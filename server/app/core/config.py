from typing import List
from pydantic_settings import BaseSettings


# 应用版本号(本地与线上保持一致)
# 修改时同步更新 app/package.json 的 "version" 字段
APP_VERSION = "2026.6.17"


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://lanliang:lanliang123@localhost:5432/lanliang"
    SECRET_KEY: str = "change-me"
    REFRESH_SECRET_KEY: str = "change-me-refresh"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "http://localhost:5173"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # 支付宝开放平台(开发期个人 AppID 也可)
    # 支付方式启用开关:ALIPAY_ENABLED=true 时支付页才显示支付宝入口(默认 false)
    ALIPAY_ENABLED: bool = False
    ALIPAY_APP_ID: str = ""
    ALIPAY_APP_PRIVATE_KEY: str = ""   # 商户应用私钥 (RSA2, -----BEGIN PRIVATE KEY----- 整段)
    ALIPAY_ALIPAY_PUBLIC_KEY: str = ""  # 支付宝公钥
    ALIPAY_GATEWAY: str = "https://openapi.alipay.com/gateway.do"  # 正式环境
    # 沙箱网关(申请沙箱环境后,改用 https://openapi.alipaydev.com/gateway.do)
    ALIPAY_NOTIFY_URL: str = ""   # 支付宝 -> 你的服务器 异步通知
    ALIPAY_RETURN_URL: str = ""  # 支付宝页面 -> 用户浏览器 同步跳转回
    FRONTEND_BASE_URL: str = "http://localhost:5173"  # 同步跳回时跳到前端哪个域名/IP

    # 微信支付开关(默认 false)
    WECHAT_ENABLED: bool = False
    WECHAT_MCH_ID: str = ""
    WECHAT_APP_ID: str = ""
    WECHAT_API_KEY: str = ""
    WECHAT_NOTIFY_URL: str = ""

    # 对公转账开关(默认 true,审核员可在后台配置账户)
    BANK_TRANSFER_ENABLED: bool = True

    SYSADMIN_PHONE: str = "sysadmin"
    SYSADMIN_PASSWORD: str = "sysadmin123"
    SYSADMIN_NAME: str = "系统管理者"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
