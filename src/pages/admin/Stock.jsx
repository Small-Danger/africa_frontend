import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  ClipboardList,
  PackageCheck,
  PackageX,
  Pencil,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { stockService } from '../../services/api';
import {
  AdminPageHeader,
  AdminButton,
  AdminLoadingScreen,
  AdminStatCard,
} from '../../components/admin/adminShared';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import NotificationToast from '../../components/ui/NotificationToast';
import DataTable from '../../components/ui/DataTable';
import { STOCK_STATE } from '../../utils/stockStatus';
import StockReceipts from './StockReceipts';

const emptySummary = {
  total: 0,
  needs_inventory: 0,
  en_stock: 0,
  sur_commande: 0,
  rupture: 0,
  low: 0,
};

const statusBadge = (item) => {
  if (item.needs_inventory) return 'info';
  if (item.stock_status === STOCK_STATE.RUPTURE) return 'destructive';
  if (item.stock_status === STOCK_STATE.SUR_COMMANDE || item.is_low) return 'warning';
  return 'success';
};

const Stock = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [canViewQuantities, setCanViewQuantities] = useState(false);
  const [canAdjust, setCanAdjust] = useState(false);
  const [status, setStatus] = useState('all');
  const [tab, setTab] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadStock = useCallback(async (silent = false, nextStatus = status) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await stockService.getAll({ status: nextStatus === 'all' ? undefined : nextStatus });
      if (response.success) {
        setItems(response.data.items || []);
        setSummary(response.data.summary || emptySummary);
        setCanViewQuantities(Boolean(response.data.can_view_quantities));
        setCanAdjust(Boolean(response.data.can_adjust));
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Impossible de charger le stock',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const filterBy = (nextStatus) => {
    setStatus(nextStatus);
    loadStock(true, nextStatus);
  };

  const openAdjust = (item) => {
    setEditing(item);
    setQuantity(item.stock_quantity == null ? '' : String(item.stock_quantity));
    setReason('');
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setFormErrors({});

    try {
      const response = await stockService.adjust(editing.id, {
        quantity: Number(quantity),
        reason: reason.trim() || undefined,
      });
      if (response.success) {
        setNotification({ type: 'success', message: response.message });
        setEditing(null);
        await loadStock(true);
      }
    } catch (err) {
      if (err.errors) setFormErrors(err.errors);
      setNotification({
        type: 'error',
        message: err.message || 'Correction impossible',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'product_name',
        label: 'Produit',
        render: (value, row) => (
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">
              {row.variant_name}
              {row.sku ? ` · ${row.sku}` : ''}
            </p>
          </div>
        ),
      },
      {
        key: 'category_name',
        label: 'Catégorie',
        render: (value) => value || '—',
      },
      {
        key: 'stock_label',
        label: 'État',
        searchable: false,
        render: (value, row) => <Badge variant={statusBadge(row)}>{value}</Badge>,
      },
    ];

    if (canViewQuantities) {
      cols.push({
        key: 'stock_quantity',
        label: 'Disponible',
        searchable: false,
        render: (value, row) =>
          row.needs_inventory ? (
            <span className="text-sky-700 text-sm font-medium">À compter</span>
          ) : (
            <span className="font-semibold text-gray-900">{value}</span>
          ),
      });
    }

    if (canAdjust) {
      cols.push({
        key: 'id',
        label: '',
        searchable: false,
        render: (_, row) => (
          <Button variant="ghost" size="sm" onClick={() => openAdjust(row)}>
            <Pencil className="h-4 w-4 mr-1" />
            {row.needs_inventory ? 'Inventorier' : 'Corriger'}
          </Button>
        ),
      });
    }

    return cols;
  }, [canAdjust, canViewQuantities]);

  if (loading) {
    return <AdminLoadingScreen label="Chargement du stock…" />;
  }

  const cardActive = (key) =>
    `cursor-pointer text-left w-full min-w-0 rounded-2xl ${status === key ? 'ring-2 ring-brand-orange ring-offset-2' : ''}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description={
          tab === 'receipts'
            ? 'Enregistrez un arrivage : les pièces s’ajoutent au stock. Notez le coût de la marchandise et le transport pour suivre l’investissement.'
            : canAdjust
              ? 'Comptez les variantes encore vides, corrigez un écart, suivez les ruptures et le stock faible.'
              : 'Consultez l’état du stock : en stock, sur commande, rupture. Les quantités restent réservées à l’admin et au gérant.'
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canAdjust && (
              <div className="flex rounded-xl bg-white border border-gray-100 p-1">
                <AdminButton
                  variant={tab === 'inventory' ? 'primary' : 'ghost'}
                  className="!py-2"
                  onClick={() => setTab('inventory')}
                >
                  Inventaire
                </AdminButton>
                <AdminButton
                  variant={tab === 'receipts' ? 'primary' : 'ghost'}
                  className="!py-2"
                  onClick={() => setTab('receipts')}
                >
                  Restockage
                </AdminButton>
              </div>
            )}
            {tab === 'inventory' && (
              <AdminButton variant="outline" icon={RefreshCw} loading={refreshing} onClick={() => loadStock(true)}>
                Actualiser
              </AdminButton>
            )}
          </div>
        }
      />

      {tab === 'receipts' && canAdjust ? (
        <StockReceipts onStockChanged={() => loadStock(true)} onNotify={setNotification} />
      ) : (
        <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <button type="button" className={cardActive('all')} onClick={() => filterBy('all')}>
          <AdminStatCard label="Total" value={String(summary.total)} icon={Boxes} accent="green" />
        </button>
        <button type="button" className={cardActive('needs_inventory')} onClick={() => filterBy('needs_inventory')}>
          <AdminStatCard label="À inventorier" value={String(summary.needs_inventory)} icon={ClipboardList} accent="orange" />
        </button>
        <button type="button" className={cardActive('en_stock')} onClick={() => filterBy('en_stock')}>
          <AdminStatCard label="En stock" value={String(summary.en_stock)} icon={PackageCheck} accent="emerald" />
        </button>
        <button type="button" className={cardActive('sur_commande')} onClick={() => filterBy('sur_commande')}>
          <AdminStatCard label="Sur commande" value={String(summary.sur_commande)} icon={Boxes} accent="violet" />
        </button>
        <button type="button" className={cardActive('rupture')} onClick={() => filterBy('rupture')}>
          <AdminStatCard label="Rupture" value={String(summary.rupture)} icon={PackageX} accent="orange" />
        </button>
        <button type="button" className={cardActive('low')} onClick={() => filterBy('low')}>
          <AdminStatCard label="Stock faible" value={String(summary.low)} icon={AlertTriangle} accent="orange" />
        </button>
      </div>

      <DataTable
        title="Variantes"
        data={items}
        columns={columns}
        searchPlaceholder="Rechercher un produit, une variante, un SKU…"
        emptyMessage="Aucune variante pour ce filtre."
        actions={
          canAdjust ? (
            <Link to="/admin/products">
              <Button variant="ghost">Ouvrir les fiches produits</Button>
            </Link>
          ) : null
        }
      />

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.needs_inventory ? 'Premier inventaire' : 'Corriger le stock'}
        size="md"
      >
        {editing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{editing.product_name}</span>
              {' · '}
              {editing.variant_name}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité comptée *</label>
              <Input
                type="number"
                min={0}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 12"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                0 = rupture, ou sur commande si la précommande est autorisée. Ne laissez pas vide : un chiffre est un inventaire.
              </p>
              {formErrors.quantity && <p className="text-sm text-red-600 mt-1">{formErrors.quantity[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motif (optionnel)</label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={editing.needs_inventory ? 'Inventaire initial' : 'Correction de stock'}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Enregistrer
              </Button>
            </div>
          </form>
        )}
      </Modal>
        </>
      )}

      {notification && (
        <NotificationToast
          type={notification.type}
          message={String(notification.message || '')}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Stock;
