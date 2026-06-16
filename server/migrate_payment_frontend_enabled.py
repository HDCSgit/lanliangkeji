"""把已存在的 PaymentGatewayConfig JSON 结构升级到 frontend_enabled 字段

旧结构: {enabled: bool}
新结构: {frontend_enabled: bool, ...}
对公转账的 enabled 保留(那是它的总开关)

策略:对所有已有记录,加 frontend_enabled = True (默认显示)
"""
import sys
sys.path.insert(0, '.')
from app.db.session import SessionLocal
from app.models.models import PaymentGatewayConfig

db = SessionLocal()
try:
    cfgs = db.query(PaymentGatewayConfig).all()
    print(f'找到 {len(cfgs)} 条 PaymentGatewayConfig')

    for cfg in cfgs:
        # 微信支付 / 支付宝: 加 frontend_enabled 字段(默认 True)
        for key in ('wechat_pay', 'alipay'):
            data = getattr(cfg, key) or {}
            if 'frontend_enabled' not in data:
                data['frontend_enabled'] = True
                setattr(cfg, key, data)
                print(f'  [{key}] 添加 frontend_enabled=True')

        # 对公转账: enabled 字段保留(就是这个的总开关,叫 enabled 不冲突)
        bank = cfg.bank_transfer or {}
        if 'enabled' not in bank:
            bank['enabled'] = True
            cfg.bank_transfer = bank
            print(f'  [bank_transfer] 添加 enabled=True')

    db.commit()
    print('[done] 升级完成')
finally:
    db.close()
