import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import StorageConfig
from app.schemas.schemas import StorageConfigUpdate

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


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


def save_upload_file_local(file: UploadFile, subdir: str = "") -> str:
    """保存文件到本地。"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型: {file.content_type}",
        )

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小超过限制: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB",
        )

    ext = Path(file.filename or "").suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        ext = ".png"

    filename = f"{uuid.uuid4().hex}{ext}"
    target_dir = UPLOAD_DIR / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / filename

    with target_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return f"/uploads/{subdir}/{filename}" if subdir else f"/uploads/{filename}"


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
