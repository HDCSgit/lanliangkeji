import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.core.config import settings, APP_VERSION
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.db.migrations import apply_schema_patches
from app.routers import auth, users, site, products, orders, payments, vouchers, admin, cart, bills, logistics, dashboard, contact, storage
from app.services import seed_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1) 同步补齐老库缺失列（仅 ADD COLUMN，不破坏数据）
    apply_schema_patches(engine)
    # 2) 创建缺失的表
    Base.metadata.create_all(bind=engine)
    # 3) 灌默认数据
    db = SessionLocal()
    try:
        seed_service.seed_all(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="福州蓝粮海洋生物科技有限公司 API",
    description="企业官网与电商交易系统后端",
    version=APP_VERSION,
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip 压缩:对 JSON / 文本响应启用 gzip(最小 500 字节才压)
# 省 API 响应的带宽(WebP 图片本身已压缩,gzip 对它收益小,但 API 文本受益大)
app.add_middleware(GZipMiddleware, minimum_size=500)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "服务器内部错误", "message": str(exc) if os.getenv("DEBUG") else None},
    )


class CachedStaticFiles(StaticFiles):
    """
    给静态资源加上长 Cache-Control 头,让浏览器/CDN 缓存。
    产品图基本不会改文件名(hash 命名),所以 max-age=30 天很安全。
    """

    async def get_response(self, path: str, scope: dict) -> Response:
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            # 30 天 = 2592000 秒;配合 hash 文件名,改名即失效,安全
            response.headers["Cache-Control"] = "public, max-age=2592000, immutable"
            response.headers["Vary"] = "Accept-Encoding"
        return response


# Static files for uploads (加缓存)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", CachedStaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/v1/users", tags=["用户"])
app.include_router(site.router, prefix="/api/v1/site", tags=["站点"])
app.include_router(products.router, prefix="/api/v1/products", tags=["产品"])
app.include_router(cart.router, prefix="/api/v1/cart", tags=["购物车"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["订单"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["支付"])
app.include_router(vouchers.router, prefix="/api/v1/vouchers", tags=["转账凭证"])
app.include_router(bills.router, prefix="/api/v1/bills", tags=["账单"])
app.include_router(logistics.router, prefix="/api/v1/logistics", tags=["物流"])
app.include_router(dashboard.router, prefix="/api/v1/admin/dashboard", tags=["仪表盘"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["管理后台"])
app.include_router(contact.router, prefix="/api/v1/contact", tags=["联系我们"])
app.include_router(storage.router, prefix="/api/v1/admin/storage", tags=["存储配置"])


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/version")
def version():
    """返回当前后端版本号(用于本地/线上对账)"""
    return {"version": APP_VERSION}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
