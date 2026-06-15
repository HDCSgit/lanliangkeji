from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_auditor_or_admin
from app.models.models import User, Order, Logistics, LogisticsUpdate, now_utc
from app.schemas.schemas import ApiResponse, LogisticsOut, LogisticsUpdateCreate
from app.core.constants import UserRole
from app.services.express_tracker import ExpressTracker
from app.services.storage_service import get_express_config

router = APIRouter()


def _serialize_logistics(logistics: Logistics) -> dict:
    return LogisticsOut.model_validate(logistics).model_dump()


def _check_order_access(order: Order, current_user: User) -> bool:
    if current_user.role in (UserRole.SYSADMIN, UserRole.AUDITOR):
        return True
    return order.user_id == current_user.id


@router.get("/orders/{order_id}", response_model=ApiResponse)
def get_logistics(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if not _check_order_access(order, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看该物流")

    logistics = (
        db.query(Logistics)
        .options(selectinload(Logistics.updates))
        .filter(Logistics.order_id == order_id)
        .first()
    )
    if not logistics:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="物流信息不存在")

    # 读取快递查询配置
    express_cfg = get_express_config(db)
    provider = express_cfg.get("provider", "sf_express")
    sf_config = express_cfg.get("sf", {})

    # 查询实时物流信息
    express_data = None
    try:
        express_data = ExpressTracker.query(
            logistics.tracking_number,
            logistics.carrier,
            provider=provider,
            sf_config=sf_config,
        )
    except Exception as e:
        print(f"物流查询失败: {e}")

    # 把实时轨迹中"新的"条目 upsert 到 LogisticsUpdate（按 (time, description) 去重）
    if express_data and express_data.get("success") and express_data.get("traces"):
        existing_keys = {
            (u.time, u.description)
            for u in logistics.updates
            if u.time is not None and u.description
        }
        new_inserted = 0
        for t in express_data["traces"]:
            t_time = t.get("time")
            t_desc = t.get("description")
            if not t_desc:
                continue
            parsed_time = None
            if t_time:
                for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M"):
                    try:
                        parsed_time = datetime.strptime(t_time, fmt)
                        break
                    except ValueError:
                        continue
            key = (parsed_time, t_desc)
            if key in existing_keys:
                continue
            try:
                db.add(LogisticsUpdate(
                    logistics_id=logistics.id,
                    time=parsed_time or now_utc(),
                    status=express_data.get("status") or "in_transit",
                    description=t_desc,
                    location=t.get("location") or "",
                ))
                new_inserted += 1
            except Exception:
                continue
        if new_inserted > 0:
            try:
                db.commit()
                db.refresh(logistics)
            except Exception:
                db.rollback()

    data = _serialize_logistics(logistics)
    if express_data and express_data.get("success"):
        data["express"] = express_data

    return ApiResponse(success=True, data=data)


@router.post("/orders/{order_id}/updates", response_model=ApiResponse)
def add_logistics_update(
    order_id: str,
    payload: LogisticsUpdateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor_or_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    logistics = db.query(Logistics).filter(Logistics.order_id == order_id).first()
    if not logistics:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="物流记录不存在")

    update = LogisticsUpdate(
        logistics_id=logistics.id,
        time=payload.time,
        status=payload.status,
        description=payload.description,
        location=payload.location,
    )
    db.add(update)

    # 同步最新状态到物流主记录
    logistics.status = payload.status

    db.commit()
    db.refresh(logistics)

    return ApiResponse(success=True, data=_serialize_logistics(logistics), message="物流更新已添加")


@router.get("/track/{tracking_number}", response_model=ApiResponse)
def track_express(
    tracking_number: str,
    carrier: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """直接查询快递单号物流信息（无需订单关联）。"""
    express_cfg = get_express_config(db)
    provider = express_cfg.get("provider", "sf_express")
    sf_config = express_cfg.get("sf", {})

    result = ExpressTracker.query(
        tracking_number,
        carrier,
        provider=provider,
        sf_config=sf_config,
    )
    if result.get("success"):
        return ApiResponse(success=True, data=result, message="查询成功")
    else:
        return ApiResponse(success=False, message=result.get("message", "查询失败"), error=result.get("message"))
