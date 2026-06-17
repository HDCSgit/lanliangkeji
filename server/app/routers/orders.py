from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_auditor_or_admin
from app.models.models import (
    User, Order, OrderItem, CartItem, Product, ProductSpec, Address, Logistics, LogisticsUpdate, PaymentOrder, now_utc
)
from app.schemas.schemas import ApiResponse, OrderCreate, OrderOut, OrderStatusUpdate
from app.utils.generators import generate_order_no
from app.core.constants import UserRole, OrderStatus
from app.services.express_tracker import ExpressTracker
from app.services.storage_service import get_express_config

router = APIRouter()


def _serialize_order(order: Order) -> dict:
    return OrderOut.model_validate(order).model_dump()


def _check_order_access(order: Order, current_user: User) -> bool:
    if current_user.role in (UserRole.SYSADMIN, UserRole.AUDITOR):
        return True
    return order.user_id == current_user.id


def _calc_shipping_fee_for_quantity(product, qty: int) -> float:
    """根据商品的运费规则算单商品的运费(同一商品买多件时按阶梯)。

    规则:
    - shipping_enabled=False → 包邮,返回 0
    - 第一件收 shipping_initial_fee
    - 超过 1 件的部分,每 shipping_per_unit_count 件加 shipping_per_unit_fee
    """
    if not product or not getattr(product, "shipping_enabled", False):
        return 0.0
    if qty <= 0:
        return 0.0
    initial = float(getattr(product, "shipping_initial_fee", 0) or 0)
    per_unit_count = int(getattr(product, "shipping_per_unit_count", 1) or 1)
    per_unit_fee = float(getattr(product, "shipping_per_unit_fee", 0) or 0)
    if qty == 1:
        return initial
    extra_qty = qty - 1
    extra_units = (extra_qty + per_unit_count - 1) // per_unit_count  # 向上取整
    return initial + extra_units * per_unit_fee


def _calc_total_shipping_fee(cart_items, product_map) -> float:
    """累加购物车里每个商品的运费(按各自规格对应的商品规则)。"""
    total = 0.0
    # 同一商品可能分多个规格,按 product_id 聚合数量后再算一次
    qty_by_product: dict[str, int] = {}
    for item in cart_items:
        qty_by_product[item.product_id] = qty_by_product.get(item.product_id, 0) + item.quantity
    for product_id, qty in qty_by_product.items():
        product = product_map.get(product_id)
        total += _calc_shipping_fee_for_quantity(product, qty)
    return round(total, 2)


