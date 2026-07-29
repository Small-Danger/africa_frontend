import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Sparkles } from 'lucide-react';
import { posService } from '../../services/posApi';
import { CONTACT_CONFIG } from '../../config/contact';
import { PosAlert, PosButton, PosLoadingScreen } from '../../components/pos/posShared';

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
    return <PosLoadingScreen message="Vérification de la caisse…" />;
  }

  if (session) {
    return children;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="/logo-principale.png"
            alt={CONTACT_CONFIG.COMPANY.name}
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="h-14 w-14 rounded-2xl bg-brand-green-light flex items-center justify-center mx-auto mb-5">
          <Banknote className="h-7 w-7 text-brand-green" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Ouverture de caisse</h1>
        <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
          Comptez l&apos;argent dans le tiroir-caisse et saisissez le fond de caisse pour démarrer.
        </p>
        <form onSubmit={handleOpen} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fond de caisse (FCFA)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="Ex: 50000"
              required
              autoFocus
              className="w-full px-4 py-4 text-2xl font-bold text-center rounded-2xl border-2 border-gray-200 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none bg-brand-cream/40"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">Mettez 0 si le tiroir est vide</p>
          </div>
          {error && <PosAlert type="error">{error}</PosAlert>}
          <PosButton type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            {!loading && <Sparkles size={18} />}
            Ouvrir la caisse
          </PosButton>
          <p className="text-center">
            <Link to="/pos/close" className="text-xs text-gray-400 hover:text-brand-green font-medium">
              Fermer une session précédente ?
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default PosCashSessionGate;
