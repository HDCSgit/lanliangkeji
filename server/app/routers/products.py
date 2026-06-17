from typing import Optional, Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_sysadmin
from app.models.models import Product, ProductSpec
from app.schemas.schemas import ApiResponse, ProductCreate, ProductOut, ProductUpdate
from app.services.storage_service import save_upload_file

router = APIRouter()


# ==================== 常量 ====================
MAX_COVER_IMAGES = 5   # 封面图最多 5 张
MAX_DETAIL_IMAGES = 50  # 详情图最多 50 张(实际不限,但要防滥用)
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10MB


def _normalize_cover_images(values: list[str]) -> list[str]:
    """
    封面图归一化:
    - 过滤空字符串
    - 最多保留 5 张
    - 兼容旧 image 字段:如果 cover_images 为空但 image 有值,用 image 兜底
    """
    cleaned = [v.strip() for v in (values or []) if v and v.strip()]
    return cleaned[:MAX_COVER_IMAGES]


def _normalize_detail_images(values: list[str]) -> list[str]:
    """详情图归一化:只过滤空串,保留全部(超 50 张截断防止滥用)。"""
    cleaned = [v.strip() for v in (values or []) if v and v.strip()]
    return cleaned[:MAX_DETAIL_IMAGES]


def _sync_cover_image_field(product: Product) -> None:
    """保持 product.image 与 cover_images[0] 同步,方便老代码/外键引用。"""
    covers = product.cover_images or []
    product.image = covers[0] if covers else ""


@router.get("/", response_model=ApiResponse)
def list_products(
    category: Optional[str] = Query(None, description="按分类过滤"),
    db: Session = Depends(get_db),
):
    """公开：获取 active 产品列表（含规格）。"""
    query = db.query(Product).filter(Product.is_active.is_(True))
    if category:
        query = query.filter(Product.category == category)
    products = query.order_by(Product.order.asc(), Product.created_at.desc()).all()
    return ApiResponse(success=True, data=[ProductOut.model_validate(p) for p in products], message="获取产品列表成功")


@router.get("/{product_id}", response_model=ApiResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    """公开：获取产品详情。"""
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.is_active.is_(True))
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="产品不存在")
    return ApiResponse(success=True, data=ProductOut.model_validate(product), message="获取产品详情成功")


