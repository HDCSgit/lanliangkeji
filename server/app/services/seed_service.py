from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.core.constants import UserRole
from app.models.models import (
    User, ReceivableAccount, PaymentGatewayConfig, SiteConfig,
    Banner, Product, ProductSpec, News, Partner, NavItem, Service, Stat,
    Page, CompanyInfo, RDInfo, StorageConfig,
)


def seed_all(db: Session):
    seed_sysadmin(db)
    seed_receivable_account(db)
    seed_payment_gateway(db)
    seed_site_config(db)
    seed_banners(db)
    seed_products(db)
    seed_news(db)
    seed_partners(db)
    seed_nav_items(db)
    seed_services(db)
    seed_stats(db)
    seed_pages(db)
    seed_company_info(db)
    seed_rd_info(db)
    seed_storage_config(db)


def seed_storage_config(db: Session):
    """初始化默认存储配置（本地模式）。"""
    if db.query(StorageConfig).first():
        return
    config = StorageConfig(
        provider="local",
        local_base_url="",
    )
    db.add(config)
    db.commit()


def seed_sysadmin(db: Session):
    existing = db.query(User).filter(User.phone == settings.SYSADMIN_PHONE).first()
    if existing:
        return
    admin = User(
        phone=settings.SYSADMIN_PHONE,
        name=settings.SYSADMIN_NAME,
        password_hash=get_password_hash(settings.SYSADMIN_PASSWORD),
        role=UserRole.SYSADMIN,
    )
    db.add(admin)
    db.commit()


def seed_receivable_account(db: Session):
    if db.query(ReceivableAccount).first():
        return
    account = ReceivableAccount(
        account_name="福州蓝粮海洋生物科技有限公司",
        bank_name="中国工商银行福州马尾支行",
        account_number="1402 0234 0900 1234 567",
    )
    db.add(account)
    db.commit()


def seed_payment_gateway(db: Session):
    if db.query(PaymentGatewayConfig).first():
        return
    config = PaymentGatewayConfig(
        wechat_pay={"enabled": True, "mch_id": "", "app_id": "", "api_key": "", "notify_url": ""},
        alipay={"enabled": True, "app_id": "", "private_key": "", "public_key": "", "notify_url": ""},
        bank_transfer={"enabled": True, "account_name": "福州蓝粮海洋生物科技有限公司", "bank_name": "中国工商银行福州马尾支行", "account_number": "1402 0234 0900 1234 567"},
    )
    db.add(config)
    db.commit()


def seed_site_config(db: Session):
    if db.query(SiteConfig).filter(SiteConfig.key == "main").first():
        return
    config = SiteConfig(
        key="main",
        value={
            "title": "福州蓝粮海洋生物科技有限公司",
            "logo": "/logo.png",
            "favicon": "/favicon.ico",
            "description": "专注于海洋生物科技研发、水产深加工与健康食材供应的企业",
            "keywords": "海洋生物科技,水产加工,海藻提取物,鱼胶原蛋白肽,深海鱼油,福州蓝粮",
            "icp": "闽ICP备2024000000号-1",
            "analytics": "",
            "contact": {
                "address": "福建省福州市马尾区 Seafood Industrial Park 88号",
                "phone": "0591-88888888",
                "email": "contact@lanliang-marine.com",
                "fax": "0591-88888889",
                "work_hours": "周一至周五 8:30-17:30",
                "map_lat": 26.0614,
                "map_lng": 119.4543,
            },
            "seo": {
                "title": "福州蓝粮海洋生物科技有限公司 - 海洋生物科技领导者",
                "description": "专注于海洋生物科技研发、水产深加工与健康食材供应，拥有先进的生产设备和完善的质量管理体系。",
                "keywords": "海洋生物科技,水产加工,海藻提取物,鱼胶原蛋白肽,深海鱼油",
                "og_image": "/og-image.jpg",
            },
        },
    )
    db.add(config)
    db.commit()


