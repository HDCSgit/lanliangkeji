from datetime import datetime, timezone
from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import require_sysadmin
from app.models.models import User, Order, Voucher
from app.schemas.schemas import ApiResponse, DashboardStats
from app.core.constants import OrderStatus, VoucherStatus

router = APIRouter(dependencies=[Depends(require_sysadmin)])


@router.get("/stats", response_model=ApiResponse)
def get_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status == OrderStatus.PENDING_PAYMENT).count()
    pending_vouchers = db.query(Voucher).filter(Voucher.status == VoucherStatus.PENDING).count()

    total_sales = db.query(func.coalesce(func.sum(Order.final_amount), 0.0)).filter(
        Order.status == OrderStatus.PAID
    ).scalar()

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_sales = db.query(func.coalesce(func.sum(Order.final_amount), 0.0)).filter(
        Order.status == OrderStatus.PAID,
        Order.payment_time >= today,
    ).scalar()

    stats = DashboardStats(
        total_users=total_users,
        total_orders=total_orders,
        pending_orders=pending_orders,
        pending_vouchers=pending_vouchers,
        total_sales=float(total_sales or 0.0),
        today_sales=float(today_sales or 0.0),
    )

    return ApiResponse(success=True, data=stats)
