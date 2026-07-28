import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Phone,
  Truck,
  ShieldCheck,
  Leaf,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { categoryService, productService } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import ProductCarousel from '../../components/ProductCarousel';
import SimpleBannerCarousel from '../../components/SimpleBannerCarousel';
import useBanners from '../../hooks/useBanners';
import { ShimmerTextVariants } from '../../components/ShimmerText';
import { generateWhatsAppLink, CONTACT_CONFIG } from '../../config/contact';

const HeroContent = ({ compact = false }) => (
  <>
    <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 mb-3 shadow-sm border border-brand-green/10">
      <span className="text-lg">🇲🇦</span>
      <span className="text-sm font-semibold text-brand-green">Produits authentiques du Maroc</span>
    </div>
    <h1 className={`font-bold text-gray-900 mb-2 leading-tight ${compact ? 'text-xl' : 'text-2xl lg:text-3xl mb-3'}`}>
      Huiles, savons, épices &amp; cosmétiques naturels
    </h1>
    <p className={`text-gray-600 max-w-2xl mx-auto leading-relaxed ${compact ? 'text-sm mb-5' : 'text-base mb-6'}`}>
      Découvrez une sélection soignée d&apos;<strong className="text-brand-green">huiles essentielles</strong>,{' '}
      <strong className="text-brand-green">savons artisanaux</strong>,{' '}
      <strong className="text-brand-green">épices</strong> et{' '}
      <strong className="text-brand-green">parfums authentiques</strong> importés directement du Maroc.
    </p>
    <Link
      to="/catalog"
      className={`inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white rounded-2xl font-semibold transition-all shadow-md hover:shadow-lg ${
        compact ? 'px-6 py-3 text-sm' : 'px-8 py-3.5 text-base hover:scale-[1.02]'
      }`}
    >
      <Sparkles size={18} />
      Découvrir la boutique
      <ArrowRight size={18} />
    </Link>
  </>
);

