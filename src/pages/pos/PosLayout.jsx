import React, { useState } from 'react';

import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import {

  ShoppingCartIcon,

  ClockIcon,

  ArrowsRightLeftIcon,

  LockClosedIcon,

  KeyIcon,

  ArrowRightOnRectangleIcon,

  XCircleIcon,

} from '@heroicons/react/24/outline';

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



  const navItems = [

    { to: '/pos', end: true, label: 'Vente', icon: ShoppingCartIcon },

    { to: '/pos/history', label: 'Historique', icon: ClockIcon },

    { to: '/pos/movements', label: 'Mouvements', icon: ArrowsRightLeftIcon },

  ];



  const navClass = ({ isActive }) =>

    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${

      isActive

        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'

        : 'text-slate-300 hover:bg-white/10 hover:text-white'

    }`;



  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/30 flex flex-col">

      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 lg:px-6 py-3 shrink-0 shadow-xl border-b border-white/5">

        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-4">

            <div className="flex items-center gap-3">

              <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">

                <ShoppingCartIcon className="h-5 w-5 text-white" />

              </div>

              <div>

                <p className="text-base font-bold tracking-tight leading-tight">AfrikRaga Caisse</p>

                {user && (

                  <p className="text-xs text-slate-400">{user.name}</p>

                )}

              </div>

            </div>



            <nav className="hidden md:flex items-center gap-1 ml-2 p-1 bg-white/5 rounded-2xl">

              {navItems.map(({ to, end, label, icon: Icon }) => (

                <NavLink key={to} to={to} end={end} className={navClass}>

                  <Icon className="h-4 w-4" />

                  {label}

                </NavLink>

              ))}

            </nav>

          </div>



          <div className="flex items-center gap-2 flex-wrap">

            <nav className="flex md:hidden items-center gap-1 w-full order-last md:order-none p-1 bg-white/5 rounded-2xl">
              {navItems.map(({ to, end, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={end} className={navClass}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-xs">{label}</span>
                </NavLink>
              ))}
            </nav>



            <button

              type="button"

              onClick={() => setShowSetPin(true)}

              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"

              title="Configurer le PIN"

            >

              <KeyIcon className="h-4 w-4" />

              <span className="hidden sm:inline">PIN</span>

            </button>

            <button

              type="button"

              onClick={lockNow}

              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"

            >

              <LockClosedIcon className="h-4 w-4" />

              <span className="hidden sm:inline">Verrouiller</span>

            </button>

            <Link

              to="/pos/close"

              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-medium shadow-lg shadow-amber-500/25 transition-colors"

            >

              <XCircleIcon className="h-4 w-4" />

              <span className="hidden sm:inline">Fermer caisse</span>

            </Link>

            <button

              type="button"

              onClick={handleLogout}

              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/80 transition-colors"

            >

              <ArrowRightOnRectangleIcon className="h-4 w-4" />

              <span className="hidden sm:inline">Quitter</span>

            </button>

          </div>

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

