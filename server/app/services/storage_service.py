import os
import uuid
import shutil
import io
import logging
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import StorageConfig
from app.schemas.schemas import StorageConfigUpdate

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

# 缩略图尺寸配置(单位 px)
# 平衡清晰度和带宽(用户反馈:列表≤100KB,详情≤300KB,详情大图≤1MB)
# - thumb: 列表卡片/首页产品卡 (目标 ≤100KB)
# - medium: 详情页主图/轮播 (目标 ≤300KB)
# - large: 详情页详情图 (目标 ≤1MB)
IMAGE_SIZES = {
    "thumb": (640, 640),     # 列表卡片/首页产品卡 - 2 倍 DPI 清晰,目标 ≤100KB
    "medium": (1200, 1200),  # 详情页主图/轮播 - 视网膜屏也清晰,目标 ≤300KB
    "large": (2000, 2000),   # 详情页详情图 - 高清细节,目标 ≤1MB
}

# WebP 质量(0-100,88 是"看不出压缩痕迹"的好平衡点)
WEBP_QUALITY = 88


def get_storage_config(db: Session) -> StorageConfig:
    """获取当前存储配置，不存在则创建默认配置。"""
    config = db.query(StorageConfig).first()
    if not config:
        config = StorageConfig(
            provider="local",
            local_base_url="",
            express_provider="sf_express",
            sf_env="production",
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def save_storage_config(db: Session, payload: StorageConfigUpdate) -> StorageConfig:
    """保存存储配置。"""
    config = db.query(StorageConfig).first()
    if not config:
        config = StorageConfig()
        db.add(config)

    config.provider = payload.provider
    config.qiniu_access_key = payload.qiniu_access_key or config.qiniu_access_key
    config.qiniu_secret_key = payload.qiniu_secret_key or config.qiniu_secret_key
    config.qiniu_bucket = payload.qiniu_bucket or config.qiniu_bucket
    config.qiniu_domain = payload.qiniu_domain or config.qiniu_domain
    config.qiniu_region = payload.qiniu_region or config.qiniu_region
    config.local_base_url = payload.local_base_url or config.local_base_url

    # 快递配置
    config.express_provider = payload.express_provider
    config.sf_partner_id = payload.sf_partner_id or config.sf_partner_id
    config.sf_checkword = payload.sf_checkword or config.sf_checkword
    config.sf_env = payload.sf_env or config.sf_env
    config.kuaidi100_key = payload.kuaidi100_key or config.kuaidi100_key
    config.kdniao_id = payload.kdniao_id or config.kdniao_id
    config.kdniao_key = payload.kdniao_key or config.kdniao_key

    db.commit()
    db.refresh(config)
    return config


def get_express_config(db: Session) -> dict:
    """获取快递查询配置。"""
    config = get_storage_config(db)
    return {
        "provider": config.express_provider,
        "sf": {
            "partner_id": config.sf_partner_id or "",
            "checkword": config.sf_checkword or "",
            "env": config.sf_env or "production",
        },
        "kuaidi100": {
            "key": config.kuaidi100_key or "",
        },
        "kdniao": {
            "id": config.kdniao_id or "",
            "key": config.kdniao_key or "",
        },
    }


def _compress_to_webp(img_bytes: bytes, max_size: tuple[int, int]) -> tuple[bytes, tuple[int, int]]:
    """
    把图片字节流压缩为 WebP:
    1. 限制最大边长(max_size),保持比例
    2. 转为 RGB(去掉 alpha 以减小体积;有 alpha 的图保留)
    3. 按 WEBP_QUALITY 编码
    返回 (webp_bytes, (width, height))
    失败时抛 RuntimeError,让上层 fallback 到原图保存
    """
    from PIL import Image

    img = Image.open(io.BytesIO(img_bytes))
    # 保留 alpha 通道(对带透明的 png 友好)
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)

    if has_alpha:
        # 保留 alpha
        if img.mode != "RGBA":
            img = img.convert("RGBA")
    else:
        if img.mode != "RGB":
            img = img.convert("RGB")

    # 等比缩放
    img.thumbnail(max_size, Image.Resampling.LANCZOS)

    out = io.BytesIO()
    save_kwargs = {"format": "WEBP", "quality": WEBP_QUALITY, "method": 4}
    if has_alpha:
        save_kwargs["lossless"] = False
    img.save(out, **save_kwargs)
    return out.getvalue(), img.size


def _is_image_mime(content_type: str) -> bool:
    return content_type in ALLOWED_IMAGE_TYPES


