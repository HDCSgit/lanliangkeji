import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.core.constants import UserRole, OrderStatus, PaymentMethod, PaymentStatus, VoucherStatus, BillType, BillStatus


def now_utc():
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    bills = relationship("Bill", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    vouchers = relationship("Voucher", back_populates="user", foreign_keys="Voucher.user_id")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    auditor_info = relationship("Auditor", back_populates="user", uselist=False, foreign_keys="Auditor.user_id")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    province = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    detail = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="addresses")


class Auditor(Base):
    __tablename__ = "auditors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    assigned_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="auditor_info", foreign_keys=[user_id])
    assigner = relationship("User", foreign_keys=[assigned_by])


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    # 兼容字段:作为 cover_images[0] 的副本,避免前端零迁移时图片空白
    image = Column(String(500), nullable=False, default="")
    # 封面图列表:1-5 张,详情页可轮播
    cover_images = Column(JSON, default=list)
    # 详情图列表:0-N 张,详情页下拉懒加载展示
    detail_images = Column(JSON, default=list)
    # 是否启用封面图轮播(只有 ≥2 张封面图才有意义;1 张时强制 False)
    enable_carousel = Column(Boolean, default=False)
    features = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    # ===== 运费规则 =====
    # 是否收取运费(关掉则包邮,运费显示为 0)
    shipping_enabled = Column(Boolean, default=False)
    # 初始运费:第一单(第一件)收多少运费
    shipping_initial_fee = Column(Float, default=0)
    # 每多少件算一个加价单位(比如每 5 件加一次价)
    shipping_per_unit_count = Column(Integer, default=1)
    # 每个加价单位加多少运费(比如每多 5 件加 ¥10)
    shipping_per_unit_fee = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    specs = relationship("ProductSpec", back_populates="product", cascade="all, delete-orphan")


class ProductSpec(Base):
    __tablename__ = "product_specs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    min_order = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

    product = relationship("Product", back_populates="specs")


class Banner(Base):
    __tablename__ = "banners"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    subtitle = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    image = Column(String(500), nullable=False)
    link = Column(String(500), nullable=True)
    button_text = Column(String(100), nullable=False)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class News(Base):
    __tablename__ = "news"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    image = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False)
    author = Column(String(100), nullable=False)
    views = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class Partner(Base):
    __tablename__ = "partners"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    logo = Column(String(500), nullable=False)
    website = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)


class SiteConfig(Base):
    __tablename__ = "site_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class NavItem(Base):
    __tablename__ = "nav_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    link = Column(String(500), nullable=False)
    icon = Column(String(100), nullable=True)
    parent_id = Column(String(36), ForeignKey("nav_items.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    is_external = Column(Boolean, default=False)

    children = relationship("NavItem", backref="parent", remote_side=[id])


class Page(Base):
    __tablename__ = "pages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    modules = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    meta = Column(JSON, default=dict)


class CompanyInfo(Base):
    __tablename__ = "company_info"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class RDInfo(Base):
    __tablename__ = "rd_info"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class Service(Base):
    __tablename__ = "services"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(100), nullable=False)
    image = Column(String(500), nullable=True)
    features = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)


