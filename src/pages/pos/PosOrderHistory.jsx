import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { posService } from '../../services/posApi';
import {
  formatPosMoney,
  methodLabel,
  PosAlert,
  PosButton,
  PosEmptyState,
  PosLoadingScreen,
  PosPageHeader,
  PosProductThumb,
} from '../../components/pos/posShared';
import { RefreshCw, ShoppingBag, XCircle } from 'lucide-react';
import PosReceipt from './PosReceipt';

const PosOrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reprintOrder, setReprintOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await posService.getTodayOrders();
      setOrders(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelTarget || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      await posService.cancelOrder(cancelTarget.id, cancelReason.trim());
      setCancelTarget(null);
      setCancelReason('');
      await loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <PosLoadingScreen message="Chargement de l'historique…" />;
  }

  const totalSales = orders
    .filter((o) => o.status !== 'annulée')
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto pb-8">
      <PosPageHeader
        title="Historique des ventes"
        description="Session de caisse en cours"
        action={
          <PosButton variant="secondary" size="sm" onClick={loadOrders}>
            <RefreshCw size={14} />
            Actualiser
          </PosButton>
        }
      />

      {orders.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Ventes</p>
            <p className="text-2xl font-bold text-brand-green mt-1">{orders.filter((o) => o.status !== 'annulée').length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Chiffre du jour</p>
            <p className="text-lg font-bold text-brand-orange-dark mt-1">{formatPosMoney(totalSales)}</p>
          </div>
        </div>
      )}

      {error && <div className="mb-4"><PosAlert type="error">{error}</PosAlert></div>}

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <PosEmptyState
            icon={ShoppingBag}
            title="Aucune vente"
            description="Les ventes de cette session apparaîtront ici."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cancelled = order.status === 'annulée';
            const firstItem = order.items?.[0];

            return (
              <article
                key={order.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  cancelled ? 'border-red-200 opacity-85' : 'border-gray-100'
                }`}
              >
                <div className="p-4 flex gap-3">
                  {firstItem && (
                    <PosProductThumb
                      src={firstItem.product_image}
                      alt={firstItem.product_name}
                      size="xl"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900">{order.order_number}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {new Date(order.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          cancelled
                            ? 'bg-red-100 text-red-700'
                            : 'bg-brand-green-light text-brand-green-dark'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-brand-green mt-2">{formatPosMoney(order.total_amount)}</p>
                    {order.cancellation_reason && (
                      <p className="text-xs text-red-600 mt-1">Motif : {order.cancellation_reason}</p>
                    )}
                  </div>
                </div>

                {order.items?.length > 0 && (
                  <ul className="px-4 pb-3 space-y-1.5 border-t border-gray-50 pt-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-sm">
                        <PosProductThumb src={item.product_image} alt={item.product_name} size="sm" />
                        <span className="text-gray-700 flex-1 truncate">
                          {item.quantity}× {item.product_name}
                          {item.variant_name ? ` — ${item.variant_name}` : ''}
                        </span>
                        <span className="font-semibold text-gray-900 shrink-0">
                          {formatPosMoney(item.total_price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="px-4 py-3 bg-brand-cream/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-gray-500">
                    {order.payments?.map((p) => (
                      <span key={p.id} className="mr-2">
                        {methodLabel(p.method)} {formatPosMoney(p.amount)}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <PosButton variant="ghost" size="sm" onClick={() => setReprintOrder(order)}>
                      Réimprimer
                    </PosButton>
                    {user?.role === 'admin' && !cancelled && (
                      <PosButton
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setCancelTarget(order);
                          setCancelReason('');
                        }}
                      >
                        <XCircle size={14} />
                        Annuler
                      </PosButton>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {reprintOrder && <PosReceipt order={reprintOrder} onClose={() => setReprintOrder(null)} />}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="font-bold text-lg mb-2">Annuler {cancelTarget.order_number}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Le stock sera remis à jour. La vente restera visible dans l&apos;historique.
            </p>
            <form onSubmit={handleCancel} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Motif d&apos;annulation *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: erreur de saisie…"
                  required
                  rows={3}
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-brand-green outline-none text-sm resize-none"
                />
              </div>
              <div className="flex gap-2">
                <PosButton type="button" variant="secondary" onClick={() => setCancelTarget(null)} className="flex-1">
                  Retour
                </PosButton>
                <PosButton type="submit" variant="danger" loading={cancelling} className="flex-1">
                  Confirmer
                </PosButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosOrderHistory;
