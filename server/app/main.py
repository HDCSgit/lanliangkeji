import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.core.config import settings
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
    version="1.0.0",
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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "服务器内部错误", "message": str(exc) if os.getenv("DEBUG") else None},
    )


# Static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

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


if __name__ == "__main__:":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
