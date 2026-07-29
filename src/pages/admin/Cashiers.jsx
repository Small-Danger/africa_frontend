import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { cashierService } from '../../services/api';
import { AdminPageHeader, AdminButton, AdminLoadingScreen, AdminStatCard } from '../../components/admin/adminShared';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import NotificationToast from '../../components/ui/NotificationToast';
import DataTable from '../../components/ui/DataTable';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  pin: '',
};

const Cashiers = () => {
  const [cashiers, setCashiers] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, with_pin: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadCashiers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await cashierService.getAll();
      if (response.success) {
        setCashiers(response.data.cashiers || []);
        setSummary(response.data.summary || { total: 0, active: 0, with_pin: 0 });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de charger les caissiers',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCashiers();
  }, [loadCashiers]);

  const openCreateModal = () => {
    setEditingCashier(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (cashier) => {
    setEditingCashier(cashier);
    setFormData({
      name: cashier.name || '',
      email: cashier.email || '',
      password: '',
      phone: cashier.phone || cashier.whatsapp_phone || '',
      pin: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (formData.pin.trim()) {
        payload.pin = formData.pin.trim();
      }

      let response;
      if (editingCashier) {
        if (!payload.password) delete payload.password;
        response = await cashierService.update(editingCashier.id, payload);
      } else {
        payload.password = formData.password;
        response = await cashierService.create(payload);
      }

      if (response.success) {
        setNotification({
          type: 'success',
          title: 'Succès',
          message: response.message,
        });
        setShowModal(false);
        await loadCashiers(true);
      }
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      }
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Opération impossible',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cashier) => {
    try {
      const response = await cashierService.toggleStatus(cashier.id);
      if (response.success) {
        setNotification({
          type: 'success',
          title: 'Statut mis à jour',
          message: response.message,
        });
        await loadCashiers(true);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de modifier le statut',
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Nom',
        searchable: true,
        render: (value) => <span className="font-medium text-gray-900">{value}</span>,
      },
      {
        key: 'email',
        label: 'Email (connexion)',
        searchable: true,
      },
      {
        key: 'phone',
        label: 'Téléphone',
        searchable: true,
        render: (_, cashier) => cashier.phone || cashier.whatsapp_phone || '—',
      },
      {
        key: 'is_active',
        label: 'Statut',
        render: (value) => (
          <Badge variant={value ? 'success' : 'destructive'}>
            {value ? 'Actif' : 'Inactif'}
          </Badge>
        ),
      },
      {
        key: 'has_pin',
        label: 'PIN caisse',
        render: (value) => (
          <Badge variant={value ? 'primary' : 'warning'}>
            {value ? 'Configuré' : 'À définir'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        searchable: false,
        render: (_, cashier) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => openEditModal(cashier)}>
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(cashier)}
              className={cashier.is_active ? 'text-red-600' : 'text-green-600'}
            >
              {cashier.is_active ? 'Désactiver' : 'Activer'}
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return <AdminLoadingScreen label="Chargement du personnel caisse…" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Créez et gérez les comptes autorisés à utiliser la caisse POS."
        action={
          <>
            <Link to="/pos">
              <AdminButton variant="outline" icon={ComputerDesktopIcon}>
                Ouvrir la caisse
              </AdminButton>
            </Link>
            <AdminButton variant="primary" icon={PlusIcon} onClick={openCreateModal}>
              Nouveau caissier
            </AdminButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminStatCard label="Total caissiers" value={String(summary.total)} icon={UserGroupIcon} accent="green" />
        <AdminStatCard label="Comptes actifs" value={String(summary.active)} icon={ShieldCheckIcon} accent="emerald" />
        <AdminStatCard label="PIN configurés" value={String(summary.with_pin)} icon={KeyIcon} accent="violet" />
      </div>

      <div className="bg-brand-green-light border border-brand-green/20 rounded-2xl p-5">
        <h3 className="font-semibold text-brand-green-dark mb-2">Comment ça marche ?</h3>
        <ul className="text-sm text-brand-green space-y-1 list-disc list-inside">
          <li>Chaque caissier se connecte avec son <strong>email</strong> et <strong>mot de passe</strong>.</li>
          <li>Accès caisse : <strong>/pos</strong> après connexion.</li>
          <li>Le <strong>PIN à 4 chiffres</strong> sert au déverrouillage rapide de la caisse (optionnel à la création).</li>
          <li>Un compte <strong>inactif</strong> ne peut plus ouvrir de session caisse.</li>
        </ul>
      </div>

      <DataTable
        title="Liste des caissiers"
        data={cashiers}
        columns={columns}
        searchPlaceholder="Rechercher par nom, email ou téléphone..."
        emptyMessage="Aucun caissier enregistré — créez le premier compte caisse."
        actions={
          <Button variant="ghost" onClick={() => loadCashiers(true)} disabled={refreshing}>
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        }
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCashier ? 'Modifier le caissier' : 'Nouveau caissier'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Aminata Ouédraogo"
              required
            />
            {formErrors.name && <p className="text-sm text-red-600 mt-1">{formErrors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de connexion *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="caissiere@afrikraga.com"
              required
            />
            {formErrors.email && <p className="text-sm text-red-600 mt-1">{formErrors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe {editingCashier ? '(laisser vide pour ne pas changer)' : '*'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={editingCashier ? '••••••••' : 'Minimum 8 caractères'}
              required={!editingCashier}
              minLength={editingCashier ? undefined : 8}
            />
            {formErrors.password && <p className="text-sm text-red-600 mt-1">{formErrors.password[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+226 70 00 00 00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN caisse (4 chiffres)
              </label>
              <Input
                value={formData.pin}
                onChange={(e) => setFormData((prev) => ({ ...prev, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                placeholder="Ex: 1234"
                maxLength={4}
              />
              {formErrors.pin && <p className="text-sm text-red-600 mt-1">{formErrors.pin[0]}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingCashier ? 'Enregistrer' : 'Créer le compte'}
            </Button>
          </div>
        </form>
      </Modal>

      {notification && (
        <NotificationToast
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Cashiers;
