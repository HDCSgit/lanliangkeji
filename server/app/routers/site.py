from typing import List, Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import (
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
    BannerOut,
    NewsOut,
    PartnerOut,
    PageOut,
    ServiceOut,
    StatOut,
)

router = APIRouter()


def _nav_tree(items: List[NavItem], parent_id: Optional[str] = None) -> List[Dict[str, Any]]:
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


@router.get("/config", response_model=ApiResponse)
def get_site_config(db: Session = Depends(get_db)):
    config = db.query(SiteConfig).filter(SiteConfig.key == "main").first()
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="站点配置不存在")
    return ApiResponse(success=True, data=config.value)


@router.get("/banners", response_model=ApiResponse)
def get_banners(db: Session = Depends(get_db)):
    banners = (
        db.query(Banner)
        .filter(Banner.is_active == True)
        .order_by(Banner.order.asc())
        .all()
    )
    return ApiResponse(success=True, data=[BannerOut.model_validate(b) for b in banners])


@router.get("/news", response_model=ApiResponse)
def get_news(db: Session = Depends(get_db)):
    news_list = (
        db.query(News)
        .filter(News.is_active == True)
        .order_by(News.created_at.desc())
        .all()
    )
    return ApiResponse(success=True, data=[NewsOut.model_validate(n) for n in news_list])


@router.get("/news/{news_id}", response_model=ApiResponse)
def get_news_detail(news_id: str, db: Session = Depends(get_db)):
    news = db.query(News).filter(News.id == news_id, News.is_active == True).first()
    if not news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="新闻不存在")
    news.views = (news.views or 0) + 1
    db.commit()
    db.refresh(news)
    return ApiResponse(success=True, data=NewsOut.model_validate(news))


@router.get("/partners", response_model=ApiResponse)
def get_partners(db: Session = Depends(get_db)):
    partners = (
        db.query(Partner)
        .filter(Partner.is_active == True)
        .order_by(Partner.order.asc())
        .all()
    )
    return ApiResponse(success=True, data=[PartnerOut.model_validate(p) for p in partners])


@router.get("/nav", response_model=ApiResponse)
def get_nav(db: Session = Depends(get_db)):
    items = (
        db.query(NavItem)
        .filter(NavItem.is_active == True)
        .order_by(NavItem.order.asc())
        .all()
    )
    return ApiResponse(success=True, data=_nav_tree(items))


@router.get("/pages/{slug}", response_model=ApiResponse)
def get_page_by_slug(slug: str, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.slug == slug, Page.is_active == True).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="页面不存在")
    return ApiResponse(success=True, data=PageOut.model_validate(page))


@router.get("/company", response_model=ApiResponse)
def get_company_info(db: Session = Depends(get_db)):
    info = db.query(CompanyInfo).first()
    if not info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="公司信息不存在")
    return ApiResponse(success=True, data=info.data)


@router.get("/rd", response_model=ApiResponse)
def get_rd_info(db: Session = Depends(get_db)):
    info = db.query(RDInfo).first()
    if not info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="研发信息不存在")
    return ApiResponse(success=True, data=info.data)


@router.get("/services", response_model=ApiResponse)
def get_services(db: Session = Depends(get_db)):
    services = (
        db.query(Service)
        .filter(Service.is_active == True)
        .order_by(Service.order.asc())
        .all()
    )
    return ApiResponse(success=True, data=[ServiceOut.model_validate(s) for s in services])


@router.get("/stats", response_model=ApiResponse)
def get_stats(db: Session = Depends(get_db)):
    stats = db.query(Stat).order_by(Stat.order.asc()).all()
    return ApiResponse(success=True, data=[StatOut.model_validate(s) for s in stats])
