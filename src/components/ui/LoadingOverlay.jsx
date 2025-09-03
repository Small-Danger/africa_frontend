import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingOverlay = ({ 
  show = false, 
  message = "Chargement...", 
  transparent = false,
  className = "" 
}) => {
  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${transparent ? 'bg-black bg-opacity-25' : 'bg-white bg-opacity-90'} ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-4 text-lg font-medium text-gray-700">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
