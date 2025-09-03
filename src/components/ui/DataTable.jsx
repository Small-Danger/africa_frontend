import React, { useState, useMemo } from 'react';
import Table from './Table';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';

const DataTable = ({
  title,
  data = [],
  columns = [],
  searchable = true,
  filterable = false,
  filters = [],
  onFilterChange,
  searchPlaceholder = 'Rechercher...',
  loading = false,
  emptyMessage = 'Aucune donnée trouvée',
  actions,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filtrer les données selon la recherche
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return columns.some(column => {
        if (column.searchable === false) return false;
        
        const value = column.accessor ? column.accessor(item) : item[column.key];
        if (value == null) return false;
        
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Paginer les données
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Retour à la première page lors d'une recherche
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Barre de recherche et filtres */}
        {(searchable || filterable) && (
          <div className="mb-6 space-y-4">
            {searchable && (
              <SearchBar
                placeholder={searchPlaceholder}
                onSearch={handleSearch}
                value={searchTerm}
              />
            )}
            
            {filterable && filters.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {filters.map((filter) => (
                  <div key={filter.key} className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      {filter.label}:
                    </label>
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filter.value || ''}
                      onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    >
                      <option value="">Tous</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tableau */}
        <Table
          data={paginatedData}
          columns={columns.map(col => ({
            key: col.key || col.name,
            label: col.label || col.name,
            sortable: col.sortable !== false,
            render: col.render
          }))}
          loading={loading}
          emptyMessage={emptyMessage}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Informations sur les résultats */}
        <div className="mt-4 text-sm text-gray-600">
          Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredData.length)} sur {filteredData.length} résultats
        </div>
      </CardContent>
    </Card>
  );
};

export default DataTable;
