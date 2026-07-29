import { useState } from 'react';
import { posService } from '../../services/posApi';
import { PosAlert, PosButton } from '../../components/pos/posShared';
import { KeyRound } from 'lucide-react';

const PosSetPinModal = ({ onSuccess, onSkip, open = true }) => {
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4 || pinConfirm.length !== 4) {
      setError('Le PIN doit contenir 4 chiffres');
      return;
    }
    if (pin !== pinConfirm) {
      setError('Les PIN ne correspondent pas');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await posService.setPin(password, pin, pinConfirm);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100">
        <div className="w-12 h-12 rounded-xl bg-brand-green-light flex items-center justify-center mb-4">
          <KeyRound size={22} className="text-brand-green" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Configurer le PIN caisse</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Ce PIN à 4 chiffres permet de déverrouiller rapidement la caisse après inactivité,
          sans ressaisir email et mot de passe.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe actuel</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none text-sm bg-brand-cream/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">PIN (4 chiffres)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none text-sm text-center font-mono tracking-widest bg-brand-cream/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmer</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none text-sm text-center font-mono tracking-widest bg-brand-cream/40"
              />
            </div>
          </div>
          {error && <PosAlert type="error">{error}</PosAlert>}
          <div className="flex gap-2 pt-2">
            {onSkip && (
              <PosButton type="button" variant="secondary" onClick={onSkip} className="flex-1">
                Plus tard
              </PosButton>
            )}
            <PosButton type="submit" variant="primary" loading={loading} className="flex-1">
              Enregistrer
            </PosButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosSetPinModal;
