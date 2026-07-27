import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { posService } from '../services/posApi';
import PosUnlock from '../pages/pos/PosUnlock';
import PosSetPinModal from '../pages/pos/PosSetPinModal';

const PosLockContext = createContext(null);

const INACTIVITY_MS = 5 * 60 * 1000;

export const usePosLock = () => {
  const ctx = useContext(PosLockContext);
  if (!ctx) throw new Error('usePosLock must be used within PosLockProvider');
  return ctx;
};

export const PosLockProvider = ({ children }) => {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(null);
  const [showSetPin, setShowSetPin] = useState(false);
  const timerRef = useRef(null);

  const refreshPinStatus = useCallback(async () => {
    try {
      const res = await posService.getPinStatus();
      setHasPin(res.data?.has_pin ?? false);
      if (!res.data?.has_pin) {
        setShowSetPin(true);
        setIsLocked(false);
      }
    } catch {
      setHasPin(false);
    }
  }, []);

  useEffect(() => {
    if (user) refreshPinStatus();
  }, [user, refreshPinStatus]);

  const resetTimer = useCallback(() => {
    if (!hasPin || isLocked) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsLocked(true), INACTIVITY_MS);
  }, [hasPin, isLocked]);

  useEffect(() => {
    if (!hasPin) return undefined;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasPin, resetTimer]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetTimer();
  }, [resetTimer]);

  const lockNow = useCallback(() => {
    if (hasPin) setIsLocked(true);
  }, [hasPin]);

  const onPinSet = useCallback(() => {
    setHasPin(true);
    setShowSetPin(false);
    resetTimer();
  }, [resetTimer]);

  return (
    <PosLockContext.Provider value={{ isLocked, hasPin, unlock, lockNow, refreshPinStatus }}>
      {children}
      {hasPin && isLocked && <PosUnlock onUnlock={unlock} />}
      {showSetPin && !hasPin && (
        <PosSetPinModal
          onSuccess={onPinSet}
          onSkip={() => setShowSetPin(false)}
        />
      )}
    </PosLockContext.Provider>
  );
};

export default PosLockContext;
