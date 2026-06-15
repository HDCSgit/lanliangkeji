from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_sysadmin
from app.models.models import Product, ProductSpec
from app.schemas.schemas import ApiResponse, ProductCreate, ProductOut, ProductUpdate
from app.services.storage_service import save_upload_file

router = APIRouter()


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
    product = Product(
        name=data.name,
        category=data.category,
        description=data.description,
        image=data.image,
        features=data.features,
        is_active=data.is_active,
        order=data.order,
    )
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

    product.name = data.name
    product.category = data.category
    product.description = data.description
    product.image = data.image
    product.features = data.features
    product.is_active = data.is_active
    product.order = data.order

    # 删除旧规格并重建
    db.query(ProductSpec).filter(ProductSpec.product_id == product_id).delete()
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
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """
    上传产品图片(覆盖更新 product.image 字段)。
    上传后返回新的 image 路径(以 /uploads 开头)。
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
        product.image = path
        db.commit()
        db.refresh(product)
        return ApiResponse(
            success=True,
            data={"id": product.id, "image": path, "product": ProductOut.model_validate(product).model_dump()},
            message="产品图片上传成功",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"上传失败: {e}")


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
