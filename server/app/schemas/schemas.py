from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from app.core.constants import UserRole, OrderStatus, PaymentMethod, PaymentStatus, VoucherStatus, BillType, BillStatus


# ==================== Common ====================
class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None


# ==================== Auth ====================
class UserBase(BaseModel):
    phone: str
    name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    phone: str
    password: str


class UserOut(BaseModel):
    id: str
    phone: str
    name: str
    avatar: Optional[str] = None
    role: UserRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshToken(BaseModel):
    refresh_token: str


# ==================== Address ====================
class AddressBase(BaseModel):
    name: str
    phone: str
    province: str
    city: str
    district: str
    detail: str
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(AddressBase):
    id: str


class AddressOut(AddressBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Product Spec ====================
class ProductSpecBase(BaseModel):
    name: str
    unit: str
    price: float = Field(..., ge=0)
    stock: int = Field(..., ge=0)
    min_order: int = Field(default=1, ge=1)
    is_active: bool = True


class ProductSpecCreate(ProductSpecBase):
    pass


class ProductSpecUpdate(ProductSpecBase):
    id: Optional[str] = None


class ProductSpecOut(ProductSpecBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# ==================== Product ====================
class ProductBase(BaseModel):
    name: str
    category: str
    description: str
    # 兼容旧字段:image 是 coverImages[0] 的镜像,旧代码读不到 coverImages 时仍能显示
    image: str = ""
    # 封面图列表:1-5 张,在详情页可按需轮播
    cover_images: List[str] = []
    # 详情图列表:0-N 张,在详情页下拉时懒加载展示
    detail_images: List[str] = []
    # 是否启用封面轮播(1 张时强制不轮播)
    enable_carousel: bool = False
    features: List[str] = []
    is_active: bool = True
    order: int = 0


class ProductCreate(ProductBase):
    specs: List[ProductSpecCreate]


class ProductUpdate(ProductBase):
    specs: List[ProductSpecUpdate]


class ProductOut(ProductBase):
    id: str
    specs: List[ProductSpecOut]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Banner ====================
class BannerBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    description: str
    image: str
    link: Optional[str] = None
    button_text: str
    order: int = 0
    is_active: bool = True


class BannerCreate(BannerBase):
    pass


class BannerUpdate(BannerBase):
    id: str


class BannerOut(BannerBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# ==================== News ====================
class NewsBase(BaseModel):
    title: str
    summary: str
    content: str
    image: str
    category: str
    author: str
    views: int = 0
    is_active: bool = True


class NewsCreate(NewsBase):
    pass


class NewsUpdate(NewsBase):
    id: str


class NewsOut(NewsBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Partner ====================
class PartnerBase(BaseModel):
    name: str
    logo: str
    website: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    order: int = 0


class PartnerCreate(PartnerBase):
    pass


class PartnerUpdate(PartnerBase):
    id: str


class PartnerOut(PartnerBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# ==================== Site Config ====================
class ContactInfo(BaseModel):
    address: str
    phone: str
    email: str
    fax: Optional[str] = None
    qq: Optional[str] = None
    wechat: Optional[str] = None
    work_hours: str
    map_lat: Optional[float] = None
    map_lng: Optional[float] = None


class SEOConfig(BaseModel):
    title: str
    description: str
    keywords: str
    og_image: str


class SiteConfigData(BaseModel):
    title: str
    logo: str
    favicon: str
    description: str
    keywords: str
    icp: str
    analytics: Optional[str] = None
    contact: ContactInfo
    seo: SEOConfig


# ==================== NavItem ====================
class NavItemBase(BaseModel):
    name: str
    link: str
    icon: Optional[str] = None
    is_active: bool = True
    order: int = 0
    is_external: bool = False


class NavItemCreate(NavItemBase):
    children: List["NavItemCreate"] = []


class NavItemUpdate(NavItemBase):
    id: str
    children: List["NavItemUpdate"] = []


class NavItemOut(NavItemBase):
    id: str
    children: List["NavItemOut"] = []

    model_config = ConfigDict(from_attributes=True)


# ==================== Page ====================
class PageModule(BaseModel):
    id: str
    name: str
    type: str
    title: str
    subtitle: Optional[str] = None
    content: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True
    order: int = 0
    settings: dict = {}


class PageMeta(BaseModel):
    title: str
    description: str
    keywords: str


class PageBase(BaseModel):
    name: str
    slug: str
    title: str
    description: str
    modules: List[PageModule] = []
    is_active: bool = True
    meta: PageMeta


class PageCreate(PageBase):
    pass


class PageUpdate(PageBase):
    id: str


class PageOut(PageBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# ==================== Company / RD / Service / Stat ====================
class CompanyInfoData(BaseModel):
    name: str
    full_name: str
    slogan: str
    description: str
    history: List[dict]
    honors: List[dict]
    culture: List[dict]
    team: List[dict]


class ServiceBase(BaseModel):
    name: str
    description: str
    icon: str
    image: Optional[str] = None
    features: List[str] = []
    is_active: bool = True
    order: int = 0


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(ServiceBase):
    id: str


class ServiceOut(ServiceBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


class StatBase(BaseModel):
    name: str
    value: float
    suffix: str
    prefix: Optional[str] = None
    description: str
    icon: str
    order: int = 0


class StatCreate(StatBase):
    pass


class StatUpdate(StatBase):
    id: str


class StatOut(StatBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# ==================== Cart ====================
class CartItemCreate(BaseModel):
    product_id: str
    spec_id: str
    quantity: int = Field(..., ge=1)


class CartItemOut(BaseModel):
    id: str
    product_id: str
    product_name: str
    product_image: str
    spec_id: str
    spec_name: str
    unit: str
    price: float
    quantity: int
    subtotal: float
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Order ====================
class OrderItemOut(BaseModel):
    id: str
    product_id: str
    product_name: str
    product_image: str
    spec_id: str
    spec_name: str
    unit: str
    price: float
    quantity: int
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    shipping_address_id: str
    remark: Optional[str] = None


class OrderOut(BaseModel):
    id: str
    order_no: str
    total_amount: float
    shipping_fee: float
    discount: float
    final_amount: float
    status: OrderStatus
    payment_method: Optional[PaymentMethod] = None
    payment_time: Optional[datetime] = None
    shipping_address: dict
    remark: Optional[str] = None
    items: List[OrderItemOut]
    vouchers: List["VoucherOut"] = []  # 交易凭证(对公转账时上传)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None


# ==================== Payment ====================
class PaymentCreate(BaseModel):
    order_id: str
    method: PaymentMethod


class PaymentOut(BaseModel):
    id: str
    order_id: str
    order_no: str
    payment_no: str
    payment_method: PaymentMethod
    amount: float
    status: PaymentStatus
    qr_code: Optional[str] = None
    pay_url: Optional[str] = None
    paid_at: Optional[datetime] = None
    expired_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ⚠️ 安全修复:PaymentCallback schema 已停用(2026-06-16)
# 原对应 /payments/callback 后门接口,无鉴权可伪造支付成功,已注释掉
# 真实的支付回调走支付宝/微信异步通知接口,带签名验证
# 此处保留 schema 定义仅供代码审查对比
#
# class PaymentCallback(BaseModel):
#     payment_no: str
#     status: str


# ==================== Voucher ====================
class VoucherCreate(BaseModel):
    order_id: str
    amount: float


class VoucherAudit(BaseModel):
    action: VoucherStatus  # approved or rejected
    reject_reason: Optional[str] = None


class VoucherOut(BaseModel):
    id: str
    order_id: str
    order_no: Optional[str] = None  # 关联订单号(便于审核员快速识别)
    user_id: str
    user_name: str
    user_phone: str
    amount: float
    voucher_image: str = Field(alias="image")
    status: VoucherStatus
    submit_time: datetime
    audit_time: Optional[datetime] = None
    auditor_id: Optional[str] = None
    auditor_name: Optional[str] = None
    reject_reason: Optional[str] = None
    expiry_time: datetime

    model_config = ConfigDict(from_attributes=True)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ==================== Logistics ====================
class LogisticsUpdateCreate(BaseModel):
    time: datetime
    status: str
    description: str
    location: str


class LogisticsOut(BaseModel):
    id: str
    order_id: str
    tracking_number: str
    carrier: str
    status: str
    updates: List[LogisticsUpdateCreate]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Bill ====================
class BillOut(BaseModel):
    id: str
    order_id: Optional[str] = None
    order_no: Optional[str] = None
    type: BillType
    amount: float
    payment_method: PaymentMethod
    description: str
    status: BillStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Receivable Account ====================
class ReceivableAccountBase(BaseModel):
    account_name: str
    bank_name: str
    account_number: str


class ReceivableAccountOut(ReceivableAccountBase):
    id: str
    updated_at: datetime
    updated_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Payment Gateway Config ====================
class WechatPayConfig(BaseModel):
    enabled: bool
    mch_id: str
    app_id: str
    api_key: str
    notify_url: str


class AlipayConfig(BaseModel):
    enabled: bool
    app_id: str
    private_key: str
    public_key: str
    notify_url: str


class BankTransferConfig(BaseModel):
    enabled: bool
    account_name: str
    bank_name: str
    account_number: str


class PaymentGatewayConfigData(BaseModel):
    wechat_pay: WechatPayConfig
    alipay: AlipayConfig
    bank_transfer: BankTransferConfig


# ==================== Contact ====================
class ContactForm(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    company: Optional[str] = None
    subject: str
    message: str


# ==================== Dashboard ====================
class DashboardStats(BaseModel):
    total_users: int
    total_orders: int
    pending_orders: int
    pending_vouchers: int
    total_sales: float
    today_sales: float


# ==================== Storage Config ====================
class StorageConfigOut(BaseModel):
    id: str
    provider: str
    qiniu_access_key: Optional[str] = None
    qiniu_secret_key: Optional[str] = None
    qiniu_bucket: Optional[str] = None
    qiniu_domain: Optional[str] = None
    qiniu_region: Optional[str] = None
    local_base_url: Optional[str] = None
    # 快递配置
    express_provider: str = "sf_express"
    sf_partner_id: Optional[str] = None
    sf_checkword: Optional[str] = None
    sf_env: Optional[str] = "production"
    kuaidi100_key: Optional[str] = None
    kdniao_id: Optional[str] = None
    kdniao_key: Optional[str] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StorageConfigUpdate(BaseModel):
    provider: str = Field(..., pattern="^(local|qiniu)$")
    qiniu_access_key: Optional[str] = None
    qiniu_secret_key: Optional[str] = None
    qiniu_bucket: Optional[str] = None
    qiniu_domain: Optional[str] = None
    qiniu_region: Optional[str] = "z0"
    local_base_url: Optional[str] = None
    # 快递配置
    express_provider: str = Field(default="sf_express", pattern="^(sf_express|sf_express_h5|kuaidi100|kdniao|mock)$")
    sf_partner_id: Optional[str] = None
    sf_checkword: Optional[str] = None
    sf_env: Optional[str] = Field(default="production", pattern="^(sandbox|production)$")
    kuaidi100_key: Optional[str] = None
    kdniao_id: Optional[str] = None
    kdniao_key: Optional[str] = None


# Forward refs
NavItemCreate.model_rebuild()
NavItemUpdate.model_rebuild()
NavItemOut.model_rebuild()
OrderOut.model_rebuild()