def seed_banners(db: Session):
    if db.query(Banner).first():
        return
    banners = [
        Banner(title="探索海洋的无限可能", subtitle="海洋生物科技领导者", description="致力于海洋生物科技研发、水产深加工与健康食材供应，为客户提供安全、健康、优质的海洋产品", image="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=80", button_text="了解更多", link="/about", order=1),
        Banner(title="创新科技 品质保障", subtitle="20+项国家专利", description="拥有先进的生产设备和完善的质量管理体系，产品远销海内外", image="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80", button_text="查看产品", link="/products", order=2),
        Banner(title="可持续发展 绿色海洋", subtitle="环保生产理念", description="坚持绿色环保生产理念，实现海洋资源的可持续利用", image="https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1920&q=80", button_text="联系我们", link="/contact", order=3),
    ]
    db.add_all(banners)
    db.commit()


def seed_products(db: Session):
    if db.query(Product).first():
        return
    products_data = [
        {
            "name": "海藻提取物", "category": "海洋生物制品",
            "description": "采用先进提取技术，从深海海藻中提取高纯度活性成分，广泛应用于食品、化妆品和医药领域。",
            "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
            "features": ["高纯度提取", "天然无添加", "易溶于水", "稳定性好"],
            "specs": [
                {"name": "25kg/桶", "unit": "桶", "price": 1200, "stock": 100, "min_order": 1},
            ],
        },
        {
            "name": "鱼胶原蛋白肽", "category": "海洋生物制品",
            "description": "从深海鱼类中提取的高纯度胶原蛋白肽，分子量小，易吸收，是理想的美容养颜原料。",
            "image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
            "features": ["小分子易吸收", "高纯度", "无腥味", "溶解性好"],
            "specs": [
                {"name": "20kg/袋", "unit": "袋", "price": 2500, "stock": 80, "min_order": 1},
            ],
        },
        {
            "name": "深海鱼油", "category": "健康食材",
            "description": "源自深海冷水鱼类，富含EPA和DHA，是优质的营养补充剂原料。",
            "image": "https://images.unsplash.com/photo-1519709042477-8de6eaf1fdc5?w=600&q=80",
            "features": ["高纯度Omega-3", "低氧化值", "无重金属", "TG型结构"],
            "specs": [
                {"name": "190kg/桶", "unit": "桶", "price": 3500, "stock": 50, "min_order": 1},
            ],
        },
        {
            "name": "海鲜干货", "category": "水产深加工",
            "description": "精选优质海鲜原料，采用传统工艺与现代技术相结合，保留海鲜的鲜美口感。",
            "image": "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600&q=80",
            "features": ["传统工艺", "原汁原味", "营养丰富", "便于储存"],
            "specs": [
                {"name": "500g/袋", "unit": "袋", "price": 88, "stock": 200, "min_order": 1},
            ],
        },
        {
            "name": "虾青素", "category": "海洋生物制品",
            "description": "从雨生红球藻中提取的天然虾青素，是强效的天然抗氧化剂。",
            "image": "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600&q=80",
            "features": ["天然提取", "高活性", "强抗氧化", "稳定性好"],
            "specs": [
                {"name": "1kg/袋", "unit": "袋", "price": 1800, "stock": 60, "min_order": 1},
            ],
        },
        {
            "name": "海洋酵素", "category": "海洋生物制品",
            "description": "采用深海微生物发酵技术生产的复合酵素，具有多种生物活性。",
            "image": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&q=80",
            "features": ["高酶活力", "多酶复合", "低温提取", "活性稳定"],
            "specs": [
                {"name": "25kg/桶", "unit": "桶", "price": 2200, "stock": 70, "min_order": 1},
            ],
        },
    ]
    for idx, p in enumerate(products_data, 1):
        product = Product(
            name=p["name"], category=p["category"], description=p["description"],
            image=p["image"], features=p["features"], order=idx,
        )
        db.add(product)
        db.flush()
        for s in p["specs"]:
            spec = ProductSpec(
                product_id=product.id, name=s["name"], unit=s["unit"],
                price=s["price"], stock=s["stock"], min_order=s["min_order"],
            )
            db.add(spec)
    db.commit()