class Stat(Base):
    __tablename__ = "stats"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    suffix = Column(String(50), nullable=False)
    prefix = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    icon = Column(String(100), nullable=False)
    order = Column(Integer, default=0)


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id", "spec_id", name="uix_user_product_spec"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    spec_id = Column(String(36), ForeignKey("product_specs.id"), nullable=False)
    product_name = Column(String(200), nullable=False)
    product_image = Column(String(500), nullable=False)
    spec_name = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)
    added_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")
    spec = relationship("ProductSpec")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    shipping_fee = Column(Float, default=0)
    discount = Column(Float, default=0)
    final_amount = Column(Float, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING_PAYMENT, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    payment_time = Column(DateTime(timezone=True), nullable=True)
    shipping_address = Column(JSON, nullable=False)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment_orders = relationship("PaymentOrder", back_populates="order")
    vouchers = relationship("Voucher", back_populates="order")
    logistics = relationship("Logistics", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200), nullable=False)
    product_image = Column(String(500), nullable=False)
    spec_id = Column(String(36), ForeignKey("product_specs.id"), nullable=False)
    spec_name = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    spec = relationship("ProductSpec")


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    order_no = Column(String(50), nullable=False)
    payment_no = Column(String(100), unique=True, nullable=False, index=True)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    qr_code = Column(String(500), nullable=True)
    pay_url = Column(String(500), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    expired_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    order = relationship("Order", back_populates="payment_orders")


class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    user_name = Column(String(100), nullable=False)
    user_phone = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False)
    image = Column(String(500), nullable=False)
    status = Column(SQLEnum(VoucherStatus), default=VoucherStatus.PENDING, nullable=False)
    submit_time = Column(DateTime(timezone=True), default=now_utc)
    audit_time = Column(DateTime(timezone=True), nullable=True)
    auditor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    auditor_name = Column(String(100), nullable=True)
    reject_reason = Column(Text, nullable=True)
    expiry_time = Column(DateTime(timezone=True), nullable=False)

    order = relationship("Order", back_populates="vouchers")
    user = relationship("User", back_populates="vouchers", foreign_keys=[user_id])


class Logistics(Base):
    __tablename__ = "logistics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id"), unique=True, nullable=False)
    tracking_number = Column(String(100), nullable=False)
    carrier = Column(String(100), nullable=False)
    status = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    order = relationship("Order", back_populates="logistics")
    updates = relationship("LogisticsUpdate", back_populates="logistics", cascade="all, delete-orphan")


class LogisticsUpdate(Base):
    __tablename__ = "logistics_updates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    logistics_id = Column(String(36), ForeignKey("logistics.id"), nullable=False)
    time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(200), nullable=False)

    logistics = relationship("Logistics", back_populates="updates")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=True)
    order_no = Column(String(50), nullable=True)
    type = Column(SQLEnum(BillType), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(SQLEnum(BillStatus), default=BillStatus.SUCCESS, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="bills")
    order = relationship("Order")


class ReceivableAccount(Base):
    __tablename__ = "receivable_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    account_name = Column(String(200), nullable=False)
    bank_name = Column(String(200), nullable=False)
    account_number = Column(String(100), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    updated_by = Column(String(36), ForeignKey("users.id"), nullable=True)


class PaymentGatewayConfig(Base):
    __tablename__ = "payment_gateway_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    wechat_pay = Column(JSON, nullable=False)
    alipay = Column(JSON, nullable=False)
    bank_transfer = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    updated_by = Column(String(36), ForeignKey("users.id"), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    target = Column(String(100), nullable=False)
    target_id = Column(String(36), nullable=True)
    ip = Column(String(100), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="audit_logs")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(200), nullable=True)
    company = Column(String(200), nullable=True)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class StorageConfig(Base):
    """存储配置表（本地/七牛云），同时包含快递查询配置。"""

    __tablename__ = "storage_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider = Column(String(20), default="local", nullable=False)  # local | qiniu
    # 七牛云配置
    qiniu_access_key = Column(String(100), nullable=True)
    qiniu_secret_key = Column(String(100), nullable=True)
    qiniu_bucket = Column(String(100), nullable=True)
    qiniu_domain = Column(String(500), nullable=True)
    qiniu_region = Column(String(20), default="z0", nullable=True)
    # 本地配置
    local_base_url = Column(String(500), nullable=True)  # 如 https://cdn.example.com
    # 快递查询配置
    express_provider = Column(String(20), default="sf_express", nullable=False)  # sf_express | kuaidi100 | kdniao | mock
    sf_partner_id = Column(String(100), nullable=True)
    sf_checkword = Column(String(100), nullable=True)
    sf_env = Column(String(20), default="production", nullable=True)  # sandbox | production
    kuaidi100_key = Column(String(100), nullable=True)
    kdniao_id = Column(String(100), nullable=True)
    kdniao_key = Column(String(100), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    updated_by = Column(String(36), ForeignKey("users.id"), nullable=True)
