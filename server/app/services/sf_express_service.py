"""
SF Express (顺丰速运) Open Platform API client.

Official docs: https://open.sf-express.com/
Supports route query and waybill tracking.
"""

import hashlib
import json
import time
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

import requests


class SFExpressService:
    """
    顺丰开放平台 API 客户端。

    环境地址：
    - 测试环境: https://sfapi-sbox.sf-express.com/
    - 生产环境: https://sfapi.sf-express.com/
    """

    ENV_SANDBOX = "sandbox"
    ENV_PRODUCTION = "production"

    _BASE_URLS = {
        ENV_SANDBOX: "https://sfapi-sbox.sf-express.com",
        ENV_PRODUCTION: "https://sfapi.sf-express.com",
    }

    # 常用服务编码
    SERVICE_ROUTE_QUERY = "EXP_RECE_SEARCH_ROUTES"          # 路由查询
    SERVICE_WAYBILL_QUERY = "EXP_RECE_QUERY_SFWAYBILL"        # 运单查询
    SERVICE_ORDER_QUERY = "EXP_RECE_SEARCH_ORDER"             # 订单结果查询

    def __init__(
        self,
        partner_id: str,
        checkword: str,
        env: str = ENV_PRODUCTION,
    ):
        self.partner_id = partner_id
        self.checkword = checkword
        self.env = env
        self.base_url = self._BASE_URLS.get(env, self._BASE_URLS[self.ENV_PRODUCTION])

    def _generate_timestamp(self) -> str:
        """生成毫秒级时间戳。"""
        return str(int(time.time() * 1000))

    def _generate_msg_no(self) -> str:
        """生成唯一消息编号。"""
        return str(uuid.uuid4()).replace("-", "")[:32]

    def _sign(self, msg_data: str, timestamp: str) -> str:
        """
        生成顺丰 API 签名。

        签名规则: base64(md5(msgData + timestamp + checkword))
        """
        raw = f"{msg_data}{timestamp}{self.checkword}"
        md5_hash = hashlib.md5(raw.encode("utf-8")).hexdigest()
        return hashlib.md5(md5_hash.encode("utf-8")).hexdigest().upper()

    def _build_headers(self, msg_data: str, timestamp: str) -> Dict[str, str]:
        """构建请求头。"""
        return {
            "Content-Type": "application/json",
            "X-Partner-ID": self.partner_id,
            "X-Timestamp": timestamp,
            "X-Sign": self._sign(msg_data, timestamp),
            "X-Msg-No": self._generate_msg_no(),
        }

    def _call(
        self,
        service_code: str,
        msg_data: Dict[str, Any],
        timeout: int = 15,
    ) -> Dict[str, Any]:
        """
        调用顺丰开放平台 API。

        通用请求格式:
        {
            "serviceCode": "xxx",
            "partnerID": "xxx",
            "timestamp": "xxx",
            "msgData": "<base64/json>",
            "sign": "xxx"
        }
        """
        timestamp = self._generate_timestamp()
        msg_data_str = json.dumps(msg_data, ensure_ascii=False, separators=(",", ":"))

        payload = {
            "serviceCode": service_code,
            "partnerID": self.partner_id,
            "timestamp": timestamp,
            "msgData": msg_data_str,
            "sign": self._sign(msg_data_str, timestamp),
        }

        url = f"{self.base_url}/std/service"
        try:
            resp = requests.post(url, json=payload, timeout=timeout)
            resp.raise_for_status()
            result = resp.json()

            # 解析外层响应
            api_result_code = result.get("apiResultCode", "")
            api_result_msg = result.get("apiResultMsg", "")

            if api_result_code != "A1000":
                return {
                    "success": False,
                    "message": f"[{api_result_code}] {api_result_msg}",
                    "raw": result,
                }

            # 解析业务层响应
            api_result_data = result.get("apiResultData", "{}")
            if isinstance(api_result_data, str):
                try:
                    api_result_data = json.loads(api_result_data)
                except json.JSONDecodeError:
                    api_result_data = {}

            return {
                "success": True,
                "data": api_result_data,
                "raw": result,
            }

        except requests.exceptions.Timeout:
            return {"success": False, "message": "请求顺丰 API 超时"}
        except requests.exceptions.RequestException as e:
            return {"success": False, "message": f"请求顺丰 API 失败: {str(e)}"}
        except Exception as e:
            return {"success": False, "message": f"顺丰 API 异常: {str(e)}"}

    def query_route(
        self,
        tracking_number: str,
        phone: Optional[str] = None,
        search_type: str = "1",
    ) -> Dict[str, Any]:
        """
        路由查询（运单轨迹）。

        Args:
            tracking_number: 顺丰运单号
            phone: 收件人/寄件人手机号后四位（部分场景需要）
            search_type: 查询类型 1=运单号, 2=订单号
        """
        msg_data: Dict[str, Any] = {
            "routeReq": {
                "trackingNumber": tracking_number,
                "searchType": search_type,
            }
        }
        if phone:
            msg_data["routeReq"]["phone"] = phone

        result = self._call(self.SERVICE_ROUTE_QUERY, msg_data)
        if not result.get("success"):
            return result

        data = result.get("data", {})
        route_resps = data.get("routeResps", [])

        if not route_resps:
            return {
                "success": False,
                "message": "未查询到路由信息",
                "raw": data,
            }

        routes = route_resps[0].get("routes", [])
        traces: List[Dict[str, str]] = []
        for r in routes:
            traces.append({
                "time": r.get("acceptTime", ""),
                "description": r.get("remark", ""),
                "location": r.get("acceptAddress", ""),
            })

        # 解析最新状态
        latest_status = "运输中"
        if traces:
            latest_remark = traces[0].get("description", "")
            if "签收" in latest_remark:
                latest_status = "已签收"
            elif "派送" in latest_remark:
                latest_status = "派送中"
            elif "揽收" in latest_remark:
                latest_status = "已揽收"

        return {
            "success": True,
            "carrier": "顺丰速运",
            "tracking_number": tracking_number,
            "status": latest_status,
            "traces": traces,
            "source": "sf_express",
        }

    def query_waybill(
        self,
        tracking_number: str,
        phone: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        运单查询（运单基本信息）。

        Args:
            tracking_number: 顺丰运单号
            phone: 收件人/寄件人手机号后四位
        """
        msg_data: Dict[str, Any] = {
            "waybillNo": tracking_number,
        }
        if phone:
            msg_data["phone"] = phone

        result = self._call(self.SERVICE_WAYBILL_QUERY, msg_data)
        if not result.get("success"):
            return result

        data = result.get("data", {})
        waybill = data.get("waybill", {})

        return {
            "success": True,
            "carrier": "顺丰速运",
            "tracking_number": tracking_number,
            "status": waybill.get("status", "未知"),
            "source": "sf_express",
            "detail": waybill,
        }

    def track(self, tracking_number: str, phone: Optional[str] = None) -> Dict[str, Any]:
        """
        统一追踪接口：优先路由查询，获取完整轨迹。

        Args:
            tracking_number: 顺丰运单号
            phone: 收件人/寄件人手机号后四位（可选）
        """
        return self.query_route(tracking_number, phone=phone)


class SFExpressMockService:
    """顺丰 API 模拟服务（用于测试环境）。"""

    @classmethod
    def track(cls, tracking_number: str, _phone: Optional[str] = None) -> Dict[str, Any]:
        """生成模拟顺丰轨迹数据。"""
        now = datetime.now()
        traces = [
            {
                "time": now.strftime("%Y-%m-%d %H:%M:%S"),
                "description": "快件已签收，签收人：本人",
                "location": "收件地网点",
            },
            {
                "time": (now.strftime("%Y-%m-%d %H:%M:%S")),
                "description": "快件正在派送中，快递员：王师傅 13800138003",
                "location": "收件地网点",
            },
            {
                "time": (now.strftime("%Y-%m-%d %H:%M:%S")),
                "description": "快件到达【收件地网点】",
                "location": "收件地网点",
            },
            {
                "time": (now.strftime("%Y-%m-%d %H:%M:%S")),
                "description": "快件离开【福州转运中心】，发往【收件地】",
                "location": "福州转运中心",
            },
            {
                "time": (now.strftime("%Y-%m-%d %H:%M:%S")),
                "description": "顺丰速运已收取快件",
                "location": "福州市",
            },
        ]
        return {
            "success": True,
            "carrier": "顺丰速运",
            "tracking_number": tracking_number,
            "status": "已签收",
            "traces": traces,
            "source": "sf_express_mock",
            "is_mock": True,
        }


def create_sf_express_service(config: Dict[str, Any]) -> SFExpressService:
    """
    根据配置创建顺丰服务实例。

    Args:
        config: {
            "partner_id": str,
            "checkword": str,
            "env": "sandbox" | "production"
        }
    """
    return SFExpressService(
        partner_id=config.get("partner_id", ""),
        checkword=config.get("checkword", ""),
        env=config.get("env", SFExpressService.ENV_PRODUCTION),
    )