def seed_news(db: Session):
    if db.query(News).first():
        return
    news_list = [
        News(title="福州蓝粮荣获'国家级高新技术企业'认定", summary="凭借卓越的技术创新能力和研发投入，福州蓝粮海洋生物科技有限公司成功获得国家级高新技术企业认定。", content="近日，福州蓝粮海洋生物科技有限公司凭借卓越的技术创新能力和持续的研发投入，成功获得国家级高新技术企业认定。", image="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80", category="公司新闻", author="admin", views=1256),
        News(title="公司新研发中心正式投入使用", summary="投资5000万元建设的新研发中心正式投入使用，标志着公司研发实力迈上新台阶。", content="经过两年的精心建设，福州蓝粮海洋生物科技有限公司新研发中心正式投入使用。", image="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80", category="公司动态", author="admin", views=986),
        News(title="蓝粮海洋与中科院海洋研究所签署战略合作协议", summary="双方将在海洋生物科技领域开展深度合作，共同推动行业技术进步。", content="福州蓝粮海洋生物科技有限公司与中国科学院海洋研究所正式签署战略合作协议。", image="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80", category="合作新闻", author="admin", views=1452),
    ]
    db.add_all(news_list)
    db.commit()


def seed_partners(db: Session):
    if db.query(Partner).first():
        return
    partners = [
        Partner(name="中国科学院海洋研究所", logo="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80", website="http://www.qdio.ac.cn", description="国内顶尖的海洋研究机构", order=1),
        Partner(name="中国海洋大学", logo="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&q=80", website="http://www.ouc.edu.cn", description="国家重点综合性海洋大学", order=2),
        Partner(name="福建省水产研究所", logo="https://images.unsplash.com/photo-1576086213369-97a306d36557?w=200&q=80", description="福建省水产科研权威机构", order=3),
    ]
    db.add_all(partners)
    db.commit()


def seed_nav_items(db: Session):
    if db.query(NavItem).first():
        return
    home = NavItem(name="首页", link="/", order=1)
    db.add(home)
    db.flush()
    about = NavItem(name="关于我们", link="/about", order=2)
    db.add(about)
    db.flush()
    db.add_all([
        NavItem(name="公司简介", link="/about#company", parent_id=about.id, order=1),
        NavItem(name="企业文化", link="/about#culture", parent_id=about.id, order=2),
        NavItem(name="发展历程", link="/about#history", parent_id=about.id, order=3),
        NavItem(name="资质荣誉", link="/about#honors", parent_id=about.id, order=4),
    ])
    db.add_all([
        NavItem(name="产品中心", link="/products", order=3),
        NavItem(name="研发实力", link="/rd", order=4),
        NavItem(name="新闻资讯", link="/news", order=5),
        NavItem(name="联系我们", link="/contact", order=6),
    ])
    db.commit()


def seed_services(db: Session):
    if db.query(Service).first():
        return
    services = [
        Service(name="海洋生物制品", description="专注于海洋生物活性物质的提取与开发", icon="FlaskConical", features=["高纯度提取", "先进工艺", "品质稳定", "定制服务"], order=1),
        Service(name="水产深加工", description="采用先进的加工技术，将优质水产原料加工成各类高附加值产品", icon="Fish", features=["传统工艺", "现代技术", "品质保证", "多样产品"], order=2),
        Service(name="健康食材供应", description="为食品企业提供优质海洋健康食材原料", icon="Apple", features=["天然健康", "营养丰富", "安全可靠", "溯源体系"], order=3),
        Service(name="原料供应服务", description="为化妆品、保健品、医药等行业提供高品质海洋原料", icon="Ship", features=["稳定供应", "品质一致", "技术支持", "灵活定制"], order=4),
    ]
    db.add_all(services)
    db.commit()


