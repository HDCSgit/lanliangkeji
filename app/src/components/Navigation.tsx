import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Droplets, ShoppingCart, User, LogOut } from 'lucide-react';
import { DataStore, defaultSiteConfig } from '@/data/store';
import type { SiteConfig } from '@/types';
import { CartStore } from '@/data/ecommerceStore';
import { UserStore } from '@/data/userStore';
import CartDrawer from '@/components/cart/CartDrawer';

interface Ripple {
  x: number;
  y: number;
  id: number;
  size: number;
}

/** 涟漪按钮：点击时从触点扩散波纹 */
const RippleButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }> = ({
  children,
  className = '',
  onClick,
  ...props
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = ref.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      setRipples((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          size,
        },
      ]);
      setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 600);
    }
    onClick?.(e);
  };

  return (
    <button ref={ref} className={`relative overflow-hidden ${className}`} onClick={handleClick} {...props}>
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-current opacity-25 animate-ripple"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
        />
      ))}
    </button>
  );
};

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const lastScrollY = useRef(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(defaultSiteConfig);

  const isHome = location.pathname === '/';
  const showSolidNav = !isHome || isScrolled;

  useEffect(() => {
    const loadConfig = async () => {
      const config = await DataStore.getSiteConfig();
      setSiteConfig(config);
    };
    loadConfig();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection('up');
      }
      lastScrollY.current = currentScrollY;
      setIsScrolled(currentScrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Check login status
  useEffect(() => {
    const checkLogin = () => {
      const loggedIn = UserStore.isLoggedIn();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const user = UserStore.getCurrentUser();
        setUserName(user?.name || '用户');
      }
    };
    checkLogin();
    const interval = setInterval(checkLogin, 2000);
    return () => clearInterval(interval);
  }, []);

  // Cart count
  useEffect(() => {
    const refreshCartCount = async () => {
      setCartCount(await CartStore.getCount());
    };
    refreshCartCount();
    const interval = setInterval(refreshCartCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: '首页', path: '/' },
    {
      name: '关于我们',
      path: '/about',
      children: [
        { name: '公司简介', path: '/about#company' },
        { name: '企业文化', path: '/about#culture' },
        { name: '发展历程', path: '/about#history' },
        { name: '资质荣誉', path: '/about#honors' },
      ],
    },
    { name: '产品中心', path: '/products' },
    { name: '研发实力', path: '/rd' },
    { name: '新闻资讯', path: '/news' },
    { name: '联系我们', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await UserStore.logout();
    setIsLoggedIn(false);
    setIsUserMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          showSolidNav
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-3 nav-ocean-border'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-ocean-blue rounded-xl flex items-center justify-center flex-shrink-0">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 sm:opacity-100 sm:max-w-[200px] sm:translate-x-0 ${
                  scrollDirection === 'down' && isScrolled
                    ? 'max-w-0 max-h-0 opacity-0 -translate-x-2'
                    : 'max-w-[200px] max-h-20 opacity-100 translate-x-0'
                }`}
              >
                <h1 className={`font-bold text-lg leading-tight ${showSolidNav ? 'text-ocean-deep' : 'text-white'}`}>
                  {siteConfig.title.split('有限公司')[0]}
                </h1>
                <p className={`text-xs ${showSolidNav ? 'text-gray-500' : 'text-white/70'}`}>
                  海洋生物科技
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.children && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-1 font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-ocean-cyan'
                        : showSolidNav
                        ? 'text-gray-700 hover:text-ocean-blue'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {item.name}
                    {item.children && <ChevronDown className="w-4 h-4" />}
                  </Link>

                  {/* Dropdown */}
                  {item.children && activeDropdown === item.name && (
                    <div className="absolute top-full left-0 pt-2 animate-fade-in">
                      <div className="w-48 bg-white rounded-xl shadow-card py-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.path}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-ocean-blue/5 hover:text-ocean-blue"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <RippleButton
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 rounded-lg transition-colors ${
                  showSolidNav
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-ocean-cyan text-white text-xs rounded-full flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </RippleButton>

              {/* User */}
              {isLoggedIn ? (
                <div className="relative">
                  <RippleButton
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      showSolidNav
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium">{userName}</span>
                  </RippleButton>

                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-card py-2 animate-fade-in">
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-ocean-blue/5 hover:text-ocean-blue"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        我的订单
                      </Link>
                      {UserStore.canAccessAdmin() && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-ocean-blue/5 hover:text-ocean-blue"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          管理后台
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    showSolidNav
                      ? 'bg-ocean-blue text-white hover:bg-ocean-deep'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <User className="w-4 h-4" />
                  登录
                </Link>
              )}

              {/* Mobile Menu Button */}
              <RippleButton
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  showSolidNav
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </RippleButton>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <div key={item.name}>
                  <Link
                    to={item.path}
                    className={`block py-2 font-medium ${
                      isActive(item.path) ? 'text-ocean-blue' : 'text-gray-700'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.children && (
                    <div className="pl-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.path}
                          className="block py-1 text-sm text-gray-500 hover:text-ocean-blue"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="block w-full text-center py-2 mt-4 bg-ocean-blue text-white rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  登录 / 注册
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navigation;
