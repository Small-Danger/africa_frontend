import React, { useState } from 'react';
import DataTable from './DataTable';
import SelectableTable from './SelectableTable';
import BulkActions from './BulkActions';
import FilterPanel from './FilterPanel';
import ExportButton from './ExportButton';

const DataTableWithSelection = ({
  columns,
  data,
  loading = false,
  searchable = true,
  pagination = true,
  itemsPerPage = 10,
  actions = null,
  onCreate = null,
  createLabel = "Ajouter",
  emptyMessage = "Aucune donnée disponible",
  sortable = true,
  onSort = null,
  sortColumn = null,
  sortDirection = 'asc',
  selectable = true,
  onSelectionChange = null,
  bulkActions = [],
  onBulkAction = null,
  filters = [],
  onFilter = null,
  exportable = false,
  onExport = null,
  className = ""
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrage des données
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Pagination des données
  const paginatedData = React.useMemo(() => {
    if (!pagination) return filteredData;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage, pagination]);

  // Calcul du nombre total de pages
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Gestion de la recherche
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Gestion du changement de page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Gestion du tri
  const handleSort = (column, direction) => {
    if (onSort) {
      onSort(column, direction);
    }
  };

  // Gestion de la sélection
  const handleSelectionChange = (items) => {
    setSelectedItems(items);
    if (onSelectionChange) {
      onSelectionChange(items);
    }
  };

  // Gestion des filtres
  const handleFilterApply = (filters) => {
    if (onFilter) {
      onFilter(filters);
    }
  };

  const handleFilterReset = () => {
    if (onFilter) {
      onFilter({});
    }
  };

  // Gestion des actions en masse
  const handleBulkAction = async (actionKey, items) => {
    if (onBulkAction) {
      await onBulkAction(actionKey, items);
      setSelectedItems([]); // Réinitialiser la sélection après l'action
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header avec recherche, filtres, export et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
          {searchable && (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {filters.length > 0 && (
            <FilterPanel
              filters={filters}
              onApply={handleFilterApply}
              onReset={handleFilterReset}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            />
          )}
          
          {exportable && (
            <ExportButton
              onExport={onExport}
              disabled={loading || filteredData.length === 0}
            />
          )}
          
          {onCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {createLabel}
            </button>
          )}
        </div>
      </div>

      {/* Actions en masse */}
      {selectable && selectedItems.length > 0 && (
        <BulkActions
          selectedItems={selectedItems}
          actions={bulkActions}
          onAction={handleBulkAction}
        />
      )}

      {/* Filtres */}
      {showFilters && filters.length > 0 && (
        <FilterPanel
          filters={filters}
          onApply={handleFilterApply}
          onReset={handleFilterReset}
          isOpen={true}
          onToggle={() => setShowFilters(false)}
        />
      )}

      {/* Tableau de données */}
      {selectable ? (
        <SelectableTable
          columns={columns}
          data={paginatedData}
          loading={loading}
          sortable={sortable}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          actions={actions}
          emptyMessage={emptyMessage}
          onSelectionChange={handleSelectionChange}
        />
      ) : (
        <DataTable
          columns={columns}
          data={paginatedData}
          loading={loading}
          searchable={false}
          pagination={false}
          actions={actions}
          emptyMessage={emptyMessage}
          sortable={sortable}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}à{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredData.length)}
                </span>
                {' '}sur{' '}
                <span className="font-medium">{filteredData.length}</span>
                {' '}résultats
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? 'z-10 bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Info sur le nombre de résultats */}
      {searchable && (
        <div className="text-sm text-gray-500 text-center">
          {filteredData.length} résultat{filteredData.length !== 1 ? 's' : ''} trouvé{filteredData.length !== 1 ? 's' : ''}
          {searchTerm && ` pour "${searchTerm}"`}
        </div>
      )}
    </div>
  );
};

export default DataTableWithSelection;
