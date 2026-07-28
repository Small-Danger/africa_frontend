import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { posService, PAYMENT_METHODS } from '../../services/posApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PosReceipt from './PosReceipt';

const formatMoney = (n) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F CFA';

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
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [payments, setPayments] = useState([{ method: 'especes', amount: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastOrder, setLastOrder] = useState(null);

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
  const canSubmit =
    cart.length > 0 &&
    remaining === 0 &&
    totalDue >= 0 &&
    !submitting;

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
    if (selectedClient) {
      return;
    }

    const digits = clientPhone.replace(/\D/g, '');
    if (!clientPhone.trim() || digits.length < 4) {
      setClientResults([]);
      setClientSearching(false);
      setClientStatus(digits.length > 0 && digits.length < 4 ? 'too_short' : 'idle');
      setClientStatusMessage(
        digits.length > 0 && digits.length < 4 ? 'Saisissez au moins 4 chiffres' : ''
      );
      return;
    }

    let cancelled = false;
    setClientSearching(true);
    setClientStatus('searching');
    setClientStatusMessage('Recherche en cours...');

    const t = setTimeout(async () => {
      try {
        const res = await posService.searchClients(clientPhone.trim());
        if (cancelled) return;

        const results = res.data || [];
        const meta = res.meta || {};
        setClientResults(results);
        setClientStatus(meta.status || (results.length ? 'partial' : 'not_found'));
        setClientStatusMessage(meta.message || '');

        if (meta.exact_match && !selectedClient) {
          setSelectedClient(meta.exact_match);
          setWalkInName(meta.exact_match.name);
          setClientResults([]);
        }
      } catch (err) {
        if (cancelled) return;
        setClientResults([]);
        setClientStatus('error');
        setClientStatusMessage(err.message || 'Erreur lors de la recherche client');
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

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length === 1) {
      e.preventDefault();
      addToCart(searchResults[0]);
    }
  };

  const updatePayment = (index, field, value) => {
    setPayments((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const addPaymentLine = () => {
    setPayments((prev) => [...prev, { method: 'wave', amount: remaining > 0 ? String(remaining) : '' }]);
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
      setError('Saisissez le nom du client pour enregistrer ce nouveau numéro');
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
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : clientStatus === 'partial'
        ? 'text-blue-700 bg-blue-50 border-blue-200'
        : clientStatus === 'not_found'
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : clientStatus === 'error'
            ? 'text-red-700 bg-red-50 border-red-200'
            : 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white min-h-0">
        <div className="p-4 border-b border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Recherche produit / scan code-barres
          </label>
          <Input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Nom, SKU ou code-barres..."
            autoComplete="off"
          />
          {searching && <p className="text-xs text-slate-500 mt-1">Recherche...</p>}
          {searchResults.length > 0 && (
            <ul className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-auto">
              {searchResults.map((item) => (
                <li key={`${item.product_id}-${item.product_variant_id}`}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b border-slate-100 last:border-0"
                    onClick={() => addToCart(item)}
                  >
                    <span className="font-medium">{item.display_name}</span>
                    <span className="text-emerald-700 ml-2">{formatMoney(item.price)}</span>
                    {item.stock_quantity != null && item.stock_quantity > 0 && (
                      <span className="text-xs text-slate-500 ml-2">Stock: {item.stock_quantity}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <h2 className="font-semibold text-slate-800 mb-3">Panier ({cart.length})</h2>
          {cart.length === 0 ? (
            <p className="text-slate-500 text-sm">Scannez ou recherchez un produit pour commencer.</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((line, index) => (
                <li
                  key={`${line.product_id}-${line.product_variant_id}-${index}`}
                  className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{line.display_name}</p>
                    <p className="text-sm text-slate-600">{formatMoney(line.unit_price)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      type="button"
                      className="w-8 h-8 rounded bg-slate-200 hover:bg-slate-300"
                      onClick={() => updateQty(index, -1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{line.quantity}</span>
                    <button
                      type="button"
                      className="w-8 h-8 rounded bg-slate-200 hover:bg-slate-300"
                      onClick={() => updateQty(index, 1)}
                    >
                      +
                    </button>
                    <span className="w-24 text-right font-semibold">
                      {formatMoney(line.unit_price * line.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="w-full lg:w-[420px] flex flex-col bg-slate-50 border-t lg:border-t-0 min-h-0 overflow-auto">
        <div className="p-4 space-y-4 flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Client — téléphone WhatsApp
            </label>
            <Input
              value={clientPhone}
              onChange={(e) => {
                setClientPhone(e.target.value);
                setSelectedClient(null);
                setError('');
              }}
              placeholder="Ex: 70 12 34 56 ou +22670123456"
              autoComplete="off"
            />
            {(clientSearching || clientStatusMessage) && (
              <p className={`text-xs mt-2 px-3 py-2 rounded-lg border ${clientStatusClass}`}>
                {clientSearching ? 'Recherche en cours...' : clientStatusMessage}
              </p>
            )}
            {clientResults.length > 0 && !selectedClient && (
              <ul className="mt-2 border rounded-lg bg-white shadow-sm">
                {clientResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0"
                      onClick={() => {
                        setSelectedClient(c);
                        setWalkInName(c.name);
                        setClientPhone(c.display_phone || c.phone || c.whatsapp_phone || '');
                        setClientResults([]);
                        setClientStatus('exact');
                        setClientStatusMessage('Client existant sélectionné');
                      }}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-slate-500 ml-2">
                        {c.display_phone || c.phone || c.whatsapp_phone}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedClient && (
              <div className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-800 font-medium">
                  ✓ Client enregistré : {selectedClient.name}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  {selectedClient.display_phone ||
                    selectedClient.phone ||
                    selectedClient.whatsapp_phone}
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs text-slate-600 underline"
                  onClick={clearClient}
                >
                  Changer de client
                </button>
              </div>
            )}
            {!selectedClient && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {clientStatus === 'not_found' && clientPhone.trim()
                    ? 'Nom du nouveau client *'
                    : 'Nom du client (si nouveau ou sans téléphone)'}
                </label>
                <Input
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder={
                    clientStatus === 'not_found'
                      ? 'Obligatoire pour enregistrer ce numéro'
                      : 'Optionnel'
                  }
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remise (FCFA)</label>
              <Input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Motif remise</label>
              <Input
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex justify-between text-sm mb-1">
              <span>Sous-total</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600 mb-1">
                <span>Remise</span>
                <span>-{formatMoney(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span>Total dû</span>
              <span className="text-emerald-700">{formatMoney(totalDue)}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">Paiements</label>
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={addPaymentLine}
              >
                + Split paiement
              </button>
            </div>
            {payments.map((p, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  value={p.method}
                  onChange={(e) => updatePayment(index, 'method', e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-2 text-sm flex-1"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={p.amount}
                  onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                  placeholder="Montant"
                  className="w-28"
                />
                <button
                  type="button"
                  className="text-xs text-slate-500 px-1"
                  onClick={() => fillRemaining(index)}
                  title="Remplir le reste"
                >
                  Reste
                </button>
                {payments.length > 1 && (
                  <button
                    type="button"
                    className="text-red-500 text-sm"
                    onClick={() => removePaymentLine(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <p
              className={`text-sm font-medium ${
                remaining === 0 ? 'text-emerald-600' : remaining > 0 ? 'text-amber-600' : 'text-red-600'
              }`}
            >
              {remaining === 0
                ? 'Paiement complet ✓'
                : remaining > 0
                  ? `Reste à payer : ${formatMoney(remaining)}`
                  : `Trop-perçu : ${formatMoney(Math.abs(remaining))}`}
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canSubmit}
            loading={submitting}
            onClick={handleSubmit}
          >
            Valider la vente
          </Button>
        </div>
      </div>

      {lastOrder && (
        <PosReceipt order={lastOrder} onClose={() => setLastOrder(null)} />
      )}
    </div>
  );
};

export default PosSale;
