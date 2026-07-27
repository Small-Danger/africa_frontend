import React, { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { posService } from '../../services/posApi';
import Button from '../../components/ui/Button';

const PosUnlock = ({ onUnlock }) => {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('Entrez 4 chiffres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await posService.unlock(user.id, pin);
      setPin('');
      onUnlock();
    } catch (err) {
      setError(err.message || 'PIN incorrect');
      setPin('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Caisse verrouillée</h2>
        <p className="text-slate-600 text-sm mb-6">
          Bonjour {user?.name}, entrez votre PIN à 4 chiffres
        </p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={4}
            value={pin}
            onChange={(e) => handlePinInput(e.target.value)}
            className="w-full text-center text-3xl tracking-[0.5em] font-mono border-2 border-slate-200 rounded-xl py-3 mb-4 focus:border-emerald-500 focus:outline-none"
            autoFocus
            autoComplete="off"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <Button type="submit" variant="primary" fullWidth loading={loading} size="lg">
            Déverrouiller
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PosUnlock;
