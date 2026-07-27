import React, { useEffect, useState } from 'react';
import { posService } from '../../services/posApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const formatMoney = (n) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F CFA';

const PosCashMovement = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [type, setType] = useState('sortie');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const loadMovements = async () => {
    setLoading(true);
    try {
      const res = await posService.getCashMovements();
      setMovements(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await posService.createCashMovement(type, parseFloat(amount), reason.trim());
      setAmount('');
      setReason('');
      setSuccess('Mouvement enregistré');
      await loadMovements();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Mouvements de caisse</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="entree"
              checked={type === 'entree'}
              onChange={() => setType('entree')}
            />
            <span className="text-emerald-700 font-medium">Entrée (+)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="sortie"
              checked={type === 'sortie'}
              onChange={() => setType('sortie')}
            />
            <span className="text-red-700 font-medium">Sortie (−)</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Montant (FCFA)</label>
          <Input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Motif *</label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: appoint retiré pour la banque"
            required
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-emerald-600 text-sm">{success}</p>}
        <Button type="submit" variant="primary" loading={submitting}>
          Enregistrer le mouvement
        </Button>
      </form>

      <h2 className="font-semibold mb-3">Mouvements de la session</h2>
      {loading ? (
        <LoadingSpinner size="md" />
      ) : movements.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucun mouvement enregistré.</p>
      ) : (
        <ul className="space-y-2">
          {movements.map((m) => (
            <li
              key={m.id}
              className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex justify-between items-center"
            >
              <div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    m.type === 'entree' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {m.type === 'entree' ? 'Entrée' : 'Sortie'}
                </span>
                <p className="text-sm mt-1">{m.reason}</p>
                <p className="text-xs text-slate-500">
                  {new Date(m.created_at).toLocaleString('fr-FR')}
                  {m.created_by?.name ? ` — ${m.created_by.name}` : ''}
                </p>
              </div>
              <span
                className={`font-bold ${
                  m.type === 'entree' ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {m.type === 'entree' ? '+' : '−'}
                {formatMoney(m.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PosCashMovement;
