from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import require_sysadmin
from app.models.models import StorageConfig
from app.schemas.schemas import ApiResponse, StorageConfigOut, StorageConfigUpdate
from app.services.storage_service import get_storage_config, save_storage_config, get_express_config
from app.services.sf_express_service import SFExpressService, SFExpressMockService
from app.services.sf_express_h5_service import SFExpressH5Service

router = APIRouter()


@router.get("/", response_model=ApiResponse)
def get_config(
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """获取当前存储配置（含快递配置）。"""
    config = get_storage_config(db)
    return ApiResponse(success=True, data=StorageConfigOut.model_validate(config))


@router.put("/", response_model=ApiResponse)
def update_config(
    payload: StorageConfigUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """更新存储配置（切换本地/七牛云）及快递配置。"""
    config = save_storage_config(db, payload)
    return ApiResponse(
        success=True,
        data=StorageConfigOut.model_validate(config),
        message="配置已更新",
    )


@router.post("/test-qiniu", response_model=ApiResponse)
def test_qiniu(
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """测试七牛云配置是否可用。"""
    from app.services.qiniu_service import QiniuService

    config = get_storage_config(db)
    if config.provider != "qiniu":
        return ApiResponse(success=False, message="当前不是七牛云模式", error="配置模式不匹配")

    try:
        qiniu = QiniuService(config)
        # 尝试获取 bucket 信息来验证
        buckets = qiniu.list_buckets()
        return ApiResponse(success=True, data={"buckets": buckets}, message="七牛云连接成功")
    except Exception as e:
        return ApiResponse(success=False, message=f"七牛云连接失败: {str(e)}", error=str(e))


@router.get("/express-config", response_model=ApiResponse)
def get_express_configuration(
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """获取当前快递查询配置。"""
    cfg = get_express_config(db)
    return ApiResponse(success=True, data=cfg)


@router.post("/test-sf", response_model=ApiResponse)
def test_sf_express(
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """测试顺丰配置是否可用（使用模拟运单号）。"""
    config = get_storage_config(db)

    # 如果未配置顺丰密钥，使用模拟服务测试
    if not config.sf_partner_id or not config.sf_checkword:
        result = SFExpressMockService.track("SF1234567890123")
        return ApiResponse(
            success=True,
            data=result,
            message="当前使用顺丰模拟数据（未配置正式密钥）",
        )

    try:
        service = SFExpressService(
            partner_id=config.sf_partner_id,
            checkword=config.sf_checkword,
            env=config.sf_env or "production",
        )
        # 使用模拟单号测试连接（避免真实单号泄露）
        result = service.track("SF1234567890123")
        if result.get("success"):
            return ApiResponse(success=True, data=result, message="顺丰 API 连接成功")
        else:
            return ApiResponse(
                success=False,
                message=f"顺丰 API 测试失败: {result.get('message', '未知错误')}",
                error=result.get("message"),
            )
    except Exception as e:
        return ApiResponse(success=False, message=f"顺丰 API 测试异常: {str(e)}", error=str(e))


@router.post("/test-sf-h5", response_model=ApiResponse)
def test_sf_express_h5(
    payload: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_sysadmin),
):
    """
    测试顺丰 H5 公开接口是否可用（免密钥）。

    接受 body 中的 tracking_number（可选），便于管理员输入一个真实单号试拉；
    留空时使用一个测试单号。能拿到正常响应（即便无轨迹）即视为网络通畅。
    """
    try:
        tracking_number = ""
        phone = ""
        if isinstance(payload, dict):
            tracking_number = (payload.get("tracking_number") or "").strip()
            phone = (payload.get("phone") or "").strip()
        if not tracking_number:
            tracking_number = "SF1234567890"

        service = SFExpressH5Service(timeout=15)
        result = service.track(tracking_number, phone=phone or None)
        if result.get("success"):
            return ApiResponse(
                success=True,
                data=result,
                message=f"顺丰 H5 接口连接成功（已获取单号 {tracking_number} 的轨迹）",
            )
        msg = result.get("message", "")
        # 业务失败但网络通:SSL 验证通过 + 拿到 HTTP 200 + 业务层弹窗
        # 视为"接口连通",告知管理员具体原因(单号/手机后四位)
        if any(kw in msg for kw in ("未查询到轨迹", "无记录", "非顺丰运单号", "业务失败")):
            return ApiResponse(
                success=True,
                data=result,
                message=f"顺丰 H5 接口连接成功（{msg}；如业务失败请检查运单号/手机后四位）",
            )
        return ApiResponse(
            success=False,
            message=f"顺丰 H5 接口测试失败: {msg}",
            error=msg,
        )
    except Exception as e:
        return ApiResponse(
            success=False,
            message=f"顺丰 H5 接口测试异常: {str(e)}",
            error=str(e),
        )
