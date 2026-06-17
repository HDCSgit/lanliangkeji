// 完整支付宝支付链路测试 (PC + 手机 UA)
// 流程: 登录 -> 创建订单 -> 创建支付 -> 拿返回的 gateway -> 模拟支付宝回调 return -> 验证入账
const http = require('http');

function req(opts, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: buf }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function flow(ua, label) {
  console.log(`\n========== ${label} ==========`);

  // 1. 登录
  let r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'POST', path: '/api/v1/auth/login',
    headers: { 'Content-Type': 'application/json', 'User-Agent': ua }
  }, JSON.stringify({ phone: '18050767545', password: 'zxcvbn12' }));
  const login = JSON.parse(r.body);
  const token = login.data.access_token;
  console.log('[1] 登录 ok');

  // 2. 拿地址
  r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'GET', path: '/api/v1/users/addresses',
    headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': ua }
  });
  const addresses = JSON.parse(r.body).data || [];
  if (addresses.length === 0) {
    console.log('[!] 没有地址, 测试终止');
    return;
  }
  const addr = addresses[0];

  // 3. 拿商品
  r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'GET', path: '/api/v1/products/',
    headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': ua }
  });
  const products = JSON.parse(r.body);
  const product = products.data[0];

  // 4. 加购物车 (POST /cart/)
  r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'POST', path: '/api/v1/cart/',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'User-Agent': ua }
  }, JSON.stringify({
    product_id: product.id,
    spec_id: product.specs[0].id,
    quantity: 1
  }));
  if (r.status !== 200 && r.status !== 201) {
    console.log('[!] 加购物车失败:', r.status, r.body.slice(0, 200));
  }

  // 5. 创建订单 (从购物车)
  r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'POST', path: '/api/v1/orders/',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'User-Agent': ua }
  }, JSON.stringify({
    shipping_address_id: addr.id,
    remark: `${label} 测试`
  }));
  if (r.status !== 200) {
    console.log('[!] 创建订单失败:', r.status, r.body.slice(0, 300));
    return;
  }
  const order = JSON.parse(r.body).data;
  console.log('[2] 订单创建:', order.order_no, 'id:', order.id);

  // 6. 创建支付 (支付宝)
  r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'POST', path: '/api/v1/payments/create',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'User-Agent': ua }
  }, JSON.stringify({ order_id: order.id, method: 'alipay' }));
  if (r.status !== 200) {
    console.log('[4] 创建支付失败:', r.status, r.body.slice(0, 300));
    return;
  }
  const pay = JSON.parse(r.body).data;
  const alipay = pay.alipay;
  console.log('[3] 支付创建:');
  console.log('    alipay.mode:', alipay.mode);
  console.log('    alipay.platform:', alipay.platform);
  console.log('    trade_url prefix:', alipay.trade_url?.slice(0, 120));
  console.log('    form_html 含自动 submit:', alipay.form_html?.includes('document.getElementById'));
  console.log('    form_html 含 QUICK_WAP_PAY:', alipay.form_html?.includes('QUICK_WAP_PAY'));
  console.log('    payment_no:', pay.payment.payment_no);

  // 7. 模拟 launch 中转页 (前端会跳这里)
  r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'GET',
    path: `/api/v1/payments/alipay/launch/${pay.payment.payment_no}`,
    headers: { 'User-Agent': ua }
  });
  console.log('[4] launch 中转页:', r.status, r.body.length, '字节');
  if (r.body.includes('alipay_submit') && r.body.includes('document.getElementById')) {
    console.log('    launch 页含自动 submit 表单 OK');
  } else {
    console.log('    launch 页异常');
  }

  // 8. 模拟 return 跳转 (支付宝完成后浏览器跳到这里)
  r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'GET',
    path: `/api/v1/payments/alipay/return?out_trade_no=${pay.payment.payment_no}`,
    headers: { 'User-Agent': ua }
  });
  console.log('[5] return 页:', r.status);
  if (r.status === 200 && r.body.includes('支付已完成')) {
    console.log('    return 页渲染 OK');
    const m = r.body.match(/url=([^"]+)"/);
    if (m) console.log('    跳转 URL:', m[1]);
  } else {
    console.log('    return 页异常:', r.body.slice(0, 200));
  }

  // 9. 主动 query (前端轮询 / 用户刷新页面时)
  r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'POST', path: '/api/v1/payments/alipay/query',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'User-Agent': ua }
  }, JSON.stringify({ out_trade_no: pay.payment.payment_no }));
  console.log('[6] query:', r.status, r.body.slice(0, 200));

  // 10. 看订单是否入账 (本次因为没真正付钱, 不会入账, 但要确认 query 不抛错)
  r = await req({
    hostname: '127.0.0.1', port: 8000, method: 'GET', path: `/api/v1/orders/${order.id}`,
    headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': ua }
  });
  const orderAfter = JSON.parse(r.body).data;
  console.log('[7] 订单状态:', orderAfter.status, '(本次测试未真实付款, 应仍为 PENDING_PAYMENT)');
}

(async () => {
  const pcUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  await flow(pcUA, 'PC');
  await flow(mobileUA, 'Mobile');
})();
