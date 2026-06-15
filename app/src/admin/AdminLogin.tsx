import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Eye, EyeOff, Lock, User, ArrowLeft } from 'lucide-react';

import { UserStore } from '@/data/userStore';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const userResult = await UserStore.login(username, password);
    if (userResult.success && (userResult.user?.role === 'sysadmin' || userResult.user?.role === 'auditor')) {
      navigate('/admin');
    } else {
      setError(userResult.success ? '无权访问后台' : (userResult.message || '用户名或密码错误'));
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
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>管理后台登录</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>福州蓝粮海洋生物科技有限公司</p>
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>用户名/手机号</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>密码</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#9ca3af' }} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required style={{ width: '100%', paddingLeft: '40px', paddingRight: '40px', paddingTop: '12px', paddingBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                  {showPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', backgroundColor: '#1a6fc4', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '16px', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>系统管理者：sysadmin / sysadmin123</p>
            <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>管理员：admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
