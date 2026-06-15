"""
顺丰 H5 公开路由查询服务（免密钥）。

原理：
顺丰手机端 m.sf-express.com 提供的路由查询 H5 接口，
任何人都能请求，不需要 partnerID / checkword。

接口地址（来自顺丰移动端页面）:
    https://m.sf-express.com/std/express/SF014001002002

请求方式：POST application/x-www-form-urlencoded
常用参数：
    type     = 业务类型（路由查询固定 SF014001002002）
    lang     = zh-cn
    region   = cn
    trackNum = 顺丰运单号
    translate= ""

注意：
- 该接口是面向 C 端用户的，未公开承诺的 SLA，仅适合小规模内部查询（日 < 500 单）。
- 单 IP 有频率限制（实测 ~30 QPS），生产建议加重试 + 缓存。
- 如果 4xx / 5xx / 超时，会返回 success=False 让上层走降级链。
"""
import json
import re
from typing import Any, Dict, List, Optional
from datetime import datetime

import requests
import urllib3
import warnings


# 顺丰 H5 接口在部分网络环境(CDN/反向代理)下会用自签名证书,导致 verify 失败
# 本服务在 verify 失败时降级到 verify=False,仅影响 m.sf-express.com
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
warnings.filterwarnings("ignore", message="Unverified HTTPS request")


# 顺丰 H5 接口地址
SF_H5_ROUTE_URL = "https://m.sf-express.com/std/express/SF014001002002"

# 通用浏览器 UA（顺丰移动端 UA）
DEFAULT_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
)

# 顺丰运单号正则（SF 开头 + 12 位以上字母数字）
SF_TRACKING_PATTERN = re.compile(r"^SF[A-Z0-9]{12,}$", re.IGNORECASE)

# 顺丰轨迹里的状态关键字 → 标准化状态
_STATUS_KEYWORDS = [
    ("签收", "已签收"),
    ("派送", "派送中"),
    ("揽收", "已揽收"),
    ("退回", "退回中"),
]


def _detect_status(latest_remark: str) -> str:
    """从最新一条轨迹的描述里推断状态。"""
    for kw, status in _STATUS_KEYWORDS:
        if kw in latest_remark:
            return status
    return "运输中"


