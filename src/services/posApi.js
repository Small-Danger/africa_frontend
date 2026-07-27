import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

class PosApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.name = 'PosApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function posRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && !window.location.pathname.includes('/auth/login')) {
      window.location.href = '/auth/login?redirect=/pos';
    }
    throw new PosApiError(data.message || 'Erreur POS', response.status, data.errors || {});
  }

  return data;
}

export const posService = {
  getCurrentSession: () => posRequest('/pos/cash-session/current'),
  openSession: (openingAmount, notes = '') =>
    posRequest('/pos/cash-session/open', {
      method: 'POST',
      body: JSON.stringify({ opening_amount: openingAmount, notes }),
    }),
  closeSession: (closingAmountCounted, notes = '') =>
    posRequest('/pos/cash-session/close', {
      method: 'POST',
      body: JSON.stringify({ closing_amount_counted: closingAmountCounted, notes }),
    }),
  searchProducts: (q) => posRequest(`/pos/products/search?q=${encodeURIComponent(q)}`),
  searchClients: (phone) => posRequest(`/pos/clients/search?phone=${encodeURIComponent(phone)}`),
  quickCreateClient: (name, phone = '') =>
    posRequest('/pos/clients/quick-create', {
      method: 'POST',
      body: JSON.stringify({ name, phone: phone || null }),
    }),
  createOrder: (payload) =>
    posRequest('/pos/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getTodayOrders: () => posRequest('/pos/orders/today'),
  cancelOrder: (orderId, cancellationReason) =>
    posRequest(`/pos/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellation_reason: cancellationReason }),
    }),
  getCashMovements: () => posRequest('/pos/cash-movements/current-session'),
  createCashMovement: (type, amount, reason) =>
    posRequest('/pos/cash-movements', {
      method: 'POST',
      body: JSON.stringify({ type, amount, reason }),
    }),
  getPinStatus: () => posRequest('/pos/pin/status'),
  setPin: (password, pin, pinConfirmation) =>
    posRequest('/pos/set-pin', {
      method: 'POST',
      body: JSON.stringify({ password, pin, pin_confirmation: pinConfirmation }),
    }),
  unlock: (userId, pin) =>
    posRequest('/pos/unlock', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, pin }),
    }),
};

export const PAYMENT_METHODS = [
  { value: 'especes', label: 'Espèces' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'wave', label: 'Wave' },
];

export default posService;
