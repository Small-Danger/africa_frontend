// Configuration de l'API
import { CONTACT_CONFIG } from './contact';

export const API_CONFIG = {
  // URL de base de l'API (peut être surchargée par les variables d'environnement)
  // Pour tester sur téléphone, remplacez localhost par l'IP de votre ordinateur
  // Exemple: 'http://192.168.11.180:8000/api'
  BASE_URL: import.meta.env.VITE_API_URL || 'https://api.afrikraga.com/api',
  
  // Timeout des requêtes (en millisecondes)
  TIMEOUT: 30000,
  
  // Configuration des en-têtes par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Configuration des endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      FORGOT_PASSWORD: '/auth/forgot-password',
      REFRESH: '/auth/refresh',
    },
    ADMIN: {
      CATEGORIES: '/admin/categories',
      PRODUCTS: '/admin/products',
      ORDERS: '/admin/orders',
      USERS: '/admin/users',
      STATS: {
        DASHBOARD: '/admin/stats/dashboard',
        SALES: '/admin/stats/sales',
        PRODUCTS: '/admin/stats/products',
        USERS: '/admin/stats/users',
      },
    },
    PUBLIC: {
      CATEGORIES: '/categories',
      PRODUCTS: '/products',
    },
  },
  
  // Configuration des statuts de commande
  ORDER_STATUSES: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },
  
  // Configuration des rôles utilisateur
  USER_ROLES: {
    ADMIN: 'admin',
    USER: 'user',
  },
  
  // Configuration des messages d'erreur
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Erreur de connexion au serveur',
    UNAUTHORIZED: 'Accès non autorisé',
    FORBIDDEN: 'Accès interdit',
    NOT_FOUND: 'Ressource non trouvée',
    VALIDATION_ERROR: 'Données invalides',
    SERVER_ERROR: 'Erreur interne du serveur',
    UNKNOWN_ERROR: 'Erreur inconnue',
  },
  
  // Configuration des notifications
  NOTIFICATION_CONFIG: {
    SUCCESS_DURATION: 5000,
    ERROR_DURATION: 7000,
    WARNING_DURATION: 6000,
    INFO_DURATION: 4000,
  },
};

// Configuration de l'environnement
export const ENV_CONFIG = {
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  APP_NAME: import.meta.env.VITE_APP_NAME || 'BS Shop Admin',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
};

// Configuration des fonctionnalités
export const FEATURE_CONFIG = {
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
  ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
};

// Configuration des limites
export const LIMIT_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_PRODUCT_IMAGES: 10,
  MAX_CATEGORY_NAME_LENGTH: 100,
  MAX_PRODUCT_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  PAGINATION_DEFAULT: 20,
  PAGINATION_MAX: 100,
};

// Configuration des formats
export const FORMAT_CONFIG = {
  DATE_FORMAT: 'DD/MM/YYYY',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  TIME_FORMAT: 'HH:mm',
  CURRENCY_FORMAT: '0,0.00',
  PHONE_FORMAT: CONTACT_CONFIG.PHONE_FORMAT,
};

// Configuration des validations
export const VALIDATION_CONFIG = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 100,
  PHONE_MAX_LENGTH: 20,
  ADDRESS_MAX_LENGTH: 500,
};

export default API_CONFIG;
