import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Droplets } from 'lucide-react';
import { DataStore } from '@/data/store';

// 涟漪效果组件
const RippleButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  to: string;
  onClick?: () => void;
}> = ({ children, className, to, onClick }) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    onClick?.();
  };

  return (
    <Link
      ref={buttonRef}
      to={to}
      onClick={handleClick}
      className={`relative overflow-hidden inline-flex ${className}`}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </Link>
  );
};

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showMobileTitle, setShowMobileTitle] = useState(true);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const siteConfig = DataStore.getSiteConfig();
  
  // 判断是否在首页
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      
      // 手机端：上滑隐藏标题，下滑显示标题
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // 上滑 - 隐藏
        setShowMobileTitle(false);
      } else {
        // 下滑 - 显示
        setShowMobileTitle(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          !isHomePage || isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg py-3 border-b border-gradient-ocean'
            : 'bg-transparent py-5'
        }`}
        style={{
          borderImage: (!isHomePage || isScrolled) 
            ? 'linear-gradient(90deg, transparent, #165DFF, #00D4FF, #165DFF, transparent) 1' 
            : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-500 relative overflow-hidden ${
                  !isHomePage || isScrolled
                    ? 'bg-gradient-to-br from-ocean-blue via-ocean-blue to-ocean-cyan shadow-lg shadow-ocean-blue/30'
                    : 'bg-white/20 backdrop-blur-sm'
                }`}
              >
                <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10 transition-transform duration-500 group-hover:rotate-12" />
                <div className={`absolute inset-0 bg-gradient-to-br from-ocean-cyan to-ocean-blue opacity-0 transition-opacity duration-500 ${!isHomePage || isScrolled ? 'group-hover:opacity-100' : ''}`} />
              </div>
              <div className={`overflow-hidden transition-all duration-500 sm:opacity-100 sm:max-w-full sm:translate-x-0 ${showMobileTitle ? 'opacity-100 max-w-[200px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-4'}`}>
                <h1
                  className={`font-bold text-base sm:text-lg leading-tight transition-all duration-300 whitespace-nowrap ${
                    !isHomePage || isScrolled ? 'text-ocean-deep' : 'text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  {siteConfig.title.split('有限公司')[0]}
                </h1>
                <p
                  className={`text-[10px] sm:text-xs font-medium tracking-wider transition-all duration-300 whitespace-nowrap ${
                    !isHomePage || isScrolled ? 'text-ocean-blue' : 'text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  海洋生物科技
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div
                  key={item.path}
                  className="relative group"
                  onMouseEnter={() => item.children && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <RippleButton
                    to={item.path}
                    className={`nav-link px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                      isActive(item.path)
                        ? !isHomePage || isScrolled
                          ? 'text-ocean-blue nav-link-active'
                          : 'text-white bg-white/10'
                        : !isHomePage || isScrolled
                        ? 'text-gray-700 hover:text-ocean-blue'
                        : 'text-white/90 hover:text-white'
                    } ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <span className="relative z-10">{item.name}</span>
                    {item.children && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          !isHomePage || isScrolled ? 'text-gray-400' : 'text-white/60'
                        } ${activeDropdown === item.name ? 'rotate-180' : ''}`}
                      />
                    )}
                  </RippleButton>

                  {/* Dropdown Menu - 使用 group-hover 保持显示 */}
                  {item.children && (
                    <div 
                      className={`absolute top-full left-0 pt-2 ${activeDropdown === item.name ? 'block' : 'hidden group-hover:block'}`}
                      onMouseEnter={() => setActiveDropdown(item.name)}
                    >
                      <div className="w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100/50 overflow-hidden animate-scale-in">
                        {item.children.map((child, index) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-ocean-blue/5 hover:to-ocean-cyan/5 hover:text-ocean-blue transition-all duration-300 border-l-2 border-transparent hover:border-ocean-blue"
                            style={{ animationDelay: `${index * 50}ms` }}
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

            {/* CTA Button */}
            <div className="hidden lg:block">
              <RippleButton
                to="/contact"
                className={`group relative px-10 py-3 rounded-full text-base font-medium transition-all duration-500 overflow-hidden w-[160px] h-[44px] items-center justify-center ${
                  !isHomePage || isScrolled
                    ? 'bg-gradient-to-r from-ocean-blue via-ocean-blue to-ocean-cyan text-white hover:shadow-lg hover:shadow-ocean-blue/30 hover:scale-105'
                    : 'bg-white text-ocean-blue hover:bg-white/95 hover:shadow-lg hover:shadow-white/20 hover:scale-105'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                  在线咨询
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse flex-shrink-0" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-ocean-cyan to-ocean-blue opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </RippleButton>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                !isHomePage || isScrolled
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          isMobileMenuOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-2xl transition-transform duration-500 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6 pt-20">
            <div className="space-y-2">
              {navItems.map((item) => (
                <div key={item.path}>
                  <Link
                    to={item.path}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-ocean-blue bg-ocean-blue/10'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                  {item.children && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="block px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-ocean-blue transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <Link
                to="/contact"
                className="block w-full px-6 py-3 rounded-full text-center text-white font-medium bg-gradient-to-r from-ocean-blue to-ocean-cyan hover:shadow-lg transition-shadow"
              >
                在线咨询
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
