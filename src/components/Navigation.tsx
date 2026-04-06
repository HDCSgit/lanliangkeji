import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Droplets } from 'lucide-react';
import { DataStore } from '@/data/store';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const siteConfig = DataStore.getSiteConfig();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isScrolled
                    ? 'bg-gradient-to-br from-ocean-blue to-ocean-cyan'
                    : 'bg-white/20 backdrop-blur-sm'
                }`}
              >
                <Droplets
                  className={`w-6 h-6 transition-colors ${
                    isScrolled ? 'text-white' : 'text-white'
                  }`}
                />
              </div>
              <div className="hidden sm:block">
                <h1
                  className={`font-bold text-lg leading-tight transition-colors ${
                    isScrolled ? 'text-ocean-deep' : 'text-white'
                  }`}
                >
                  {siteConfig.title.split('有限公司')[0]}
                </h1>
                <p
                  className={`text-xs transition-colors ${
                    isScrolled ? 'text-ocean-blue' : 'text-white/80'
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
                  className="relative"
                  onMouseEnter={() => item.children && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1 ${
                      isActive(item.path)
                        ? isScrolled
                          ? 'text-ocean-blue bg-ocean-blue/10'
                          : 'text-white bg-white/20'
                        : isScrolled
                        ? 'text-gray-700 hover:text-ocean-blue hover:bg-ocean-blue/5'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.name}
                    {item.children && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          activeDropdown === item.name ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </Link>

                  {/* Dropdown Menu */}
                  {item.children && activeDropdown === item.name && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-ocean-blue/5 hover:text-ocean-blue transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden lg:block">
              <Link
                to="/contact"
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isScrolled
                    ? 'bg-gradient-to-r from-ocean-blue to-ocean-cyan text-white hover:shadow-lg hover:shadow-ocean-blue/30'
                    : 'bg-white text-ocean-blue hover:bg-white/90'
                }`}
              >
                在线咨询
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isScrolled
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
