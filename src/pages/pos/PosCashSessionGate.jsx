import React, { useEffect, useState } from 'react';
import { BanknotesIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { posService } from '../../services/posApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PosCashSessionGate = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [openingAmount, setOpeningAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    posService
      .getCurrentSession()
      .then((res) => setSession(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const handleOpen = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await posService.openSession(parseFloat(openingAmount) || 0);
      setSession(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (session === undefined && !error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Ouverture de la caisse..." />
      </div>
    );
  }

  if (session) {
    return children;
  }

  return (
    <div className="min-h-[calc(100vh-68px)] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 lg:p-10 w-full max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <BanknotesIcon className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Bonjour !</h1>
        <p className="text-slate-600 text-center mb-8 text-sm leading-relaxed">
          Comptez l&apos;argent dans votre tiroir-caisse et entrez le montant pour commencer la journée.
        </p>
        <form onSubmit={handleOpen} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fond de caisse (FCFA)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="Ex: 50000"
              required
              autoFocus
              className="w-full px-4 py-4 text-2xl font-bold text-center rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none"
            />
            <p className="text-xs text-slate-400 mt-2 text-center">Mettez 0 si le tiroir est vide</p>
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-60"
          >
            {loading ? (
              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <SparklesIcon className="h-6 w-6" />
                Ouvrir la caisse
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PosCashSessionGate;
