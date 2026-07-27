import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posService } from '../../services/posApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const formatMoney = (n) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F CFA';

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
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement..." />
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-md mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Caisse fermée</h1>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Fond initial</dt>
              <dd className="font-medium">{formatMoney(result.opening_amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Espèces attendues</dt>
              <dd className="font-medium">{formatMoney(result.closing_amount_expected)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Espèces comptées</dt>
              <dd className="font-medium">{formatMoney(result.closing_amount_counted)}</dd>
            </div>
            <div
              className={`flex justify-between text-lg font-bold pt-2 border-t ${
                Number(result.discrepancy) === 0
                  ? 'text-emerald-600'
                  : Number(result.discrepancy) > 0
                    ? 'text-blue-600'
                    : 'text-red-600'
              }`}
            >
              <dt>Écart</dt>
              <dd>
                {Number(result.discrepancy) >= 0 ? '+' : ''}
                {formatMoney(result.discrepancy)}
              </dd>
            </div>
          </dl>
          <Button
            className="mt-6"
            variant="primary"
            fullWidth
            onClick={() => navigate('/pos')}
          >
            Retour à l&apos;ouverture
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Fermeture de caisse</h1>
        <p className="text-slate-600 mb-6">
          Comptez les espèces en caisse et saisissez le montant réel.
        </p>
        {session && (
          <p className="text-sm text-slate-500 mb-4">
            Session ouverte le{' '}
            {new Date(session.opened_at).toLocaleString('fr-FR')} — fond initial{' '}
            {formatMoney(session.opening_amount)}
          </p>
        )}
        <form onSubmit={handleClose} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Montant compté en espèces (FCFA)
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={closingAmount}
              onChange={(e) => setClosingAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/pos')}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" fullWidth loading={submitting}>
              Fermer la caisse
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosCashSessionClose;
