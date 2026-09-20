import { useCallback, useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { settingsService } from '../../services/api';
import {
  AdminPageHeader,
  AdminButton,
  AdminLoadingScreen,
  AdminPanel,
} from '../../components/admin/adminShared';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import NotificationToast from '../../components/ui/NotificationToast';

const emptySettings = {
  preorder_delay_days: 14,
  unpaid_expiry_hours: 24,
  low_stock_threshold: 5,
  min_deposit_percent: 0,
  payment_methods: [],
  whatsapp_number: '',
  notify_whatsapp: true,
  notify_email: true,
};

const Settings = () => {
  const [form, setForm] = useState(emptySettings);
  const [options, setOptions] = useState([]);
  const [canEditIdentity, setCanEditIdentity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsService.get();
      if (response.success) {
        setForm({ ...emptySettings, ...response.data.settings });
        setOptions(response.data.payment_method_options || []);
        setCanEditIdentity(Boolean(response.data.can_edit_identity));
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Impossible de charger les paramètres',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMethod = (name) => {
    if (!canEditIdentity) return;
    setForm((prev) => {
      const current = prev.payment_methods || [];
      const next = current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name];
      return { ...prev, payment_methods: next };
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = {
      preorder_delay_days: Number(form.preorder_delay_days),
      unpaid_expiry_hours: Number(form.unpaid_expiry_hours),
      low_stock_threshold: Number(form.low_stock_threshold),
      min_deposit_percent: Number(form.min_deposit_percent),
    };

    if (canEditIdentity) {
      payload.payment_methods = form.payment_methods;
      payload.whatsapp_number = form.whatsapp_number || null;
      payload.notify_whatsapp = Boolean(form.notify_whatsapp);
      payload.notify_email = Boolean(form.notify_email);
    }

    try {
      const response = await settingsService.update(payload);
      if (response.success) {
        setForm({ ...emptySettings, ...response.data.settings });
        setNotification({ type: 'success', message: response.message });
      }
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setNotification({
        type: 'error',
        message: err.message || 'Enregistrement impossible',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AdminLoadingScreen label="Chargement des paramètres…" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Règles de la boutique : précommande, expiration, stock faible et moyens de paiement. Elles serviront au stock et aux commandes."
        action={
          <AdminButton variant="primary" icon={Save} loading={submitting} onClick={handleSubmit}>
            Enregistrer
          </AdminButton>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminPanel
          title="Ventes et stock"
          subtitle="Modifiable par l’administrateur et le gérant."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Délai de précommande (jours)
              </label>
              <Input
                type="number"
                min={1}
                max={90}
                value={form.preorder_delay_days}
                onChange={(e) => setField('preorder_delay_days', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Par défaut 14 jours. Un article à 0 reste commandable sous ce délai.</p>
              {errors.preorder_delay_days && (
                <p className="text-sm text-red-600 mt-1">{errors.preorder_delay_days[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration d’une commande non payée (heures)
              </label>
              <Input
                type="number"
                min={1}
                max={168}
                value={form.unpaid_expiry_hours}
                onChange={(e) => setField('unpaid_expiry_hours', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Par défaut 24 h. Ensuite la réservation sera libérée.</p>
              {errors.unpaid_expiry_hours && (
                <p className="text-sm text-red-600 mt-1">{errors.unpaid_expiry_hours[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seuil de stock faible
              </label>
              <Input
                type="number"
                min={0}
                max={999}
                value={form.low_stock_threshold}
                onChange={(e) => setField('low_stock_threshold', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Badge « plus que N » sous ce seuil. Défaut : 5.</p>
              {errors.low_stock_threshold && (
                <p className="text-sm text-red-600 mt-1">{errors.low_stock_threshold[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acompte minimum pour valider (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.min_deposit_percent}
                onChange={(e) => setField('min_deposit_percent', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">0 % = on peut accepter sans paiement. 50 % = il faut au moins la moitié avant d’accepter.</p>
              {errors.min_deposit_percent && (
                <p className="text-sm text-red-600 mt-1">{errors.min_deposit_percent[0]}</p>
              )}
            </div>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Boutique et notifications"
          subtitle={canEditIdentity ? 'Réservé à l’administrateur.' : 'Seul l’administrateur peut modifier cette partie.'}
        >
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Modes de paiement actifs</p>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const checked = (form.payment_methods || []).includes(option.name);
                  return (
                    <label
                      key={option.name}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                        checked
                          ? 'bg-brand-green-light border-brand-green/30 text-brand-green-dark'
                          : 'bg-white border-gray-200 text-gray-600'
                      } ${canEditIdentity ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={checked}
                        disabled={!canEditIdentity}
                        onChange={() => toggleMethod(option.name)}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
              {errors.payment_methods && (
                <p className="text-sm text-red-600 mt-1">{errors.payment_methods[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro WhatsApp de la boutique
              </label>
              <Input
                value={form.whatsapp_number || ''}
                disabled={!canEditIdentity}
                onChange={(e) => setField('whatsapp_number', e.target.value)}
                placeholder="+226 63 12 68 49"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={Boolean(form.notify_whatsapp)}
                  disabled={!canEditIdentity}
                  onChange={(e) => setField('notify_whatsapp', e.target.checked)}
                />
                Notifications WhatsApp
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={Boolean(form.notify_email)}
                  disabled={!canEditIdentity}
                  onChange={(e) => setField('notify_email', e.target.checked)}
                />
                Notifications e-mail
              </label>
            </div>
          </div>
        </AdminPanel>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={submitting}>
            <SettingsIcon className="h-4 w-4 mr-2" />
            Enregistrer les paramètres
          </Button>
        </div>
      </form>

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

export default Settings;
