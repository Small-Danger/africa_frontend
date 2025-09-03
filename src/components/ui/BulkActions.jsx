import React, { useState } from 'react';
import Button from './Button';
import Dropdown from './Dropdown';
import { TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

const BulkActions = ({ 
  selectedItems = [], 
  actions = [], 
  onAction, 
  className = "",
  disabled = false 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedItems.length === 0) return null;

  const defaultActions = [
    {
      key: 'view',
      label: 'Voir',
      icon: EyeIcon,
      variant: 'outline'
    },
    {
      key: 'edit',
      label: 'Modifier',
      icon: PencilIcon,
      variant: 'outline'
    },
    {
      key: 'delete',
      label: 'Supprimer',
      icon: TrashIcon,
      variant: 'destructive'
    }
  ];

  const availableActions = actions.length > 0 ? actions : defaultActions;

  const handleAction = async (actionKey) => {
    if (!onAction) return;
    
    setIsProcessing(true);
    try {
      await onAction(actionKey, selectedItems);
    } catch (error) {
      console.error('Erreur lors de l\'action en masse:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const dropdownItems = availableActions.map(action => ({
    label: action.label,
    icon: action.icon,
    onClick: () => handleAction(action.key),
    danger: action.variant === 'destructive'
  }));

  return (
    <div className={`flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-blue-900">
          {selectedItems.length} élément{selectedItems.length !== 1 ? 's' : ''} sélectionné{selectedItems.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {availableActions.slice(0, 2).map((action) => (
          <Button
            key={action.key}
            variant={action.variant}
            size="sm"
            onClick={() => handleAction(action.key)}
            disabled={disabled || isProcessing}
            className="flex items-center"
          >
            {action.icon && <action.icon className="h-4 w-4 mr-1" />}
            {action.label}
          </Button>
        ))}
        
        {availableActions.length > 2 && (
          <Dropdown
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || isProcessing}
                className="flex items-center"
              >
                Plus d'actions
              </Button>
            }
            items={dropdownItems.slice(2)}
            align="right"
          />
        )}
      </div>
      
      {isProcessing && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Traitement...</span>
        </div>
      )}
    </div>
  );
};

export default BulkActions;
