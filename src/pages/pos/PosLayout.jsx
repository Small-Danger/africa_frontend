import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Clock,
  ArrowLeftRight,
  Lock,
  KeyRound,
  LogOut,
  CircleX,
  Circle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PosLockProvider, usePosLock } from '../../contexts/PosLockContext';
import { posService } from '../../services/posApi';
import { CONTACT_CONFIG } from '../../config/contact';
import PosSetPinModal from './PosSetPinModal';
import { formatPosMoney } from '../../components/pos/posShared';

const PosLayoutInner = () => {
  const { user, logout } = useAuth();
  const { lockNow, refreshPinStatus } = usePosLock();
  const navigate = useNavigate();
  const [showSetPin, setShowSetPin] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    posService
      .getCurrentSession()
      .then((res) => setSession(res.data))
      .catch(() => setSession(null));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const navItems = [
    { to: '/pos', end: true, label: 'Vente', icon: ShoppingCart },
    { to: '/pos/history', label: 'Historique', icon: Clock },
    { to: '/pos/movements', label: 'Mouvements', icon: ArrowLeftRight },
  ];

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25'
        : 'text-white/75 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <header className="bg-gradient-to-r from-brand-green-dark via-brand-green to-brand-green-dark text-white shrink-0 shadow-lg border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-3 lg:px-5 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/pos"
                className="flex-shrink-0 rounded-xl bg-white px-2.5 py-1.5 shadow-md hover:shadow-lg transition-shadow"
              >
                <img
                  src="/logo-principale.png"
                  alt={CONTACT_CONFIG.COMPANY.name}
                  className="h-8 w-auto max-w-[6.5rem] object-contain"
                />
              </Link>

              <div className="hidden sm:block min-w-0 border-l border-white/15 pl-3">
                <p className="text-sm font-bold leading-tight truncate">Caisse boutique</p>
                {user && <p className="text-[11px] text-white/60 truncate">{user.name}</p>}
              </div>

              <nav className="hidden lg:flex items-center gap-1 ml-1 p-1 bg-black/15 rounded-2xl">
                {navItems.map(({ to, end, label, icon: Icon }) => (
                  <NavLink key={to} to={to} end={end} className={navClass}>
                    <Icon size={16} />
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {session && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-[11px]">
                  <Circle size={8} className="text-emerald-300 fill-emerald-300 animate-pulse" />
                  <span className="text-white/80">
                    Session · fond {formatPosMoney(session.opening_amount)}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowSetPin(true)}
                className="flex items-center gap-1.5 text-sm px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
                title="Configurer le PIN"
              >
                <KeyRound size={16} />
                <span className="hidden sm:inline text-xs font-semibold">PIN</span>
              </button>
              <button
                type="button"
                onClick={lockNow}
                className="flex items-center gap-1.5 text-sm px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
              >
                <Lock size={16} />
                <span className="hidden sm:inline text-xs font-semibold">Verrouiller</span>
              </button>
              <Link
                to="/pos/close"
                className="flex items-center gap-1.5 text-sm px-2.5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark font-semibold shadow-md shadow-brand-orange/30 transition-colors"
              >
                <CircleX size={16} />
                <span className="hidden sm:inline text-xs">Fermer</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm px-2.5 py-2 rounded-xl bg-white/10 hover:bg-red-500/80 transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline text-xs font-semibold">Quitter</span>
              </button>
            </div>
          </div>

          <nav className="flex lg:hidden items-center gap-1 mt-2 p-1 bg-black/15 rounded-2xl overflow-x-auto scrollbar-hide">
            {navItems.map(({ to, end, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className={`${navClass} flex-1 justify-center min-w-[5rem]`}>
                <Icon size={15} />
                <span className="text-xs">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {showSetPin && (
        <PosSetPinModal
          open
          onSuccess={() => {
            refreshPinStatus();
            setShowSetPin(false);
          }}
          onSkip={() => setShowSetPin(false)}
        />
      )}
    </div>
  );
};

const PosLayout = () => (
  <PosLockProvider>
    <PosLayoutInner />
  </PosLockProvider>
);

export default PosLayout;
