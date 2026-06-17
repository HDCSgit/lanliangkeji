import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Droplets, Eye, EyeOff, Phone, Lock, User, ArrowLeft } from 'lucide-react';
import { UserStore } from '@/data/userStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // 优先读 query ?redirect=... (来自未登录拦截), 其次读 state.from (来自 RequireAuth), 默认 '/'
  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const from = redirectParam
    ? decodeURIComponent(redirectParam)
    : (location.state as any)?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      if (isRegister) {
        if (!formData.name.trim()) { setError('请输入姓名'); setIsLoading(false); return; }
        if (!formData.phone.trim()) { setError('请输入手机号'); setIsLoading(false); return; }
        if (!/^1[3-9]\d{9}$/.test(formData.phone)) { setError('请输入正确的手机号'); setIsLoading(false); return; }
        if (formData.password.length < 6) { setError('密码至少6位'); setIsLoading(false); return; }
        if (formData.password !== formData.confirmPassword) { setError('两次密码不一致'); setIsLoading(false); return; }

        const result = await UserStore.register(formData.name, formData.phone, formData.password);
        if (result.success) { navigate(from); } else { setError(result.message); }
      } else {
        if (!formData.phone.trim()) { setError('请输入手机号'); setIsLoading(false); return; }
        if (!formData.password) { setError('请输入密码'); setIsLoading(false); return; }

        const result = await UserStore.login(formData.phone, formData.password);
        if (result.success) { navigate(from); } else { setError(result.message); }
      }
    } catch (err: any) {
      setError('系统错误: ' + err.message);
    }

    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          返回首页
        </button>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#1a6fc4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Droplets style={{ width: '32px', height: '32px', color: 'white' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
              {isRegister ? '注册账号' : '用户登录'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>福州蓝粮海洋生物科技有限公司</p>
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>姓名</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="请输入姓名" style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>手机号</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="请输入手机号" maxLength={11} style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>密码</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={isRegister ? '设置密码（至少6位）' : '请输入密码'} style={{ width: '100%', paddingLeft: '40px', paddingRight: '40px', paddingTop: '12px', paddingBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>确认密码</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                  <input type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="再次输入密码" style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', backgroundColor: '#1a6fc4', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '16px', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? '处理中...' : (isRegister ? '注册' : '登录')}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ color: '#1a6fc4', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
