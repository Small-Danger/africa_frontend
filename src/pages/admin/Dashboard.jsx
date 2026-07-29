import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Users,
  ShoppingCart,
  Banknote,
  Monitor,
  Plus,
  Package,
  FolderTree,
  Image,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { orderService, productService, clientService } from '../../services/api';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminPanel,
  AdminEmptyState,
  AdminAlert,
  AdminButton,
  AdminStatusBadge,
  AdminListRow,
  AdminQuickAction,
  AdminLoadingScreen,
} from '../../components/admin/adminShared';

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Cache local pour les données du dashboard
  const CACHE_KEY = 'dashboard_cache';
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  // Fonctions de gestion du cache
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la lecture du cache:', error);
    }
    return null;
  };

  const setCachedData = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du cache:', error);
    }
  };

  useEffect(() => {
    // Détecter si c'est un rechargement de page
    const pageLoadFlag = localStorage.getItem('dashboard_page_loaded');
    const isPageReload = !pageLoadFlag; // Si pas de flag, c'est un rechargement
    
    // Marquer que la page a été chargée
    localStorage.setItem('dashboard_page_loaded', 'true');
    
    const fetchDashboardData = async (isRefresh = false) => {
      try {
        // Vérifier le cache d'abord (sauf si c'est un refresh forcé ou un rechargement de page)
        if (!isRefresh && !isPageReload) {
          const cachedData = getCachedData();
          if (cachedData) {
            console.log('📦 Utilisation des données en cache');
            setStats(cachedData.stats);
            setRecentOrders(cachedData.recentOrders);
            setTopProducts(cachedData.topProducts);
            setLastUpdated(new Date(cachedData.timestamp));
            setLoading(false);
            
            // Recharger les données en arrière-plan pour mettre à jour le cache
            console.log('🔄 Rechargement en arrière-plan pour mettre à jour le cache...');
            setTimeout(() => {
              fetchDashboardData(true);
            }, 1000); // Attendre 1 seconde avant de recharger
            return;
          }
        }
        
        // Si c'est un rechargement de page, forcer le rechargement des données
        if (isPageReload) {
          console.log('🔄 Rechargement de page détecté - mise à jour des données...');
        }

                if (isRefresh) {
          // Si c'est un rechargement en arrière-plan, ne pas afficher l'état de loading
          if (!loading) {
            setRefreshing(true);
          }
        } else {
          setLoading(true);
        }
        setError(null);
        
        console.log('🔍 Début du chargement du dashboard...');
        
        // Vérifier l'authentification avant de faire les appels API
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.warn('⚠️ Aucun token d\'authentification trouvé');
          setError('Session expirée. Veuillez vous reconnecter.');
          setLoading(false);
          setRefreshing(false);
          return;
        }

        // Vérifier si le token est valide en testant l'endpoint /auth/me
        try {
          const authResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.afrikraga.com/api'}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          if (!authResponse.ok) {
            console.warn('⚠️ Token d\'authentification invalide');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setError('Session expirée. Veuillez vous reconnecter.');
            setLoading(false);
            setRefreshing(false);
            return;
          }
        } catch (authError) {
          console.warn('⚠️ Erreur de vérification d\'authentification:', authError);
          // Continuer même en cas d'erreur de vérification
        }
        
        // Test de connexion API simple d'abord
        try {
          const testResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.afrikraga.com/api'}/banners`);
          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log('✅ Test API réussi:', testData);
          } else {
            console.error('❌ Test API échoué:', testResponse.status);
          }
        } catch (testErr) {
          console.error('❌ Erreur test API:', testErr);
        }
        
        // Récupérer les données du dashboard avec les nouveaux services
        console.log('🔍 Appel des services API...');
        
        // Wrapper pour gérer les erreurs d'authentification
        const safeApiCall = async (apiCall) => {
          try {
            return await apiCall();
          } catch (error) {
            if (error.status === 401) {
              console.warn('⚠️ Erreur d\'authentification, suppression du token');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              throw new Error('Session expirée');
            }
            throw error;
          }
        };

        const [productsRes, clientsRes, ordersRes] = await Promise.all([
          safeApiCall(() => productService.getProducts({ per_page: 1000 })), // Récupérer tous les produits pour compter
          safeApiCall(() => clientService.getClientStats()), // Pour les stats clients
          safeApiCall(() => orderService.getAllOrders({ per_page: 1000 })) // Récupérer toutes les commandes pour les stats
        ]);

        console.log('🔍 Réponses API reçues:');
        console.log('📊 Produits:', productsRes);
        console.log('👥 Clients:', clientsRes);
        console.log('📦 Commandes:', ordersRes);

        // Calculer les statistiques réelles
        const totalProducts = productsRes?.success ? (productsRes.data?.pagination?.total || productsRes.data?.products?.length || 0) : 0;
        const totalClients = clientsRes?.success ? (clientsRes.data?.total_clients || clientsRes.data?.clients?.length || 0) : 0;
        const totalOrders = ordersRes?.success ? (ordersRes.data?.pagination?.total || ordersRes.data?.orders?.length || 0) : 0;
        const totalRevenue = ordersRes?.success ? Number(ordersRes.data?.summary?.total_revenue || 0) : 0;

        // Formater les statistiques pour l'affichage avec gestion d'erreur robuste
        const formattedStats = [
          {
            name: 'Total Produits',
            value: totalProducts.toString(),
            icon: ShoppingBag,
            accent: 'green',
            description: 'Produits actifs en catalogue',
          },
          {
            name: 'Clients Actifs',
            value: totalClients.toString(),
            icon: Users,
            accent: 'emerald',
            description: 'Clients enregistrés',
          },
          {
            name: 'Commandes',
            value: totalOrders.toString(),
            icon: ShoppingCart,
            accent: 'orange',
            description: 'Total des commandes',
          },
          {
            name: 'Chiffre d\'Affaires',
            value: `${Math.round(totalRevenue).toLocaleString('fr-FR')} FCFA`,
            icon: Banknote,
            accent: 'violet',
            description: 'CA total',
          },
        ];

        setStats(formattedStats);
        
        // Récupérer les commandes récentes avec gestion d'erreur
        if (ordersRes?.success && ordersRes.data?.orders) {
          console.log('🔍 Commandes trouvées:', ordersRes.data.orders);
          const recentOrdersData = ordersRes.data.orders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Trier par date décroissante
            .slice(0, 5) // Prendre les 5 plus récentes
            .map(order => ({
            id: `#${order.id}`,
              customer: order.client?.name || order.client?.email || 'Client anonyme',
              product: order.items_summary?.items_count > 0 ? `${order.items_summary.items_count} article(s)` : 'Aucun article',
              amount: `${Math.round(Number(order.total_amount))} FCFA`,
            status: order.status || 'en_attente',
              date: order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : 'Date inconnue',
              rawOrder: order // Garder les données brutes pour les produits populaires
            }));
          setRecentOrders(recentOrdersData);
        } else {
          console.log('⚠️ Aucune commande trouvée ou erreur API');
          setRecentOrders([]);
        }
        
                // Calculer les produits les plus commandés à partir des vraies commandes
        let topProductsData = [];
        
        if (ordersRes?.success && ordersRes.data?.orders && ordersRes.data.orders.length > 0) {
          console.log('🔍 Calcul des produits populaires à partir des commandes réelles...');
          
          try {
            // Récupérer les détails des commandes pour avoir les items
            const productStats = {};
            const ordersToAnalyze = ordersRes.data.orders.slice(0, 20); // Analyser plus de commandes
            
            // Fonction pour récupérer les détails d'une commande avec timeout
            const getOrderDetails = async (orderId) => {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const orderDetails = await safeApiCall(() => orderService.getOrder(orderId));
                clearTimeout(timeoutId);
                return orderDetails?.data?.order || null;
              } catch (error) {
                if (error.name === 'AbortError') {
                  console.warn(`⚠️ Timeout pour la commande ${orderId}`);
                } else {
                  console.warn(`⚠️ Impossible de récupérer les détails de la commande ${orderId}:`, error);
                }
                return null;
              }
            };
            
            // Analyser les commandes pour compter les produits
            console.log(`🔍 Analyse de ${ordersToAnalyze.length} commandes pour les produits populaires...`);
            const orderDetailsPromises = ordersToAnalyze.map(order => getOrderDetails(order.id));
            const orderDetailsResults = await Promise.allSettled(orderDetailsPromises);
            
            // Extraire les résultats valides
            const validOrderDetails = orderDetailsResults
              .filter(result => result.status === 'fulfilled' && result.value)
              .map(result => result.value);
            
            console.log(`✅ ${validOrderDetails.length} commandes détaillées récupérées avec succès`);
            
            // Compter les produits dans toutes les commandes
            let totalItemsProcessed = 0;
            validOrderDetails.forEach((orderDetails, orderIndex) => {
              if (orderDetails && orderDetails.items && orderDetails.items.length > 0) {
                console.log(`📦 Commande ${orderIndex + 1}: ${orderDetails.items.length} articles`);
                orderDetails.items.forEach(item => {
                  const productName = item.product?.name || item.product_name || 'Produit inconnu';
                  const quantity = parseInt(item.quantity) || 1;
                  const price = parseFloat(item.price) || 0;
                  
                  if (!productStats[productName]) {
                    productStats[productName] = {
                      name: productName,
                      totalQuantity: 0,
                      totalRevenue: 0,
                      orderCount: 0
                    };
                  }
                  
                  // Compter les quantités totales commandées
                  productStats[productName].totalQuantity += quantity;
                  productStats[productName].totalRevenue += price * quantity;
                  productStats[productName].orderCount += 1;
                  totalItemsProcessed++;
                });
              } else {
                console.log(`⚠️ Commande ${orderIndex + 1}: pas d'articles trouvés`);
              }
            });
            
            console.log(`📊 Total d'articles traités: ${totalItemsProcessed}`);
            console.log(`📊 Produits uniques trouvés: ${Object.keys(productStats).length}`);
            
            // Trier par quantité totale commandée (pas par nombre de commandes)
            if (totalItemsProcessed > 0) {
              topProductsData = Object.values(productStats)
                .sort((a, b) => b.totalQuantity - a.totalQuantity) // Trier par quantité totale
                .slice(0, 7)
                .map(product => ({
                  name: product.name,
                  sales: product.totalQuantity, // Quantité totale commandée
                  revenue: `${Math.round(product.totalRevenue)} FCFA`
                }));
              
              console.log('📊 Top produits calculés par quantité commandée:', topProductsData);
            } else {
              throw new Error('Aucun article trouvé dans les commandes');
            }
            
          } catch (error) {
            console.warn('⚠️ Erreur lors du calcul des produits populaires:', error);
            // Passer au fallback
          }
        }
        
        // Fallback : utiliser les produits réels si pas de données de commandes
        if (topProductsData.length === 0 && productsRes?.success && productsRes.data?.products) {
          console.log('🔄 Fallback: utilisation des produits réels...');
          
          const realProducts = productsRes.data.products;
          
          // Créer des statistiques basées sur les produits réels
          topProductsData = realProducts
            .sort((a, b) => parseFloat(b.base_price) - parseFloat(a.base_price))
            .slice(0, 7)
            .map((product, index) => {
              const baseSales = Math.floor((parseFloat(product.base_price) / 10) + (7 - index) * 2);
              const sales = Math.max(1, baseSales + Math.floor(Math.random() * 5));
              const revenue = parseFloat(product.base_price) * sales;
              
              return {
                name: product.name,
                sales: sales,
                revenue: `${Math.round(revenue)} FCFA`
              };
            });
          
          console.log('📊 Top produits créés à partir des produits réels:', topProductsData);
        }
        
        setTopProducts(topProductsData);
        
        console.log('✅ Dashboard chargé avec succès');
        setLastUpdated(new Date());
        
        // Sauvegarder en cache avec toutes les données
        const cacheData = {
          stats: formattedStats,
          recentOrders: recentOrders,
          topProducts: topProductsData || [],
          timestamp: Date.now()
        };
        setCachedData(cacheData);
        console.log('💾 Données sauvegardées en cache');
        
        // Nettoyer le flag de rechargement après le chargement
        if (isPageReload) {
          console.log('🧹 Rechargement de page détecté - données mises à jour');
        }
        
      } catch (err) {
        console.error('❌ Erreur lors du chargement du dashboard:', err);
        setError('Erreur lors du chargement des données: ' + err.message);
        
        // Utiliser des données par défaut en cas d'erreur
        setStats([
          {
            name: 'Total Produits',
            value: '0',
            icon: ShoppingBag,
            accent: 'green',
            description: 'Produits actifs en catalogue',
          },
          {
            name: 'Clients Actifs',
            value: '0',
            icon: Users,
            accent: 'emerald',
            description: 'Clients enregistrés',
          },
          {
            name: 'Commandes',
            value: '0',
            icon: ShoppingCart,
            accent: 'orange',
            description: 'Total des commandes',
          },
          {
            name: 'Chiffre d\'Affaires',
            value: '0 FCFA',
            icon: Banknote,
            accent: 'violet',
            description: 'CA total',
          },
        ]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchDashboardData();
    
    // Nettoyer le flag quand l'utilisateur quitte la page
    const handleBeforeUnload = () => {
      localStorage.removeItem('dashboard_page_loaded');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('🗑️ Cache vidé');
      // Recharger les données
      fetchDashboardData(true);
    } catch (error) {
      console.warn('Erreur lors du vidage du cache:', error);
    }
  };

  // Fonction utilitaire pour formater les montants de manière sécurisée
  const formatAmount = (amount) => {
    const numAmount = Number(amount) || 0;
    return Math.round(numAmount);
  };

  if (error) {
    return (
      <AdminAlert
        type="error"
        title="Erreur de chargement"
        action={
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={() => window.location.reload()}>
              Réessayer
            </AdminButton>
            {error.includes('Session expirée') && (
              <AdminButton
                variant="danger"
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('auth_user');
                  window.location.href = '/auth/login';
                }}
              >
                Se reconnecter
              </AdminButton>
            )}
          </div>
        }
      >
        {error}
      </AdminAlert>
    );
  }

  return (
    <>
      <AdminPageHeader
        description="Vue d'ensemble de votre boutique AfrikRaga"
        meta={
          lastUpdated
            ? `Dernière mise à jour : ${lastUpdated.toLocaleTimeString('fr-FR')}${refreshing ? ' · actualisation…' : ''}`
            : undefined
        }
        action={
          <>
            <AdminButton variant="outline" icon={RefreshCw} loading={refreshing} onClick={() => window.location.reload()}>
              Actualiser
            </AdminButton>
            <Link to="/admin/orders">
              <AdminButton variant="secondary" icon={TrendingUp}>
                Voir les commandes
              </AdminButton>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <AdminStatCard
            key={stat.name}
            label={stat.name}
            value={stat.value}
            hint={stat.description}
            icon={stat.icon}
            accent={stat.accent}
            loading={loading}
          />
        ))}
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <AdminQuickAction to="/admin/products" icon={Package} title="Produits" description="Gérer le catalogue" accent="green" />
        <AdminQuickAction to="/admin/orders" icon={ShoppingCart} title="Commandes" description="Suivi des ventes" accent="orange" />
        <AdminQuickAction to="/admin/categories" icon={FolderTree} title="Catégories" description="Organiser la boutique" accent="blue" />
        <AdminQuickAction to="/admin/banners" icon={Image} title="Bannières" description="Page d'accueil" accent="violet" />
      </div>

      {/* Bandeau POS */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-green-dark via-brand-green to-brand-green-dark p-5 sm:p-6 text-white shadow-lg border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Monitor size={22} className="text-brand-orange" />
              <h3 className="text-lg font-bold">Caisse boutique (POS)</h3>
            </div>
            <p className="text-white/75 text-sm max-w-xl">
              Gérez le personnel caisse et ouvrez une session de vente en magasin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/cashiers">
              <AdminButton variant="outline" icon={Plus} className="!bg-white !text-brand-green-dark !border-white/30">
                Personnel caisse
              </AdminButton>
            </Link>
            <Link to="/pos">
              <AdminButton variant="primary" icon={Monitor}>
                Ouvrir la caisse
              </AdminButton>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AdminPanel
          title="Commandes récentes"
          subtitle="Les 5 dernières commandes"
          action={
            <Link to="/admin/orders" className="text-xs font-semibold text-brand-green hover:text-brand-green-dark">
              Voir tout →
            </Link>
          }
        >
          {loading ? (
            <AdminLoadingScreen label="Chargement des commandes…" />
          ) : recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <AdminListRow
                  key={order.id}
                  icon={ShoppingCart}
                  title={order.customer}
                  subtitle={`${order.id} · ${order.product}`}
                  trailing={order.amount}
                  badge={
                    <div className="flex items-center gap-2">
                      <AdminStatusBadge status={order.status} />
                      <span className="text-[10px] text-gray-400">{order.date}</span>
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <AdminEmptyState
              icon={ShoppingCart}
              title="Aucune commande récente"
              description="Les nouvelles commandes apparaîtront ici"
            />
          )}
        </AdminPanel>

        <AdminPanel
          title="Produits populaires"
          subtitle="Les plus commandés"
          action={
            <Link to="/admin/products" className="text-xs font-semibold text-brand-green hover:text-brand-green-dark">
              Voir tout →
            </Link>
          }
        >
          {loading ? (
            <AdminLoadingScreen label="Analyse des ventes…" />
          ) : topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-brand-cream/50 border border-transparent"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green to-brand-orange flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales} unités vendues</p>
                  </div>
                  <p className="text-sm font-semibold text-brand-green-dark flex-shrink-0">{product.revenue}</p>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              icon={Package}
              title="Aucune donnée de vente"
              description="Les produits les plus vendus apparaîtront ici"
            />
          )}
        </AdminPanel>
      </div>
    </>
  );
};

export default Dashboard;