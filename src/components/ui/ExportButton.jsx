import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import Dropdown from './Dropdown';

const ExportButton = ({ 
  onExport, 
  formats = ['csv', 'excel', 'pdf'], 
  className = "",
  disabled = false 
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const formatConfig = {
    csv: {
      label: 'CSV',
      icon: '📊',
      mimeType: 'text/csv',
      extension: '.csv'
    },
    excel: {
      label: 'Excel',
      icon: '📈',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: '.xlsx'
    },
    pdf: {
      label: 'PDF',
      icon: '📄',
      mimeType: 'application/pdf',
      extension: '.pdf'
    }
  };

  const handleExport = async (format) => {
    if (!onExport) return;
    
    setIsExporting(true);
    try {
      const data = await onExport(format);
      
      if (data) {
        // Créer un blob et télécharger le fichier
        const blob = new Blob([data], { type: formatConfig[format].mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export-${new Date().toISOString().split('T')[0]}${formatConfig[format].extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const dropdownItems = formats.map(format => ({
    label: `${formatConfig[format].icon} ${formatConfig[format].label}`,
    onClick: () => handleExport(format)
  }));

  return (
    <Dropdown
      trigger={
        <Button
          disabled={disabled || isExporting}
          className={`flex items-center ${className}`}
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          {isExporting ? 'Export...' : 'Exporter'}
        </Button>
      }
      items={dropdownItems}
      align="right"
    />
  );
};

export default ExportButton;
