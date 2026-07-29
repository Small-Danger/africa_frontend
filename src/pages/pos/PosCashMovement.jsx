import { useEffect, useState } from 'react';
import { posService } from '../../services/posApi';
import {
  formatPosMoney,
  PosAlert,
  PosButton,
  PosEmptyState,
  PosLoadingScreen,
  PosPageHeader,
  PosPanel,
} from '../../components/pos/posShared';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';

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
      setSuccess('Mouvement enregistré avec succès');
      await loadMovements();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto pb-8">
      <PosPageHeader
        title="Mouvements de caisse"
        description="Entrées et sorties d'espèces hors ventes"
        action={
          <PosButton variant="ghost" size="sm" onClick={loadMovements}>
            <RefreshCw size={14} />
            Actualiser
          </PosButton>
        }
      />

      <PosPanel title="Nouveau mouvement" className="mb-6">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('entree')}
              className={`py-4 rounded-xl border-2 font-semibold text-sm flex flex-col items-center gap-1.5 transition-all ${
                type === 'entree'
                  ? 'border-brand-green bg-brand-green-light text-brand-green-dark'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <ArrowDownCircle size={22} />
              Entrée
            </button>
            <button
              type="button"
              onClick={() => setType('sortie')}
              className={`py-4 rounded-xl border-2 font-semibold text-sm flex flex-col items-center gap-1.5 transition-all ${
                type === 'sortie'
                  ? 'border-red-400 bg-red-50 text-red-800'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <ArrowUpCircle size={22} />
              Sortie
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Montant (FCFA)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none text-lg font-bold bg-brand-cream/40"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Motif *</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: appoint pour la banque"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none text-sm bg-brand-cream/40"
            />
          </div>
          {error && <PosAlert type="error">{error}</PosAlert>}
          {success && <PosAlert type="success">{success}</PosAlert>}
          <PosButton type="submit" variant="primary" loading={submitting} className="w-full">
            Enregistrer
          </PosButton>
        </form>
      </PosPanel>

      <h2 className="font-bold text-gray-900 mb-3 text-sm">Mouvements de la session</h2>
      {loading ? (
        <PosLoadingScreen message="Chargement…" />
      ) : movements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100">
          <PosEmptyState title="Aucun mouvement" description="Les entrées et sorties apparaîtront ici." />
        </div>
      ) : (
        <ul className="space-y-2">
          {movements.map((m) => (
            <li
              key={m.id}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex justify-between items-center shadow-sm"
            >
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    m.type === 'entree' ? 'bg-brand-green-light text-brand-green-dark' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {m.type === 'entree' ? 'Entrée' : 'Sortie'}
                </span>
                <p className="text-sm font-medium text-gray-900 mt-1.5">{m.reason}</p>
                <p className="text-[11px] text-gray-500">
                  {new Date(m.created_at).toLocaleString('fr-FR')}
                  {m.created_by?.name ? ` · ${m.created_by.name}` : ''}
                </p>
              </div>
              <span className={`font-bold text-base ${m.type === 'entree' ? 'text-brand-green' : 'text-red-600'}`}>
                {m.type === 'entree' ? '+' : '−'}
                {formatPosMoney(m.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PosCashMovement;
