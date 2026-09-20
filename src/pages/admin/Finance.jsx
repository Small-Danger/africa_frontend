import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Banknote, Truck, ShoppingCart, RefreshCw } from 'lucide-react';
import { financeService } from '../../services/api';
import {
  AdminPageHeader,
  AdminButton,
  AdminLoadingScreen,
  AdminStatCard,
  AdminPanel,
  formatAdminMoney,
} from '../../components/admin/adminShared';
import NotificationToast from '../../components/ui/NotificationToast';

const emptyReport = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  label: '',
  invested: 0,
  merchandise_cost: 0,
  shipping_cost: 0,
  receipts_count: 0,
  sales: 0,
  orders_count: 0,
  remaining: 0,
  progress_percent: 0,
  recovered: false,
  series: [],
};

const barHeight = (value, max) => {
  if (max <= 0 || value <= 0) return 4;
  return Math.max(6, Math.round((value / max) * 160));
};

const FinanceChart = ({ series = [], currentMonth }) => {
  const max = Math.max(1, ...series.flatMap((point) => [point.invested || 0, point.sales || 0]));
  const hasData = series.some((point) => (point.invested || 0) > 0 || (point.sales || 0) > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 sm:gap-3 h-52">
        {series.map((point) => {
          const active = point.year === currentMonth?.year && point.month === currentMonth?.month;
          return (
            <div key={`${point.year}-${point.month}`} className="flex-1 min-w-0 flex flex-col items-center gap-2">
              <div className="w-full h-40 flex items-end justify-center gap-1">
                <div
                  className="w-[42%] max-w-[1.35rem] rounded-t-md bg-brand-orange"
                  style={{ height: `${barHeight(point.invested, max)}px` }}
                  title={`Investi ${formatAdminMoney(point.invested)}`}
                />
                <div
                  className="w-[42%] max-w-[1.35rem] rounded-t-md bg-brand-green"
                  style={{ height: `${barHeight(point.sales, max)}px` }}
                  title={`Ventes ${formatAdminMoney(point.sales)}`}
                />
              </div>
              <p className={`text-[11px] capitalize ${active ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                {point.short_label || point.label}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-orange" />
          Investi (camions)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-green" />
          Ventes
        </span>
      </div>
      {!hasData && (
        <p className="text-sm text-gray-500">
          Pas encore de camion ni de vente sur ces 6 mois. Le diagramme se remplira dès le prochain arrivage.
        </p>
      )}
    </div>
  );
};

const shiftMonth = (year, month, delta) => {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
};

const Finance = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const load = useCallback(async (nextYear = year, nextMonth = month) => {
    setLoading(true);
    try {
      const response = await financeService.getMonth({ year: nextYear, month: nextMonth });
      if (response.success) setReport(response.data);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Impossible de charger le rapport',
      });
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const go = (delta) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  if (loading && !report.label) {
    return <AdminLoadingScreen label="Chargement du rapport…" />;
  }

  const remainingPositive = report.remaining > 0;
  const insight = report.invested === 0
    ? 'Aucun arrivage enregistré ce mois. Les ventes s’affichent quand même.'
    : report.recovered
      ? `L’investissement du mois est récupéré. Les ventes dépassent les camions de ${formatAdminMoney(Math.abs(report.remaining))}.`
      : `Il reste ${formatAdminMoney(report.remaining)} à encaisser pour rentrer dans les camions de ce mois.`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Compare l’argent mis dans les arrivages et les ventes du même mois, hors commandes annulées ou expirées."
        action={
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" icon={ChevronLeft} onClick={() => go(-1)}>
              Mois précédent
            </AdminButton>
            <p className="text-sm font-semibold text-gray-800 min-w-[9rem] text-center capitalize">
              {report.label || `${month}/${year}`}
            </p>
            <AdminButton variant="outline" icon={ChevronRight} onClick={() => go(1)}>
              Mois suivant
            </AdminButton>
            <AdminButton variant="ghost" icon={RefreshCw} onClick={() => load()}>
              Actualiser
            </AdminButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <AdminStatCard
          label="Investi (camions)"
          value={formatAdminMoney(report.invested)}
          hint={`${report.receipts_count} arrivage(s) · marchandise ${formatAdminMoney(report.merchandise_cost)}`}
          icon={Truck}
          accent="orange"
        />
        <AdminStatCard
          label="Ventes"
          value={formatAdminMoney(report.sales)}
          hint={`${report.orders_count} commande(s) hors annulées / expirées`}
          icon={ShoppingCart}
          accent="green"
        />
        <AdminStatCard
          label={
            report.invested === 0
              ? 'Écart'
              : remainingPositive
                ? 'Reste à récupérer'
                : 'Au-delà de l’investissement'
          }
          value={formatAdminMoney(Math.abs(report.remaining))}
          icon={Banknote}
          accent={remainingPositive ? 'violet' : 'emerald'}
        />
        <AdminStatCard
          label="Avancement"
          value={`${report.progress_percent} %`}
          hint={report.shipping_cost ? `Dont transport ${formatAdminMoney(report.shipping_cost)}` : undefined}
          accent="green"
        />
      </div>

      <AdminPanel
        title="Évolution sur 6 mois"
        subtitle="Orange = argent mis dans les camions. Vert = ventes hors annulations."
      >
        <FinanceChart series={report.series || []} currentMonth={report} />
      </AdminPanel>

      <AdminPanel title="Lecture du mois">
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${report.recovered ? 'bg-brand-green' : 'bg-brand-orange'}`}
            style={{ width: `${report.progress_percent}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-4">{insight}</p>
        <p className="text-xs text-gray-400 mt-2">
          Ce n’est pas encore une marge produit par produit : on compare le total des camions au total des ventes du mois.
        </p>
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

export default Finance;
