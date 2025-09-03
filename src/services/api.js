import { API_CONFIG } from '../config/api';

// Cache désactivé temporairement
const apiCache = new Map();
const CACHE_TTL = 0; // Cache désactivé

// Configuration de l'API
const API_BASE_URL = API_CONFIG.BASE_URL;

// Classe pour gérer les erreurs API
class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Fonction utilitaire pour faire des requêtes HTTP avec cache
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Cache désactivé - pas de vérification
  console.log('🔄 Requête directe à l\'API (cache désactivé)');
  
  // Configuration par défaut
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  // Ajouter le token d'authentification si disponible
  const token = localStorage.getItem('auth_token');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  // Fusionner les options
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    
    // Gérer les réponses non-JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new ApiError('Réponse invalide du serveur', response.status);
    }

    const data = await response.json();

    // Gérer les erreurs HTTP
    if (!response.ok) {
      throw new ApiError(
        data.message || 'Erreur de requête',
        response.status,
        data.errors || {}
      );
    }

    // Cache désactivé - pas de sauvegarde
    console.log('💾 Cache désactivé - réponse non sauvegardée');

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Erreurs réseau ou autres
    throw new ApiError(
      error.message || 'Erreur de connexion',
      0
    );
  }
}

// Service d'authentification
export const authService = {
  // Inscription d'un nouveau client
  async register(userData) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Connexion (client ou admin)
  async login(email, password) {
    const credentials = { email, password };
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Déconnexion
  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  // Récupérer le profil utilisateur
  async getProfile() {
    return await apiRequest('/auth/me');
  },

  // Mettre à jour le profil
  async updateProfile(profileData) {
    return await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Mot de passe oublié
  async forgotPassword(emailOrPhone) {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(emailOrPhone),
    });
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },

  // Vérifier si l'utilisateur est admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser() {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Récupérer le token actuel
  getCurrentToken() {
    return localStorage.getItem('auth_token');
  }
};

