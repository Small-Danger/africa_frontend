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
import DataTable from '../../components/ui/DataTable';

const emptySummary = {
  receipts_count: 0,
  units_received: 0,
  merchandise_cost: 0,
  shipping_cost: 0,
  invested: 0,
};

const today = () => new Date().toISOString().slice(0, 10);

const StockReceipts = ({ onStockChanged, onNotify }) => {
  const [catalog, setCatalog] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [canViewFinance, setCanViewFinance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState([]);
  const [merchandise, setMerchandise] = useState('');
  const [shipping, setShipping] = useState('');
  const [note, setNote] = useState('');
  const [receivedAt, setReceivedAt] = useState(today);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lines.length === 0) {
      setFormErrors({ items: ['Ajoutez au moins un produit reçu'] });
      return;
    }
    setSubmitting(true);
    setFormErrors({});

    try {
      const response = await stockService.createReceipt({
        items: lines.map((line) => ({
          variant_id: line.variant_id,
          quantity: Number(line.quantity),
        })),
        merchandise_cost: merchandise === '' ? 0 : Number(merchandise),
        shipping_cost: shipping === '' ? 0 : Number(shipping),
        note: note.trim() || undefined,
        received_at: receivedAt || undefined,
      });
      if (response.success) {
        onNotify?.({ type: 'success', message: response.message });
        setLines([]);
        setMerchandise('');
        setShipping('');
        setNote('');
        setReceivedAt(today());
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

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'received_at',
        label: 'Date',
        searchable: false,
        render: (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '—'),
      },
      {
        key: 'items',
        label: 'Produits',
        render: (_, row) => (
          <div className="space-y-0.5">
            {(row.items || []).slice(0, 3).map((item) => (
              <p key={item.id} className="text-sm text-gray-800">
                {item.product_name} · {item.variant_name}
                <span className="text-gray-400"> × {item.quantity}</span>
              </p>
            ))}
            {(row.items || []).length > 3 && (
              <p className="text-xs text-gray-400">+{row.items.length - 3} autre(s)</p>
            )}
          </div>
        ),
      },
      {
        key: 'units',
        label: 'Pièces',
        searchable: false,
      },
      {
        key: 'note',
        label: 'Note',
        render: (value) => value || '—',
      },
    ];

    if (canViewFinance) {
      cols.splice(3, 0, {
        key: 'invested',
        label: 'Investi',
        searchable: false,
        render: (value, row) => (
          <div>
            <p className="font-semibold text-gray-900">{formatAdminMoney(value)}</p>
            <p className="text-xs text-gray-400">
              {formatAdminMoney(row.merchandise_cost)} + transport {formatAdminMoney(row.shipping_cost)}
            </p>
          </div>
        ),
      });
    }

    return cols;
  }, [canViewFinance]);

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
        title="Nouvel arrivage"
        subtitle="Le stock est augmenté, pas écrasé. Corriger reste l’inventaire si le rayon ne correspond pas."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            Ces montants enregistrent l’investissement de l’arrivage. Les rapports mensuels (ventes vs récupération) arriveront à la brique finance.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optionnel)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Fournisseur, n° de colis, camion du 20 septembre…"
            />
          </div>
          <div className="flex justify-start">
            <Button type="submit" variant="primary" loading={submitting} disabled={lines.length === 0}>
              Injecter dans le stock
            </Button>
          </div>
        </form>
      </AdminPanel>

      <DataTable
        title="Derniers arrivages"
        data={receipts}
        columns={columns}
        searchPlaceholder="Rechercher dans les réceptions…"
        emptyMessage="Aucun arrivage enregistré pour l’instant."
      />
    </div>
  );
};

export default StockReceipts;
