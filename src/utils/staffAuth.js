export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'admin' || user.is_admin) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

export function hasAnyPermission(user, permissions) {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function canAccessBackoffice(user) {
  return Boolean(user?.can_access_backoffice) || hasPermission(user, 'access.backoffice');
}

export function homePathForUser(user) {
  if (!user) return '/';
  if (user.role === 'caissiere' || (user.can_access_pos && !canAccessBackoffice(user))) {
    return '/pos';
  }
  if (hasPermission(user, 'finance.view') || user.role === 'admin' || user.role === 'gerant') {
    return '/admin';
  }
  if (canAccessBackoffice(user)) {
    return '/admin/orders';
  }
  return '/profile';
}

export const ROLE_LABELS = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  secretaire: 'Secrétaire',
  caissiere: 'Caissier',
  client: 'Client',
};
