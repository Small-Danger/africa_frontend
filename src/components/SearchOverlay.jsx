import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, ArrowRight } from 'lucide-react';
import SearchSuggestionRow from './SearchSuggestionRow';

/**
 * Panneau de recherche plein écran — évite que le header « bouge »
 * et que les suggestions se mélangent au contenu de la page.
 */
const SearchOverlay = ({
  open,
  onClose,
  searchQuery,
  onSearchChange,
  onSubmit,
  searchResults,
  showSuggestions,
  isSearching,
  onSuggestionClick,
  onViewAllResults,
}) => {
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => inputRef.current?.focus(), 50);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onSubmit(e);
      onClose();
    },
    [onSubmit, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col md:hidden" role="dialog" aria-modal="true" aria-label="Rechercher">
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 pt-3 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center"
            aria-label="Fermer la recherche"
          >
            <X size={20} className="text-gray-700" />
          </button>

          <form onSubmit={handleSubmit} className="flex-1 min-w-0">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-green" />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Huile, savon, épice, thé…"
                value={searchQuery}
                onChange={onSearchChange}
                className="w-full pl-10 pr-10 py-3 bg-brand-cream border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-base text-gray-900"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-green border-t-transparent" />
                </div>
              )}
            </div>
          </form>
        </div>

        {searchQuery.trim().length >= 2 && (
          <button
            type="button"
            onClick={() => {
              onViewAllResults();
              onClose();
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-green text-white text-sm font-semibold"
          >
            <Search size={16} />
            Voir tous les résultats
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-8">
        {!searchQuery.trim() && (
          <div className="text-center py-12">
            <Search size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Que cherchez-vous ?</p>
            <p className="text-xs text-gray-500 mt-1">Tapez au moins 2 caractères</p>
          </div>
        )}

        {searchQuery.trim().length === 1 && (
          <p className="text-sm text-gray-500 text-center py-8">Continuez à taper…</p>
        )}

        {showSuggestions && searchResults.length > 0 && (
          <ul className="space-y-2">
            {searchResults.map((result, index) => (
              <li key={`${result.type}-${result.id}-${index}`}>
                <SearchSuggestionRow
                  result={result}
                  showArrow
                  onClick={() => {
                    onSuggestionClick(result);
                    onClose();
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
          <div className="text-center py-12">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-800">Aucune suggestion</p>
            <button
              type="button"
              onClick={() => {
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                onClose();
              }}
              className="mt-4 text-sm font-semibold text-brand-green"
            >
              Lancer la recherche complète
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
