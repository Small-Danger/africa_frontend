import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { stockService } from '../../services/api';
import { AdminButton, AdminPanel, AdminStatCard } from '../../components/admin/adminShared';
import Badge from '../../components/ui/Badge';

const emptySummary = {
  waiting_lines: 0,
  waiting_units: 0,
  waiting_orders: 0,
};

const StockPreorders = ({ onNotify }) => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await stockService.listPreorders();
      if (response.success) {
        setItems(response.data.items || []);
        setSummary({ ...emptySummary, ...(response.data.summary || {}) });
      }
    } catch (err) {
      onNotify?.({ type: 'error', message: err.message || 'Impossible de charger la file' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminStatCard label="Commandes en file" value={String(summary.waiting_orders)} accent="orange" />
        <AdminStatCard label="Lignes" value={String(summary.waiting_lines)} accent="violet" />
        <AdminStatCard label="Pièces attendues" value={String(summary.waiting_units)} accent="green" />
      </div>

      <AdminPanel
        title="File d’attente FIFO"
        subtitle="Le prochain arrivage sert d’abord le client le plus ancien."
        action={
          <AdminButton variant="outline" icon={RefreshCw} loading={refreshing} onClick={() => load(true)}>
            Actualiser
          </AdminButton>
        }
      >
        {loading ? (
          <p className="text-sm text-gray-500">Chargement de la file…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">
            Personne n’attend de stock. Une commande « sur commande » apparaîtra ici, du plus ancien au plus récent.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((row) => (
              <div key={row.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      #{row.position} · {row.product_name} · {row.variant_name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {row.order_number} — {row.customer_name}
                      {row.customer_phone ? ` · ${row.customer_phone}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      En file depuis {row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="warning">En attente</Badge>
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      {row.quantity} / {row.original_quantity} pièce(s)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
};

export default StockPreorders;
