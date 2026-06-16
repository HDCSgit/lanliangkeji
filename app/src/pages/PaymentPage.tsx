import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CreditCard, QrCode, Building2, CheckCircle, XCircle,
  Clock, RefreshCw, Copy, ArrowLeft, ArrowRight, Upload, FileText,
  AlertCircle, ImagePlus
} from 'lucide-react';
import { OrderStore } from '@/data/ecommerceStore';
import { PaymentGateway, PaymentAPI, VoucherStore } from '@/data/paymentGateway';
import type { PaymentMethod } from '@/types/ecommerce';
import type { Order, ReceivableAccount } from '@/types/ecommerce';

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [step, setStep] = useState<'select' | 'qrcode' | 'upload' | 'processing' | 'result'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [alipayInfo, setAlipayInfo] = useState<{ mode: 'real' | 'mock'; configured: boolean; trade_url?: string } | null>(null);
  const [paymentNo, setPaymentNo] = useState('');
  const [result, setResult] = useState<'success' | 'failed' | 'expired' | 'cancelled' | null>(null);
  const [countdown, setCountdown] = useState(1800);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receivableAccount, setReceivableAccount] = useState<ReceivableAccount | null>(null);

  // 对公转账凭证
  const [voucherImage, setVoucherImage] = useState('');
  const [uploadCountdown, setUploadCountdown] = useState(72 * 60 * 60);
  const [voucherStatus, setVoucherStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 加载订单
  useEffect(() => {
    if (!orderId) {
      navigate('/orders');
      return;
    }
    loadOrder();
  }, [orderId, navigate]);

  const loadOrder = async () => {
    // 收款账户是站点级配置,PaymentGateway 内部有内存缓存
    // 这里用 Promise.all 并行拉取(订单详情 + 收款账户),不要串行 await
    const [found, account] = await Promise.all([
      OrderStore.getById(orderId!),
      PaymentGateway.getReceivableAccount(),
    ]);
    if (!found) {
      navigate('/orders');
      return;
    }
    setOrder(found);
    setReceivableAccount(account);

    // 检查是否已有凭证（对公转账）
    if (found.paymentMethod === 'bank_transfer') {
      const existingVoucher = await VoucherStore.getByOrderId(orderId!);
      if (existingVoucher) {
        setVoucherImage(existingVoucher.voucherImage);
        setVoucherStatus(existingVoucher.status);
        if (existingVoucher.rejectReason) {
          setRejectReason(existingVoucher.rejectReason);
        }
        const remaining = VoucherStore.getRemainingTime(existingVoucher);
        if (existingVoucher.status === 'pending') {
          setUploadCountdown(Math.floor(remaining / 1000));
          setStep('processing');
        } else if (existingVoucher.status === 'rejected') {
          setUploadCountdown(Math.floor(remaining / 1000));
          setStep('upload');
          setError(`审核不通过：${existingVoucher.rejectReason || '凭证信息有误，请重新上传'}`);
        } else if (existingVoucher.status === 'approved') {
          setResult('success');
          setStep('result');
        }
      }
    }
  };

  // 倒计时（扫码支付用）
  useEffect(() => {
    if (step !== 'qrcode' || paymentMethod === 'bank_transfer' || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [step, countdown, paymentMethod]);

  // 倒计时结束时自动过期
  useEffect(() => {
    if (countdown <= 0 && step === 'qrcode' && paymentMethod !== 'bank_transfer') {
      setResult('expired');
      setStep('result');
      setPolling(false);
    }
  }, [countdown, step, paymentMethod]);

  // 凭证上传倒计时（72小时）
  useEffect(() => {
    if (step !== 'processing' && step !== 'upload') return;
    if (uploadCountdown <= 0) {
      setResult('cancelled');
      setStep('result');
      return;
    }
    const timer = setInterval(() => {
      setUploadCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setResult('cancelled');
          setStep('result');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, uploadCountdown]);

  // 轮询支付状态(微信/支付宝用)
  const startPolling = useCallback((pn: string) => {
    setPolling(true);
    // 先清理可能残留的 timer (用户重复点击确认支付场景)
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollTimerRef.current = setInterval(async () => {
      const status = await PaymentAPI.queryPaymentStatus(pn);
      if (status === 'paid') {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        setPolling(false);
        setResult('success');
        setStep('result');
      } else if (status === 'expired' || status === 'failed') {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        setPolling(false);
        setResult(status);
        setStep('result');
      }
    }, 3000);
  }, []);

  // 组件卸载时清理轮询 timer (避免离开页面后还在 3s 调一次后端)
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // 创建支付
  const handleCreatePayment = async () => {
    if (!order) return;
    setIsLoading(true);
    setError('');

    const result = await PaymentAPI.createPayment(
      order.id,
      order.orderNo,
      order.finalAmount,
      paymentMethod,
      `蓝粮海洋-${order.items.map(i => i.productName).join(',')}`
    );

    if (result.success) {
      setPaymentNo(result.paymentNo);
      if (paymentMethod === 'bank_transfer') {
        setStep('upload');
        if (result.receivableAccount) {
          // 注意:axios response interceptor 已经把整个 response.data snake→camel 了
          // 所以这里要读 camelCase 字段
          setReceivableAccount({
            accountName: result.receivableAccount.accountName,
            bankName: result.receivableAccount.bankName,
            accountNumber: result.receivableAccount.accountNumber,
          });
        }
      } else {
        if (result.qrCode) {
          setQrCode(result.qrCode);
        }
        if (result.alipay) {
          setAlipayInfo(result.alipay);
        }
        setCountdown(1800);
        setStep('qrcode');
        startPolling(result.paymentNo);
      }
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  // 上传凭证截图
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setVoucherImage(event.target?.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // 提交凭证
  const handleSubmitVoucher = async () => {
    if (!voucherImage || !order) {
      setError('请先上传转账凭证截图');
      return;
    }

    setIsLoading(true);

    try {
      await VoucherStore.submit({
        orderId: order.id,
        amount: order.finalAmount,
        voucherImage,
      });

      setVoucherStatus('pending');
      setUploadCountdown(72 * 60 * 60);
      setStep('processing');
      setError('');
    } catch (err: any) {
      setError(err.message || '凭证提交失败');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const copyOrderNo = () => {
    if (order?.orderNo) {
      navigator.clipboard.writeText(order.orderNo);
    }
  };

  if (!order) return null;

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Step 1: Select Payment Method */}
        {step === 'select' && (
          <>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-gray-500 hover:text-ocean-blue mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>

            <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
              <h1 className="text-xl font-bold text-ocean-deep mb-1">确认支付</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>订单号：{order.orderNo}</span>
                <button onClick={copyOrderNo} className="text-ocean-blue hover:text-ocean-deep">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-4 text-center">
                <span className="text-gray-500">应付金额</span>
                <div className="text-4xl font-bold text-ocean-blue mt-1">
                  ¥{order.finalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
              <h2 className="font-bold text-ocean-deep mb-4">选择支付方式</h2>
              <div className="space-y-3">
                {/* 微信支付 - 始终显示 */}
                <button
                  onClick={() => setPaymentMethod('wechat')}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'wechat'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-ocean-deep">微信支付</div>
                    <div className="text-xs text-gray-500">扫码支付</div>
                  </div>
                  {paymentMethod === 'wechat' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </button>

                {/* 支付宝 - 始终显示 */}
                <button
                  onClick={() => setPaymentMethod('alipay')}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'alipay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-ocean-deep">支付宝</div>
                    <div className="text-xs text-gray-500">扫码支付</div>
                  </div>
                  {paymentMethod === 'alipay' && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </button>

                {/* 对公转账 */}
                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-ocean-deep">对公转账</div>
                    <div className="text-xs text-gray-500">银行转账，审核确认</div>
                  </div>
                  {paymentMethod === 'bank_transfer' && (
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreatePayment}
                disabled={isLoading}
                className="w-full mt-6 py-4 bg-gradient-to-r from-ocean-blue to-ocean-cyan text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    正在生成支付...
                  </div>
                ) : (
                  `确认支付 ¥${order.finalAmount.toFixed(2)}`
                )}
              </button>
            </div>
          </>
        )}

        {/* Step 2: QR Code (微信/支付宝) */}
        {step === 'qrcode' && (
          <>
            <button
              onClick={() => {
                setStep('select');
                setPolling(false);
              }}
              className="flex items-center gap-1 text-gray-500 hover:text-ocean-blue mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              更换支付方式
            </button>

            <div className="bg-white rounded-2xl shadow-card p-6 text-center">
              <h2 className="text-lg font-bold text-ocean-deep mb-1">
                {paymentMethod === 'wechat' && '微信支付'}
                {paymentMethod === 'alipay' && '支付宝'}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                订单金额：<span className="text-ocean-blue font-bold">¥{order.finalAmount.toFixed(2)}</span>
              </p>

              {/* 真实支付宝:点击按钮后端 form 自动 POST 跳转到支付宝 (wap.pay / page.pay 都要求 POST) */}
              {paymentMethod === 'alipay' && alipayInfo && (alipayInfo as any).mode === 'real' && ((alipayInfo as any).trade_url || (alipayInfo as any).tradeUrl) ? (
                <div className="space-y-3">
                  <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-sm text-cyan-800">
                    <p className="font-medium mb-1">
                      {(alipayInfo as any).platform === 'mobile' ? '点击下方按钮在手机上完成支付宝支付' : '点击下方按钮跳转到支付宝完成支付'}
                    </p>
                    <p>支付完成后会自动跳回本站,并自动确认订单状态。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // 重要: 必须用后端中转页 /api/v1/payments/alipay/launch/{payment_no}
                      //      让后端渲染 form POST 跳支付宝。
                      // 原因: 前端直接 form.submit(), 部分手机浏览器在支付宝 App 接管 URL 时
                      //      会 pop 当前 history, 用户回到 #/checkout "选择支付方式" 页。
                      //      用中转页后, 前端 history 干净, 支付宝完成支付 return_url 跳后端 HTML
                      //      3 秒后再 meta refresh 跳回前端 /#/order/{id}, 衔接稳定。
                      // 重要: 必须用后端中转页 /api/v1/payments/alipay/launch/{payment_no}
                      //      让后端渲染 form POST 跳支付宝。
                      // 原因: 前端直接 form.submit(), 部分手机浏览器在支付宝 App 接管 URL 时
                      //      会 pop 当前 history, 用户回到 #/checkout "选择支付方式" 页。
                      //      用中转页后, 前端 history 干净, 支付宝完成支付 return_url 跳后端 HTML
                      //      3 秒后再 meta refresh 跳回前端 /#/order/{id}, 衔接稳定。
                      // 不要清掉 polling —— 用户从支付宝回来后，queryPaymentStatus 会通过
                      // alipayQuery 主动查支付宝，并触发 setStep('result') 显示成功
                      // (即使后端 notify 漏发也能拉到支付结果)
                      const launchUrl = `/api/v1/payments/alipay/launch/${paymentNo}`;
                      window.location.href = launchUrl;
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#1677ff] text-white rounded-full font-semibold hover:bg-[#0f5fcc] transition-colors"
                  >
                    <span>去支付宝支付</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-400 mt-3">
                    订单号: {paymentNo}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mock / 微信:展示二维码 */}
                  <div className="relative w-64 h-64 mx-auto mb-4 bg-gray-100 rounded-xl overflow-hidden">
                    {qrCode ? (
                      <img src={qrCode} alt="支付二维码" className="w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        加载中...
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫一扫
                  </p>
                  {paymentMethod === 'alipay' && alipayInfo?.mode === 'mock' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 mb-3">
                      ⚠ 当前为<strong>演示模式</strong>(未配置支付宝 AppID/密钥)。生产环境配置后即可扫码真实支付。
                    </div>
                  )}
                </>
              )}

              {/* 倒计时 */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                <Clock className="w-4 h-4" />
                剩余支付时间：{formatTime(countdown)}
              </div>

              {/* 轮询状态 */}
              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm text-ocean-blue">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  等待支付结果...
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 3: Upload Voucher (对公转账) */}
        {step === 'upload' && (
          <>
            <button
              onClick={() => {
                setStep('select');
                setVoucherImage('');
                setError('');
              }}
              className="flex items-center gap-1 text-gray-500 hover:text-ocean-blue mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              更换支付方式
            </button>

            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-bold text-ocean-deep mb-1">对公转账</h2>
              <p className="text-gray-500 text-sm mb-4">
                订单金额：<span className="text-ocean-blue font-bold">¥{order.finalAmount.toFixed(2)}</span>
              </p>

              {/* 收款账户信息 */}
              {receivableAccount && (
                <div className="p-4 bg-orange-50 rounded-xl space-y-2 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-orange-700">收款方账户信息</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">收款方</span>
                    <span className="font-medium text-ocean-deep">{receivableAccount.accountName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">开户行</span>
                    <span className="font-medium text-ocean-deep">{receivableAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">账号</span>
                    <span className="font-medium text-ocean-deep">{receivableAccount.accountNumber}</span>
                  </div>
                  <div className="border-t border-orange-200 pt-2 mt-2">
                    <p className="text-xs text-orange-600">
                      如需开票请备注:开票及对公开票信息(单位名称、纳税人识别号、开户行、银行账号、地址、电话等)
                    </p>
                  </div>
                </div>
              )}

              {/* 凭证上传 */}
              <div className="space-y-4">
                <label className="block font-medium text-ocean-deep text-sm">
                  上传转账凭证截图
                </label>

                {voucherImage ? (
                  <div className="relative">
                    <img
                      src={voucherImage}
                      alt="转账凭证"
                      className="w-full h-48 object-contain bg-gray-50 rounded-xl border"
                    />
                    <button
                      onClick={() => {
                        setVoucherImage('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-ocean-blue hover:bg-ocean-blue/5 transition-colors"
                  >
                    <ImagePlus className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">点击上传转账凭证截图</span>
                    <span className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* 时间提示 */}
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>请在 {formatTime(uploadCountdown)} 内完成转账并上传凭证，超时将自动取消订单</span>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleSubmitVoucher}
                  disabled={isLoading || !voucherImage}
                  className="w-full py-4 bg-gradient-to-r from-ocean-blue to-ocean-cyan text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      提交中...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" />
                      提交转账凭证
                    </div>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Processing - 等待审核 */}
        {step === 'processing' && (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-ocean-blue/20" />
              <div className="absolute inset-0 rounded-full border-4 border-ocean-blue border-t-transparent animate-spin" />
              <Clock className="absolute inset-0 m-auto w-8 h-8 text-ocean-blue" />
            </div>

            <h2 className="text-2xl font-bold text-ocean-deep mb-2">交易处理中</h2>
            <p className="text-gray-500 mb-4">您的转账凭证已提交，等待审核员审核</p>

            {voucherImage && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">已提交的凭证</p>
                <img
                  src={voucherImage}
                  alt="已提交凭证"
                  className="w-full max-w-xs mx-auto h-32 object-contain bg-gray-50 rounded-lg border"
                />
              </div>
            )}

            <div className="p-4 bg-orange-50 rounded-xl mb-6">
              <div className="flex items-center justify-center gap-2 text-orange-600 text-sm">
                <Clock className="w-4 h-4" />
                <span>凭证上传剩余时间：{formatTime(uploadCountdown)}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-500">
              <p>审核通过后，交易将变为「等待发货」状态</p>
              <p>您可以在订单详情中查看审核进度</p>
            </div>

            <button
              onClick={() => navigate('/orders')}
              className="mt-6 px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-deep transition-colors"
            >
              查看订单
            </button>
          </div>
        )}

        {/* Step 5: Result */}
        {step === 'result' && (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            {result === 'success' && (
              <>
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-ocean-deep mb-2">支付成功</h2>
                <p className="text-gray-500 mb-2">订单号：{order.orderNo}</p>
                <p className="text-gray-500 mb-2">
                  支付金额：<span className="text-ocean-blue font-bold">¥{order.finalAmount.toFixed(2)}</span>
                </p>
                <p className="text-green-600 mb-6">
                  {voucherStatus === 'approved' ? '审核通过，等待发货' : '支付成功'}
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/orders')}
                    className="px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-deep transition-colors"
                  >
                    查看订单
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    继续购物
                  </button>
                </div>
              </>
            )}

            {result === 'expired' && (
              <>
                <Clock className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-ocean-deep mb-2">支付超时</h2>
                <p className="text-gray-500 mb-6">订单已过期，请重新下单</p>
                <button
                  onClick={() => navigate('/orders')}
                  className="px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-deep transition-colors"
                >
                  查看订单
                </button>
              </>
            )}

            {result === 'cancelled' && (
              <>
                <XCircle className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-ocean-deep mb-2">订单已取消</h2>
                <p className="text-gray-500 mb-6">超过72小时未上传凭证，订单已自动取消</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/orders')}
                    className="px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-deep transition-colors"
                  >
                    查看订单
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    重新下单
                  </button>
                </div>
              </>
            )}

            {result === 'failed' && (
              <>
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-ocean-deep mb-2">审核不通过</h2>
                {rejectReason && (
                  <p className="text-red-500 mb-2 text-sm">原因：{rejectReason}</p>
                )}
                <p className="text-gray-500 mb-6">交易凭证未通过审核，请重新提交凭证截图或重新下单</p>
                <div className="flex flex-col gap-3">
                  {uploadCountdown > 0 ? (
                    <button
                      onClick={() => {
                        setResult(null);
                        setVoucherImage('');
                        setStep('upload');
                        setError('');
                      }}
                      className="w-full px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-deep transition-colors"
                    >
                      重新提交凭证（剩余 {formatTime(uploadCountdown)}）
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/products')}
                      className="w-full px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-deep transition-colors"
                    >
                      重新下单
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/orders')}
                    className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    查看订单
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
