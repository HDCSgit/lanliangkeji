"""把 sysadmin 用户的 role 改成 SYSADMIN"""
import sys
sys.path.insert(0, '.')
from app.db.session import SessionLocal
from app.models.models import User, UserRole

db = SessionLocal()
try:
    u = db.query(User).filter(User.phone == 'sysadmin').first()
    if not u:
        print("❌ 没找到 sysadmin 用户")
    else:
        old = u.role
        u.role = UserRole.SYSADMIN
        db.commit()
        print(f"✅ sysadmin user: role {old.value} -> {u.role.value}")
finally:
    db.close()
