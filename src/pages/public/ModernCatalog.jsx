import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { categoryService, productService } from '../../services/api';
import CatalogLayoutFinal from '../../components/catalog/CatalogLayoutFinal';
import { ShimmerTextVariants } from '../../components/ShimmerText';

const PRODUCTS_PER_PAGE = 24;

const dedupeProducts = (items) => {
  const seen = new Set();
  return items.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
};

const ModernCatalog = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const [currentCategory, setCurrentCategory] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await categoryService.getCategories();
        if (response.success) {
          setCategories(response.data.categories);
        } else {
          setError('Erreur lors du chargement des catégories');
        }
      } catch {
        setError('Erreur lors du chargement des catégories');
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  /** Récupère toutes les pages d'une requête produits */
  const fetchAllPages = useCallback(async (filters) => {
    let page = 1;
    let collected = [];
    let total = 0;
    let lastPage = 1;

    do {
      const response = await productService.getProducts({
        ...filters,
        page,
        per_page: PRODUCTS_PER_PAGE,
        sort_by: 'sort_order',
        sort_order: 'asc',
      });
      if (!response.success) break;
      collected = [...collected, ...(response.data.products ?? [])];
      const pag = response.data.pagination;
      total = pag?.total ?? collected.length;
      lastPage = pag?.last_page ?? 1;
      page += 1;
    } while (page <= lastPage);

    return { products: collected, total };
  }, []);

  const loadProducts = useCallback(async () => {
    if (!categories.length || !categorySlug) {
      setAllProducts([]);
      setVisibleCount(PRODUCTS_PER_PAGE);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const category = categories.find((cat) => cat.slug === categorySlug);
    setCurrentCategory(category ?? null);

    if (!category) {
      setAllProducts([]);
      setError('Catégorie introuvable');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setVisibleCount(PRODUCTS_PER_PAGE);

      let result = { products: [], total: 0 };

      if (subcategorySlug) {
        const sub = category.subcategories?.find((s) => s.slug === subcategorySlug);
        if (!sub) {
          setAllProducts([]);
          return;
        }
        result = await fetchAllPages({ subcategory_id: sub.id });
      } else {
        // Tenter avec include_subcategories (API à jour)
        result = await fetchAllPages({
          category_id: category.id,
          include_subcategories: true,
        });

        // Repli si l'API ne supporte pas encore include_subcategories
        const subcategories = category.subcategories ?? [];
        if (subcategories.length > 0) {
          const directOnly = await fetchAllPages({ category_id: category.id });
          const expectedMin = subcategories.reduce(
            (sum, sub) => sum + (sub.products_count || 0),
            directOnly.total
          );
          if (result.total < expectedMin) {
            const subResults = await Promise.all(
              subcategories.map((sub) => fetchAllPages({ subcategory_id: sub.id }))
            );
            const merged = dedupeProducts([
              ...directOnly.products,
              ...subResults.flatMap((r) => r.products),
            ]);
            result = { products: merged, total: merged.length };
          }
        }
      }

      setAllProducts(result.products);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Erreur lors du chargement des produits');
      }
    } finally {
      setLoading(false);
    }
  }, [categories, categorySlug, subcategorySlug, fetchAllPages]);

  useEffect(() => {
    if (!categories.length) return;
    if (!categorySlug) {
      setAllProducts([]);
      setCurrentCategory(null);
      return;
    }
    loadProducts();
  }, [categories, categorySlug, subcategorySlug, loadProducts]);

  const visibleProducts = allProducts.slice(0, visibleCount);
  const pagination = {
    total: allProducts.length,
    current_page: 1,
    last_page: 1,
    per_page: PRODUCTS_PER_PAGE,
  };

  const handleLoadMore = useCallback(() => {
    setVisibleCount((c) => c + PRODUCTS_PER_PAGE);
  }, []);

  if (loading && categorySlug) {
    return <ShimmerTextVariants.PageLoader subtitle="Chargement des produits..." />;
  }

  if (loading && !categories.length) {
    return <ShimmerTextVariants.PageLoader subtitle="Chargement du catalogue..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-brand-green text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-green-dark"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <CatalogLayoutFinal
          categories={categories}
          products={visibleProducts}
          categorySlug={categorySlug}
          subcategorySlug={subcategorySlug}
          currentCategory={currentCategory}
          pagination={pagination}
          totalLoaded={allProducts.length}
          loadingMore={false}
          onLoadMore={handleLoadMore}
          hasMoreToShow={visibleCount < allProducts.length}
        />
      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ModernCatalog;
