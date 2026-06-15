from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.db.session import get_db
from app.dependencies.auth import get_current_active_user
from app.models.models import Address, User
from app.schemas.schemas import (
    AddressBase,
    AddressCreate,
    AddressOut,
    ApiResponse,
    UserOut,
)
from pydantic import BaseModel

router = APIRouter()


class UserUpdate(BaseModel):
    """当前用户可修改的个人信息。"""

    name: Optional[str] = None
    avatar: Optional[str] = None


class AddressUpdateBody(AddressBase):
    """修改地址时的请求体（不含路径参数 id）。"""

    pass


def _ensure_address_owner(db: Session, address_id: str, user_id: str) -> Address:
    """确保地址存在且属于当前用户。"""
    address = db.query(Address).filter(Address.id == address_id).first()
    if not address or address.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="地址不存在",
        )
    return address


def _unset_other_defaults(db: Session, user_id: str, exclude_id: Optional[str] = None):
    """将当前用户的其他地址设为非默认。"""
    query = db.query(Address).filter(
        Address.user_id == user_id,
        Address.is_default == True,
    )
    if exclude_id:
        query = query.filter(Address.id != exclude_id)
    query.update({Address.is_default: False}, synchronize_session=False)


@router.get("/me", response_model=ApiResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """获取当前用户信息。"""
    role = UserRole.AUDITOR if current_user.auditor_info else current_user.role
    user_out = UserOut(
        id=current_user.id,
        phone=current_user.phone,
        name=current_user.name,
        avatar=current_user.avatar,
        role=role,
        created_at=current_user.created_at,
    )
    return ApiResponse(success=True, data=user_out, message="获取成功")


@router.put("/me", response_model=ApiResponse)
def update_me(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """修改当前用户姓名 / 头像。"""
    if update_in.name is not None:
        current_user.name = update_in.name
    if update_in.avatar is not None:
        current_user.avatar = update_in.avatar

    db.commit()
    db.refresh(current_user)

    role = UserRole.AUDITOR if current_user.auditor_info else current_user.role
    user_out = UserOut(
        id=current_user.id,
        phone=current_user.phone,
        name=current_user.name,
        avatar=current_user.avatar,
        role=role,
        created_at=current_user.created_at,
    )
    return ApiResponse(success=True, data=user_out, message="修改成功")


@router.get("/addresses", response_model=ApiResponse)
def get_addresses(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """获取当前用户地址列表。"""
    addresses = (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )
    return ApiResponse(
        success=True,
        data=[AddressOut.model_validate(addr) for addr in addresses],
        message="获取成功",
    )


@router.post("/addresses", response_model=ApiResponse)
def create_address(
    address_in: AddressCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """添加地址；若设为默认，则取消其他默认地址。"""
    if address_in.is_default:
        _unset_other_defaults(db, current_user.id)

    address = Address(
        user_id=current_user.id,
        name=address_in.name,
        phone=address_in.phone,
        province=address_in.province,
        city=address_in.city,
        district=address_in.district,
        detail=address_in.detail,
        is_default=address_in.is_default,
    )
    db.add(address)
    db.commit()
    db.refresh(address)

    return ApiResponse(
        success=True,
        data=AddressOut.model_validate(address),
        message="添加成功",
    )


@router.put("/addresses/{address_id}", response_model=ApiResponse)
def update_address(
    address_id: str,
    address_in: AddressUpdateBody,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """修改指定地址；若设为默认，则取消其他默认地址。"""
    address = _ensure_address_owner(db, address_id, current_user.id)

    if address_in.is_default and not address.is_default:
        _unset_other_defaults(db, current_user.id, exclude_id=address_id)

    address.name = address_in.name
    address.phone = address_in.phone
    address.province = address_in.province
    address.city = address_in.city
    address.district = address_in.district
    address.detail = address_in.detail
    address.is_default = address_in.is_default

    db.commit()
    db.refresh(address)

    return ApiResponse(
        success=True,
        data=AddressOut.model_validate(address),
        message="修改成功",
    )


@router.delete("/addresses/{address_id}", response_model=ApiResponse)
def delete_address(
    address_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """删除指定地址。"""
    address = _ensure_address_owner(db, address_id, current_user.id)

    db.delete(address)
    db.commit()

    return ApiResponse(success=True, data=None, message="删除成功")


@router.get("/addresses/default", response_model=ApiResponse)
def get_default_address(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """获取当前用户默认地址。"""
    address = (
        db.query(Address)
        .filter(Address.user_id == current_user.id, Address.is_default == True)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未设置默认地址",
        )
    return ApiResponse(
        success=True,
        data=AddressOut.model_validate(address),
        message="获取成功",
    )
