import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Image,
  Package,
  Newspaper,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Droplets,
  Home,
  ClipboardList,
  CreditCard,
  Shield,
  FileCheck,
  UserCog,
  Cloud,
} from 'lucide-react';
import { UserStore } from '@/data/userStore';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('管理员');
  const [userRole, setUserRole] = useState('admin');
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    // Check if user is logged in
    const hasAccess = UserStore.canAccessAdmin();
    if (!hasAccess) {
      navigate('/admin/login');
      return;
    }

    // Determine user info
    const user = UserStore.getCurrentUser();
    if (user) {
      setUserName(user.name || '管理员');
      setUserRole(user.role || 'admin');
    }

    // Generate menu based on role
    setMenuItems(getMenuItems());
  }, [navigate]);

  const getMenuItems = () => {
    const isSysAdmin = UserStore.isSysAdmin();
    const isLegacyAdmin = false;

    // 所有后台用户共享的基础菜单
    const baseMenu = [
      { name: '订单管理', path: '/admin/orders', icon: ClipboardList },
      { name: '转账审核', path: '/admin/audit', icon: FileCheck },
      { name: '支付配置', path: '/admin/payment', icon: CreditCard },
    ];

    // 系统管理者和旧版管理员才有的完整菜单
    const fullMenu = [
      { name: '仪表盘', path: '/admin', icon: LayoutDashboard },
      { name: '轮播图管理', path: '/admin/banners', icon: Image },
      { name: '产品管理', path: '/admin/products', icon: Package },
      ...baseMenu,
      { name: '审核员管理', path: '/admin/auditors', icon: UserCog },
      { name: '新闻管理', path: '/admin/news', icon: Newspaper },
      { name: '合作伙伴', path: '/admin/partners', icon: Users },
      { name: '存储配置', path: '/admin/storage', icon: Cloud },
      { name: '网站设置', path: '/admin/settings', icon: Settings },
    ];

    if (isSysAdmin || isLegacyAdmin) {
      return fullMenu;
    }

    // 审核员只有基础菜单
    return baseMenu;
  };

  const handleLogout = async () => {
    await UserStore.logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    // 避免 /admin/audit 同时匹配 /admin/auditors 等前缀冲突
    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const getRoleLabel = () => {
    if (userRole === 'sysadmin') return '系统管理者';
    if (userRole === 'auditor') return '审核员';
    return '管理员';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-ocean-deep transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-blue to-ocean-cyan flex items-center justify-center flex-shrink-0">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-white whitespace-nowrap">管理后台</h1>
                <p className="text-xs text-white/50 whitespace-nowrap">蓝粮海洋</p>
              </div>
            )}
          </Link>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? 'bg-ocean-blue text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all mb-2"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">访问网站</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">退出登录</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <Link to="/admin" className="hover:text-ocean-blue">
                管理后台
              </Link>
              {location.pathname !== '/admin' && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-ocean-deep">
                    {menuItems.find((item) => isActive(item.path))?.name || ''}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-ocean-blue/10 rounded-full">
              <Shield className="w-4 h-4 text-ocean-blue" />
              <span className="text-xs text-ocean-blue font-medium">{getRoleLabel()}</span>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-ocean-deep">{userName}</p>
              <p className="text-xs text-gray-500">{getRoleLabel()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-ocean-blue/10 flex items-center justify-center">
              <span className="text-ocean-blue font-bold">
                {userName?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
