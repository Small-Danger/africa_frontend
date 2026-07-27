import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PosLockProvider, usePosLock } from '../../contexts/PosLockContext';
import PosSetPinModal from './PosSetPinModal';

const PosLayoutInner = () => {
  const { user, logout } = useAuth();
  const { lockNow, refreshPinStatus } = usePosLock();
  const navigate = useNavigate();
  const [showSetPin, setShowSetPin] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const navClass = ({ isActive }) =>
    `text-sm px-3 py-1.5 rounded-lg transition-colors ${
      isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'
    }`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg font-bold tracking-tight">AfrikRaga — Caisse</span>
          {user && (
            <span className="text-sm text-slate-300 hidden sm:inline">
              {user.name} ({user.role})
            </span>
          )}
          <nav className="flex gap-1 ml-0 sm:ml-4">
            <NavLink to="/pos" end className={navClass}>
              Vente
            </NavLink>
            <NavLink to="/pos/history" className={navClass}>
              Historique
            </NavLink>
            <NavLink to="/pos/movements" className={navClass}>
              Mouvements
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSetPin(true)}
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            PIN
          </button>
          <button
            type="button"
            onClick={lockNow}
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Verrouiller
          </button>
          <Link
            to="/pos/close"
            className="text-sm px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 transition-colors"
          >
            Fermer caisse
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Déconnexion
          </button>
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