const ModernHome = () => {
  const [categories, setCategories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { banners } = useBanners();

  const testApiConnection = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.afrikraga.com/api';
      const response = await fetch(`${apiUrl}/banners`);
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const isConnected = await testApiConnection();
        if (!isConnected) {
          if (isMounted) {
            setError('Impossible de se connecter à l\'API. Vérifiez que le backend est démarré.');
            setLoading(false);
          }
          return;
        }

        const [categoriesRes, productsRes] = await Promise.all([
          categoryService.getCategories(),
          productService.getProducts({ per_page: 12, sort_by: 'created_at', sort_order: 'desc' }),
        ]);

        if (!isMounted) return;

        if (categoriesRes.success) {
          setCategories(categoriesRes.data.categories || []);
        } else {
          setError('Erreur lors du chargement des catégories.');
        }

        if (productsRes.success) {
          const products = productsRes.data.products || [];
          const shuffled = [...products].sort(() => Math.random() - 0.5);
          setPopularProducts(shuffled.slice(0, 10));
          setNewProducts(products.slice(0, 8));
        } else {
          setError('Erreur lors du chargement des produits.');
        }
      } catch (err) {
        if (isMounted) {
          setError('Erreur lors du chargement des données: ' + err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [testApiConnection]);

  const handleWhatsAppContact = useCallback(() => {
    const message = "Bonjour ! J'aimerais des informations sur vos produits marocains. Pouvez-vous m'aider ?";
    window.open(generateWhatsAppLink(message), '_blank');
  }, []);

  const handlePhoneCall = useCallback(() => {
    window.open(`tel:${CONTACT_CONFIG.WHATSAPP_PHONE}`, '_self');
  }, []);

  if (loading) {
    return <ShimmerTextVariants.PageLoader subtitle="Chargement des trésors du Maroc..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-brand-green text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-green-dark transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-24 md:pb-8">
      {/* ── MOBILE : texte hero (sans logo) + bannière en carte ── */}
      <section className="md:hidden bg-gradient-to-b from-brand-green-light/60 to-brand-cream">
        <div className="max-w-6xl mx-auto px-4 pt-5 pb-4 text-center">
          <HeroContent compact />
        </div>
        {banners && banners.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pb-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="h-44 sm:h-52">
                <SimpleBannerCarousel banners={banners} autoPlay interval={5000} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── DESKTOP : bannière pleine largeur + carte chevauchante (version précédente) ── */}
      <section className="hidden md:block relative">
        {banners && banners.length > 0 ? (
          <div className="relative w-full h-72 lg:h-80 overflow-hidden">
            <SimpleBannerCarousel banners={banners} autoPlay interval={5000} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-brand-green to-brand-green-dark" />
        )}
        <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-10">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
            <img
              src="/logo-principale.png"
              alt="AfrikRaga"
              className="h-28 mx-auto mb-4 object-contain"
            />
            <HeroContent />
          </div>
        </div>
      </section>

      {/* Catégories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-6 md:mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Nos catégories</h2>
            <Link to="/catalog" className="text-sm font-medium text-brand-green hover:text-brand-green-dark flex items-center gap-1">
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/catalog/${category.slug}`}
                className="flex-shrink-0 w-36 sm:w-40 group"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all group-hover:shadow-md group-hover:border-brand-green/30">
                  <div className="h-28 sm:h-32 bg-brand-green-light flex items-center justify-center overflow-hidden">
                    {category.image_main ? (
                      <img
                        src={category.image_main}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Leaf size={32} className="text-brand-green/40" />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-brand-green transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Coups de cœur — carrousel mobile / grille desktop */}
      {popularProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-8 md:mt-12">
          <div className="flex items-center justify-between mb-1 md:mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Coups de cœur</h2>
            <Link to="/catalog" className="text-sm font-medium text-brand-orange hover:text-brand-orange-dark flex items-center gap-1">
              Voir plus <ArrowRight size={14} />
            </Link>
          </div>
          <div className="md:hidden">
            <ProductCarousel
              products={popularProducts}
              itemsPerSlide={2}
              autoPlay
              interval={3500}
              dotColor="bg-brand-green"
            />
          </div>
          <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4">
            {popularProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} showActions />
            ))}
          </div>
        </section>
      )}

      {/* Bandeau confiance */}
      <section className="max-w-6xl mx-auto px-4 mt-8 md:mt-12">
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {[
            { icon: Leaf, label: '100% naturel', sub: 'Produits authentiques' },
            { icon: Truck, label: 'Livraison rapide', sub: 'Partout au pays' },
            { icon: ShieldCheck, label: 'Qualité garantie', sub: 'Sélection rigoureuse' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 text-center border border-gray-100 shadow-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-2">
                <Icon size={20} className="text-brand-green" />
              </div>
              <p className="font-semibold text-gray-900 text-xs md:text-sm">{label}</p>
              <p className="text-gray-500 text-[10px] md:text-xs mt-0.5 hidden sm:block">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nouveautés — carrousel mobile / grille desktop */}
      {newProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-8 md:mt-12">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-4">Nouveautés</h2>
          <div className="md:hidden">
            <ProductCarousel
              products={newProducts}
              itemsPerSlide={2}
              autoPlay
              interval={3000}
              dotColor="bg-brand-orange"
            />
          </div>
          <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} showActions />
            ))}
          </div>
        </section>
      )}

      {/* CTA WhatsApp */}
      <section className="max-w-6xl mx-auto px-4 mt-8 md:mt-12 mb-4">
        <div className="bg-gradient-to-br from-brand-green to-brand-green-dark rounded-2xl md:rounded-3xl p-6 md:p-8 text-center text-white">
          <h3 className="text-lg md:text-xl font-bold mb-2">Une question ? On vous conseille</h3>
          <p className="text-white/80 text-sm mb-5 max-w-md mx-auto">
            Notre équipe vous aide à choisir le produit marocain idéal pour vous.
          </p>
          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              type="button"
              onClick={handleWhatsAppContact}
              className="flex-1 bg-white text-brand-green px-4 py-3 rounded-xl font-semibold text-sm hover:bg-brand-green-light transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handlePhoneCall}
              className="flex-1 bg-transparent border-2 border-white/60 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              Appeler
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ModernHome;