@router.post("/", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """创建产品（含规格），仅 sysadmin。"""
    cover_images = _normalize_cover_images(data.cover_images)
    # 1 张封面时强制不轮播
    enable_carousel = data.enable_carousel if len(cover_images) >= 2 else False
    detail_images = _normalize_detail_images(data.detail_images)

    product = Product(
        name=data.name,
        category=data.category,
        description=data.description,
        cover_images=cover_images,
        detail_images=detail_images,
        enable_carousel=enable_carousel,
        features=data.features,
        is_active=data.is_active,
        order=data.order,
        # 运费规则(草稿创建时全部默认包邮)
        shipping_enabled=data.shipping_enabled,
        shipping_initial_fee=data.shipping_initial_fee,
        shipping_per_unit_count=data.shipping_per_unit_count,
        shipping_per_unit_fee=data.shipping_per_unit_fee,
    )
    # image 镜像 cover_images[0]
    product.image = cover_images[0] if cover_images else ""
    db.add(product)
    db.flush()

    for spec_data in data.specs:
        spec = ProductSpec(
            product_id=product.id,
            name=spec_data.name,
            unit=spec_data.unit,
            price=spec_data.price,
            stock=spec_data.stock,
            min_order=spec_data.min_order,
            is_active=spec_data.is_active,
        )
        db.add(spec)

    db.commit()
    db.refresh(product)
    return ApiResponse(success=True, data=ProductOut.model_validate(product), message="产品创建成功")


@router.put("/{product_id}", response_model=ApiResponse)
def update_product(
    product_id: str,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """更新产品及规格（删除旧规格后重建），仅 sysadmin。"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="产品不存在")

    cover_images = _normalize_cover_images(data.cover_images)
    # 1 张封面时强制不轮播
    enable_carousel = data.enable_carousel if len(cover_images) >= 2 else False
    detail_images = _normalize_detail_images(data.detail_images)

    product.name = data.name
    product.category = data.category
    product.description = data.description
    product.cover_images = cover_images
    product.detail_images = detail_images
    product.enable_carousel = enable_carousel
    product.features = data.features
    product.is_active = data.is_active
    product.order = data.order
    # 运费规则
    product.shipping_enabled = data.shipping_enabled
    product.shipping_initial_fee = data.shipping_initial_fee
    product.shipping_per_unit_count = data.shipping_per_unit_count
    product.shipping_per_unit_fee = data.shipping_per_unit_fee
    # 镜像 image
    product.image = cover_images[0] if cover_images else ""

    # 规格 upsert(按 name 匹配,保持 spec.id 稳定,避免 cart_items.spec_id 失效)
    # - 旧库里有同 name 的 spec → 更新字段(id 不变)
    # - 旧库里没的 → 新建
    # - 新列表里没出现的旧 spec → 删除(用户主动删的)
    old_specs = (
        db.query(ProductSpec)
        .filter(ProductSpec.product_id == product_id)
        .all()
    )
    old_specs_by_name = {s.name: s for s in old_specs}
    new_names = {s.name for s in data.specs if s.name}

    # 删除被废弃的 spec(不在新列表里)
    for old in old_specs:
        if old.name not in new_names:
            db.delete(old)
    db.flush()

    # upsert
    for spec_data in data.specs:
        if not spec_data.name:
            continue
        existing = old_specs_by_name.get(spec_data.name)
        if existing:
            # 命中旧 spec:更新字段,id 保持不变 → cart_items.spec_id 仍有效
            existing.unit = spec_data.unit
            existing.price = spec_data.price
            existing.stock = spec_data.stock
            existing.min_order = spec_data.min_order
            existing.is_active = spec_data.is_active
        else:
            # 新 spec:插入
            spec = ProductSpec(
                product_id=product.id,
                name=spec_data.name,
                unit=spec_data.unit,
                price=spec_data.price,
                stock=spec_data.stock,
                min_order=spec_data.min_order,
                is_active=spec_data.is_active,
            )
            db.add(spec)

    db.commit()
    db.refresh(product)
    return ApiResponse(success=True, data=ProductOut.model_validate(product), message="产品更新成功")


@router.delete("/{product_id}", response_model=ApiResponse)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """删除产品，仅 sysadmin。"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="产品不存在")
    db.delete(product)
    db.commit()
    return ApiResponse(success=True, data=None, message="产品删除成功")


@router.post("/{product_id}/image", response_model=ApiResponse)
def upload_product_image(
    product_id: str,
    image: UploadFile = File(...),
    kind: Literal["cover", "detail"] = Form("cover"),
    position: Optional[int] = Form(None, description="插入到 cover_images 的位置,None 则追加到末尾"),
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """
    上传产品图片(支持封面或详情图)。
    - kind=cover:追加/插入到 cover_images(最多 5 张)
    - kind=detail:追加到 detail_images
    上传后返回新的 image 路径(以 /uploads 开头)及完整产品信息。
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="产品不存在")
    try:
        # 校验图片类型
        if image.content_type and not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"仅支持图片格式,当前: {image.content_type}",
            )

        path = save_upload_file(image, "products", db)

        if kind == "cover":
            covers = list(product.cover_images or [])
            if position is not None and 0 <= position <= len(covers):
                covers.insert(position, path)
            else:
                covers.append(path)
            covers = _normalize_cover_images(covers)
            product.cover_images = covers
            # 镜像 image
            product.image = covers[0] if covers else ""
            # ≤1 张时强制不轮播
            if len(covers) < 2 and product.enable_carousel:
                product.enable_carousel = False
        else:  # detail
            details = list(product.detail_images or [])
            details.append(path)
            product.detail_images = _normalize_detail_images(details)

        db.commit()
        db.refresh(product)
        return ApiResponse(
            success=True,
            data={
                "id": product.id,
                "image": product.image or "",
                "cover_images": product.cover_images or [],
                "detail_images": product.detail_images or [],
                "enable_carousel": product.enable_carousel,
                "product": ProductOut.model_validate(product).model_dump(),
            },
            message="产品图片上传成功",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"上传失败: {e}")


@router.delete("/{product_id}/image", response_model=ApiResponse)
def delete_product_image(
    product_id: str,
    image_url: str = Query(..., description="要删除的图片 URL"),
    kind: Literal["cover", "detail"] = Query("cover"),
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """从 cover_images 或 detail_images 中移除指定图片(不删除磁盘文件)。"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="产品不存在")

    if kind == "cover":
        covers = [c for c in (product.cover_images or []) if c != image_url]
        product.cover_images = covers
        product.image = covers[0] if covers else ""
        if len(covers) < 2 and product.enable_carousel:
            product.enable_carousel = False
    else:
        product.detail_images = [d for d in (product.detail_images or []) if d != image_url]

    db.commit()
    db.refresh(product)
    return ApiResponse(
        success=True,
        data={
            "id": product.id,
            "cover_images": product.cover_images or [],
            "detail_images": product.detail_images or [],
            "enable_carousel": product.enable_carousel,
            "product": ProductOut.model_validate(product).model_dump(),
        },
        message="图片已移除",
    )


@router.put("/{product_id}/images/reorder", response_model=ApiResponse)
def reorder_product_images(
    product_id: str,
    kind: Literal["cover", "detail"] = Query("cover"),
    urls: list[str] = Query(..., description="按目标顺序排列的图片 URL 列表"),
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """对 cover_images 或 detail_images 进行重排序(拖拽排序)。"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="产品不存在")

    # 仅允许传入当前已有的 url(防止误传不存在的图)
    if kind == "cover":
        existing = list(product.cover_images or [])
        # 保留现有 url,且按 urls 给的顺序
        new_order = [u for u in urls if u in existing]
        # 把 urls 里没有但 existing 里的补到末尾(防止丢图)
        for u in existing:
            if u not in new_order:
                new_order.append(u)
        product.cover_images = _normalize_cover_images(new_order)
        product.image = product.cover_images[0] if product.cover_images else ""
        if len(product.cover_images) < 2 and product.enable_carousel:
            product.enable_carousel = False
    else:
        existing = list(product.detail_images or [])
        new_order = [u for u in urls if u in existing]
        for u in existing:
            if u not in new_order:
                new_order.append(u)
        product.detail_images = _normalize_detail_images(new_order)

    db.commit()
    db.refresh(product)
    return ApiResponse(
        success=True,
        data={
            "id": product.id,
            "cover_images": product.cover_images or [],
            "detail_images": product.detail_images or [],
            "enable_carousel": product.enable_carousel,
            "product": ProductOut.model_validate(product).model_dump(),
        },
        message="图片顺序已更新",
    )


@router.put("/{product_id}/carousel", response_model=ApiResponse)
def toggle_product_carousel(
    product_id: str,
    enable: bool = Query(..., description="是否启用封面轮播"),
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """切换产品封面图轮播开关(只有 ≥2 张封面图时才会真正开启)。"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="产品不存在")
    covers = product.cover_images or []
    product.enable_carousel = bool(enable) and len(covers) >= 2
    db.commit()
    db.refresh(product)
    return ApiResponse(
        success=True,
        data={"id": product.id, "enable_carousel": product.enable_carousel},
        message=f"封面轮播已{'开启' if product.enable_carousel else '关闭'}",
    )


@router.get("/{product_id}/image", response_model=ApiResponse)
def get_product_image(
    product_id: str,
    db: Session = Depends(get_db),
):
    """获取产品图片 URL(便于前端预填)。"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="产品不存在")
    return ApiResponse(success=True, data={"id": product.id, "image": product.image or ""})
