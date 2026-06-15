from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import OrderStatus, PaymentMethod, PaymentStatus, VoucherStatus, BillStatus, BillType
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_sysadmin
from app.models.models import (
    Order, PaymentOrder, PaymentGatewayConfig, ReceivableAccount, Bill, User, Voucher
)
from app.schemas.schemas import ApiResponse, PaymentCallback, PaymentCreate, PaymentOut
from app.services.alipay_service import (
    create_precreate_order as alipay_create_precreate_order,
    detect_platform,
    is_alipay_configured,
    query_order as alipay_query_order,
    trade_status_paid,
    verify_notify_sign,
)
from app.services.storage_service import get_express_config
from app.utils.generators import generate_payment_no

router = APIRouter()


def _make_qr_url(data: str) -> str:
    return f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={quote(data, safe='')}"


@router.post("/create", response_model=ApiResponse)
def create_payment(
    payload: PaymentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    if order.user_id != current_user.id and current_user.role not in (UserRole.SYSADMIN, UserRole.AUDITOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作该订单")

    payment_no = generate_payment_no()
    now = datetime.now(timezone.utc)

    if payload.method in (PaymentMethod.WECHAT, PaymentMethod.ALIPAY):
        expired_at = now + timedelta(minutes=30)
    else:
        expired_at = now + timedelta(hours=72)

    qr_code: str | None = None
    pay_url: str | None = None
    form_html: str | None = None
    alipay_trade_url: str | None = None
    alipay_mode: str = "mock"
    receivable_account: dict | None = None

    if payload.method == PaymentMethod.WECHAT:
        pay_url = f"/api/v1/payments/{payment_no}/status"
        qr_code = _make_qr_url(f"wechat:{payment_no}")
    elif payload.method == PaymentMethod.ALIPAY:
        # 真实支付宝接入(按 UA 自动选 page.pay PC / wap.pay 手机)
        platform = detect_platform(request.headers.get("user-agent", ""))
        alipay_resp = alipay_create_precreate_order(
            out_trade_no=payment_no,
            total_amount=float(order.final_amount),
            subject=f"订单 {order.order_no} 支付",
            platform=platform,
        )
        if alipay_resp.get("ok"):
            alipay_mode = "real"
            alipay_trade_url = alipay_resp["gateway"]
            form_html = alipay_resp["form_html"]
            pay_url = alipay_resp["gateway"]  # 兼容老字段
            qr_code = alipay_resp["gateway"]  # 在 PaymentOut 展示为可点击的支付链接
        else:
            # 配置缺失或 SDK 异常 → 回退到 mock 模式(开发期不阻塞业务)
            alipay_mode = "mock"
            pay_url = f"/api/v1/payments/{payment_no}/status"
            qr_code = _make_qr_url(f"alipay:{payment_no}")
    elif payload.method == PaymentMethod.BANK_TRANSFER:
        account = db.query(ReceivableAccount).first()
        if account:
            receivable_account = {
                "account_name": account.account_name,
                "bank_name": account.bank_name,
                "account_number": account.account_number,
            }

    payment = PaymentOrder(
        order_id=order.id,
        order_no=order.order_no,
        payment_no=payment_no,
        payment_method=payload.method,
        amount=order.final_amount,
        status=PaymentStatus.PENDING,
        qr_code=qr_code,
        pay_url=pay_url,
        expired_at=expired_at,
    )
    db.add(payment)

    order.payment_method = payload.method
    db.commit()
    db.refresh(payment)

    data = {"payment": PaymentOut.model_validate(payment)}
    if receivable_account:
        data["receivable_account"] = receivable_account
    if payload.method == PaymentMethod.ALIPAY:
        data["alipay"] = {
            "mode": alipay_mode,         # "real" / "mock"
            "configured": is_alipay_configured(),
            "platform": platform,         # "mobile" / "pc" (后端按 UA 选定)
            "trade_url": alipay_trade_url,
            "form_html": form_html,      # 前端可直接 innerHTML 到一个 div
        }

    return ApiResponse(success=True, data=data, message="支付订单创建成功")


# ============================================================
# 支付宝回调
# ============================================================

def _mark_paid_and_settle(db: Session, payment: PaymentOrder) -> None:
    """统一的支付成功处理:更新 PaymentOrder + Order + 写账单。"""
    if payment.status == PaymentStatus.PAID:
        return  # 幂等
    now = datetime.now(timezone.utc)
    payment.status = PaymentStatus.PAID
    payment.paid_at = now
    db.flush()

    order = payment.order
    order.status = OrderStatus.PAID
    order.payment_time = now
    order.payment_method = payment.payment_method

    bill = Bill(
        user_id=order.user_id,
        order_id=order.id,
        order_no=order.order_no,
        type="expense",
        amount=payment.amount,
        payment_method=payment.payment_method,
        description=f"订单 {order.order_no} 支付成功",
        status="success",
    )
    db.add(bill)
    db.commit()


@router.post("/alipay/notify", include_in_schema=True)
async def alipay_notify(request: Request, db: Session = Depends(get_db)):
    """
    支付宝异步通知(POST application/x-www-form-urlencoded)。

    配置路径:支付宝开放平台 -> 应用配置 -> 授权回调地址。
    注意:此接口必须返回纯文本 "success"(成功) / "fail"(失败),不能返回 JSON。
    """
    form = await request.form()
    posted = {k: v for k, v in form.items() if k not in ("sign", "sign_type")}

    if not verify_notify_sign({k: str(v) for k, v in posted.items()}):
        return HTMLResponse(content="fail", status_code=400)

    out_trade_no = posted.get("out_trade_no")
    trade_status = posted.get("trade_status", "")
    if not out_trade_no:
        return HTMLResponse(content="fail", status_code=400)

    payment = db.query(PaymentOrder).filter(PaymentOrder.payment_no == out_trade_no).first()
    if not payment:
        return HTMLResponse(content="fail", status_code=404)

    if trade_status_paid(trade_status):
        try:
            _mark_paid_and_settle(db, payment)
        except Exception:
            db.rollback()
            return HTMLResponse(content="fail", status_code=500)
    return HTMLResponse(content="success")


@router.get("/alipay/launch/{payment_no}", include_in_schema=False)
def alipay_launch(
    payment_no: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    支付宝支付"中转页"。

    为什么需要这个中转:
    支付宝 trade.wap.pay / trade.page.pay 必须用 POST 表单提交。
    前端如果直接 form.submit() 跳支付宝, 部分手机浏览器在支付宝 App 接管 URL 时
    会 pop 掉当前 history, 用户回到 #/checkout "选择支付方式" 页。

    解决: 前端 window.location 跳到后端这个接口, 后端渲染 form 自动 POST 提交给支付宝。
    当前端跳走后, 浏览器栈不再持有前端 PaymentPage 的 history, 支付宝完成支付后
    return_url 跳回 /return 接口, 后端 HTML meta refresh 跳回前端 /#/order/{id}。
    """
    payment = db.query(PaymentOrder).filter(PaymentOrder.payment_no == payment_no).first()
    if not payment:
        return HTMLResponse(content="<h1>支付订单不存在</h1>", status_code=404)

    # 按当前请求的 UA 重新选择 API
    platform = detect_platform(request.headers.get("user-agent", ""))
    alipay_resp = alipay_create_precreate_order(
        out_trade_no=payment.payment_no,
        total_amount=float(payment.amount),
        subject=f"订单 {payment.order_no} 支付",
        platform=platform,
    )
    if not alipay_resp.get("ok"):
        return HTMLResponse(content="<h1>支付宝未配置</h1>", status_code=500)

    # 复用之前构造的 form_html, 含自动 submit 的 JS
    return HTMLResponse(content=alipay_resp["form_html"])


@router.get("/alipay/return", include_in_schema=True)
async def alipay_return(
    request: Request,
    out_trade_no: str,
    db: Session = Depends(get_db),
):
    """
    支付宝同步跳转(用户在支付宝页面付完后跳回)。

    简单展示一个"支付完成/正在确认"的页面;真正的入账以 notify 为准。
    用户随后被前端 PaymentPage 自动跳到 /orders/{id}。
    """
    payment = db.query(PaymentOrder).filter(PaymentOrder.payment_no == out_trade_no).first()
    if not payment:
        return HTMLResponse(content="<h1>支付订单不存在</h1>", status_code=404)

    # 同步回来时支付宝的 trade_status 经常还是 WAIT_BUYER_PAY,
    # 这里额外主动查一次,确保跳转页能反映真实结果
    if payment.status != PaymentStatus.PAID:
        query_resp = alipay_query_order(out_trade_no)
        if query_resp.get("ok"):
            r = query_resp["result"]
            if trade_status_paid(r.get("trade_status", "")):
                try:
                    _mark_paid_and_settle(db, payment)
                except Exception:
                    db.rollback()

    order_id = payment.order_id
    # 拼接前端绝对 URL (前端用 HashRouter, 路径必须是 /#/order/<id>, 不能是 /order/<id>)
    frontend_base = (settings.FRONTEND_BASE_URL or "http://localhost:5173").rstrip("/")
    order_url = f"{frontend_base}/#/order/{order_id}"
    # 给用户一个简单的等待页,3 秒后跳订单详情
    html = f"""<!doctype html><html><head><meta charset="utf-8">
<title>支付完成</title><meta http-equiv="refresh" content="3;url={order_url}"></head>
<body style="font-family:sans-serif;text-align:center;padding:60px 20px;">
<h2 style="color:#0c7a8a;">支付已完成</h2>
<p>正在确认支付结果,3 秒后跳转到订单详情...</p>
<p>如果未自动跳转, <a href="{order_url}">点这里</a></p>
</body></html>"""
    return HTMLResponse(content=html)


@router.post("/alipay/query", response_model=ApiResponse)
def alipay_query(
    out_trade_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    主动查询支付宝订单(给前端轮询 / 重新确认结果用)。
    """
    payment = db.query(PaymentOrder).filter(PaymentOrder.payment_no == out_trade_no).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="支付订单不存在")
    if payment.order.user_id != current_user.id and current_user.role not in (UserRole.SYSADMIN, UserRole.AUDITOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查询该支付订单")

    query_resp = alipay_query_order(out_trade_no)
    if query_resp.get("ok"):
        r = query_resp["result"]
        if trade_status_paid(r.get("trade_status", "")):
            try:
                _mark_paid_and_settle(db, payment)
                db.refresh(payment)
            except Exception:
                db.rollback()
        return ApiResponse(success=True, data={
            "out_trade_no": out_trade_no,
            "trade_status": r.get("trade_status"),
            "trade_no": r.get("trade_no"),
            "total_amount": r.get("total_amount"),
            "paid": trade_status_paid(r.get("trade_status", "")),
            "local_status": payment.status,
        })
    return ApiResponse(success=False, message=query_resp.get("reason", "查询失败"))


@router.get("/{payment_no}/status", response_model=ApiResponse)
def get_payment_status(
    payment_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.query(PaymentOrder).filter(PaymentOrder.payment_no == payment_no).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="支付订单不存在")

    if payment.order.user_id != current_user.id and current_user.role not in (UserRole.SYSADMIN, UserRole.AUDITOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看该支付订单")

    # 自动将已过期的待支付订单标记为过期（避免前端时区解析差异导致误判）
    if payment.status == PaymentStatus.PENDING and payment.expired_at:
        now = datetime.now(timezone.utc)
        expired_at = payment.expired_at
        if expired_at.tzinfo is None:
            expired_at = expired_at.replace(tzinfo=timezone.utc)
        if now > expired_at:
            payment.status = PaymentStatus.EXPIRED
            db.commit()
            db.refresh(payment)

    return ApiResponse(success=True, data=PaymentOut.model_validate(payment))


@router.post("/callback", response_model=ApiResponse)
def payment_callback(payload: PaymentCallback, db: Session = Depends(get_db)):
    payment = db.query(PaymentOrder).filter(PaymentOrder.payment_no == payload.payment_no).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="支付订单不存在")

    now = datetime.now(timezone.utc)
    payment.status = PaymentStatus.PAID
    payment.paid_at = now

    order = payment.order
    order.status = OrderStatus.PAID
    order.payment_time = now

    bill = Bill(
        user_id=order.user_id,
        order_id=order.id,
        order_no=order.order_no,
        type=BillType.EXPENSE,
        amount=payment.amount,
        payment_method=payment.payment_method,
        description=f"订单 {order.order_no} 支付",
        status=BillStatus.SUCCESS,
    )
    db.add(bill)
    db.commit()
    db.refresh(payment)

    return ApiResponse(success=True, data=PaymentOut.model_validate(payment), message="支付回调处理成功")


@router.get("/methods", response_model=ApiResponse)
def get_payment_methods(db: Session = Depends(get_db)):
    config = db.query(PaymentGatewayConfig).first()
    if not config:
        return ApiResponse(success=True, data=[], message="暂无支付方式配置")

    methods = []
    if config.wechat_pay.get("enabled"):
        methods.append({"method": "wechat", "name": "微信支付", "enabled": True})
    if config.alipay.get("enabled"):
        methods.append({"method": "alipay", "name": "支付宝", "enabled": True})
    if config.bank_transfer.get("enabled"):
        methods.append({"method": "bank_transfer", "name": "对公转账", "enabled": True})

    return ApiResponse(success=True, data=methods)


@router.get("/receivable-account", response_model=ApiResponse)
def get_receivable_account(db: Session = Depends(get_db)):
    account = db.query(ReceivableAccount).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="收款账户未配置")

    return ApiResponse(success=True, data={
        "id": account.id,
        "account_name": account.account_name,
        "bank_name": account.bank_name,
        "account_number": account.account_number,
        "updated_at": account.updated_at,
    })
