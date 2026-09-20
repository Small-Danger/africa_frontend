import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { teamService } from '../../services/api';
import { AdminPageHeader, AdminButton, AdminLoadingScreen, AdminStatCard } from '../../components/admin/adminShared';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import NotificationToast from '../../components/ui/NotificationToast';
import DataTable from '../../components/ui/DataTable';
import { ROLE_LABELS } from '../../utils/staffAuth';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  pin: '',
  role: '',
};

const roleBadge = (role) => {
  if (role === 'gerant') return 'primary';
  if (role === 'secretaire') return 'warning';
  if (role === 'caissiere') return 'success';
  return 'secondary';
};

const Team = () => {
  const [members, setMembers] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    gerants: 0,
    secretaires: 0,
    caissiers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadTeam = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await teamService.getAll();
      if (response.success) {
        setMembers(response.data.members || []);
        setAssignableRoles(response.data.assignable_roles || []);
        setSummary(response.data.summary || summary);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de charger l\'équipe',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const defaultRole = assignableRoles[0]?.name || '';

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData({ ...emptyForm, role: defaultRole });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      password: '',
      phone: member.phone || member.whatsapp_phone || '',
      pin: '',
      role: member.role || defaultRole,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const pinRelevant = ['admin', 'gerant', 'caissiere'].includes(formData.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        role: formData.role,
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }
      if (pinRelevant && formData.pin.trim()) {
        payload.pin = formData.pin.trim();
      }

      let response;
      if (editingMember) {
        if (!payload.password) delete payload.password;
        response = await teamService.update(editingMember.id, payload);
      } else {
        payload.password = formData.password;
        response = await teamService.create(payload);
      }

      if (response.success) {
        setNotification({ type: 'success', title: 'Succès', message: response.message });
        setShowModal(false);
        await loadTeam(true);
      }
    } catch (err) {
      if (err.errors) setFormErrors(err.errors);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Opération impossible',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member) => {
    try {
      const response = await teamService.toggleStatus(member.id);
      if (response.success) {
        setNotification({ type: 'success', title: 'Statut mis à jour', message: response.message });
        await loadTeam(true);
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
        key: 'role_label',
        label: 'Rôle',
        render: (_, member) => (
          <Badge variant={roleBadge(member.role)}>
            {member.role_label || ROLE_LABELS[member.role] || member.role}
          </Badge>
        ),
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
        render: (_, member) => member.phone || member.whatsapp_phone || '—',
      },
      {
        key: 'is_active',
        label: 'Statut',
        render: (value) => (
          <Badge variant={value ? 'success' : 'destructive'}>{value ? 'Actif' : 'Inactif'}</Badge>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        searchable: false,
        render: (_, member) =>
          member.can_manage ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => openEditModal(member)}>
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleStatus(member)}
                className={member.is_active ? 'text-red-600' : 'text-green-600'}
              >
                {member.is_active ? 'Désactiver' : 'Activer'}
              </Button>
            </div>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          ),
      },
    ],
    []
  );

  if (loading) {
    return <AdminLoadingScreen label="Chargement de l'équipe…" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Créez les accès du personnel : gérant, secrétaires et caissiers, chacun avec son périmètre."
        action={
          <>
            <Link to="/pos">
              <AdminButton variant="outline" icon={ComputerDesktopIcon}>
                Ouvrir la caisse
              </AdminButton>
            </Link>
            {assignableRoles.length > 0 && (
              <AdminButton variant="primary" icon={PlusIcon} onClick={openCreateModal}>
                Nouveau compte
              </AdminButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminStatCard label="Membres" value={String(summary.total)} icon={UserGroupIcon} accent="green" />
        <AdminStatCard label="Actifs" value={String(summary.active)} icon={ShieldCheckIcon} accent="emerald" />
        <AdminStatCard label="Secrétaires" value={String(summary.secretaires)} icon={UserIcon} accent="orange" />
        <AdminStatCard label="Caissiers" value={String(summary.caissiers)} icon={ComputerDesktopIcon} accent="violet" />
      </div>

      <div className="bg-brand-green-light border border-brand-green/20 rounded-2xl p-5">
        <h3 className="font-semibold text-brand-green-dark mb-2">Qui fait quoi ?</h3>
        <ul className="text-sm text-brand-green space-y-1 list-disc list-inside">
          <li><strong>Gérant</strong> : boutique + site, stock, finance, secrétaires et caissiers.</li>
          <li><strong>Secrétaire</strong> : commandes du site, paiements WhatsApp, précommandes au comptoir.</li>
          <li><strong>Caissier</strong> : ventes en caisse (espèces, Wave, Orange Money).</li>
        </ul>
      </div>

      <DataTable
        title="Équipe"
        data={members}
        columns={columns}
        searchPlaceholder="Rechercher par nom, rôle, email…"
        emptyMessage="Aucun membre — créez le premier compte."
        actions={
          <Button variant="ghost" onClick={() => loadTeam(true)} disabled={refreshing}>
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        }
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMember ? 'Modifier le compte' : 'Nouveau compte'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              required
            >
              {assignableRoles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.label}
                </option>
              ))}
            </select>
            {formErrors.role && <p className="text-sm text-red-600 mt-1">{formErrors.role[0]}</p>}
          </div>

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
              placeholder="prenom@afrikraga.com"
              required
            />
            {formErrors.email && <p className="text-sm text-red-600 mt-1">{formErrors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe {editingMember ? '(laisser vide pour ne pas changer)' : '*'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={editingMember ? '••••••••' : 'Minimum 8 caractères'}
              required={!editingMember}
              minLength={editingMember ? undefined : 8}
            />
            {formErrors.password && <p className="text-sm text-red-600 mt-1">{formErrors.password[0]}</p>}
          </div>

          <div className={`grid grid-cols-1 ${pinRelevant ? 'md:grid-cols-2' : ''} gap-4`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+226 70 00 00 00"
              />
            </div>
            {pinRelevant && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN caisse (4 chiffres)</label>
                <Input
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pin: e.target.value.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                  placeholder="Ex: 1234"
                  maxLength={4}
                />
                {formErrors.pin && <p className="text-sm text-red-600 mt-1">{formErrors.pin[0]}</p>}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingMember ? 'Enregistrer' : 'Créer le compte'}
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

export default Team;
