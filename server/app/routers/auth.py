from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import UserRole
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.dependencies.auth import security
from app.models.models import User
from app.schemas.schemas import (
    ApiResponse,
    RefreshToken,
    Token,
    UserCreate,
    UserLogin,
    UserOut,
)

router = APIRouter()


def _user_out_from_user(user: User) -> UserOut:
    """根据 SQLAlchemy User 构造 UserOut，并优先识别 auditor 身份。"""
    role = UserRole.AUDITOR if user.auditor_info else user.role
    return UserOut(
        id=user.id,
        phone=user.phone,
        name=user.name,
        avatar=user.avatar,
        role=role,
        created_at=user.created_at,
    )


def _sysadmin_out() -> UserOut:
    """构造系统管理员 UserOut。"""
    return UserOut(
        id=settings.SYSADMIN_PHONE,
        phone=settings.SYSADMIN_PHONE,
        name=settings.SYSADMIN_NAME,
        avatar=None,
        role=UserRole.SYSADMIN,
        created_at=datetime.now(timezone.utc),
    )


def _create_token_for_user(user: User) -> Token:
    """为数据库用户生成 access_token / refresh_token。"""
    role = UserRole.AUDITOR if user.auditor_info else user.role
    access_token = create_access_token({"sub": user.id, "role": role.value})
    refresh_token = create_refresh_token({"sub": user.id, "role": role.value})
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=_user_out_from_user(user),
    )


def _create_token_for_sysadmin() -> Token:
    """为系统管理员生成 access_token / refresh_token。"""
    sub = settings.SYSADMIN_PHONE
    access_token = create_access_token({"sub": sub, "role": UserRole.SYSADMIN.value})
    refresh_token = create_refresh_token({"sub": sub, "role": UserRole.SYSADMIN.value})
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=_sysadmin_out(),
    )


def _get_current_user_or_sysadmin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    解析 access token，返回当前登录用户；同时支持未入库的 sysadmin。
    返回字典格式便于在 /me 中直接构造 UserOut。
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌",
        )

    payload = decode_token(credentials.credentials, settings.SECRET_KEY)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
        )

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
        )

    if sub == settings.SYSADMIN_PHONE:
        return {
            "id": settings.SYSADMIN_PHONE,
            "phone": settings.SYSADMIN_PHONE,
            "name": settings.SYSADMIN_NAME,
            "avatar": None,
            "role": UserRole.SYSADMIN,
            "created_at": datetime.now(timezone.utc),
        }

    user = db.query(User).filter(User.id == sub).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    return {
        "id": user.id,
        "phone": user.phone,
        "name": user.name,
        "avatar": user.avatar,
        "role": UserRole.AUDITOR if user.auditor_info else user.role,
        "created_at": user.created_at,
    }


@router.post("/register", response_model=ApiResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """用户注册。"""
    existing = db.query(User).filter(User.phone == user_in.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="手机号已注册",
        )

    user = User(
        phone=user_in.phone,
        name=user_in.name,
        password_hash=get_password_hash(user_in.password),
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_token_for_user(user)
    return ApiResponse(success=True, data=token, message="注册成功")


@router.post("/login", response_model=ApiResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """用户 / 管理员登录。"""
    # 系统管理员走 settings 硬编码
    if (
        credentials.phone == settings.SYSADMIN_PHONE
        and credentials.password == settings.SYSADMIN_PASSWORD
    ):
        token = _create_token_for_sysadmin()
        return ApiResponse(success=True, data=token, message="登录成功")

    user = db.query(User).filter(User.phone == credentials.phone).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="手机号或密码错误",
        )

    token = _create_token_for_user(user)
    return ApiResponse(success=True, data=token, message="登录成功")


@router.post("/refresh", response_model=ApiResponse)
def refresh(token_in: RefreshToken, db: Session = Depends(get_db)):
    """使用 refresh token 换取新的 access token。"""
    payload = decode_token(token_in.refresh_token, settings.REFRESH_SECRET_KEY)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
        )

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
        )

    # sysadmin
    if sub == settings.SYSADMIN_PHONE:
        new_access = create_access_token(
            {"sub": sub, "role": UserRole.SYSADMIN.value}
        )
        return ApiResponse(
            success=True,
            data={"access_token": new_access, "token_type": "bearer"},
            message="刷新成功",
        )

    user = db.query(User).filter(User.id == sub).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    role = UserRole.AUDITOR if user.auditor_info else user.role
    new_access = create_access_token({"sub": user.id, "role": role.value})
    return ApiResponse(
        success=True,
        data={"access_token": new_access, "token_type": "bearer"},
        message="刷新成功",
    )


@router.post("/logout", response_model=ApiResponse)
def logout():
    """退出登录；前端清理本地 token 即可。"""
    return ApiResponse(success=True, data=None, message="退出成功")


@router.get("/me", response_model=ApiResponse)
def me(
    current: Dict[str, Any] = Depends(_get_current_user_or_sysadmin),
):
    """获取当前登录用户信息，兼容 sysadmin。"""
    user_out = UserOut(**current)
    return ApiResponse(success=True, data=user_out, message="获取成功")
