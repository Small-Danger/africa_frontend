import React, { useState } from 'react';
import { posService } from '../../services/posApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Configurer le PIN caisse</h2>
        <p className="text-slate-600 text-sm mb-6">
          Ce PIN à 4 chiffres permet de déverrouiller rapidement la caisse après inactivité,
          sans ressaisir email et mot de passe.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe actuel</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PIN (4 chiffres)</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmer le PIN</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            {onSkip && (
              <Button type="button" variant="secondary" onClick={onSkip}>
                Plus tard
              </Button>
            )}
            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Enregistrer le PIN
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosSetPinModal;