@router.post("/", response_model=ApiResponse)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 查询收货地址
    address = db.query(Address).filter(
        Address.id == payload.shipping_address_id,
        Address.user_id == current_user.id,
    ).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="收货地址不存在")

    # 读取购物车
    cart_items = (
        db.query(CartItem)
        .options(selectinload(CartItem.spec))
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="购物车为空")

    # 锁定规格库存并校验
    spec_ids = [item.spec_id for item in cart_items]
    specs = (
        db.query(ProductSpec)
        .filter(ProductSpec.id.in_(spec_ids))
        .with_for_update()
        .all()
    )
    spec_map = {spec.id: spec for spec in specs}

    for item in cart_items:
        spec = spec_map.get(item.spec_id)
        if not spec:
            # 兜底:如果 spec_id 失效(产品被改过导致 spec 重建),
            # 尝试按 (product_id, spec_name) 找回,自动修复 cart_item.spec_id
            fallback = (
                db.query(ProductSpec)
                .filter(
                    ProductSpec.product_id == item.product_id,
                    ProductSpec.name == item.spec_name,
                    ProductSpec.is_active.is_(True),
                )
                .with_for_update()
                .first()
            )
            if fallback:
                spec = fallback
                spec_map[fallback.id] = fallback
                item.spec_id = fallback.id
                # 顺便修正 subtotal(price 可能变过)
                item.price = fallback.price
                item.subtotal = fallback.price * item.quantity
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"规格不存在: {item.spec_name}",
                )
        if spec.stock < item.quantity:
            # 注:库存只在付款成功时扣减,创建订单不预扣
            # 这里只校验"当前可售卖库存"是否够
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"库存不足: {item.product_name} - {item.spec_name}",
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"库存不足: {item.product_name} - {item.spec_name}",
            )

    # 按商品加载运费规则(避免在循环里 N+1 查询)
    product_ids = list({item.product_id for item in cart_items})
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .all()
    ) if product_ids else []
    product_map = {p.id: p for p in products}

    # 计算金额
    total_amount = sum(item.subtotal for item in cart_items)
    shipping_fee = _calc_total_shipping_fee(cart_items, product_map)
    discount = 0.0
    final_amount = total_amount + shipping_fee - discount

    # 创建订单
    order = Order(
        order_no=generate_order_no(),
        user_id=current_user.id,
        total_amount=total_amount,
        shipping_fee=shipping_fee,
        discount=discount,
        final_amount=final_amount,
        status=OrderStatus.PENDING_PAYMENT,
        shipping_address={
            "name": address.name,
            "phone": address.phone,
            "province": address.province,
            "city": address.city,
            "district": address.district,
            "detail": address.detail,
        },
        remark=payload.remark,
    )
    db.add(order)
    db.flush()

    # 创建订单项
    # 注意:库存不在这里扣,改到 _mark_paid_and_settle (付款成功时) 才扣
    # 原因:用户未付款时不应该占用库存,避免"已下单未付"卡住其他买家
    for item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            product_image=item.product_image,
            spec_id=item.spec_id,
            spec_name=item.spec_name,
            unit=item.unit,
            price=item.price,
            quantity=item.quantity,
            subtotal=item.subtotal,
        )
        db.add(order_item)

    # 清空购物车
    for item in cart_items:
        db.delete(item)

    db.commit()
    db.refresh(order)

    return ApiResponse(success=True, data=_serialize_order(order), message="订单创建成功")


@router.get("/", response_model=ApiResponse)
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Order).options(
        selectinload(Order.items),
        selectinload(Order.vouchers),
    )
    if current_user.role not in (UserRole.SYSADMIN, UserRole.AUDITOR):
        query = query.filter(Order.user_id == current_user.id)

    orders = query.order_by(desc(Order.created_at)).all()
    data = [_serialize_order(order) for order in orders]
    return ApiResponse(success=True, data=data)


@router.get("/{order_id}", response_model=ApiResponse)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.vouchers),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if not _check_order_access(order, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看该订单")

    return ApiResponse(success=True, data=_serialize_order(order))


@router.put("/{order_id}/status", response_model=ApiResponse)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor_or_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    # 取消订单仅管理员可操作
    if payload.status == OrderStatus.CANCELLED and current_user.role != UserRole.SYSADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅管理员可取消订单")

    # 发货必须提供物流信息
    if payload.status == OrderStatus.SHIPPED:
        if not payload.tracking_number or not payload.carrier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="发货时需提供运单号和物流公司",
            )

        if order.logistics:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该订单已存在物流记录",
            )

        logistics = Logistics(
            order_id=order.id,
            tracking_number=payload.tracking_number,
            carrier=payload.carrier,
            status="shipped",
        )
        db.add(logistics)
        db.flush()

        update = LogisticsUpdate(
            logistics_id=logistics.id,
            time=now_utc(),
            status="shipped",
            description="订单已发货",
            location="发货地",
        )
        db.add(update)

    order.status = payload.status
    db.commit()
    db.refresh(order)

    return ApiResponse(success=True, data=_serialize_order(order), message="订单状态更新成功")


