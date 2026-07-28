import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, TrendingUp, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { suggestionService } from '../services/api';
import ProductCard from './ProductCard';

const SECTIONS = [
  {
    key: 'complementary',
    title: 'Complétez votre panier',
    subtitle: 'Parfait avec vos articles',
    icon: ShoppingCart,
    maxItems: 6,
  },
  {
    key: 'frequently_bought_together',
    title: 'Souvent achetés ensemble',
    subtitle: 'D\'autres clients ont aussi choisi',
    icon: TrendingUp,
    maxItems: 4,
  },
  {
    key: 'similar_products',
    title: 'Articles similaires',
    subtitle: 'Dans la même catégorie',
    icon: Sparkles,
    maxItems: 6,
  },
  {
    key: 'popular_products',
    title: 'Les plus populaires',
    subtitle: 'Favoris de nos clients',
    icon: TrendingUp,
    maxItems: 4,
  },
  {
    key: 'recent_products',
    title: 'Nouveautés',
    subtitle: 'Derniers arrivages AfrikRaga',
    icon: Clock,
    maxItems: 4,
  },
];

const resolveCategoryCatalogPath = (category) => {
  if (!category?.slug) return '/catalog';
  if (category.parent?.slug) {
    return `/catalog/${category.parent.slug}/${category.slug}`;
  }
  return `/catalog/${category.slug}`;
};

const normalizeForCard = (product) => {
  const variantCount = product?.variant ? 1 : 0;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    image_main: product.image_main,
    base_price: product.base_price ?? product.price,
    min_price: product.price ?? product.base_price,
    has_variants: Boolean(product.variant),
    variants_count: variantCount,
    category: product.category,
  };
};

const SuggestionSection = ({ title, subtitle, icon: Icon, products, catalogLink = '/catalog' }) => {
  if (!products.length) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-4 md:px-5 md:py-5 border-b border-gray-100 bg-gradient-to-r from-brand-green-light/30 to-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center flex-shrink-0 shadow-sm">
              <Icon size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              <p className="text-[11px] text-brand-green font-semibold mt-1">
                {products.length} produit{products.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link
            to={catalogLink}
            className="flex-shrink-0 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-green hover:text-brand-green-dark mt-1"
          >
            Voir tout
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div className="md:hidden p-4 -mx-1">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-1">
          {products.map((product) => (
            <div key={product.id} className="snap-start w-[9.25rem] flex-shrink-0">
              <ProductCard product={normalizeForCard(product)} />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1">Glissez pour voir plus →</p>
      </div>

      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4 p-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={normalizeForCard(product)} />
        ))}
      </div>

      <div className="h-0.5 bg-gradient-to-r from-brand-green via-brand-orange to-brand-green" aria-hidden />
    </section>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {[1, 2].map((block) => (
      <div key={block} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-green-light" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const CartSuggestions = ({ cartSessionId }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = {};
        if (cartSessionId) {
          headers['X-Session-ID'] = cartSessionId;
        }

        const response = await suggestionService.getCartSuggestions(headers);
        if (response.success) {
          setSuggestions(response.data);
        } else {
          setError('Impossible de charger les suggestions');
        }
      } catch {
        setError('Impossible de charger les suggestions');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [cartSessionId]);

  const filteredSections = useMemo(() => {
    if (!suggestions) return [];
    const seen = new Set();

    return SECTIONS.map((section) => {
      const products = (suggestions[section.key] ?? [])
        .filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        })
        .slice(0, section.maxItems);

      const catalogLink =
        section.key === 'recent_products'
          ? '/catalog'
          : resolveCategoryCatalogPath(products[0]?.category);

      return { ...section, products, catalogLink };
    }).filter((s) => s.products.length > 0);
  }, [suggestions]);

  if (loading) return <LoadingSkeleton />;
  if (error || filteredSections.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <span className="inline-flex items-center gap-1.5 bg-brand-orange-light text-brand-orange-dark text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full">
          🇲🇦 Sélection AfrikRaga
        </span>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-3">Complétez votre commande</h2>
        <p className="text-sm text-gray-500 mt-1">Des produits qui s&apos;accordent parfaitement avec votre panier</p>
      </div>

      {filteredSections.map(({ key, title, subtitle, icon, products, catalogLink }) => (
        <SuggestionSection
          key={key}
          title={title}
          subtitle={subtitle}
          icon={icon}
          products={products}
          catalogLink={catalogLink}
        />
      ))}
    </div>
  );
};

export default CartSuggestions;
