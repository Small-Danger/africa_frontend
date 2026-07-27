import React, { useEffect, useState } from 'react';
import { posService } from '../../services/posApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
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
        <LoadingSpinner size="lg" text="Vérification session..." />
      </div>
    );
  }

  if (session) {
    return children;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ouverture de caisse</h1>
        <p className="text-slate-600 mb-6">
          Déclarez le fond de caisse initial avant de commencer les ventes.
        </p>
        <form onSubmit={handleOpen} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fond de caisse (FCFA)
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="0"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Ouvrir la caisse
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PosCashSessionGate;
