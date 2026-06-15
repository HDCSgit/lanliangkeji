import AdminStorage from '@/admin/AdminStorage';import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { DataStore } from '@/data/store';
import { UserStore } from '@/data/userStore';
import { PaymentGateway } from '@/data/paymentGateway';

// Components
import ScrollToTop from '@/components/ScrollToTop';
import RequireAuth from '@/components/RequireAuth';

// Layouts
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// Pages
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import RDPage from '@/pages/RDPage';
import NewsPage from '@/pages/NewsPage';
import ContactPage from '@/pages/ContactPage';
import LoginPage from '@/pages/LoginPage';

// E-commerce Pages
import CheckoutPage from '@/pages/CheckoutPage';
import PaymentPage from '@/pages/PaymentPage';
import OrdersPage from '@/pages/OrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import BillsPage from '@/pages/BillsPage';

// Admin
import AdminLogin from '@/admin/AdminLogin';
import AdminLayout from '@/admin/AdminLayout';
import AdminDashboard from '@/admin/AdminDashboard';
import AdminBanners from '@/admin/AdminBanners';
import AdminProducts from '@/admin/AdminProducts';
import AdminOrders from '@/admin/AdminOrders';
import AdminAudit from '@/admin/AdminAudit';
import AdminAuditorMgmt from '@/admin/AdminAuditorMgmt';
import AdminPaymentConfig from '@/admin/AdminPaymentConfig';
import AdminNews from '@/admin/AdminNews';
import AdminPartners from '@/admin/AdminPartners';
import AdminSettings from '@/admin/AdminSettings';

// Main Layout Component
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

// Admin Protected Route
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (UserStore.canAccessAdmin()) return <>{children}</>;
  if (DataStore.isLoggedIn()) return <>{children}</>;
  return <Navigate to="/admin/login" replace />;
};

// 系统管理者专属路由
const SysAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (UserStore.isSysAdmin()) return <>{children}</>;
  if (DataStore.isLoggedIn()) return <>{children}</>;
  return <Navigate to="/admin" replace />;
};

function App() {
  useEffect(() => {
    DataStore.init();
    // 应用启动后预热收款账户缓存,确保进入对公转账页时秒开
    void PaymentGateway.prefetchReceivableAccount();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
        <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
        <Route path="/products" element={<MainLayout><ProductsPage /></MainLayout>} />
        <Route path="/product/:productId" element={<MainLayout><ProductDetailPage /></MainLayout>} />
        <Route path="/rd" element={<MainLayout><RDPage /></MainLayout>} />
        <Route path="/news" element={<MainLayout><NewsPage /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected E-commerce Routes */}
        <Route path="/checkout" element={<RequireAuth><MainLayout><CheckoutPage /></MainLayout></RequireAuth>} />
        <Route path="/payment/:orderId" element={<RequireAuth><MainLayout><PaymentPage /></MainLayout></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><MainLayout><OrdersPage /></MainLayout></RequireAuth>} />
        <Route path="/order/:orderId" element={<RequireAuth><MainLayout><OrderDetailPage /></MainLayout></RequireAuth>} />
        <Route path="/bills" element={<RequireAuth><MainLayout><BillsPage /></MainLayout></RequireAuth>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="payment" element={<AdminPaymentConfig />} />
          <Route path="auditors" element={<SysAdminRoute><AdminAuditorMgmt /></SysAdminRoute>} />
          <Route path="news" element={<AdminNews />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="storage" element={<AdminStorage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
