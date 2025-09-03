import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useNotification } from '../../hooks/useNotification';

const ProductImageForm = ({
  isOpen,
  onClose,
  onSubmit,
  image = null,
  loading = false,
  errors = {}
}) => {
  const isEditing = !!image;
  const title = isEditing ? 'Modifier l\'image' : 'Ajouter des images';
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imageData, setImageData] = useState({
    sort_order: image?.sort_order || 0,
    is_main: image?.is_main || false
  });

  const { error: showError } = useNotification();

  const onDrop = useCallback((acceptedFiles) => {
    // Vérifier la taille des fichiers (max 10MB)
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        showError(`Le fichier ${file.name} dépasse la limite de 10MB`);
        return false;
      }
      return true;
    });

    // Vérifier le type des fichiers
    const imageFiles = validFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        showError(`Le fichier ${file.name} n'est pas une image valide`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...imageFiles]);
  }, [showError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  });

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 && !isEditing) {
      showError('Veuillez sélectionner au moins une image');
      return;
    }

    try {
      if (isEditing) {
        // Mode édition - mettre à jour les métadonnées
        await onSubmit({
          sort_order: parseInt(imageData.sort_order),
          is_main: imageData.is_main
        });
      } else {
        // Mode création - upload des fichiers
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('sort_order', parseInt(imageData.sort_order));
          formData.append('is_main', imageData.is_main);
          
          await onSubmit(formData);
        }
      }
      
      // Réinitialiser le formulaire
      setSelectedFiles([]);
      setImageData({
        sort_order: 0,
        is_main: false
      });
      
      onClose();
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setImageData({
      sort_order: 0,
      is_main: false
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      <div className="space-y-6">
        {/* Zone de drop pour les images */}
        {!isEditing && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">
                Déposez les images ici...
              </p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Glissez-déposez vos images ici
                </p>
                <p className="text-gray-500 mb-4">
                  ou cliquez pour sélectionner des fichiers
                </p>
                <Button variant="outline" type="button">
                  Sélectionner des images
                </Button>
              </div>
            )}
            
            <p className="text-sm text-gray-400 mt-4">
              PNG, JPG, GIF, WebP jusqu'à 10MB
            </p>
          </div>
        )}

        {/* Fichiers sélectionnés */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              Images sélectionnées ({selectedFiles.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Bouton de suppression */}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                  
                  {/* Nom du fichier */}
                  <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métadonnées de l'image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordre de tri
            </label>
            <Input
              type="number"
              value={imageData.sort_order}
              onChange={(e) => setImageData(prev => ({ ...prev, sort_order: e.target.value }))}
              placeholder="0"
              min="0"
              className="w-full"
            />
          </div>
        </div>

        {/* Options avancées */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_main"
              checked={imageData.is_main}
              onChange={(e) => setImageData(prev => ({ ...prev, is_main: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_main" className="ml-2 flex items-center text-sm text-gray-700">
              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
              Définir comme image principale
            </label>
          </div>
          
          {imageData.is_main && (
            <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
              ⚠️ Cette image remplacera l'image principale actuelle du produit.
            </p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={selectedFiles.length === 0 && !isEditing}
          >
            {isEditing ? 'Mettre à jour' : `Ajouter ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductImageForm;