def save_upload_file_local(file: UploadFile, subdir: str = "") -> str:
    """
    保存图片到本地,并自动:
    1. 压缩为 WebP(肉眼无损,但体积小 30-70%)
    2. 生成多尺寸:thumb(列表卡) / medium(详情页主图) / large(详情图/大图)
    3. 返回的 URL 是 medium 尺寸(够用且省流量);后管展示原图用 thumb

    注意:GIF 保持原格式(不支持动图转 WebP);非图片走原逻辑。
    """
    if not _is_image_mime(file.content_type or ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型: {file.content_type}",
        )

    # 读取全部字节(同时得到大小)
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小超过限制: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB",
        )
    raw = file.file.read()

    # GIF 保持原格式(动图不能转 WebP 静图)
    if file.content_type == "image/gif":
        return _save_raw(raw, subdir, file.content_type)

    # 尝试压缩;失败 fallback 原图
    try:
        from PIL import Image  # noqa: F401
    except ImportError:
        logger.warning("Pillow not installed, fallback to original upload")
        return _save_raw(raw, subdir, file.content_type)

    target_dir = UPLOAD_DIR / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    base_id = uuid.uuid4().hex

    # 生成 thumb / medium / large 三档
    saved_paths: dict[str, Path] = {}
    for size_name, max_size in IMAGE_SIZES.items():
        try:
            webp_bytes, _ = _compress_to_webp(raw, max_size)
            sub = target_dir / size_name
            sub.mkdir(parents=True, exist_ok=True)
            p = sub / f"{base_id}.webp"
            p.write_bytes(webp_bytes)
            saved_paths[size_name] = p
        except Exception as e:
            logger.warning("compress %s failed: %s", size_name, e)

    if not saved_paths:
        # 全部失败,fallback 原图
        logger.warning("all compress failed, fallback to original")
        return _save_raw(raw, subdir, file.content_type)

    # 返回主路径(medium 优先,降级 thumb,再降级 large)
    main_size = "medium" if "medium" in saved_paths else ("thumb" if "thumb" in saved_paths else "large")
    main_path = saved_paths[main_size]
    rel = f"/uploads/{subdir}/{main_size}/{main_path.name}" if subdir else f"/uploads/{main_size}/{main_path.name}"

    # 记录:总节省了多少 KB(便于后续优化评估)
    try:
        original_kb = size / 1024
        compressed_kb = sum(p.stat().st_size for p in saved_paths.values()) / 1024
        logger.info(
            "image compressed: %s %.1fKB -> %d sizes %.1fKB (%.0f%% saved)",
            base_id, original_kb, len(saved_paths), compressed_kb,
            (1 - compressed_kb / original_kb) * 100 if original_kb > 0 else 0,
        )
    except Exception:
        pass

    return rel


def _save_raw(raw: bytes, subdir: str, content_type: str) -> str:
    """保存原文件(非图片或压缩失败时的 fallback)。"""
    ext_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }
    ext = ext_map.get(content_type, ".bin")
    target_dir = UPLOAD_DIR / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{uuid.uuid4().hex}{ext}"
    target_path.write_bytes(raw)
    return f"/uploads/{subdir}/{target_path.name}" if subdir else f"/uploads/{target_path.name}"


def save_upload_file(file: UploadFile, subdir: str = "", db: Optional[Session] = None) -> str:
    """统一上传接口：根据配置自动选择本地或七牛云。"""
    if db is None:
        # 没有 db session 时默认使用本地存储
        return save_upload_file_local(file, subdir)

    config = get_storage_config(db)

    if config.provider == "qiniu":
        from app.services.qiniu_service import QiniuService
        qiniu = QiniuService(config)
        return qiniu.upload_file(file, subdir)
    else:
        return save_upload_file_local(file, subdir)


def get_full_url(path: str, db: Optional[Session] = None) -> str:
    """获取文件的完整 URL。"""
    if not path:
        return path

    # 已经是完整 URL
    if path.startswith("http://") or path.startswith("https://"):
        return path

    if db is None:
        return path

    config = get_storage_config(db)

    if config.provider == "qiniu" and config.qiniu_domain:
        # 七牛云文件路径
        domain = config.qiniu_domain.rstrip("/")
        path = path.lstrip("/")
        return f"{domain}/{path}"

    # 本地存储，使用配置的 base_url 或默认路径
    if config.local_base_url:
        base = config.local_base_url.rstrip("/")
        return f"{base}{path}"

    return path


def get_thumb_url(path: str) -> str:
    """
    把 medium/origin URL 转换为 thumb 缩略图 URL(列表卡片用,极致省流量)。
    例:/uploads/products/medium/abc.webp -> /uploads/products/thumb/abc.webp
    """
    if not path or "/medium/" not in path:
        return path
    return path.replace("/medium/", "/thumb/")


def get_medium_url(path: str) -> str:
    """large/原图 -> medium(详情页主图用)"""
    if not path:
        return path
    if "/large/" in path:
        return path.replace("/large/", "/medium/")
    return path


def get_large_url(path: str) -> str:
    """medium/thumb -> large(详情图用,大图保留细节)"""
    if not path:
        return path
    if "/thumb/" in path:
        return path.replace("/thumb/", "/large/")
    if "/medium/" in path:
        return path.replace("/medium/", "/large/")
    return path
