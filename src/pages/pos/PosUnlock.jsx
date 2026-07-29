import { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { posService } from '../../services/posApi';
import { CONTACT_CONFIG } from '../../config/contact';
import { PosAlert, PosButton } from '../../components/pos/posShared';
import { Lock } from 'lucide-react';

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
    setPin(value.replace(/\D/g, '').slice(0, 4));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-brand-green-dark/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center border border-gray-100">
        <img
          src="/logo-principale.png"
          alt={CONTACT_CONFIG.COMPANY.name}
          className="h-10 mx-auto mb-5 object-contain"
        />
        <div className="w-14 h-14 bg-brand-green-light rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={26} className="text-brand-green" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Caisse verrouillée</h2>
        <p className="text-gray-500 text-sm mb-6">
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
            className="w-full text-center text-3xl tracking-[0.5em] font-mono border-2 border-gray-200 rounded-2xl py-3.5 mb-4 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none bg-brand-cream/40"
            autoFocus
            autoComplete="off"
          />
          {error && <div className="mb-3"><PosAlert type="error">{error}</PosAlert></div>}
          <PosButton type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Déverrouiller
          </PosButton>
        </form>
      </div>
    </div>
  );
};

export default PosUnlock;
