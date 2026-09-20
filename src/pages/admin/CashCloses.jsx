import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { financeService } from '../../services/api';
import {
  AdminPageHeader,
  AdminButton,
  AdminLoadingScreen,
  AdminStatCard,
  AdminPanel,
  formatAdminMoney,
} from '../../components/admin/adminShared';
import Badge from '../../components/ui/Badge';
import NotificationToast from '../../components/ui/NotificationToast';

const emptySummary = {
  sessions_count: 0,
  closed_count: 0,
  open_count: 0,
  sales_total: 0,
  discrepancy_total: 0,
};

const methodLabel = {
  especes: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  carte: 'Carte',
};

const discrepancyTone = (value) => {
  if (value == null) return 'text-gray-400';
  if (value === 0) return 'text-brand-green';
  if (value > 0) return 'text-sky-700';
  return 'text-red-600';
};

const CashCloses = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [notification, setNotification] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await financeService.listCloses();
      if (response.success) {
        setItems(response.data.items || []);
        setSummary({ ...emptySummary, ...(response.data.summary || {}) });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Impossible de charger les clôtures' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <AdminLoadingScreen label="Chargement des clôtures…" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Chaque fermeture de caisse : ventes du jour, encaissements et écart du tiroir."
        action={
          <AdminButton variant="outline" icon={RefreshCw} loading={refreshing} onClick={() => load(true)}>
            Actualiser
          </AdminButton>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard label="Sessions" value={String(summary.sessions_count)} accent="violet" />
        <AdminStatCard label="Clôturées" value={String(summary.closed_count)} accent="green" />
        <AdminStatCard label="Ventes clôturées" value={formatAdminMoney(summary.sales_total)} accent="orange" />
        <AdminStatCard
          label="Écarts"
          value={formatAdminMoney(summary.discrepancy_total)}
          accent={summary.discrepancy_total === 0 ? 'green' : 'orange'}
        />
      </div>

      <AdminPanel title="Journées de caisse" subtitle="La plus récente en premier.">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune session de caisse pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {items.map((session) => {
              const report = session.report || {};
              const open = openId === session.id;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setOpenId(open ? null : session.id)}
                  className="w-full text-left rounded-xl border border-gray-100 bg-gray-50 p-4 hover:border-brand-green/30 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {session.cashier_name || 'Caissier'}
                        {session.is_open ? (
                          <Badge variant="warning" className="ml-2">Ouverte</Badge>
                        ) : (
                          <Badge variant="success" className="ml-2">Clôturée</Badge>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Ouverte le {session.opened_at ? new Date(session.opened_at).toLocaleString('fr-FR') : '—'}
                        {session.closed_at ? ` · fermée le ${new Date(session.closed_at).toLocaleString('fr-FR')}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatAdminMoney(report.sales_total)}</p>
                      <p className={`text-sm font-semibold ${discrepancyTone(session.discrepancy)}`}>
                        Écart {session.discrepancy == null ? '—' : formatAdminMoney(session.discrepancy)}
                      </p>
                    </div>
                  </div>
                  {open && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Ventes</p>
                        <p className="font-semibold">{report.sales_count || 0} · {formatAdminMoney(report.sales_total)}</p>
                      </div>
                      {Object.entries(methodLabel).map(([key, label]) => (
                        <div key={key}>
                          <p className="text-gray-400 text-xs">{label}</p>
                          <p className="font-semibold">{formatAdminMoney(report.payments?.[key] || 0)}</p>
                        </div>
                      ))}
                      <div>
                        <p className="text-gray-400 text-xs">Fond / attendu / compté</p>
                        <p className="font-semibold">
                          {formatAdminMoney(report.opening_amount)} · {formatAdminMoney(report.expected_cash)} ·{' '}
                          {report.counted_cash == null ? '—' : formatAdminMoney(report.counted_cash)}
                        </p>
                      </div>
                      {(report.cash_in > 0 || report.cash_out > 0) && (
                        <div>
                          <p className="text-gray-400 text-xs">Mouvements</p>
                          <p className="font-semibold">+{formatAdminMoney(report.cash_in)} / −{formatAdminMoney(report.cash_out)}</p>
                        </div>
                      )}
                      {session.notes && (
                        <div className="col-span-2">
                          <p className="text-gray-400 text-xs">Note</p>
                          <p>{session.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </AdminPanel>

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

export default CashCloses;
