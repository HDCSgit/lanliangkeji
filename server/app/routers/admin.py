from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_sysadmin, require_auditor_or_admin
from app.models.models import (
    User,
    SiteConfig,
    Banner,
    News,
    Partner,
    NavItem,
    Page,
    CompanyInfo,
    RDInfo,
    Service,
    Stat,
)
from app.schemas.schemas import (
    ApiResponse,
    SiteConfigData,
    BannerCreate,
    BannerUpdate,
    BannerOut,
    NewsCreate,
    NewsUpdate,
    NewsOut,
    PartnerCreate,
    PartnerUpdate,
    PartnerOut,
    NavItemCreate,
    PageCreate,
    PageUpdate,
    PageOut,
    ServiceCreate,
    ServiceUpdate,
    ServiceOut,
    StatCreate,
    StatUpdate,
    StatOut,
    CompanyInfoData,
)

router = APIRouter()


# ==================== Helpers ====================

def _nav_tree(items: List[NavItem], parent_id: str | None = None) -> List[Dict[str, Any]]:
    """将扁平的导航列表递归构造成嵌套树结构。"""
    children = [item for item in items if item.parent_id == parent_id]
    children.sort(key=lambda x: x.order)
    result: List[Dict[str, Any]] = []
    for item in children:
        node = {
            "id": item.id,
            "name": item.name,
            "link": item.link,
            "icon": item.icon,
            "is_active": item.is_active,
            "order": item.order,
            "is_external": item.is_external,
            "children": _nav_tree(items, item.id),
        }
        result.append(node)
    return result


def _create_nav_children(
    db: Session, children_data: List[NavItemCreate], parent_id: str
) -> None:
    for child_data in children_data:
        child = NavItem(
            name=child_data.name,
            link=child_data.link,
            icon=child_data.icon,
            parent_id=parent_id,
            is_active=child_data.is_active,
            order=child_data.order,
            is_external=child_data.is_external,
        )
        db.add(child)
        db.flush()
        if child_data.children:
            _create_nav_children(db, child_data.children, child.id)


def _delete_nav_subtree(db: Session, parent_id: str | None = None) -> None:
    """递归删除导航子树（先删叶子节点，避免自引用外键冲突）。"""
    children = db.query(NavItem).filter(NavItem.parent_id == parent_id).all()
    for child in children:
        _delete_nav_subtree(db, child.id)
        db.delete(child)


# ==================== Site Config ====================

