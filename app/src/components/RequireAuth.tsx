import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserStore } from '@/data/userStore';

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = UserStore.isLoggedIn();

  if (!isLoggedIn) {
    // 保存当前路径，登录后跳转回来
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
