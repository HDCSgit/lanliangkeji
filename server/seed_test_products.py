"""一次性脚本:塞 2 个测试产品(带规格)。运行: python seed_test_products.py"""
import sys, uuid
from datetime import datetime, timezone
sys.path.insert(0, '.')

from app.db.session import SessionLocal
from app.models.models import Product, ProductSpec

NOW = datetime.now(timezone.utc)

SAMPLES = [
    {
        "name": "冰岛深海鳕鱼柳",
        "category": "冷冻水产",
        "description": "纯净海域捕捞,急速冷冻锁鲜,肉质细嫩无刺,适合清蒸或煎制。",
        "features": ["深海捕捞", "急速冷冻", "无骨无刺", "富含蛋白质"],
        "specs": [
            {"name": "500g 装", "unit": "袋", "price": 89.0, "stock": 50, "min_order": 1},
            {"name": "1kg 装", "unit": "袋", "price": 168.0, "stock": 30, "min_order": 1},
        ],
        "is_active": True,
        "order": 1,
    },
    {
        "name": "北海道即食海参",
        "category": "海味干货",
        "description": "开袋即食,口感 Q 弹,深海野生海参,营养丰富,送礼自用皆宜。",
        "features": ["开袋即食", "深海野生", "高蛋白低脂", "礼盒包装"],
        "specs": [
            {"name": "300g 礼盒装", "unit": "盒", "price": 268.0, "stock": 20, "min_order": 1},
        ],
        "is_active": True,
        "order": 2,
    },
]


def main():
    db = SessionLocal()
    try:
        # 清掉旧的(避免重复塞)
        db.query(Product).delete()
        db.commit()
        print("[clean] 已清空 products 表")

        for s in SAMPLES:
            p = Product(
                id=str(uuid.uuid4()),
                name=s["name"],
                category=s["category"],
                description=s["description"],
                image="",  # 先空着,后台编辑再上传
                cover_images=[],
                detail_images=[],
                enable_carousel=False,
                features=s["features"],
                is_active=s["is_active"],
                order=s["order"],
                created_at=NOW,
                updated_at=NOW,
            )
            db.add(p)
            db.flush()
            for sp in s["specs"]:
                db.add(ProductSpec(
                    id=str(uuid.uuid4()),
                    product_id=p.id,
                    name=sp["name"],
                    unit=sp["unit"],
                    price=sp["price"],
                    stock=sp["stock"],
                    min_order=sp["min_order"],
                    is_active=True,
                ))
            db.commit()
            print(f"[ok] {s['name']} (id={p.id}, {len(s['specs'])} 个规格)")
        print(f"\n[done] 共插入 {len(SAMPLES)} 个产品")
    finally:
        db.close()


if __name__ == "__main__":
    main()