def _parse_route_items(items: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    把 H5 接口返回的 routes 数组规整成统一 traces 结构。
    H5 返回的字段名在不同版本略有差异，做容错：
        acceptTime / time / ftime
        remark / context / desc
        acceptAddress / address / location
    """
    traces: List[Dict[str, str]] = []
    for it in items:
        if not isinstance(it, dict):
            continue
        traces.append({
            "time": str(it.get("acceptTime") or it.get("time") or it.get("ftime") or ""),
            "description": str(it.get("remark") or it.get("context") or it.get("desc") or ""),
            "location": str(it.get("acceptAddress") or it.get("address") or it.get("location") or ""),
        })
    return traces


class SFExpressH5Service:
    """
    顺丰 H5 公开路由查询（免 partnerID/checkword）。

    用法:
        svc = SFExpressH5Service(timeout=10)
        result = svc.track("SF1234567890123")
    """

    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": DEFAULT_UA,
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Referer": "https://m.sf-express.com/",
            "Origin": "https://m.sf-express.com",
            "X-Requested-With": "XMLHttpRequest",
        })

    @classmethod
    def is_sf_tracking_number(cls, tracking_number: str) -> bool:
        """判断是否为顺丰运单号。"""
        if not tracking_number:
            return False
        return bool(SF_TRACKING_PATTERN.match(tracking_number.strip()))

    def _post(self, payload: Dict[str, str], allow_html_fallback: bool = True) -> Optional[Dict[str, Any]]:
        """
        发送一次 POST 请求，返回解析后的 JSON；失败返回 None。

        SSL 处理策略：先按 verify=True 严格校验；若失败（自签名证书）
        则降级为 verify=False，因为顺丰 H5 接口在部分 CDN/反代节点用了自签名证书。
        仅针对 m.sf-express.com 域名做此降级。

        业务错误处理：顺丰 H5 业务错误时返回 HTML（window.alert 弹窗），
        这种情况下我们解析 HTML 里的 alert 文案，包装成结构化结果交给上层。
        """
        # 第一次：标准 SSL 校验
        try:
            resp = self.session.post(
                SF_H5_ROUTE_URL,
                data=payload,
                timeout=self.timeout,
                verify=True,
            )
        except requests.exceptions.SSLError:
            # 第二次：降级 verify=False（顺丰 H5 部分节点是自签名证书）
            try:
                resp = self.session.post(
                    SF_H5_ROUTE_URL,
                    data=payload,
                    timeout=self.timeout,
                    verify=False,
                )
            except (requests.exceptions.Timeout, requests.exceptions.RequestException, ValueError):
                return None
        except (requests.exceptions.Timeout, requests.exceptions.RequestException, ValueError):
            return None

        if resp.status_code != 200:
            return None

        ctype = resp.headers.get("Content-Type", "")
        if "json" in ctype.lower():
            try:
                return resp.json()
            except ValueError:
                return None

        # 业务错误返回 HTML：尝试从 window.alert("...") 中提取信息
        if allow_html_fallback and "html" in ctype.lower():
            text = resp.text or ""
            import re as _re
            m = _re.search(r'window\.alert\("([^"]+)"\)', text)
            if m:
                return {
                    "__html_error__": True,
                    "message": m.group(1).encode("latin-1").decode("utf-8", errors="replace"),
                }
            # 找不到 alert 时,原样返回文本前 200 字
            return {
                "__html_error__": True,
                "message": text[:200].encode("latin-1").decode("utf-8", errors="replace"),
            }

        return None

    def track(
        self,
        tracking_number: str,
        phone: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        查询顺丰运单轨迹。

        Args:
            tracking_number: 顺丰运单号
            phone: 收件人/寄件人手机号后四位（顺丰 H5 接口要求）
                   注意：传完整 11 位手机号会被顺丰风控挂起超时，
                   务必传后 4 位（例如 "3922"）。

        Returns:
            {
              "success": bool,
              "carrier": "顺丰速运",
              "tracking_number": str,
              "status": str,            # 已签收/派送中/已揽收/运输中...
              "traces": [{"time","description","location"}, ...],
              "source": "sf_express_h5",
            }
        """
        tn = (tracking_number or "").strip()
        if not tn:
            return {"success": False, "message": "运单号为空"}

        if not self.is_sf_tracking_number(tn):
            return {
                "success": False,
                "message": f"非顺丰运单号格式: {tn}",
            }

        # 顺丰 H5 接口需要收件人/寄件人手机后四位
        # 传完整 11 位号码会被风控(挂起不返回)
        phone_digits = "".join(c for c in (phone or "") if c.isdigit())
        if phone_digits and len(phone_digits) > 4:
            phone_digits = phone_digits[-4:]

        payload: Dict[str, str] = {
            "type": "SF014001002002",
            "lang": "zh-cn",
            "region": "cn",
            "translate": "",
            "trackNum": tn,
        }
        if phone_digits:
            payload["phone"] = phone_digits

        data = self._post(payload)
        if data is None:
            return {
                "success": False,
                "message": "顺丰 H5 接口请求失败（网络/HTTP/SSL 异常）",
            }

        # HTML 错误(顺丰 H5 业务错误时返回 window.alert 弹窗)
        if isinstance(data, dict) and data.get("__html_error__"):
            return {
                "success": False,
                "message": f"顺丰 H5 业务失败: {data.get('message', '查询失败')}",
                "raw_hint": "需检查运单号 + 收件人/寄件人手机后四位是否对应",
            }

        # H5 接口业务层 code：A1000=成功；其他视为失败
        code = str(data.get("code") or data.get("apiResultCode") or "")
        if code and code not in ("A1000", "0", "200", ""):
            msg = data.get("msg") or data.get("apiResultMsg") or f"业务码 {code}"
            return {"success": False, "message": f"顺丰 H5 业务失败: {msg}", "raw_code": code}

        # 解析轨迹数据（不同版本字段略不同，做容错）
        routes_raw: List[Dict[str, Any]] = []
        if isinstance(data.get("data"), dict):
            inner = data["data"]
            if isinstance(inner.get("routeResps"), list) and inner["routeResps"]:
                routes_raw = inner["routeResps"][0].get("routes", []) or []
            elif isinstance(inner.get("routes"), list):
                routes_raw = inner["routes"]
        elif isinstance(data.get("routes"), list):
            routes_raw = data["routes"]
        elif isinstance(data.get("data"), list):
            routes_raw = data["data"]

        if not routes_raw:
            return {
                "success": False,
                "message": "未查询到轨迹数据（单号无记录或尚未揽收）",
                "raw": data,
            }

        traces = _parse_route_items(routes_raw)
        latest_remark = traces[0]["description"] if traces else ""

        return {
            "success": True,
            "carrier": "顺丰速运",
            "tracking_number": tn,
            "status": _detect_status(latest_remark),
            "traces": traces,
            "source": "sf_express_h5",
        }
