import React, { useState, useEffect } from 'react';
import Table from './Table';
import Checkbox from './Checkbox';

const SelectableTable = ({ 
  columns, 
  data, 
  onSelectionChange,
  selectable = true,
  ...tableProps 
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Mettre à jour la sélection quand les données changent
  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [data]);

  // Gérer la sélection de tous les éléments
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(data.map(item => item.id || item));
      setSelectAll(true);
    } else {
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  // Gérer la sélection d'un élément individuel
  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // Mettre à jour l'état "sélectionner tout" quand la sélection change
  useEffect(() => {
    if (data.length > 0) {
      const allSelected = data.every(item => 
        selectedItems.includes(item.id || item)
      );
      setSelectAll(allSelected);
    }
  }, [selectedItems, data]);

  // Notifier le parent des changements de sélection
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedItems);
    }
  }, [selectedItems, onSelectionChange]);

  // Ajouter la colonne de sélection si activée
  const selectableColumns = selectable ? [
    {
      key: 'selection',
      label: '',
      sortable: false,
      render: (_, row) => (
        <Checkbox
          checked={selectedItems.includes(row.id || row)}
          onChange={(checked) => handleSelectItem(row.id || row, checked)}
        />
      )
    },
    ...columns
  ] : columns;

  // Gérer l'en-tête de sélection
  const handleHeaderSelection = (checked) => {
    handleSelectAll(checked);
  };

  // Modifier le rendu de l'en-tête pour inclure la case à cocher
  const modifiedColumns = selectableColumns.map((column, index) => {
    if (index === 0 && selectable) {
      return {
        ...column,
        render: () => (
          <Checkbox
            checked={selectAll}
            onChange={handleHeaderSelection}
            indeterminate={selectedItems.length > 0 && selectedItems.length < data.length}
          />
        )
      };
    }
    return column;
  });

  return (
    <Table
      columns={modifiedColumns}
      data={data}
      {...tableProps}
    />
  );
};

export default SelectableTable;
