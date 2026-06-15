from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.models import User, Bill
from app.schemas.schemas import ApiResponse, BillOut
from app.core.constants import UserRole

router = APIRouter()


def _serialize_bill(bill: Bill) -> dict:
    return BillOut.model_validate(bill).model_dump()


@router.get("/", response_model=ApiResponse)
def list_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Bill)
    if current_user.role != UserRole.SYSADMIN:
        query = query.filter(Bill.user_id == current_user.id)

    bills = query.order_by(desc(Bill.created_at)).all()
    data = [_serialize_bill(bill) for bill in bills]
    return ApiResponse(success=True, data=data)
