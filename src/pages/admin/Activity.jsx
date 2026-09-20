import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ScrollText } from 'lucide-react';
import { activityService } from '../../services/api';
import { AdminPageHeader, AdminButton, AdminLoadingScreen } from '../../components/admin/adminShared';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import NotificationToast from '../../components/ui/NotificationToast';
import DataTable from '../../components/ui/DataTable';

const actionBadge = (action) => {
  if (action?.startsWith('team.')) return 'primary';
  if (action === 'settings.updated') return 'warning';
  if (action === 'stock.adjusted' || action === 'stock.received' || action === 'stock.reserved' || action === 'stock.preorder_allocated' || action === 'cash.closed' || action === 'order.payment_recorded') return 'info';
  if (action === 'stock.receipt_updated' || action === 'stock.reservation_released' || action === 'stock.preorder_queued') return 'warning';
  if (action === 'stock.receipt_cancelled' || action === 'stock.reservation_expired' || action === 'stock.preorder_cancelled') return 'destructive';
  return 'secondary';
};

const Activity = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadActivity = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await activityService.getAll({ per_page: 50 });
      if (response.success) {
        setEntries(response.data.entries || []);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Impossible de charger le journal',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const columns = useMemo(
    () => [
      {
        key: 'created_at',
        label: 'Date',
        render: (value) =>
          value
            ? new Date(value).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—',
      },
      {
        key: 'actor',
        label: 'Par',
        searchable: false,
        render: (_, row) => (
          <div>
            <p className="font-medium text-gray-900">{row.actor?.name || 'Système'}</p>
            {row.actor?.role_label && (
              <p className="text-xs text-gray-400">{row.actor.role_label}</p>
            )}
          </div>
        ),
      },
      {
        key: 'action_label',
        label: 'Action',
        render: (value, row) => <Badge variant={actionBadge(row.action)}>{value}</Badge>,
      },
      {
        key: 'description',
        label: 'Détail',
        searchable: true,
        render: (value) => <span className="text-gray-800">{value}</span>,
      },
    ],
    []
  );

  if (loading) {
    return <AdminLoadingScreen label="Chargement du journal…" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Qui a créé un compte, modifié un accès, changé un paramètre ou corrigé un stock."
        action={
          <AdminButton variant="outline" icon={RefreshCw} loading={refreshing} onClick={() => loadActivity(true)}>
            Actualiser
          </AdminButton>
        }
      />

      <DataTable
        title="Journal d’activité"
        data={entries}
        columns={columns}
        searchPlaceholder="Rechercher par nom, action, détail…"
        emptyMessage="Aucune action enregistrée pour l’instant."
        actions={
          <Button variant="ghost" onClick={() => loadActivity(true)} disabled={refreshing}>
            <ScrollText className="h-4 w-4 mr-2" />
            {entries.length} entrée{entries.length > 1 ? 's' : ''}
          </Button>
        }
      />

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

export default Activity;
