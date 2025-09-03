import React, { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const FilterPanel = ({ 
  filters, 
  onApply, 
  onReset, 
  className = "",
  isOpen = false,
  onToggle = null 
}) => {
  const [localFilters, setLocalFilters] = useState({});

  const handleFilterChange = (filterName, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  const renderFilterInput = (filter) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={localFilters[filter.name] || ''}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">{filter.placeholder || 'Sélectionner...'}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={localFilters[filter.name] || ''}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );
      
      case 'range':
        return (
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder={filter.minPlaceholder || 'Min'}
              value={localFilters[`${filter.name}_min`] || ''}
              onChange={(e) => handleFilterChange(`${filter.name}_min`, e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <input
              type="number"
              placeholder={filter.maxPlaceholder || 'Max'}
              value={localFilters[`${filter.name}_max`] || ''}
              onChange={(e) => handleFilterChange(`${filter.name}_max`, e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            placeholder={filter.placeholder || 'Filtrer...'}
            value={localFilters[filter.name] || ''}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );
    }
  };

  if (!isOpen) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          onClick={onToggle}
          className="flex items-center"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filters.map((filter) => (
          <div key={filter.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {filter.label}
            </label>
            {renderFilterInput(filter)}
          </div>
        ))}
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={handleReset}>
          Réinitialiser
        </Button>
        <Button onClick={handleApply}>
          Appliquer
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
