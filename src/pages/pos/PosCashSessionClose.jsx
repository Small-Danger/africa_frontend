import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posService } from '../../services/posApi';
import { CONTACT_CONFIG } from '../../config/contact';
import {
  formatPosMoney,
  PosAlert,
  PosButton,
  PosLoadingScreen,
} from '../../components/pos/posShared';
import { CheckCircle2, CircleX } from 'lucide-react';

const PosCashSessionClose = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closingAmount, setClosingAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    posService
      .getCurrentSession()
      .then((res) => {
        setSession(res.data);
        if (!res.data) {
          navigate('/pos');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleClose = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await posService.closeSession(parseFloat(closingAmount) || 0, notes);
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PosLoadingScreen message="Chargement de la session…" />;
  }

  if (result) {
    const discrepancy = Number(result.discrepancy);
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-md">
          <div className="flex justify-center mb-4">
            <img src="/logo-header.png" alt={CONTACT_CONFIG.COMPANY.name} className="h-9 opacity-90" />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-brand-green-light flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-brand-green" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Caisse fermée</h1>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <dt className="text-gray-500">Fond initial</dt>
              <dd className="font-semibold">{formatPosMoney(result.opening_amount)}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <dt className="text-gray-500">Espèces attendues</dt>
              <dd className="font-semibold">{formatPosMoney(result.closing_amount_expected)}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <dt className="text-gray-500">Espèces comptées</dt>
              <dd className="font-semibold">{formatPosMoney(result.closing_amount_counted)}</dd>
            </div>
            <div
              className={`flex justify-between text-lg font-bold pt-2 ${
                discrepancy === 0 ? 'text-brand-green' : discrepancy > 0 ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              <dt>Écart</dt>
              <dd>
                {discrepancy >= 0 ? '+' : ''}
                {formatPosMoney(result.discrepancy)}
              </dd>
            </div>
          </dl>
          <PosButton variant="primary" className="w-full mt-6" onClick={() => navigate('/pos')}>
            Retour à l&apos;ouverture
          </PosButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-brand-orange-light flex items-center justify-center mx-auto mb-4">
          <CircleX size={28} className="text-brand-orange" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Fermeture de caisse</h1>
        <p className="text-gray-500 text-center mb-6 text-sm">
          Comptez les espèces en caisse et saisissez le montant réel.
        </p>
        {session && (
          <p className="text-xs text-gray-400 text-center mb-5 bg-brand-cream rounded-xl px-3 py-2">
            Ouverte le {new Date(session.opened_at).toLocaleString('fr-FR')} · fond{' '}
            {formatPosMoney(session.opening_amount)}
          </p>
        )}
        <form onSubmit={handleClose} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Montant compté (FCFA)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={closingAmount}
              onChange={(e) => setClosingAmount(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 text-xl font-bold text-center rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none bg-brand-cream/40"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none text-sm bg-brand-cream/40"
            />
          </div>
          {error && <PosAlert type="error">{error}</PosAlert>}
          <div className="flex gap-2 pt-2">
            <PosButton type="button" variant="secondary" onClick={() => navigate('/pos')} className="flex-1">
              Annuler
            </PosButton>
            <PosButton type="submit" variant="dark" loading={submitting} className="flex-1">
              Fermer
            </PosButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosCashSessionClose;
