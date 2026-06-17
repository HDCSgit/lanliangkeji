"""清理草稿产品(name='未命名产品'且 is_active=false 的)"""
import sys
sys.path.insert(0, '.')
from app.db.session import SessionLocal
from app.models.models import Product

db = SessionLocal()
try:
    drafts = db.query(Product).filter(Product.name == '未命名产品').all()
    print(f'找到 {len(drafts)} 个草稿产品')
    for d in drafts:
        print(f'  - id={d.id} name={d.name} is_active={d.is_active}')
        db.delete(d)
    db.commit()
    print(f'[done] 已删除 {len(drafts)} 个草稿')
finally:
    db.close()
