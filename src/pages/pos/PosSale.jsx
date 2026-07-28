import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserIcon,
  BanknotesIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  CheckCircleIcon,
  QrCodeIcon,
  PhoneIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { posService, PAYMENT_METHODS } from '../../services/posApi';
import PosReceipt from './PosReceipt';

const formatMoney = (n) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F CFA';

const PAYMENT_STYLES = {
  especes: { emoji: '💵', bg: 'bg-emerald-50 border-emerald-400 text-emerald-800' },
  carte: { emoji: '💳', bg: 'bg-blue-50 border-blue-400 text-blue-800' },
  orange_money: { emoji: '🟠', bg: 'bg-orange-50 border-orange-400 text-orange-800' },
  wave: { emoji: '🌊', bg: 'bg-violet-50 border-violet-400 text-violet-800' },
};

const PosSale = () => {
  const searchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState([]);
  const [clientPhone, setClientPhone] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearching, setClientSearching] = useState(false);
  const [clientStatus, setClientStatus] = useState('idle');
  const [clientStatusMessage, setClientStatusMessage] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [payments, setPayments] = useState([{ method: 'especes', amount: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastOrder, setLastOrder] = useState(null);

  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.quantity, 0), [cart]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((s, line) => s + line.unit_price * line.quantity, 0),
    [cart]
  );

  const discount = parseFloat(discountAmount) || 0;
  const totalDue = Math.max(0, subtotal - discount);

  const paymentsTotal = useMemo(
    () => payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
    [payments]
  );

  const remaining = Math.round((totalDue - paymentsTotal) * 100) / 100;
  const canSubmit = cart.length > 0 && remaining === 0 && totalDue >= 0 && !submitting;

  useEffect(() => {
    setPayments((prev) => {
      if (prev.length !== 1) return prev;
      return [{ ...prev[0], amount: totalDue > 0 ? String(totalDue) : '' }];
    });
  }, [totalDue]);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await posService.searchProducts(q.trim());
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, runSearch]);

  useEffect(() => {
    if (selectedClient) return;

    const digits = clientPhone.replace(/\D/g, '');
    if (!clientPhone.trim() || digits.length < 4) {
      setClientResults([]);
      setClientSearching(false);
      setClientStatus(digits.length > 0 && digits.length < 4 ? 'too_short' : 'idle');
      setClientStatusMessage(
        digits.length > 0 && digits.length < 4 ? 'Encore quelques chiffres...' : ''
      );
      return;
    }

    let cancelled = false;
    setClientSearching(true);
    setClientStatus('searching');
    setClientStatusMessage('Recherche du client...');

    const t = setTimeout(async () => {
      try {
        const res = await posService.searchClients(clientPhone.trim());
        if (cancelled) return;

        const results = res.data || [];
        const meta = res.meta || {};
        setClientResults(results);
        setClientStatus(meta.status || (results.length ? 'partial' : 'not_found'));
        setClientStatusMessage(meta.message || '');

        if (meta.exact_match) {
          setSelectedClient(meta.exact_match);
          setWalkInName(meta.exact_match.name);
          setClientResults([]);
        }
      } catch (err) {
        if (cancelled) return;
        setClientResults([]);
        setClientStatus('error');
        setClientStatusMessage(err.message || 'Erreur de recherche');
      } finally {
        if (!cancelled) setClientSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [clientPhone, selectedClient]);

  const addToCart = (item) => {
    setCart((prev) => {
      const key = `${item.product_id}-${item.product_variant_id || 'base'}`;
      const existing = prev.find(
        (l) => `${l.product_id}-${l.product_variant_id || 'base'}` === key
      );
      if (existing) {
        return prev.map((l) =>
          `${l.product_id}-${l.product_variant_id || 'base'}` === key
            ? { ...l, quantity: l.quantity + 1 }
            : l
        );
      }
      return [
        ...prev,
        {
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          display_name: item.display_name,
          unit_price: parseFloat(item.price) || 0,
          quantity: 1,
          stock_quantity: item.stock_quantity,
        },
      ];
    });
    setSearchQuery('');
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const updateQty = (index, delta) => {
    setCart((prev) =>
      prev
        .map((l, i) => (i === index ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const clearCart = () => {
    if (cart.length === 0 || window.confirm('Vider le panier ?')) {
      setCart([]);
      searchRef.current?.focus();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length >= 1) {
      e.preventDefault();
      addToCart(searchResults[0]);
    }
  };

  const updatePayment = (index, field, value) => {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addPaymentLine = () => {
    setPayments((prev) => [
      ...prev,
      { method: 'wave', amount: remaining > 0 ? String(remaining) : '' },
    ]);
  };

  const removePaymentLine = (index) => {
    if (payments.length <= 1) return;
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const fillRemaining = (index) => {
    if (remaining <= 0) return;
    updatePayment(index, 'amount', String(Math.max(0, remaining)));
  };

  const clearClient = () => {
    setSelectedClient(null);
    setClientPhone('');
    setWalkInName('');
    setClientResults([]);
    setClientStatus('idle');
    setClientStatusMessage('');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const phoneDigits = clientPhone.replace(/\D/g, '');
    if (phoneDigits.length >= 4 && !selectedClient && !walkInName.trim()) {
      setError('Entrez le nom du client pour ce nouveau numéro');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        items: cart.map((l) => ({
          product_id: l.product_id,
          product_variant_id: l.product_variant_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
        discount_amount: discount,
        discount_reason: discountReason || null,
        client_id: selectedClient?.id || null,
        client_phone: clientPhone.trim() || null,
        client_name: walkInName.trim() || selectedClient?.name || null,
        walk_in_name: !selectedClient && !clientPhone.trim() && walkInName ? walkInName : null,
        payments: payments.map((p) => ({
          method: p.method,
          amount: parseFloat(p.amount),
        })),
      };
      const res = await posService.createOrder(payload);
      setLastOrder(res.data);
      setCart([]);
      setPayments([{ method: 'especes', amount: '' }]);
      setDiscountAmount('');
      setDiscountReason('');
      setShowDiscount(false);
      clearClient();
      searchRef.current?.focus();
    } catch (err) {
      const nameErr = err.errors?.client_name;
      const stockErr = err.errors?.stock;
      setError(
        nameErr ? nameErr.join(', ') : stockErr ? stockErr.join(', ') : err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clientStatusClass =
    clientStatus === 'exact' || selectedClient
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : clientStatus === 'partial'
        ? 'bg-blue-50 border-blue-200 text-blue-800'
        : clientStatus === 'not_found'
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : clientStatus === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-slate-50 border-slate-200 text-slate-600';

  return (
    <div className="h-[calc(100vh-68px)] flex flex-col xl:flex-row max-w-[1600px] mx-auto p-3 lg:p-4 gap-3 lg:gap-4">
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 lg:p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-sm font-bold text-emerald-700">1</span>
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Ajouter des produits</h2>
              <p className="text-xs text-slate-500">Scannez ou tapez le nom du produit</p>
            </div>
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
            <QrCodeIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Nom, code-barres ou SKU..."
              autoComplete="off"
              className="w-full pl-12 pr-12 py-4 text-lg rounded-2xl border-2 border-slate-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {searching && (
            <p className="text-sm text-emerald-600 mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Recherche en cours...
            </p>
          )}

          {searchResults.length > 0 && (
            <ul className="mt-3 rounded-2xl border border-slate-200 overflow-hidden shadow-lg max-h-56 overflow-y-auto">
              {searchResults.map((item) => (
                <li key={`${item.product_id}-${item.product_variant_id}`}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-emerald-50 active:bg-emerald-100 border-b border-slate-100 last:border-0 text-left transition-colors"
                    onClick={() => addToCart(item)}
                  >
                    <span className="font-semibold text-slate-900">{item.display_name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      {item.stock_quantity != null && item.stock_quantity > 0 && (
                        <span className="text-xs text-slate-400">Stock {item.stock_quantity}</span>
                      )}
                      <span className="font-bold text-emerald-700">{formatMoney(item.price)}</span>
                      <span className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <PlusIcon className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5 text-slate-600" />
              <h3 className="font-bold text-slate-900">
                Panier
                {cartCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    {cartCount}
                  </span>
                )}
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                Vider
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                  <ShoppingCartIcon className="h-10 w-10 text-slate-300" />
                </div>
                <p className="text-lg font-semibold text-slate-700 mb-2">Panier vide</p>
                <p className="text-sm text-slate-500 max-w-xs mb-6">
                  Recherchez un produit ci-dessus ou scannez un code-barres pour commencer.
                </p>
                <div className="grid grid-cols-3 gap-3 w-full max-w-sm text-left">
                  {[
                    { n: '1', t: 'Chercher', d: 'Nom ou code' },
                    { n: '2', t: 'Ajouter', d: 'Cliquer résultat' },
                    { n: '3', t: 'Encaisser', d: 'Payer à droite →' },
                  ].map((step) => (
                    <div key={step.n} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <span className="text-xs font-bold text-emerald-600">{step.n}</span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{step.t}</p>
                      <p className="text-[10px] text-slate-500">{step.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {cart.map((line, index) => (
                  <li
                    key={`${line.product_id}-${line.product_variant_id}-${index}`}
                    className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{line.display_name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{formatMoney(line.unit_price)} / unité</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                      <button
                        type="button"
                        className="h-10 w-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                        onClick={() => updateQty(index, -1)}
                      >
                        <MinusIcon className="h-5 w-5 text-slate-700" />
                      </button>
                      <span className="w-10 text-center text-lg font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        className="h-10 w-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center"
                        onClick={() => updateQty(index, 1)}
                      >
                        <PlusIcon className="h-5 w-5 text-white" />
                      </button>
                    </div>
                    <p className="w-28 text-right text-lg font-bold text-slate-900 shrink-0">
                      {formatMoney(line.unit_price * line.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="px-4 lg:px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-slate-300 text-sm">Sous-total panier</span>
              <span className="text-2xl font-bold">{formatMoney(subtotal)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full xl:w-[440px] flex flex-col min-h-0 gap-3 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-700">2</span>
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Client</h2>
              <p className="text-xs text-slate-500">Optionnel — pour fidéliser</p>
            </div>
          </div>

          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              value={clientPhone}
              onChange={(e) => {
                setClientPhone(e.target.value);
                setSelectedClient(null);
                setError('');
              }}
              placeholder="Numéro WhatsApp (ex: 70 12 34 56)"
              autoComplete="off"
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none text-sm"
            />
          </div>

          {(clientSearching || clientStatusMessage) && (
            <div className={`mt-2 px-3 py-2 rounded-xl border text-sm flex items-center gap-2 ${clientStatusClass}`}>
              {clientSearching && <span className="h-2 w-2 rounded-full bg-current animate-pulse shrink-0" />}
              {!clientSearching && (selectedClient || clientStatus === 'exact') && (
                <CheckCircleIcon className="h-4 w-4 shrink-0" />
              )}
              {clientSearching ? 'Recherche...' : clientStatusMessage}
            </div>
          )}

          {clientResults.length > 0 && !selectedClient && (
            <ul className="mt-2 rounded-xl border border-slate-200 overflow-hidden">
              {clientResults.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0"
                    onClick={() => {
                      setSelectedClient(c);
                      setWalkInName(c.name);
                      setClientPhone(c.display_phone || c.phone || c.whatsapp_phone || '');
                      setClientResults([]);
                      setClientStatus('exact');
                      setClientStatusMessage(`Client trouvé : ${c.name}`);
                    }}
                  >
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.display_phone || c.phone || c.whatsapp_phone}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedClient ? (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">{selectedClient.name}</p>
                  <p className="text-xs text-emerald-700">Client enregistré</p>
                </div>
              </div>
              <button type="button" onClick={clearClient} className="text-xs text-slate-500 underline">
                Changer
              </button>
            </div>
          ) : (
            <input
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              placeholder={
                clientStatus === 'not_found' && clientPhone.trim()
                  ? 'Nom du nouveau client *'
                  : 'Nom du client (optionnel)'
              }
              className="mt-2 w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-400 outline-none text-sm"
            />
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-4 lg:p-5 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-700">3</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Paiement</h2>
                <p className="text-xs text-slate-500">Choisissez le mode et validez</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white mb-4">
              {discount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Sous-total</span>
                    <span className="line-through">{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-300 mb-2">
                    <span>Remise</span>
                    <span>−{formatMoney(discount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-end">
                <span className="text-slate-300 text-sm">Total à payer</span>
                <span className="text-3xl font-black text-emerald-400">{formatMoney(totalDue)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDiscount(!showDiscount)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-3"
            >
              {showDiscount ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              Appliquer une remise
            </button>
            {showDiscount && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="Montant FCFA"
                  className="px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-violet-400"
                />
                <input
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Motif (optionnel)"
                  className="px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-violet-400"
                />
              </div>
            )}

            {payments.map((p, index) => (
              <div key={index} className="mb-4">
                {payments.length > 1 && (
                  <p className="text-xs font-medium text-slate-500 mb-2">Paiement {index + 1}</p>
                )}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {PAYMENT_METHODS.map((m) => {
                    const style = PAYMENT_STYLES[m.value] || PAYMENT_STYLES.especes;
                    const active = p.method === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => updatePayment(index, 'method', m.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                          active ? style.bg : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{style.emoji}</span>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <BanknotesIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      value={p.amount}
                      onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                      placeholder="Montant reçu"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 text-lg font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fillRemaining(index)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap"
                  >
                    Total exact
                  </button>
                  {payments.length > 1 && (
                    <button type="button" onClick={() => removePaymentLine(index)} className="px-3 text-red-500">
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPaymentLine}
              className="text-sm text-violet-600 font-medium flex items-center gap-1 mb-4"
            >
              <PlusIcon className="h-4 w-4" />
              Diviser le paiement (2 modes)
            </button>

            <div
              className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold ${
                remaining === 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : remaining > 0
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {remaining === 0 ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  Montant correct — prêt à valider
                </>
              ) : remaining > 0 ? (
                <>Il manque {formatMoney(remaining)}</>
              ) : (
                <>Trop-perçu de {formatMoney(Math.abs(remaining))}</>
              )}
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="p-4 lg:p-5 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={`w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all ${
                canSubmit
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                <>
                  <SparklesIcon className="h-6 w-6" />
                  Valider la vente
                  {totalDue > 0 && (
                    <span className="bg-white/20 px-3 py-0.5 rounded-full text-base">{formatMoney(totalDue)}</span>
                  )}
                </>
              )}
            </button>
            {cart.length === 0 && (
              <p className="text-center text-xs text-slate-400 mt-2">Ajoutez des produits pour encaisser</p>
            )}
          </div>
        </div>
      </div>

      {lastOrder && <PosReceipt order={lastOrder} onClose={() => setLastOrder(null)} />}
    </div>
  );
};

export default PosSale;
