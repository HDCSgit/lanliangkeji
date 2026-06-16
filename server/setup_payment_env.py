"""给 .env 加微信支付开关 + 确认所有支付 enabled=true"""
import os
env_path = r'D:\openclaw\lanliang\server\.env'

with open(env_path, 'a', encoding='utf-8') as f:
    f.write('\n')
    f.write('# ============================================================\n')
    f.write('# 微信支付(电脑网站支付 / 公众号支付 / 小程序支付)\n')
    f.write('# 申请地址: https://pay.weixin.qq.com/index.php/apply/applyment/home\n')
    f.write('# ============================================================\n')
    f.write('WECHAT_ENABLED=true\n')
    f.write('# 微信支付商户号(申请微信支付后由微信下发)\n')
    f.write('WECHAT_MCH_ID=your-merchant-id\n')
    f.write('# 公众号/小程序/移动应用的 AppID\n')
    f.write('WECHAT_APP_ID=your-wechat-app-id\n')
    f.write('# API 密钥(微信支付商户平台 -> API 安全 -> APIv2 密钥)\n')
    f.write('WECHAT_API_KEY=your-32-char-api-key-please-replace\n')
    f.write('# 异步通知地址\n')
    f.write('WECHAT_NOTIFY_URL=http://192.168.3.6:8000/api/v1/payments/wechat/notify\n')
    f.write('\n')
    f.write('# 对公转账开关(默认开启)\n')
    f.write('BANK_TRANSFER_ENABLED=true\n')

print('[done] 已追加微信支付和对公转账开关到 .env')

# 验证
with open(env_path, 'r', encoding='utf-8') as f:
    content = f.read()
for key in ['WECHAT_ENABLED', 'ALIPAY_ENABLED', 'BANK_TRANSFER_ENABLED']:
    for line in content.split('\n'):
        if line.startswith(key + '='):
            print(f'  {line}')
            break
