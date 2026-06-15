from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_active_user
from app.models.models import CartItem, Product, ProductSpec, User
from app.schemas.schemas import ApiResponse, CartItemCreate, CartItemOut

router = APIRouter()


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


@router.get("/", response_model=ApiResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取当前用户购物车列表。"""
    items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .order_by(CartItem.added_at.desc())
        .all()
    )
    return ApiResponse(success=True, data=[CartItemOut.model_validate(item) for item in items], message="获取购物车成功")


@router.post("/", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """添加商品到购物车；同规格存在则累加数量并更新 subtotal。"""
    product = (
        db.query(Product)
        .filter(Product.id == data.product_id, Product.is_active.is_(True))
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="产品不存在或已下架"
        )

    spec = (
        db.query(ProductSpec)
        .filter(
            ProductSpec.id == data.spec_id,
            ProductSpec.product_id == data.product_id,
            ProductSpec.is_active.is_(True),
        )
        .first()
    )
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="规格不存在或已下架"
        )

    existing = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == data.product_id,
            CartItem.spec_id == data.spec_id,
        )
        .first()
    )

    if existing:
        existing.quantity += data.quantity
        existing.subtotal = existing.price * existing.quantity
        db.commit()
        db.refresh(existing)
        return ApiResponse(success=True, data=CartItemOut.model_validate(existing), message="购物车商品数量已累加")

    item = CartItem(
        user_id=current_user.id,
        product_id=data.product_id,
        spec_id=data.spec_id,
        product_name=product.name,
        product_image=product.image,
        spec_name=spec.name,
        unit=spec.unit,
        price=spec.price,
        quantity=data.quantity,
        subtotal=spec.price * data.quantity,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ApiResponse(success=True, data=CartItemOut.model_validate(item), message="添加购物车成功")


@router.put("/{item_id}", response_model=ApiResponse)
def update_cart_item(
    item_id: str,
    data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """更新购物车数量。"""
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="购物车项不存在")

    item.quantity = data.quantity
    item.subtotal = item.price * data.quantity
    db.commit()
    db.refresh(item)
    return ApiResponse(success=True, data=CartItemOut.model_validate(item), message="购物车项更新成功")


@router.delete("/{item_id}", response_model=ApiResponse)
def delete_cart_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """删除购物车项。"""
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="购物车项不存在")
    db.delete(item)
    db.commit()
    return ApiResponse(success=True, data=None, message="购物车项删除成功")


@router.delete("/", response_model=ApiResponse)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """清空当前用户购物车。"""
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return ApiResponse(success=True, data=None, message="购物车已清空")
