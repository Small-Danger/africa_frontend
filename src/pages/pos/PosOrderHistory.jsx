import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { posService, PAYMENT_METHODS } from '../../services/posApi';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PosReceipt from './PosReceipt';

const formatMoney = (n) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' F CFA';

const methodLabel = (method) =>
  PAYMENT_METHODS.find((m) => m.value === method)?.label || method;

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
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement historique..." />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique des ventes</h1>
          <p className="text-sm text-slate-500 mt-1">Session de caisse en cours</p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadOrders}>
          Actualiser
        </Button>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">Aucune vente pour l&apos;instant — les ventes apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm ${
                order.status === 'annulée' ? 'border-red-200 opacity-80' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{order.order_number}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.created_at).toLocaleString('fr-FR')}
                  </p>
                  <p className="text-lg font-bold text-emerald-700 mt-1">
                    {formatMoney(order.total_amount)}
                  </p>
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${
                      order.status === 'annulée'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {order.status}
                  </span>
                  {order.cancellation_reason && (
                    <p className="text-xs text-red-600 mt-1">Motif : {order.cancellation_reason}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setReprintOrder(order)}
                  >
                    Réimprimer
                  </Button>
                  {user?.role === 'admin' && order.status !== 'annulée' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setCancelTarget(order);
                        setCancelReason('');
                      }}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
              <ul className="mt-3 text-sm text-slate-600 border-t pt-2">
                {order.items?.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.product_name}
                    {item.variant_name ? ` — ${item.variant_name}` : ''} ({formatMoney(item.total_price)})
                  </li>
                ))}
              </ul>
              <div className="text-xs text-slate-500 mt-2">
                {order.payments?.map((p) => (
                  <span key={p.id} className="mr-3">
                    {methodLabel(p.method)}: {formatMoney(p.amount)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {reprintOrder && (
        <PosReceipt order={reprintOrder} onClose={() => setReprintOrder(null)} />
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-2">Annuler la vente {cancelTarget.order_number}</h3>
            <p className="text-sm text-slate-600 mb-4">
              Le stock sera remis à jour. La vente restera visible dans l&apos;historique.
            </p>
            <form onSubmit={handleCancel}>
              <label className="block text-sm font-medium mb-1">Motif d&apos;annulation *</label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: erreur de saisie, client a changé d'avis..."
                required
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCancelTarget(null)}
                >
                  Retour
                </Button>
                <Button type="submit" variant="destructive" fullWidth loading={cancelling}>
                  Confirmer l&apos;annulation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosOrderHistory;
