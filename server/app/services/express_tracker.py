import requests
import json
import re
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.services.sf_express_service import SFExpressService, SFExpressMockService, create_sf_express_service
from app.services.sf_express_h5_service import SFExpressH5Service


class ExpressTracker:
    """
    统一快递查询服务。

    查询优先级（可配置）：
    1. 顺丰开放平台 API（官方，partnerID 已配置时优先）
    2. 顺丰 H5 公开接口（免密钥，适合小规模内部查询）
    3. 快递100 免费接口
    4. 快递鸟 / aa1.cn 免费API
    5. 模拟数据（测试环境兜底）
    """

    # 快递公司编码映射
    CARRIER_MAP = {
        "顺丰速运": "shunfeng",
        "顺丰": "shunfeng",
        "中通快递": "zhongtong",
        "中通": "zhongtong",
        "圆通速递": "yuantong",
        "圆通": "yuantong",
        "韵达快递": "yunda",
        "韵达": "yunda",
        "申通快递": "shentong",
        "申通": "shentong",
        "德邦物流": "debang",
        "德邦": "debang",
        "EMS": "ems",
        "邮政": "ems",
        "京东物流": "jd",
        "京东": "jd",
        "极兔速递": "jtexpress",
        "极兔": "jtexpress",
        "百世快递": "huitongkuaidi",
        "百世": "huitongkuaidi",
        "天天快递": "tiantian",
        "天天": "tiantian",
        "菜鸟": "cainiao",
        "菜鸟裹裹": "cainiao",
    }

    # 顺丰单号正则
    SF_PATTERN = re.compile(r'^SF[A-Z0-9]{12,}$', re.IGNORECASE)
    
    # 通用单号正则（各快递公司）
    TRACKING_PATTERNS = {
        'shunfeng': re.compile(r'^SF[A-Z0-9]{12,}$', re.IGNORECASE),
        'zhongtong': re.compile(r'^7[0-9]{13}$|^ZT[0-9]{12,}$', re.IGNORECASE),
        'yuantong': re.compile(r'^YT[0-9]{12,}$|^8[0-9]{16,}$', re.IGNORECASE),
        'yunda': re.compile(r'^3[0-9]{12}$|^4[0-9]{12}$|^YT[0-9]{12,}$', re.IGNORECASE),
        'shentong': re.compile(r'^7[0-9]{13}$|^STO[0-9]{10,}$', re.IGNORECASE),
        'debang': re.compile(r'^DPK[0-9]{12,}$', re.IGNORECASE),
        'ems': re.compile(r'^1[0-9]{10}$|^E[A-Z][0-9]{9}CN$', re.IGNORECASE),
        'jd': re.compile(r'^JD[0-9]{12,}$|^JDVA[0-9]{12,}$', re.IGNORECASE),
        'jtexpress': re.compile(r'^JT[0-9]{12,}$', re.IGNORECASE),
    }

    # 支持的查询提供商
    PROVIDER_SF = "sf_express"          # 顺丰开放平台（需 partnerID/checkword）
    PROVIDER_SF_H5 = "sf_express_h5"    # 顺丰 H5 公开接口（免密钥）
    PROVIDER_KUAIDI100 = "kuaidi100"
    PROVIDER_KDNIAO = "kdniao"
    PROVIDER_MOCK = "mock"

    @classmethod
    def get_carrier_code(cls, carrier_name: str) -> str:
        """根据快递公司名称获取编码。"""
        return cls.CARRIER_MAP.get(carrier_name, "")

    @classmethod
    def detect_carrier(cls, tracking_number: str) -> str:
        """根据单号自动识别快递公司。"""
        for carrier, pattern in cls.TRACKING_PATTERNS.items():
            if pattern.match(tracking_number):
                return carrier
        return ""

    @classmethod
    def is_sf_express(cls, tracking_number: str, carrier: str = "") -> bool:
        """判断是否为顺丰运单。"""
        if cls.SF_PATTERN.match(tracking_number):
            return True
        carrier_code = cls.get_carrier_code(carrier)
        if carrier_code == "shunfeng":
            return True
        return False

    @classmethod
    def query_sf_express(
        cls,
        tracking_number: str,
        phone: Optional[str] = None,
        sf_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        使用顺丰开放平台 API 查询。

        Args:
            tracking_number: 顺丰运单号
            phone: 收件人/寄件人手机号后四位（部分场景需要）
            sf_config: 顺丰配置 {"partner_id": ..., "checkword": ..., "env": ...}
        """
        try:
            # 如果没有配置或配置不完整，使用模拟服务
            if not sf_config or not sf_config.get("partner_id") or not sf_config.get("checkword"):
                return SFExpressMockService.track(tracking_number, phone)

            service = create_sf_express_service(sf_config)
            return service.track(tracking_number, phone=phone)
        except Exception as e:
            return {"success": False, "message": f"顺丰查询异常: {str(e)}"}

    @classmethod
    def query_sf_express_h5(
        cls,
        tracking_number: str,
        phone: Optional[str] = None,
        timeout: int = 10,
    ) -> Dict[str, Any]:
        """
        使用顺丰 H5 公开接口查询（免 partnerID / checkword）。

        适合小规模（< 500 单/天）内部查询场景。
        """
        try:
            if not SFExpressH5Service.is_sf_tracking_number(tracking_number):
                return {
                    "success": False,
                    "message": f"非顺丰运单号: {tracking_number}",
                }
            service = SFExpressH5Service(timeout=timeout)
            return service.track(tracking_number, phone=phone)
        except Exception as e:
            return {"success": False, "message": f"顺丰 H5 查询异常: {str(e)}"}

    @classmethod
    def query_kuaidi100_free(cls, tracking_number: str, carrier_code: str = "") -> Dict[str, Any]:
        """
        使用快递100免费查询接口（无需API Key）。
        
        接口地址: https://www.kuaidi100.com/query
        这是快递100的免费查询页面，可以模拟请求获取数据。
        """
        try:
            # 先获取快递公司编码（如果未提供）
            if not carrier_code:
                # 尝试自动识别
                auto_url = "https://www.kuaidi100.com/autonumber/autoComNum"
                resp = requests.post(auto_url, data={"text": tracking_number}, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    auto_codes = data.get("auto", [])
                    if auto_codes:
                        carrier_code = auto_codes[0].get("comCode", "")
            
            if not carrier_code:
                return {"success": False, "message": "无法识别快递公司"}

            # 查询物流轨迹
            query_url = "https://www.kuaidi100.com/query"
            params = {
                "type": carrier_code,
                "postid": tracking_number,
                "temp": str(int(datetime.now().timestamp() * 1000)),
            }
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.kuaidi100.com/",
            }
            
            resp = requests.get(query_url, params=params, headers=headers, timeout=10)
            if resp.status_code == 200:
                result = resp.json()
                if result.get("status") == "200":
                    traces = [
                        {
                            "time": t.get("time"),
                            "description": t.get("context"),
                            "location": "",
                        }
                        for t in result.get("data", [])
                    ]
                    
                    # 解析状态
                    state_map = {
                        "0": "运输中",
                        "1": "已揽收",
                        "2": "疑难件",
                        "3": "已签收",
                        "4": "已退签",
                        "5": "派送中",
                        "6": "退回中",
                        "7": "转投中",
                    }
                    
                    return {
                        "success": True,
                        "carrier": result.get("com", carrier_code),
                        "tracking_number": tracking_number,
                        "status": state_map.get(result.get("state", "0"), "运输中"),
                        "traces": traces,
                        "source": "kuaidi100",
                    }
                else:
                    return {
                        "success": False,
                        "message": result.get("message", "查询失败"),
                    }
            
            return {"success": False, "message": f"查询失败: HTTP {resp.status_code}"}
        
        except Exception as e:
            return {"success": False, "message": f"查询异常: {str(e)}"}

    @classmethod
    def query_free_api_aa1(cls, tracking_number: str, carrier: str = "") -> Dict[str, Any]:
        """
        使用 aa1.cn 免费API（无需注册）。
        
        接口: https://api.aa1.cn/doc/szx-express-tracking.html
        """
        try:
            url = "https://api.aa1.cn/api/szx-express-tracking"
            params = {
                "trackingNumber": tracking_number,
                "courierCode": cls.get_carrier_code(carrier) or cls.detect_carrier(tracking_number) or "shunfeng",
            }
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            }
            
            resp = requests.get(url, params=params, headers=headers, timeout=15)
            if resp.status_code == 200:
                result = resp.json()
                if result.get("code") == 200:
                    data = result.get("data", {})
                    traces = [
                        {
                            "time": t.get("time"),
                            "description": t.get("description"),
                            "location": t.get("location", ""),
                        }
                        for t in data.get("trackingDetails", [])
                    ]
                    
                    return {
                        "success": True,
                        "carrier": data.get("courierName", carrier),
                        "tracking_number": tracking_number,
                        "status": data.get("deliveryStatus", "运输中"),
                        "traces": traces,
                        "source": "aa1",
                    }
                else:
                    return {
                        "success": False,
                        "message": result.get("message", "查询失败"),
                    }
            
            return {"success": False, "message": f"查询失败: HTTP {resp.status_code}"}
        
        except Exception as e:
            return {"success": False, "message": f"查询异常: {str(e)}"}

    @classmethod
    def query_mock(cls, tracking_number: str, carrier: str = "") -> Dict[str, Any]:
        """模拟查询（用于测试环境或备用）。"""
        now = datetime.now()
        
        # 根据单号生成一致的模拟数据
        import hashlib
        hash_val = int(hashlib.md5(tracking_number.encode()).hexdigest(), 16)
        
        carriers = ["顺丰速运", "中通快递", "圆通速递", "韵达快递", "申通快递", "德邦物流"]
        carrier_name = carrier if carrier else carriers[hash_val % len(carriers)]
        
        # 模拟快递员信息
        couriers = [
            {"name": "张师傅", "phone": "13800138001"},
            {"name": "李师傅", "phone": "13800138002"},
            {"name": "王师傅", "phone": "13800138003"},
            {"name": "刘师傅", "phone": "13800138004"},
        ]
        courier = couriers[hash_val % len(couriers)]
        
        traces = [
            {
                "time": (now.strftime("%Y-%m-%d %H:%M:%S")),
                "description": f"快件已签收，签收人：本人",
                "location": "收件地",
            },
            {
                "time": (now.strftime("%Y-%m-%d %H:%M:%S")),
                "description": f"快件正在派送中，快递员：{courier['name']} {courier['phone']}",
                "location": "收件地网点",
            },
            {
                "time": (now.strftime("%Y-%m-%d %H:%M:%S")),
                "description": f"快件到达【收件地网点】",
                "location": "收件地网点",
            },
            {
                "time": (now.strftime("%Y-%m-%d %H:%M:%S")),
                "description": f"快件离开【发件地转运中心】，发往【收件地】",
                "location": "发件地转运中心",
            },
            {
                "time": (now.strftime("%Y-%m-%d %H:%M:%S")),
                "description": f"{carrier_name}已收取快件",
                "location": "发件地",
            },
        ]
        
        return {
            "success": True,
            "carrier": carrier_name,
            "tracking_number": tracking_number,
            "status": "已签收",
            "traces": traces,
            "courier": courier,
            "source": "mock",
            "is_mock": True,
        }

    @classmethod
    def query(
        cls,
        tracking_number: str,
        carrier: str = "",
        provider: str = "",
        sf_config: Optional[Dict[str, Any]] = None,
        phone: Optional[str] = None,
        use_mock: bool = False,
    ) -> Dict[str, Any]:
        """
        统一查询接口。

        查询优先级：
        1. 顺丰开放平台（如果是顺丰单号且配置有效）
        2. 指定 provider 查询
        3. 快递100 免费接口
        4. aa1.cn 免费API
        5. 模拟数据（兜底）

        Args:
            tracking_number: 快递单号
            carrier: 快递公司名称
            provider: 指定查询提供商
                (sf_express / sf_express_h5 / kuaidi100 / kdniao / mock)
            sf_config: 顺丰 API 配置
            phone: 收件人/寄件人手机号后四位（顺丰查询可能需要）
            use_mock: 强制使用模拟数据
        """
        if use_mock:
            return cls.query_mock(tracking_number, carrier)

        # 如果指定了 provider，按 provider 查询
        if provider == cls.PROVIDER_MOCK:
            return cls.query_mock(tracking_number, carrier)

        if provider == cls.PROVIDER_SF:
            return cls.query_sf_express(tracking_number, phone=phone, sf_config=sf_config)

        if provider == cls.PROVIDER_SF_H5:
            return cls.query_sf_express_h5(tracking_number, phone=phone)

        if provider == cls.PROVIDER_KUAIDI100:
            carrier_code = cls.get_carrier_code(carrier) or cls.detect_carrier(tracking_number)
            result = cls.query_kuaidi100_free(tracking_number, carrier_code)
            if result.get("success") and result.get("traces"):
                return result
            return cls.query_mock(tracking_number, carrier)

        # 默认策略：如果是顺丰单号，优先使用顺丰 API
        if cls.is_sf_express(tracking_number, carrier):
            # 1) 顺丰开放平台（仅在配了 partnerID/checkword 时生效）
            if sf_config and sf_config.get("partner_id") and sf_config.get("checkword"):
                result = cls.query_sf_express(tracking_number, phone=phone, sf_config=sf_config)
                if result.get("success") and result.get("traces"):
                    return result
            # 2) 顺丰 H5 公开接口（免密钥）
            result = cls.query_sf_express_h5(tracking_number, phone=phone)
            if result.get("success") and result.get("traces"):
                return result
            # 3) 顺丰失败，降级到快递100
            carrier_code = cls.get_carrier_code(carrier) or "shunfeng"
            result = cls.query_kuaidi100_free(tracking_number, carrier_code)
            if result.get("success") and result.get("traces"):
                return result
            # 最后降级到 mock
            return cls.query_mock(tracking_number, carrier)

        # 非顺丰单号：先尝试快递100
        carrier_code = cls.get_carrier_code(carrier) or cls.detect_carrier(tracking_number)
        result = cls.query_kuaidi100_free(tracking_number, carrier_code)
        if result.get("success") and result.get("traces"):
            return result
        
        # 快递100 失败，尝试 aa1.cn
        result = cls.query_free_api_aa1(tracking_number, carrier)
        if result.get("success") and result.get("traces"):
            return result
        
        # 都失败了，返回模拟数据
        return cls.query_mock(tracking_number, carrier)


# 快捷函数
def track_express(
    tracking_number: str,
    carrier: str = "",
    provider: str = "",
    sf_config: Optional[Dict[str, Any]] = None,
    phone: Optional[str] = None,
) -> Dict[str, Any]:
    """查询快递单号物流信息。"""
    return ExpressTracker.query(
        tracking_number,
        carrier=carrier,
        provider=provider,
        sf_config=sf_config,
        phone=phone,
    )
