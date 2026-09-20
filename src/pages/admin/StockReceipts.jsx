import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Truck } from 'lucide-react';
import { stockService } from '../../services/api';
import {
  AdminButton,
  AdminPanel,
  AdminStatCard,
  formatAdminMoney,
} from '../../components/admin/adminShared';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const emptySummary = {
  receipts_count: 0,
  units_received: 0,
  merchandise_cost: 0,
  shipping_cost: 0,
  invested: 0,
};

const today = () => new Date().toISOString().slice(0, 10);
const dateOnly = (value) => (value ? String(value).slice(0, 10) : today());

const StockReceipts = ({ onStockChanged, onNotify }) => {
  const [catalog, setCatalog] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [canViewFinance, setCanViewFinance] = useState(false);
  const [canAdjust, setCanAdjust] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState([]);
  const [merchandise, setMerchandise] = useState('');
  const [shipping, setShipping] = useState('');
  const [note, setNote] = useState('');
  const [receivedAt, setReceivedAt] = useState(today);
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toCancel, setToCancel] = useState(null);
  const [deleteWord, setDeleteWord] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [listSearch, setListSearch] = useState('');

  const resetForm = () => {
    setLines([]);
    setMerchandise('');
    setShipping('');
    setNote('');
    setReceivedAt(today());
    setEditingId(null);
    setFormErrors({});
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogRes, receiptsRes] = await Promise.all([
        stockService.getAll(),
        stockService.listReceipts(),
      ]);
      if (catalogRes.success) setCatalog(catalogRes.data.items || []);
      if (receiptsRes.success) {
        setReceipts(receiptsRes.data.items || []);
        setSummary({ ...emptySummary, ...(receiptsRes.data.summary || {}) });
        setCanViewFinance(Boolean(receiptsRes.data.can_view_finance));
        setCanAdjust(Boolean(receiptsRes.data.can_adjust));
      }
    } catch (err) {
      onNotify?.({ type: 'error', message: err.message || 'Impossible de charger les réceptions' });
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  const suggestions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const taken = new Set(lines.map((line) => line.variant_id));
    return catalog
      .filter((item) => !taken.has(item.id))
      .filter((item) => {
        if (!needle) return true;
        return `${item.product_name} ${item.variant_name} ${item.sku || ''}`.toLowerCase().includes(needle);
      })
      .slice(0, 8);
  }, [catalog, lines, search]);

  const addLine = (item) => {
    setLines((prev) => [
      ...prev,
      {
        variant_id: item.id,
        product_name: item.product_name,
        variant_name: item.variant_name,
        quantity: '1',
      },
    ]);
    setSearch('');
  };

  const updateQty = (variantId, value) => {
    setLines((prev) => prev.map((line) => (
      line.variant_id === variantId ? { ...line, quantity: value } : line
    )));
  };

  const removeLine = (variantId) => {
    setLines((prev) => prev.filter((line) => line.variant_id !== variantId));
  };

  const startEdit = (receipt) => {
    setEditingId(receipt.id);
    setLines((receipt.items || []).map((item) => ({
      variant_id: item.variant_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      quantity: String(item.quantity),
    })));
    setMerchandise(receipt.merchandise_cost == null ? '' : String(receipt.merchandise_cost));
    setShipping(receipt.shipping_cost == null ? '' : String(receipt.shipping_cost));
    setNote(receipt.note || '');
    setReceivedAt(dateOnly(receipt.received_at));
    setFormErrors({});
    document.getElementById('receipt-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const payload = () => ({
    items: lines.map((line) => ({
      variant_id: line.variant_id,
      quantity: Number(line.quantity),
    })),
    merchandise_cost: merchandise === '' ? 0 : Number(merchandise),
    shipping_cost: shipping === '' ? 0 : Number(shipping),
    note: note.trim() || undefined,
    received_at: receivedAt || undefined,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lines.length === 0) {
      setFormErrors({ items: ['Ajoutez au moins un produit reçu'] });
      return;
    }
    setSubmitting(true);
    setFormErrors({});

    try {
      const response = editingId
        ? await stockService.updateReceipt(editingId, payload())
        : await stockService.createReceipt(payload());
      if (response.success) {
        onNotify?.({ type: 'success', message: response.message });
        resetForm();
        await load();
        onStockChanged?.();
      }
    } catch (err) {
      if (err.errors) setFormErrors(err.errors);
      onNotify?.({ type: 'error', message: err.message || 'Réception impossible' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReceipt = async () => {
    if (!toCancel || deleteWord !== 'DELETE') return;
    setCancelling(true);
    try {
      const response = await stockService.cancelReceipt(toCancel.id, { confirmation: 'DELETE' });
      if (response.success) {
        onNotify?.({ type: 'success', message: response.message });
        if (editingId === toCancel.id) resetForm();
        setToCancel(null);
        setDeleteWord('');
        await load();
        onStockChanged?.();
      }
    } catch (err) {
      onNotify?.({ type: 'error', message: err.message || 'Annulation impossible' });
    } finally {
      setCancelling(false);
    }
  };

  const visibleReceipts = useMemo(() => {
    const needle = listSearch.trim().toLowerCase();
    if (!needle) return receipts;
    return receipts.filter((row) => {
      const hay = [
        row.note,
        row.actor_name,
        ...(row.items || []).flatMap((item) => [item.product_name, item.variant_name]),
      ].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [receipts, listSearch]);

  if (loading) {
    return <p className="text-sm text-gray-500">Chargement des réceptions…</p>;
  }

  return (
    <div className="space-y-6">
      {canViewFinance && (
        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard label="Arrivages ce mois" value={String(summary.receipts_count)} icon={Truck} accent="green" />
          <AdminStatCard label="Pièces reçues" value={String(summary.units_received)} icon={Plus} accent="emerald" />
          <AdminStatCard label="Marchandise" value={formatAdminMoney(summary.merchandise_cost)} accent="violet" />
          <AdminStatCard
            label="Dont transport"
            value={formatAdminMoney(summary.shipping_cost)}
            hint={`Total investi ${formatAdminMoney(summary.invested)}`}
            accent="orange"
          />
        </div>
      )}

      <AdminPanel
        title={editingId ? 'Corriger l’arrivage' : 'Nouvel arrivage'}
        subtitle={
          editingId
            ? 'Le stock sera ajusté de la différence. Vous pourrez encore modifier après enregistrement.'
            : 'Le stock est augmenté, pas écrasé. Plus bas, Modifier et Annuler restent disponibles sur chaque arrivage.'
        }
      >
        <form id="receipt-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ajouter un produit</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un savon, une huile, un SKU…"
            />
            {search.trim() && (
              <div className="mt-2 border border-gray-100 rounded-xl divide-y bg-white shadow-sm max-h-56 overflow-y-auto">
                {suggestions.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-400">Aucun produit correspondant</p>
                ) : (
                  suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-brand-cream"
                      onClick={() => addLine(item)}
                    >
                      <span className="font-medium text-gray-900">{item.product_name}</span>
                      <span className="text-sm text-gray-500"> · {item.variant_name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {lines.length > 0 && (
            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.variant_id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{line.product_name}</p>
                    <p className="text-xs text-gray-400">{line.variant_name}</p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    className="w-24"
                    value={line.quantity}
                    onChange={(e) => updateQty(line.variant_id, e.target.value)}
                    required
                  />
                  <button type="button" className="text-gray-400 hover:text-red-600" onClick={() => removeLine(line.variant_id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {formErrors.items && <p className="text-sm text-red-600">{formErrors.items[0]}</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de réception</label>
              <Input type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coût marchandise (FCFA)</label>
              <Input
                type="number"
                min={0}
                step={1}
                value={merchandise}
                onChange={(e) => setMerchandise(e.target.value)}
                placeholder="Ex: 200000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frais de transport (FCFA)</label>
              <Input
                type="number"
                min={0}
                step={1}
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                placeholder="Ex: 75000"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Ces montants enregistrent l’investissement de l’arrivage. Le menu Finances compare ensuite ces camions aux ventes du mois.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optionnel)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Fournisseur, n° de colis, camion du 20 septembre…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" loading={submitting} disabled={lines.length === 0}>
              {editingId ? 'Enregistrer la correction' : 'Injecter dans le stock'}
            </Button>
            {editingId && (
              <AdminButton type="button" variant="outline" onClick={resetForm}>
                Annuler la modification
              </AdminButton>
            )}
          </div>
        </form>
      </AdminPanel>

      <AdminPanel
        title="Arrivages enregistrés"
        subtitle="Un arrivage actif peut être corrigé autant de fois que nécessaire. L’historique reste dans le journal."
      >
        <div className="space-y-3">
          <Input
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            placeholder="Rechercher un produit, une note…"
          />
          {visibleReceipts.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              {receipts.length === 0 ? 'Aucun arrivage enregistré pour l’instant.' : 'Aucun arrivage ne correspond à la recherche.'}
            </p>
          ) : (
            visibleReceipts.map((row) => {
              const editing = editingId === row.id;
              return (
                <div
                  key={row.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    row.cancelled
                      ? 'border-gray-100 bg-gray-50'
                      : editing
                        ? 'border-brand-orange bg-brand-cream/60'
                        : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-semibold ${row.cancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {row.received_at ? new Date(row.received_at).toLocaleDateString('fr-FR') : '—'}
                        </p>
                        <Badge variant={row.cancelled ? 'destructive' : 'success'}>
                          {row.cancelled ? 'Annulé' : 'Actif'}
                        </Badge>
                        {editing && <Badge variant="warning">Modification en cours</Badge>}
                      </div>
                      <div className={row.cancelled ? 'opacity-60 space-y-0.5' : 'space-y-0.5'}>
                        {(row.items || []).map((item) => (
                          <p key={item.id || item.variant_id} className="text-sm text-gray-800">
                            {item.product_name} · {item.variant_name}
                            <span className="text-gray-400"> × {item.quantity}</span>
                          </p>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">
                        {row.units} pièce(s)
                        {canViewFinance && (
                          <>
                            {' · '}
                            {formatAdminMoney(row.cancelled ? 0 : row.invested)}
                            <span className="text-xs text-gray-400">
                              {' '}({formatAdminMoney(row.merchandise_cost)} + transport {formatAdminMoney(row.shipping_cost)})
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{row.note || 'Sans note'}</p>
                      {row.cancelled && (
                        <p className="text-xs text-gray-400">
                          Annulé{row.cancelled_by_name ? ` par ${row.cancelled_by_name}` : ''} — conservé dans l’historique
                        </p>
                      )}
                    </div>
                    {canAdjust && !row.cancelled && (
                      <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch shrink-0">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(row)}>
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setToCancel(row);
                            setDeleteWord('');
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </AdminPanel>

      <Modal
        isOpen={Boolean(toCancel)}
        onClose={() => {
          if (!cancelling) {
            setToCancel(null);
            setDeleteWord('');
          }
        }}
        title="Annuler cet arrivage"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Le stock sera retiré, mais l’arrivage restera visible comme <strong>annulé</strong> dans l’historique.
            Si des pièces ont déjà été vendues, l’annulation sera refusée.
          </p>
          {toCancel && (
            <p className="text-sm text-gray-800">
              {(toCancel.items || []).map((item) => `${item.product_name} · ${item.variant_name} × ${item.quantity}`).join(', ')}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tapez <span className="font-mono">DELETE</span> pour confirmer
            </label>
            <Input
              value={deleteWord}
              onChange={(e) => setDeleteWord(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setToCancel(null);
                setDeleteWord('');
              }}
              disabled={cancelling}
            >
              Retour
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelReceipt}
              loading={cancelling}
              disabled={deleteWord !== 'DELETE'}
            >
              Annuler l’arrivage
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StockReceipts;
