import { useState, useMemo } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Image,
  Monitor,
  Menu,
  X,
  LogOut,
  Store,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CONTACT_CONFIG } from '../../config/contact';

const NAV_GROUPS = [
  {
    label: 'Vue d\'ensemble',
    items: [{ name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Catalogue',
    items: [
      { name: 'Produits', href: '/admin/products', icon: Package },
      { name: 'Catégories', href: '/admin/categories', icon: FolderTree },
    ],
  },
  {
    label: 'Ventes',
    items: [
      { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Clients', href: '/admin/customers', icon: Users },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { name: 'Bannières', href: '/admin/banners', icon: Image },
      { name: 'Personnel caisse', href: '/admin/cashiers', icon: Monitor },
    ],
  },
];

const PAGE_TITLES = {
  '/admin': 'Tableau de bord',
  '/admin/products': 'Produits',
  '/admin/categories': 'Catégories',
  '/admin/orders': 'Commandes',
  '/admin/customers': 'Clients',
  '/admin/banners': 'Bannières',
  '/admin/cashiers': 'Personnel caisse',
};

const navLinkClass = ({ isActive }) =>
  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
    isActive
      ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
      : 'text-gray-600 hover:text-gray-900 hover:bg-brand-cream'
  }`;

const SidebarContent = ({ user, onNavigate, onLogout }) => {
  const initials = (user?.name || 'A')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-100">
        <Link to="/admin" onClick={onNavigate} className="flex items-center gap-3 min-w-0">
          <img
            src="/logo-principale.png"
            alt={CONTACT_CONFIG.COMPANY.name}
            className="h-9 w-auto max-w-[7rem] object-contain"
          />
        </Link>
      </div>

      <div className="px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">
          Administration
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  className={navLinkClass}
                  onClick={onNavigate}
                >
                  <item.icon
                    size={18}
                    className="flex-shrink-0 opacity-90"
                  />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-2 bg-brand-cream/50">
        <div className="flex gap-2">
          <Link
            to="/"
            onClick={onNavigate}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-green bg-white border border-brand-green/20 hover:bg-brand-green-light transition-colors"
          >
            <Store size={14} />
            Boutique
          </Link>
          <Link
            to="/pos"
            onClick={onNavigate}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-brand-green hover:bg-brand-green-dark transition-colors"
          >
            <Monitor size={14} />
            Caisse
          </Link>
        </div>

        <div className="rounded-xl bg-white border border-gray-100 p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </>
  );
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const pageTitle = useMemo(() => {
    const exact = PAGE_TITLES[location.pathname];
    if (exact) return exact;
    const match = Object.entries(PAGE_TITLES).find(
      ([path]) => path !== '/admin' && location.pathname.startsWith(path)
    );
    return match?.[1] || 'Administration';
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={closeSidebar}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 w-[min(100vw-3rem,17rem)] bg-white shadow-2xl flex flex-col">
            <button
              type="button"
              onClick={closeSidebar}
              className="absolute top-4 right-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100"
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
            <SidebarContent user={user} onNavigate={closeSidebar} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-100 shadow-sm">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* Main */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-brand-cream"
                onClick={() => setSidebarOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu size={22} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span>AfrikRaga</span>
                  <ChevronRight size={12} />
                  <span className="text-brand-green font-medium">Admin</span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{pageTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-brand-cream hover:text-brand-green transition-colors"
                title="Actualiser la page"
              >
                <RefreshCw size={18} />
              </button>
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-brand-green border border-brand-green/20 hover:bg-brand-green-light transition-colors"
              >
                <Store size={16} />
                Voir la boutique
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
