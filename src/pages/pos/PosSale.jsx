import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Barcode,
  Phone,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Banknote,
} from 'lucide-react';
import { posService, PAYMENT_METHODS } from '../../services/posApi';
import PosReceipt from './PosReceipt';
import {
  formatPosMoney,
  PAYMENT_METHOD_CONFIG,
  PosProductThumb,
  PosPanel,
  PosEmptyState,
  PosAlert,
  PosButton,
} from '../../components/pos/posShared';

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
        digits.length > 0 && digits.length < 4 ? 'Encore quelques chiffres…' : ''
      );
      return;
    }

    let cancelled = false;
    setClientSearching(true);
    setClientStatus('searching');
    setClientStatusMessage('Recherche du client…');

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
          image: item.image,
          category: item.category,
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

  const clientStatusType =
    clientStatus === 'exact' || selectedClient
      ? 'success'
      : clientStatus === 'error'
        ? 'error'
        : clientStatus === 'not_found'
          ? 'warning'
          : 'info';

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-72px)] flex flex-col xl:flex-row max-w-[1600px] mx-auto p-3 lg:p-4 gap-3 lg:gap-4">
      {/* Colonne gauche — recherche + panier */}
      <div className="flex-1 flex flex-col min-h-0 gap-3">
        <PosPanel step={1} title="Produits" subtitle="Scannez, cherchez ou appuyez sur Entrée">
          <div className="p-4 lg:p-5 pt-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Nom, code-barres ou SKU…"
                autoComplete="off"
                className="w-full pl-12 pr-12 py-3.5 text-base md:text-lg rounded-2xl border-2 border-gray-200 bg-brand-cream/50 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            {searching && (
              <p className="text-xs text-brand-green mt-2 flex items-center gap-2 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
                Recherche…
              </p>
            )}

            {searchResults.length > 0 && (
              <ul className="mt-3 rounded-2xl border border-gray-100 overflow-hidden shadow-md max-h-60 overflow-y-auto divide-y divide-gray-50">
                {searchResults.map((item) => (
                  <li key={`${item.product_id}-${item.product_variant_id}`}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-brand-green-light/50 active:bg-brand-green-light text-left transition-colors"
                      onClick={() => addToCart(item)}
                    >
                      <PosProductThumb src={item.image} alt={item.display_name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{item.display_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.category && (
                            <span className="text-[10px] text-gray-400 truncate">{item.category}</span>
                          )}
                          {item.stock_quantity != null && item.stock_quantity > 0 && (
                            <span className="text-[10px] text-brand-green font-medium">
                              Stock {item.stock_quantity}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-brand-green text-sm">{formatPosMoney(item.price)}</span>
                        <span className="h-9 w-9 rounded-xl bg-brand-orange flex items-center justify-center shadow-sm">
                          <Plus size={18} className="text-white" />
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PosPanel>

        <PosPanel
          className="flex-1 min-h-0"
          title="Panier"
          subtitle={
            cartCount > 0
              ? `${cartCount} article${cartCount > 1 ? 's' : ''} · ${cart.length} ligne${cart.length > 1 ? 's' : ''}`
              : undefined
          }
          headerClassName="!py-3"
        >
          <div className="flex items-center justify-end px-4 -mt-2 mb-1">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={14} />
                Vider
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-[180px] max-h-[40vh] xl:max-h-none xl:flex-1">
            {cart.length === 0 ? (
              <PosEmptyState
                icon={ShoppingCart}
                title="Panier vide"
                description="Recherchez un produit ou scannez un code-barres pour commencer."
              >
                <div className="grid grid-cols-3 gap-2 w-full max-w-sm text-left">
                  {[
                    { n: '1', t: 'Chercher', d: 'Nom ou code' },
                    { n: '2', t: 'Ajouter', d: 'Clic ou Entrée' },
                    { n: '3', t: 'Encaisser', d: 'Payer →' },
                  ].map((step) => (
                    <div key={step.n} className="bg-brand-cream rounded-xl p-2.5 border border-gray-100">
                      <span className="text-[10px] font-bold text-brand-green">{step.n}</span>
                      <p className="text-[11px] font-semibold text-gray-800 mt-0.5">{step.t}</p>
                      <p className="text-[9px] text-gray-500">{step.d}</p>
                    </div>
                  ))}
                </div>
              </PosEmptyState>
            ) : (
              <ul className="space-y-2.5">
                {cart.map((line, index) => (
                  <li
                    key={`${line.product_id}-${line.product_variant_id}-${index}`}
                    className="flex items-center gap-3 bg-brand-cream/70 rounded-2xl p-3 border border-gray-100"
                  >
                    <PosProductThumb src={line.image} alt={line.display_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{line.display_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatPosMoney(line.unit_price)} / u.</p>
                    </div>
                    <div className="flex items-center gap-0.5 bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm">
                      <button
                        type="button"
                        className="h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        onClick={() => updateQty(index, -1)}
                      >
                        <Minus size={16} className="text-gray-600" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        className="h-9 w-9 rounded-lg bg-brand-green hover:bg-brand-green-dark flex items-center justify-center"
                        onClick={() => updateQty(index, 1)}
                      >
                        <Plus size={16} className="text-white" />
                      </button>
                    </div>
                    <p className="w-24 text-right text-sm font-bold text-gray-900 shrink-0">
                      {formatPosMoney(line.unit_price * line.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="px-4 py-3 bg-brand-green-dark text-white flex items-center justify-between rounded-b-2xl mx-0">
              <span className="text-white/70 text-sm">Sous-total</span>
              <span className="text-xl font-bold">{formatPosMoney(subtotal)}</span>
            </div>
          )}
        </PosPanel>
      </div>

      {/* Colonne droite — client + paiement */}
      <div className="w-full xl:w-[420px] flex flex-col min-h-0 gap-3 shrink-0">
        <PosPanel step={2} title="Client" subtitle="Optionnel — fidélisation WhatsApp">
          <div className="p-4 lg:p-5 pt-0 space-y-2">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={clientPhone}
                onChange={(e) => {
                  setClientPhone(e.target.value);
                  setSelectedClient(null);
                  setError('');
                }}
                placeholder="Numéro WhatsApp (ex: 70 12 34 56)"
                autoComplete="off"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 outline-none text-sm bg-brand-cream/40"
              />
            </div>

            {(clientSearching || clientStatusMessage) && !selectedClient && (
              <PosAlert type={clientSearching ? 'info' : clientStatusType}>
                {clientSearching ? 'Recherche…' : clientStatusMessage}
              </PosAlert>
            )}

            {clientResults.length > 0 && !selectedClient && (
              <ul className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {clientResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-brand-green-light/40 flex items-center gap-2"
                      onClick={() => {
                        setSelectedClient(c);
                        setWalkInName(c.name);
                        setClientPhone(c.display_phone || c.phone || c.whatsapp_phone || '');
                        setClientResults([]);
                        setClientStatus('exact');
                        setClientStatusMessage(`Client : ${c.name}`);
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-green-light flex items-center justify-center">
                        <User size={14} className="text-brand-green" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {c.display_phone || c.phone || c.whatsapp_phone}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectedClient ? (
              <div className="p-3 rounded-xl bg-brand-green-light/60 border border-brand-green/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-brand-green" />
                  <div>
                    <p className="font-semibold text-brand-green-dark text-sm">{selectedClient.name}</p>
                    <p className="text-[11px] text-brand-green">Client enregistré</p>
                  </div>
                </div>
                <button type="button" onClick={clearClient} className="text-xs text-gray-500 font-semibold underline">
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
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none text-sm bg-brand-cream/40"
              />
            )}
          </div>
        </PosPanel>

        <PosPanel step={3} title="Paiement" subtitle="Choisissez le mode et validez" className="flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 lg:p-5 pt-0 space-y-4">
            <div className="bg-gradient-to-br from-brand-green-dark to-brand-green rounded-2xl p-4 text-white">
              {discount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-white/60 mb-1">
                    <span>Sous-total</span>
                    <span className="line-through">{formatPosMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-200 mb-2">
                    <span>Remise</span>
                    <span>−{formatPosMoney(discount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-end">
                <span className="text-white/70 text-sm">Total à payer</span>
                <span className="text-2xl md:text-3xl font-black text-brand-orange-light">
                  {formatPosMoney(totalDue)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDiscount(!showDiscount)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-brand-green font-semibold"
            >
              {showDiscount ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Appliquer une remise
            </button>
            {showDiscount && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="Montant FCFA"
                  className="px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-brand-green bg-brand-cream/40"
                />
                <input
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Motif"
                  className="px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-brand-green bg-brand-cream/40"
                />
              </div>
            )}

            {payments.map((p, index) => (
              <div key={index} className="space-y-2">
                {payments.length > 1 && (
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    Paiement {index + 1}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_METHODS.map((m) => {
                    const cfg = PAYMENT_METHOD_CONFIG[m.value] || PAYMENT_METHOD_CONFIG.especes;
                    const active = p.method === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => updatePayment(index, 'method', m.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                          active ? cfg.active : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span>{cfg.icon}</span>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      value={p.amount}
                      onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                      placeholder="Montant"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-gray-200 text-base font-bold outline-none focus:border-brand-green bg-brand-cream/40"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fillRemaining(index)}
                    className="px-2.5 py-2 rounded-xl bg-brand-green-light text-brand-green-dark text-[11px] font-bold hover:bg-brand-green/15 whitespace-nowrap"
                  >
                    Total exact
                  </button>
                  {payments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePaymentLine(index)}
                      className="px-2.5 text-red-500 font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPaymentLine}
              className="text-xs text-brand-green font-bold flex items-center gap-1"
            >
              <Plus size={14} />
              Diviser le paiement
            </button>

            <div
              className={`px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold border ${
                remaining === 0
                  ? 'bg-brand-green-light text-brand-green-dark border-brand-green/20'
                  : remaining > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {remaining === 0 ? (
                <>
                  <CheckCircle2 size={16} />
                  Montant correct — prêt à valider
                </>
              ) : remaining > 0 ? (
                <>Il manque {formatPosMoney(remaining)}</>
              ) : (
                <>Trop-perçu de {formatPosMoney(Math.abs(remaining))}</>
              )}
            </div>

            {error && <PosAlert type="error">{error}</PosAlert>}
          </div>

          <div className="p-4 border-t border-gray-100 bg-brand-cream/50">
            <PosButton
              variant="primary"
              size="xl"
              disabled={!canSubmit}
              loading={submitting}
              onClick={handleSubmit}
              className="gap-3"
            >
              {!submitting && <Sparkles size={20} />}
              Valider la vente
              {totalDue > 0 && !submitting && (
                <span className="bg-white/25 px-2.5 py-0.5 rounded-full text-sm">{formatPosMoney(totalDue)}</span>
              )}
            </PosButton>
            {cart.length === 0 && (
              <p className="text-center text-[11px] text-gray-400 mt-2">Ajoutez des produits pour encaisser</p>
            )}
          </div>
        </PosPanel>
      </div>

      {lastOrder && <PosReceipt order={lastOrder} onClose={() => setLastOrder(null)} />}
    </div>
  );
};

export default PosSale;
