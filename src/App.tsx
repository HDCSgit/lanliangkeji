import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataStore } from '@/data/store';

// Layouts
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// Pages
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ProductsPage from '@/pages/ProductsPage';
import RDPage from '@/pages/RDPage';
import NewsPage from '@/pages/NewsPage';
import ContactPage from '@/pages/ContactPage';

// Admin
import AdminLogin from '@/admin/AdminLogin';
import AdminLayout from '@/admin/AdminLayout';
import AdminDashboard from '@/admin/AdminDashboard';
import AdminBanners from '@/admin/AdminBanners';
import AdminProducts from '@/admin/AdminProducts';
import AdminNews from '@/admin/AdminNews';
import AdminPartners from '@/admin/AdminPartners';
import AdminSettings from '@/admin/AdminSettings';

// Initialize DataStore
DataStore.init();

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

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = DataStore.isLoggedIn();
  return isLoggedIn ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />
        <Route
          path="/about"
          element={
            <MainLayout>
              <AboutPage />
            </MainLayout>
          }
        />
        <Route
          path="/products"
          element={
            <MainLayout>
              <ProductsPage />
            </MainLayout>
          }
        />
        <Route
          path="/rd"
          element={
            <MainLayout>
              <RDPage />
            </MainLayout>
          }
        />
        <Route
          path="/news"
          element={
            <MainLayout>
              <NewsPage />
            </MainLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <MainLayout>
              <ContactPage />
            </MainLayout>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