// Service des catégories
export const categoryService = {
  // Lister toutes les catégories (endpoint public)
  async getCategories() {
    return await apiRequest('/categories');
  },

  // Récupérer les catégories avec hiérarchie (pour les formulaires)
  async getCategoriesHierarchy() {
    return await apiRequest('/categories');
  },

  // Alias pour getAll (compatibilité)
  async getAll() {
    return await this.getCategoriesHierarchy();
  },

  // Récupérer une catégorie spécifique
  async getCategory(id) {
    return await apiRequest(`/categories/${id}`);
  },

  // Créer une catégorie (Admin)
  async createCategory(categoryData) {
    // Maintenant on envoie toujours en JSON pour une meilleure compatibilité
    console.log('=== API SERVICE - Création catégorie ===');
    console.log('Type de données reçues:', typeof categoryData);
    console.log('Données reçues:', categoryData);
    
    // Vérifier si c'est un FormData (pour les images) ou un objet JSON
    const isFormData = categoryData instanceof FormData;
    
    if (isFormData) {
      console.log('⚠️ FormData détecté, conversion en JSON...');
      // Convertir FormData en JSON si nécessaire
      const jsonData = {};
      for (let [key, value] of categoryData.entries()) {
        if (key === 'image_main' && value instanceof File) {
          console.log('⚠️ Image ignorée (JSON ne supporte pas les fichiers)');
          continue;
        }
        jsonData[key] = value;
      }
      console.log('Données converties:', jsonData);
      
      return await apiRequest('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(jsonData),
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Envoi en JSON (cas normal maintenant)
    console.log('✅ Envoi en JSON');
    return await apiRequest('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Mettre à jour une catégorie (Admin)
  async updateCategory(id, categoryData) {
    // Vérifier si c'est un FormData (pour les images) ou un objet JSON
    const isFormData = categoryData instanceof FormData;
    
          return await apiRequest(`/admin/categories/${id}`, {
      method: 'PUT',
      body: isFormData ? categoryData : JSON.stringify(categoryData),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' }
    });
  },

  // Supprimer une catégorie (Admin)
  async deleteCategory(id) {
    return await apiRequest(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload d'image pour une catégorie (Admin)
  async uploadCategoryImage(id, imageFile) {
    const formData = new FormData();
    formData.append('image_main', imageFile);
    
    return await apiRequest(`/admin/categories/${id}/image`, {
      method: 'POST',
      body: formData,
      headers: {} // Pas de Content-Type pour FormData
    });
  }
};

// Service des produits
export const productService = {
  // Lister tous les produits avec filtres
  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.category_id) queryParams.append('category_id', filters.category_id);
    if (filters.subcategory_id) queryParams.append('subcategory_id', filters.subcategory_id);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.min_price) queryParams.append('min_price', filters.min_price);
    if (filters.max_price) queryParams.append('max_price', filters.max_price);
    if (filters.sort) queryParams.append('sort', filters.sort);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.per_page) queryParams.append('per_page', filters.per_page);

    const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiRequest(endpoint);
  },

  // Alias pour getAll (compatibilité)
  async getAll() {
    return await this.getProducts();
  },

  // Récupérer un produit spécifique
  async getProduct(id) {
    return await apiRequest(`/products/${id}`);
  },

  // Créer un produit (Admin)
  async createProduct(productData) {
    return await apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Mettre à jour un produit (Admin)
  async updateProduct(id, productData) {
    return await apiRequest(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // Supprimer un produit (Admin)
  async deleteProduct(id) {
    return await apiRequest(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  }
};

// Service des variantes
export const variantService = {
  // Récupérer une variante spécifique
  async getVariant(id) {
    return await apiRequest(`/variants/${id}`);
  },

  // Lister les variantes d'un produit (Admin)
  async getProductVariants(productId) {
    return await apiRequest(`/admin/products/${productId}/variants`);
  },

  // Créer une variante (Admin)
  async createVariant(productId, variantData) {
    return await apiRequest(`/admin/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(variantData),
    });
  },

  // Mettre à jour une variante (Admin)
  async updateVariant(productId, variantId, variantData) {
    return await apiRequest(`/admin/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(variantData),
    });
  },

  // Supprimer une variante (Admin)
  async deleteVariant(productId, variantId) {
    return await apiRequest(`/admin/products/${productId}/variants/${variantId}`, {
      method: 'DELETE',
    });
  }
};

// Service des images
export const imageService = {
  // Lister les images d'un produit
  async getProductImages(productId) {
    return await apiRequest(`/products/${productId}/images`);
  },

  // Créer des images (Admin)
  async createImages(productId, formData) {
    const url = `${API_BASE_URL}/admin/products/${productId}/images`;
    
    const token = localStorage.getItem('auth_token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData, // Pas de Content-Type pour FormData
    });

    if (!response.ok) {
      const data = await response.json();
      throw new ApiError(
        data.message || 'Erreur lors de l\'upload des images',
        response.status,
        data.errors || {}
      );
    }

    return await response.json();
  },

  // Mettre à jour une image (Admin)
  async updateImage(productId, imageId, imageData) {
    return await apiRequest(`/admin/products/${productId}/images/${imageId}`, {
      method: 'PUT',
      body: JSON.stringify(imageData),
    });
  },

  // Supprimer une image (Admin)
  async deleteImage(productId, imageId) {
    return await apiRequest(`/admin/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
    });
  },

  // Réorganiser les images (Admin)
  async reorderImages(productId, imageOrder) {
    return await apiRequest(`/admin/products/${productId}/images/reorder`, {
      method: 'POST',
      body: JSON.stringify({ image_order: imageOrder }),
    });
  }
};

// Service du panier
export const cartService = {
  // Récupérer le panier
  async getCart(headers = {}) {
    return await apiRequest('/cart', {
      headers: headers
    });
  },

  // Ajouter un produit au panier
  async addToCart(cartData, headers = {}) {
    return await apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify(cartData),
      headers: headers
    });
  },

  // Mettre à jour la quantité d'un item
  async updateCartItem(itemId, quantity, headers = {}) {
    return await apiRequest(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
      headers: headers
    });
  },

  // Supprimer un item du panier
  async removeCartItem(itemId, headers = {}) {
    return await apiRequest(`/cart/${itemId}`, {
      method: 'DELETE',
      headers: headers
    });
  },

  // Vider le panier
  async clearCart(headers = {}) {
    return await apiRequest('/cart', {
      method: 'DELETE',
      headers: headers
    });
  }
};

// Service des commandes
export const orderService = {
  // Créer une commande
  async createOrder(orderData) {
    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Lister les commandes du client
  async getMyOrders() {
    return await apiRequest('/orders');
  },

  // Récupérer une commande spécifique du client
  async getMyOrder(id) {
    return await apiRequest(`/orders/${id}`);
  },

  // Lister toutes les commandes (Admin)
  async getAllOrders(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.per_page) queryParams.append('per_page', filters.per_page);

    const endpoint = `/admin/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiRequest(endpoint);
  },

  // Récupérer une commande spécifique (Admin)
  async getOrder(id) {
    return await apiRequest(`/admin/orders/${id}`);
  },

  // Mettre à jour le statut d'une commande (Admin)
  async updateOrderStatus(id, status) {
    return await apiRequest(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Récupérer les commandes de l'utilisateur connecté
  async getUserOrders() {
    return await apiRequest('/orders');
  },

  // Créer une commande (utilisateur connecté)
  async createOrder(orderData) {
    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Créer une commande guest (utilisateur non connecté)
  async createGuestOrder(orderData) {
    return await apiRequest('/orders/guest', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }
};

// Service des notifications
export const notificationService = {
  // Lister les notifications de l'utilisateur
  async getNotifications() {
    return await apiRequest('/notifications');
  },

  // Marquer une notification comme lue
  async markAsRead(id) {
    return await apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead() {
    return await apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },

  // Supprimer une notification
  async deleteNotification(id) {
    return await apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  // Envoyer une notification à un client (Admin)
  async sendNotification(notificationData) {
    return await apiRequest('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  // Envoyer une notification à plusieurs clients (Admin)
  async sendMultipleNotifications(notificationData) {
    return await apiRequest('/admin/notifications/multiple', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  // Envoyer une notification promotionnelle (Admin)
  async sendPromotionalNotification(notificationData) {
    return await apiRequest('/admin/notifications/promotion', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }
};

// Service de gestion des clients (Admin)
export const clientService = {
  // Lister tous les clients
  async getClients(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.per_page) queryParams.append('per_page', filters.per_page);

    const endpoint = `/admin/clients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiRequest(endpoint);
  },

  // Bloquer/Débloquer un client
  async toggleClientStatus(clientId, action) {
    return await apiRequest('/admin/clients/toggle-status', {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, action }),
    });
  },

  // Obtenir les statistiques des clients
  async getClientStats() {
    return await apiRequest('/admin/clients/stats');
  }
};

// Service des suggestions
export const suggestionService = {
  // Obtenir des suggestions pour le panier
  async getCartSuggestions(headers = {}) {
    return await apiRequest('/suggestions/cart', {
      headers: headers
    });
  },

  // Obtenir des produits similaires pour une page produit
  async getSimilarProducts(productId) {
    return await apiRequest(`/suggestions/products/${productId}/similar`);
  }
};

// Service de test de l'API
export const testService = {
  // Test général de l'API
  async testApi() {
    return await apiRequest('/banners');
  },

  // Test du système d'authentification
  async testAuth() {
    return await apiRequest('/test/auth');
  }
};

// Export par défaut de tous les services
export default {
  auth: authService,
  categories: categoryService,
  products: productService,
  variants: variantService,
  images: imageService,
  cart: cartService,
  orders: orderService,
  notifications: notificationService,
  clients: clientService,
  suggestions: suggestionService,
  test: testService,
};