@router.get("/{order_id}/payments", response_model=ApiResponse)
def get_order_payments(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    获取订单的所有支付单(支付流水)。

    用于后管订单详情展示支付方式/流水号/支付时间等。
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if not _check_order_access(order, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问此订单")

    payments = (
        db.query(PaymentOrder)
        .filter(PaymentOrder.order_id == order_id)
        .order_by(desc(PaymentOrder.created_at))
        .all()
    )

    data = [
        {
            "id": p.id,
            "payment_no": p.payment_no,
            "method": p.method,
            "amount": p.amount,
            "status": p.status,
            "qr_code_url": p.qr_code_url,
            "status_url": p.status_url,
            "paid_at": p.paid_at.isoformat() if p.paid_at else None,
            "expired_at": p.expired_at.isoformat() if p.expired_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in payments
    ]
    return ApiResponse(success=True, data=data, message="查询成功")


@router.get("/{order_id}/logistics-trace", response_model=ApiResponse)
def get_order_logistics_trace(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    查询订单的实时物流轨迹。

    行为：
    1. 先从 Logistics 表读已缓存的轨迹（status + 多次 LogisticsUpdate）；
    2. 然后调用 ExpressTracker 实时查询外部接口（顺丰 H5 / 快递100 / 快递鸟）；
    3. 把实时结果合并到 LogisticsUpdate 表（upsert 模式：按 (logistics_id, time, description) 去重）。
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if not _check_order_access(order, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权访问此订单")

    logistics = (
        db.query(Logistics)
        .options(selectinload(Logistics.updates))
        .filter(Logistics.order_id == order_id)
        .first()
    )
    if not logistics:
        return ApiResponse(
            success=True,
            data={
                "has_logistics": False,
                "message": "订单尚未发货,无物流信息",
            },
            message="订单尚未发货",
        )

    # 1) 读取已缓存的轨迹
    cached_traces = sorted(
        [
            {
                "time": u.time.isoformat() if u.time else None,
                "status": u.status,
                "description": u.description,
                "location": u.location,
                "source": "cache",
            }
            for u in logistics.updates
        ],
        key=lambda t: t.get("time") or "",
        reverse=True,
    )

    # 2) 实时查询
    express_cfg = get_express_config(db)
    realtime = ExpressTracker.query(
        logistics.tracking_number,
        carrier=logistics.carrier or "",
        provider=express_cfg.get("provider", "sf_express"),
        sf_config=express_cfg.get("sf"),
    )

    # 3) 合并新增轨迹到 DB（只插入之前没有的）
    if realtime.get("success"):
        existing_keys = {
            (u.time, u.description)
            for u in logistics.updates
            if u.time is not None and u.description
        }
        new_inserted = 0
        for t in realtime.get("traces", []) or []:
            t_time = t.get("time")
            t_desc = t.get("description")
            if not t_desc:
                continue
            key = (t_time, t_desc)
            if key in existing_keys:
                continue
            try:
                from datetime import datetime
                parsed_time = None
                if t_time:
                    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M"):
                        try:
                            parsed_time = datetime.strptime(t_time, fmt)
                            break
                        except ValueError:
                            continue
                db.add(LogisticsUpdate(
                    logistics_id=logistics.id,
                    time=parsed_time or now_utc(),
                    status=realtime.get("status") or "in_transit",
                    description=t_desc,
                    location=t.get("location") or "",
                ))
                new_inserted += 1
            except Exception as e:
                # 单条插入失败不影响整体
                continue
        if new_inserted > 0:
            try:
                db.commit()
            except Exception:
                db.rollback()
            # 重新加载 updates
            db.refresh(logistics)
            cached_traces = sorted(
                [
                    {
                        "time": u.time.isoformat() if u.time else None,
                        "status": u.status,
                        "description": u.description,
                        "location": u.location,
                        "source": "cache",
                    }
                    for u in logistics.updates
                ],
                key=lambda t: t.get("time") or "",
                reverse=True,
            )

    return ApiResponse(
        success=True,
        data={
            "has_logistics": True,
            "tracking_number": logistics.tracking_number,
            "carrier": logistics.carrier,
            "shipped_at": logistics.created_at.isoformat() if logistics.created_at else None,
            "realtime_status": realtime.get("status") if realtime else None,
            "realtime_source": realtime.get("source") if realtime else None,
            "realtime_error": realtime.get("message") if realtime and not realtime.get("success") else None,
            "traces": cached_traces,
        },
        message="查询成功",
    )