@router.put("/site/config", response_model=ApiResponse)
def update_site_config(
    data: SiteConfigData,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    config = db.query(SiteConfig).filter(SiteConfig.key == "main").first()
    if not config:
        config = SiteConfig(key="main", value=data.model_dump())
        db.add(config)
    else:
        config.value = data.model_dump()
    db.commit()
    db.refresh(config)
    return ApiResponse(success=True, data=config.value)


# ==================== Banners ====================

@router.get("/banners", response_model=ApiResponse)
def list_banners(
    db: Session = Depends(get_db),
    _user: User = Depends(require_auditor_or_admin),
):
    banners = db.query(Banner).order_by(Banner.order.asc()).all()
    return ApiResponse(success=True, data=[BannerOut.model_validate(b) for b in banners])


@router.post("/banners", response_model=ApiResponse)
def create_banner(
    data: BannerCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    banner = Banner(**data.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return ApiResponse(success=True, data=BannerOut.model_validate(banner))


@router.put("/banners/{banner_id}", response_model=ApiResponse)
def update_banner(
    banner_id: str,
    data: BannerUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="轮播图不存在")
    for key, value in data.model_dump().items():
        setattr(banner, key, value)
    db.commit()
    db.refresh(banner)
    return ApiResponse(success=True, data=BannerOut.model_validate(banner))


@router.delete("/banners/{banner_id}", response_model=ApiResponse)
def delete_banner(
    banner_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="轮播图不存在")
    db.delete(banner)
    db.commit()
    return ApiResponse(success=True, message="删除成功")


# ==================== News ====================

@router.get("/news", response_model=ApiResponse)
def list_news(
    db: Session = Depends(get_db),
    _user: User = Depends(require_auditor_or_admin),
):
    news_list = db.query(News).order_by(News.created_at.desc()).all()
    return ApiResponse(success=True, data=[NewsOut.model_validate(n) for n in news_list])


@router.post("/news", response_model=ApiResponse)
def create_news(
    data: NewsCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    news = News(**data.model_dump())
    db.add(news)
    db.commit()
    db.refresh(news)
    return ApiResponse(success=True, data=NewsOut.model_validate(news))


@router.put("/news/{news_id}", response_model=ApiResponse)
def update_news(
    news_id: str,
    data: NewsUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="新闻不存在")
    for key, value in data.model_dump().items():
        setattr(news, key, value)
    db.commit()
    db.refresh(news)
    return ApiResponse(success=True, data=NewsOut.model_validate(news))


@router.delete("/news/{news_id}", response_model=ApiResponse)
def delete_news(
    news_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="新闻不存在")
    db.delete(news)
    db.commit()
    return ApiResponse(success=True, message="删除成功")


# ==================== Partners ====================

@router.get("/partners", response_model=ApiResponse)
def list_partners(
    db: Session = Depends(get_db),
    _user: User = Depends(require_auditor_or_admin),
):
    partners = db.query(Partner).order_by(Partner.order.asc()).all()
    return ApiResponse(success=True, data=[PartnerOut.model_validate(p) for p in partners])


@router.post("/partners", response_model=ApiResponse)
def create_partner(
    data: PartnerCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    partner = Partner(**data.model_dump())
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return ApiResponse(success=True, data=PartnerOut.model_validate(partner))


@router.put("/partners/{partner_id}", response_model=ApiResponse)
def update_partner(
    partner_id: str,
    data: PartnerUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="合作伙伴不存在")
    for key, value in data.model_dump().items():
        setattr(partner, key, value)
    db.commit()
    db.refresh(partner)
    return ApiResponse(success=True, data=PartnerOut.model_validate(partner))


@router.delete("/partners/{partner_id}", response_model=ApiResponse)
def delete_partner(
    partner_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="合作伙伴不存在")
    db.delete(partner)
    db.commit()
    return ApiResponse(success=True, message="删除成功")


# ==================== Nav ====================

@router.get("/nav", response_model=ApiResponse)
def list_nav(
    db: Session = Depends(get_db),
    _user: User = Depends(require_auditor_or_admin),
):
    items = db.query(NavItem).order_by(NavItem.order.asc()).all()
    return ApiResponse(success=True, data=_nav_tree(items))


@router.put("/nav", response_model=ApiResponse)
def update_nav(
    items: List[NavItemCreate],
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    # 先删后插，保持传入顺序
    _delete_nav_subtree(db, None)
    for item_data in items:
        nav = NavItem(
            name=item_data.name,
            link=item_data.link,
            icon=item_data.icon,
            parent_id=None,
            is_active=item_data.is_active,
            order=item_data.order,
            is_external=item_data.is_external,
        )
        db.add(nav)
        db.flush()
        if item_data.children:
            _create_nav_children(db, item_data.children, nav.id)
    db.commit()
    refreshed = db.query(NavItem).order_by(NavItem.order.asc()).all()
    return ApiResponse(success=True, data=_nav_tree(refreshed))


# ==================== Company Info ====================

@router.get("/company", response_model=ApiResponse)
def get_company_info_admin(
    db: Session = Depends(get_db),
    _user: User = Depends(require_auditor_or_admin),
):
    info = db.query(CompanyInfo).first()
    if not info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="公司信息不存在")
    return ApiResponse(success=True, data=info.data)


@router.put("/company", response_model=ApiResponse)
def update_company_info(
    data: CompanyInfoData,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    info = db.query(CompanyInfo).first()
    if not info:
        info = CompanyInfo(data=data.model_dump())
        db.add(info)
    else:
        info.data = data.model_dump()
    db.commit()
    db.refresh(info)
    return ApiResponse(success=True, data=info.data)


# ==================== R&D Info ====================

@router.get("/rd", response_model=ApiResponse)
def get_rd_info_admin(
    db: Session = Depends(get_db),
    _user: User = Depends(require_auditor_or_admin),
):
    info = db.query(RDInfo).first()
    if not info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="研发信息不存在")
    return ApiResponse(success=True, data=info.data)


@router.put("/rd", response_model=ApiResponse)
def update_rd_info(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    info = db.query(RDInfo).first()
    if not info:
        info = RDInfo(data=data)
        db.add(info)
    else:
        info.data = data
    db.commit()
    db.refresh(info)
    return ApiResponse(success=True, data=info.data)


# ==================== Services ====================

@router.get("/services", response_model=ApiResponse)
def list_services(
    db: Session = Depends(get_db),
    _user: User = Depends(require_auditor_or_admin),
):
    services = db.query(Service).order_by(Service.order.asc()).all()
    return ApiResponse(success=True, data=[ServiceOut.model_validate(s) for s in services])


@router.post("/services", response_model=ApiResponse)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    service = Service(**data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return ApiResponse(success=True, data=ServiceOut.model_validate(service))


@router.put("/services/{service_id}", response_model=ApiResponse)
def update_service(
    service_id: str,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="服务不存在")
    for key, value in data.model_dump().items():
        setattr(service, key, value)
    db.commit()
    db.refresh(service)
    return ApiResponse(success=True, data=ServiceOut.model_validate(service))


@router.delete("/services/{service_id}", response_model=ApiResponse)
def delete_service(
    service_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="服务不存在")
    db.delete(service)
    db.commit()
    return ApiResponse(success=True, message="删除成功")


# ==================== Stats ====================

@router.get("/stats", response_model=ApiResponse)
def list_stats(
    db: Session = Depends(get_db),
    _user: User = Depends(require_auditor_or_admin),
):
    stats = db.query(Stat).order_by(Stat.order.asc()).all()
    return ApiResponse(success=True, data=[StatOut.model_validate(s) for s in stats])


@router.post("/stats", response_model=ApiResponse)
def create_stat(
    data: StatCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    stat = Stat(**data.model_dump())
    db.add(stat)
    db.commit()
    db.refresh(stat)
    return ApiResponse(success=True, data=StatOut.model_validate(stat))


@router.put("/stats/{stat_id}", response_model=ApiResponse)
def update_stat(
    stat_id: str,
    data: StatUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    stat = db.query(Stat).filter(Stat.id == stat_id).first()
    if not stat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="统计数据不存在")
    for key, value in data.model_dump().items():
        setattr(stat, key, value)
    db.commit()
    db.refresh(stat)
    return ApiResponse(success=True, data=StatOut.model_validate(stat))


@router.delete("/stats/{stat_id}", response_model=ApiResponse)
def delete_stat(
    stat_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    stat = db.query(Stat).filter(Stat.id == stat_id).first()
    if not stat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="统计数据不存在")
    db.delete(stat)
    db.commit()
    return ApiResponse(success=True, message="删除成功")


# ==================== Pages ====================

@router.get("/pages", response_model=ApiResponse)
def list_pages(
    db: Session = Depends(get_db),
    _user: User = Depends(require_auditor_or_admin),
):
    pages = db.query(Page).order_by(Page.name.asc()).all()
    return ApiResponse(success=True, data=[PageOut.model_validate(p) for p in pages])


@router.post("/pages", response_model=ApiResponse)
def create_page(
    data: PageCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    page = Page(**data.model_dump())
    db.add(page)
    db.commit()
    db.refresh(page)
    return ApiResponse(success=True, data=PageOut.model_validate(page))


@router.put("/pages/{page_id}", response_model=ApiResponse)
def update_page(
    page_id: str,
    data: PageUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="页面不存在")
    for key, value in data.model_dump().items():
        setattr(page, key, value)
    db.commit()
    db.refresh(page)
    return ApiResponse(success=True, data=PageOut.model_validate(page))


@router.delete("/pages/{page_id}", response_model=ApiResponse)
def delete_page(
    page_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="页面不存在")
    db.delete(page)
    db.commit()
    return ApiResponse(success=True, message="删除成功")


# ==================== Users ====================

@router.get("/users", response_model=ApiResponse)
def list_users(
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return ApiResponse(success=True, data=[
        {
            "id": u.id,
            "phone": u.phone,
            "name": u.name,
            "avatar": u.avatar,
            "role": u.role.value,
            "created_at": u.created_at,
        }
        for u in users
    ])


# ==================== Auditors ====================

@router.get("/auditors", response_model=ApiResponse)
def list_auditors(
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    from app.models.models import Auditor
    auditors = db.query(Auditor).all()
    return ApiResponse(success=True, data=[
        {
            "userId": a.user_id,
            "userName": a.user.name,
            "userPhone": a.user.phone,
            "assignedBy": a.assigned_by,
            "assignedByName": a.assigner.name if a.assigner else "",
            "assignedAt": a.assigned_at,
        }
        for a in auditors
    ])


@router.post("/auditors", response_model=ApiResponse)
def create_auditor(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sysadmin),
):
    from app.models.models import Auditor
    user_id = data.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    existing = db.query(Auditor).filter(Auditor.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该用户已是审核员")

    auditor = Auditor(
        user_id=user_id,
        assigned_by=current_user.id,
    )
    user.role = "auditor"
    db.add(auditor)
    db.commit()
    db.refresh(auditor)
    return ApiResponse(success=True, message=f"已将 {user.name} 设置为审核员")


@router.delete("/auditors/{user_id}", response_model=ApiResponse)
def delete_auditor(
    user_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_sysadmin),
):
    from app.models.models import Auditor
    auditor = db.query(Auditor).filter(Auditor.user_id == user_id).first()
    if not auditor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="该用户不是审核员")

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.role = "user"

    db.delete(auditor)
    db.commit()
    return ApiResponse(success=True, message=f"已移除 {auditor.user.name} 的审核员权限")
