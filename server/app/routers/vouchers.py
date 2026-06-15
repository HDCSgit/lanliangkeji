from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, selectinload
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_auditor_or_admin
from app.models.models import Voucher, Order, Bill, User
from app.schemas.schemas import VoucherAudit, VoucherOut, ApiResponse
from app.services.storage_service import save_upload_file
from app.core.constants import UserRole, OrderStatus, VoucherStatus, PaymentMethod, BillType, BillStatus

router = APIRouter()


@router.post("/", response_model=ApiResponse)
def create_voucher(
    order_id: str = Form(...),
    amount: float = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    # 支持审计员身份：通过 auditor_info 关联判断
    effective_role = current_user.role
    if current_user.auditor_info and effective_role == UserRole.USER:
        effective_role = UserRole.AUDITOR
    
    if order.user_id != current_user.id and effective_role not in (UserRole.SYSADMIN, UserRole.AUDITOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作该订单")

    image_path = save_upload_file(image, "vouchers", db)
    now = datetime.now(timezone.utc)
    expiry_time = now + timedelta(hours=72)

    voucher = db.query(Voucher).filter(Voucher.order_id == order_id).first()
    if voucher:
        voucher.amount = amount
        voucher.image = image_path
        voucher.status = VoucherStatus.PENDING
        voucher.submit_time = now
        voucher.reject_reason = None
        voucher.audit_time = None
        voucher.auditor_id = None
        voucher.auditor_name = None
        voucher.expiry_time = expiry_time
        message = "凭证已重新提交"
    else:
        voucher = Voucher(
            order_id=order.id,
            user_id=current_user.id,
            user_name=current_user.name,
            user_phone=current_user.phone,
            amount=amount,
            image=image_path,
            status=VoucherStatus.PENDING,
            expiry_time=expiry_time,
        )
        db.add(voucher)
        message = "凭证提交成功"

    # 提交凭证后订单进入处理中状态，等待审核
    order.status = OrderStatus.PROCESSING

    db.commit()
    db.refresh(voucher)
    return ApiResponse(success=True, data=VoucherOut.model_validate(voucher), message=message)


@router.get("/", response_model=ApiResponse)
def list_vouchers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in (UserRole.SYSADMIN, UserRole.AUDITOR):
        vouchers = (
            db.query(Voucher)
            .options(selectinload(Voucher.order))
            .filter(Voucher.status == VoucherStatus.PENDING)
            .order_by(Voucher.submit_time.desc())
            .all()
        )
    else:
        vouchers = (
            db.query(Voucher)
            .options(selectinload(Voucher.order))
            .filter(Voucher.user_id == current_user.id)
            .order_by(Voucher.submit_time.desc())
            .all()
        )

    return ApiResponse(success=True, data=[VoucherOut.model_validate(v) for v in vouchers])


@router.get("/{id}", response_model=ApiResponse)
def get_voucher(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    voucher = (
        db.query(Voucher)
        .options(selectinload(Voucher.order))
        .filter(Voucher.id == id)
        .first()
    )
    if not voucher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="凭证不存在")

    if voucher.user_id != current_user.id and current_user.role not in (UserRole.SYSADMIN, UserRole.AUDITOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看该凭证")

    return ApiResponse(success=True, data=VoucherOut.model_validate(voucher))


@router.post("/{id}/audit", response_model=ApiResponse)
def audit_voucher(
    id: str,
    payload: VoucherAudit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor_or_admin),
):
    voucher = db.query(Voucher).filter(Voucher.id == id).first()
    if not voucher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="凭证不存在")

    if voucher.status != VoucherStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="凭证非待审核状态")

    if payload.action not in (VoucherStatus.APPROVED, VoucherStatus.REJECTED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的审核操作")

    now = datetime.now(timezone.utc)
    voucher.audit_time = now
    voucher.auditor_id = current_user.id
    voucher.auditor_name = current_user.name

    if payload.action == VoucherStatus.APPROVED:
        voucher.status = VoucherStatus.APPROVED
        voucher.reject_reason = None

        order = voucher.order
        order.status = OrderStatus.PAID
        order.payment_time = now
        order.payment_method = PaymentMethod.BANK_TRANSFER

        bill = Bill(
            user_id=order.user_id,
            order_id=order.id,
            order_no=order.order_no,
            type=BillType.EXPENSE,
            amount=voucher.amount,
            payment_method=PaymentMethod.BANK_TRANSFER,
            description=f"订单 {order.order_no} 对公转账",
            status=BillStatus.SUCCESS,
        )
        db.add(bill)
        message = "凭证审核通过"
    else:
        voucher.status = VoucherStatus.REJECTED
        voucher.reject_reason = payload.reject_reason
        voucher.expiry_time = now + timedelta(hours=72)
        message = "凭证已驳回"

    db.commit()
    db.refresh(voucher)
    return ApiResponse(success=True, data=VoucherOut.model_validate(voucher), message=message)