def seed_stats(db: Session):
    if db.query(Stat).first():
        return
    stats = [
        Stat(name="行业经验", value=10, suffix="+年", description="深耕海洋生物科技领域", icon="Clock", order=1),
        Stat(name="国家专利", value=20, suffix="+项", description="自主知识产权技术", icon="Award", order=2),
        Stat(name="合作伙伴", value=500, suffix="+家", description="遍布全球的合作伙伴", icon="Users", order=3),
        Stat(name="养殖基地", value=1000, suffix="+亩", description="现代化养殖基地", icon="MapPin", order=4),
    ]
    db.add_all(stats)
    db.commit()


def seed_pages(db: Session):
    if db.query(Page).first():
        return
    pages = [
        Page(name="首页", slug="/", title="福州蓝粮海洋生物科技有限公司", description="专注于海洋生物科技研发、水产深加工与健康食材供应", meta={"title": "福州蓝粮海洋生物科技有限公司 - 海洋生物科技领导者", "description": "专注于海洋生物科技研发、水产深加工与健康食材供应", "keywords": "海洋生物科技,水产加工"}),
        Page(name="关于我们", slug="/about", title="关于我们 - 福州蓝粮海洋生物科技有限公司", description="了解蓝粮海洋的企业文化、发展历程和资质荣誉", meta={"title": "关于我们 - 福州蓝粮海洋生物科技有限公司", "description": "了解蓝粮海洋的企业文化、发展历程和资质荣誉", "keywords": "蓝粮海洋,企业文化"}),
        Page(name="产品中心", slug="/products", title="产品中心 - 福州蓝粮海洋生物科技有限公司", description="浏览我们的海洋生物制品、水产深加工产品和健康食材", meta={"title": "产品中心 - 福州蓝粮海洋生物科技有限公司", "description": "提供海藻提取物、鱼胶原蛋白肽、深海鱼油等多种海洋生物制品", "keywords": "海藻提取物,鱼胶原蛋白肽"}),
    ]
    db.add_all(pages)
    db.commit()


def seed_company_info(db: Session):
    if db.query(CompanyInfo).first():
        return
    info = CompanyInfo(
        data={
            "name": "蓝粮海洋",
            "full_name": "福州蓝粮海洋生物科技有限公司",
            "slogan": "探索海洋的无限可能",
            "description": "福州蓝粮海洋生物科技有限公司是一家专注于海洋生物科技研发、水产深加工与健康食材供应的企业。",
            "history": [
                {"year": "2014", "title": "公司成立", "description": "福州蓝粮海洋生物科技有限公司正式成立。"},
                {"year": "2016", "title": "首条生产线投产", "description": "公司首条海藻提取物生产线正式投产。"},
            ],
            "honors": [
                {"id": "1", "title": "国家级高新技术企业", "image": "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&q=80", "date": "2024-01", "issuer": "科技部"},
            ],
            "culture": [
                {"id": "1", "title": "使命", "description": "探索海洋的无限可能", "icon": "Target"},
                {"id": "2", "title": "愿景", "description": "成为海洋生物科技领域的领导者", "icon": "Eye"},
            ],
            "team": [
                {"id": "1", "name": "张明华", "position": "董事长", "photo": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80", "bio": "拥有20年海洋生物科技行业经验。"},
            ],
        }
    )
    db.add(info)
    db.commit()


def seed_rd_info(db: Session):
    if db.query(RDInfo).first():
        return
    info = RDInfo(
        data={
            "description": "公司拥有强大的研发实力，建有现代化的研发中心。",
            "technologies": [
                {"id": "1", "name": "低温酶解技术", "description": "采用低温酶解工艺", "icon": "Thermometer"},
            ],
            "equipment": [
                {"id": "1", "name": "高效液相色谱仪", "description": "用于海洋活性物质的分离", "image": "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=400&q=80", "specs": {"型号": "Agilent 1260"}},
            ],
            "patents": [
                {"id": "1", "name": "一种海藻多糖的提取方法", "number": "ZL201810123456.7", "date": "2018-03-15", "type": "发明专利", "description": "提取率提高30%以上"},
            ],
            "partners": [
                {"id": "1", "name": "中国科学院海洋研究所", "logo": "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80", "type": "科研机构", "description": "深度合作"},
            ],
        }
    )
    db.add(info)
    db.commit()
