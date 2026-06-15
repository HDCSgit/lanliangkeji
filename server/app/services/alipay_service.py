"""
支付宝开放平台服务(电脑网站支付 / 手机网站支付)。

参考: https://github.com/fzlee/alipay
环境:
  - 正式网关: https://openapi.alipay.com/gateway.do
  - 沙箱网关: https://openapi.alipaydev.com/gateway.do (用沙箱 AppID 时)

手机端使用 alipay.trade.wap.pay (手机网站支付)
PC   端使用 alipay.trade.page.pay (电脑网站支付)
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, Optional
from urllib.parse import quote_plus

from alipay import AliPay

from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================
# 客户端平台检测
# ============================================================

_MOBILE_UA_PATTERNS = re.compile(
    r"(android|bb\d+|meego|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|"
    r"hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile|"
    r"nokia|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|"
    r"series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|"
    r"xda|xiino)",
    re.IGNORECASE,
)


def detect_platform(user_agent: Optional[str]) -> str:
    """
    根据 User-Agent 判断客户端平台。
    返回 "mobile" / "pc"
    """
    if not user_agent:
        return "pc"
    return "mobile" if _MOBILE_UA_PATTERNS.search(user_agent) else "pc"


def _normalize_rsa_key(key: str, kind: str = "private") -> str:
    """
    规范化用户从支付宝开放平台复制来的 RSA 密钥:
      1. 把 \\\\n 翻译成真换行
      2. 去掉首尾空白
      3. 裸 base64(无 -----BEGIN 头)时,自动补上 PKCS#1 头尾并按 64 字符折行

    kind: "private" (PKCS#1 RSA PRIVATE KEY) / "public" (PKCS#8 PUBLIC KEY)
    """
    if not key:
        return key
    k = key.replace("\\n", "\n").strip()
    if "-----BEGIN" in k:
        return k
    b64 = "".join(k.split())
    if not b64:
        return k
    lines = [b64[i:i+64] for i in range(0, len(b64), 64)]
    if kind == "private":
        begin, end = "-----BEGIN RSA PRIVATE KEY-----", "-----END RSA PRIVATE KEY-----"
    else:
        begin, end = "-----BEGIN PUBLIC KEY-----", "-----END PUBLIC KEY-----"
    return f"{begin}\n" + "\n".join(lines) + f"\n{end}"


# 兼容旧名(外部若还在 import 也兼容)
_strip_rsa_headers = _normalize_rsa_key


def get_alipay_client() -> Optional[AliPay]:
    """
    构造 AliPay 客户端。
    若 ALIPAY_APP_ID / 私钥 / 公钥任一为空,返回 None(走 mock 模式)。

    ALIPAY_GATEWAY 字段:
        - 默认: https://openapi.alipay.com/gateway.do (正式)
        - 含 "sandbox" 或 "alipaydev": 自动切到沙箱模式 (debug=True)
    """
    app_id = (settings.ALIPAY_APP_ID or "").strip()
    app_private_key = _normalize_rsa_key(settings.ALIPAY_APP_PRIVATE_KEY, "private")
    alipay_public_key = _normalize_rsa_key(settings.ALIPAY_ALIPAY_PUBLIC_KEY, "public")

    if not (app_id and app_private_key and alipay_public_key):
        logger.warning(
            "Alipay not configured (app_id=%r, has_private=%s, has_public=%s) → mock mode",
            bool(app_id), bool(app_private_key), bool(alipay_public_key),
        )
        return None

    gateway = (settings.ALIPAY_GATEWAY or "").lower()
    is_sandbox = "sandbox" in gateway or "alipaydev" in gateway

    return AliPay(
        appid=app_id,
        app_notify_url=(settings.ALIPAY_NOTIFY_URL or None),
        app_private_key_string=app_private_key,
        alipay_public_key_string=alipay_public_key,
        sign_type="RSA2",
        debug=is_sandbox,
    )


def is_alipay_configured() -> bool:
    return bool(
        (settings.ALIPAY_APP_ID or "").strip()
        and _strip_rsa_headers(settings.ALIPAY_APP_PRIVATE_KEY)
        and _strip_rsa_headers(settings.ALIPAY_ALIPAY_PUBLIC_KEY)
    )


def create_precreate_order(
    out_trade_no: str,
    total_amount: float,
    subject: str,
    *,
    platform: str = "pc",
    timeout_express: str = "30m",
    notify_url: Optional[str] = None,
    return_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    创建支付宝支付订单。
    - platform="mobile" -> 走 alipay.trade.wap.pay (手机网站支付, 支付宝 App 内可自动唤起)
    - platform="pc"     -> 走 alipay.trade.page.pay (电脑网站支付)

    Returns:
        {
          "ok": True,
          "method": "POST",
          "platform": "mobile" | "pc",
          "gateway": "https://openapi.alipay.com/gateway.do?...",
          "form_html": "<form>...</form>",
          "out_trade_no": "...",
        }
    """
    alipay = get_alipay_client()
    if not alipay:
        return {"ok": False, "reason": "alipay_not_configured", "mock": True}

    total = str(round(float(total_amount), 2))
    subj = subject[:128]  # 支付宝 subject 限制 128 字节
    ret = return_url or settings.ALIPAY_RETURN_URL or None
    ntf = notify_url or settings.ALIPAY_NOTIFY_URL or None

    if platform == "mobile":
        # 手机网站支付:返回带签名的 query string,组装到网关 URL
        pay_url = alipay.api_alipay_trade_wap_pay(
            subject=subj,
            out_trade_no=out_trade_no,
            total_amount=total,
            return_url=ret,
            notify_url=ntf,
        )
    else:
        # 电脑网站支付
        pay_url = alipay.api_alipay_trade_page_pay(
            out_trade_no=out_trade_no,
            total_amount=total,
            subject=subj,
            return_url=ret,
            notify_url=ntf,
        )

    full_url = f"{settings.ALIPAY_GATEWAY}?{pay_url}"
    # 构造自动提交的 form (用户点击"去支付"立即跳转)
    form_html = (
        f'<form id="alipay_submit" name="alipay_submit" action="{full_url}" method="POST">'
        f'<input type="hidden" name="biz_content" value="{pay_url}"/>'
        f'<input type="submit" value="去支付宝支付" style="display:none"/></form>'
        f'<script>document.getElementById("alipay_submit").submit();</script>'
    )
    return {
        "ok": True,
        "method": "POST",
        "platform": platform,
        "gateway": full_url,
        "form_html": form_html,
        "out_trade_no": out_trade_no,
    }


def verify_notify_sign(posted_data: Dict[str, str]) -> bool:
    """
    验证支付宝异步通知的签名(供 /payments/alipay/notify 使用)。
    posted_data 应去掉 sign / sign_type 字段。
    """
    alipay = get_alipay_client()
    if not alipay:
        return False
    sign = posted_data.pop("sign", None) if "sign" in posted_data else None
    if not sign:
        return False
    return alipay.verify(posted_data, sign)


def query_order(out_trade_no: str) -> Dict[str, Any]:
    """
    主动查询订单状态(用于回调未到时轮询 / 支付完成后回查)。
    返回值已解码,字段如:
      {"trade_no": "202xxx", "out_trade_no": "PAY...", "trade_status": "TRADE_SUCCESS", "total_amount": "100.00"}
    """
    alipay = get_alipay_client()
    if not alipay:
        return {"ok": False, "reason": "alipay_not_configured"}
    try:
        result = alipay.api_alipay_trade_query(out_trade_no=out_trade_no)
        return {"ok": True, "result": result}
    except Exception as e:
        logger.exception("query_order failed: %s", e)
        return {"ok": False, "reason": str(e)}


def trade_status_paid(trade_status: str) -> bool:
    """
    判定支付宝交易状态是否为已支付。
    """
    if not trade_status:
        return False
    s = trade_status.upper()
    return s in ("TRADE_SUCCESS", "TRADE_FINISHED")
