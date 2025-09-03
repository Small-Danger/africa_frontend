import React, { useState, useEffect } from 'react';
import { PhotoIcon, VideoCameraIcon, TrashIcon, CameraIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { imageService, productService } from '../../services/api';
import { API_CONFIG } from '../../config/api';

const ImageManager = ({ product, onClose, onUpdate }) => {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (product) {
      loadProductMedia();
    }
  }, [product]);

  const loadProductMedia = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des médias pour le produit:', product.id);
      const response = await imageService.getProductImages(product.id);
      console.log('📡 Réponse API getProductImages:', response);
      
      if (response.success) {
        console.log('📊 Données reçues:', response.data);
        console.log('🖼️ Images reçues:', response.data.images);
        console.log('🎥 Vidéos reçues:', response.data.videos);
        
        const imagesData = response.data.images?.data || response.data.images || [];
        const videosData = response.data.videos?.data || response.data.videos || [];
        
        console.log('🖼️ Images finales:', imagesData);
        console.log('🎥 Vidéos finales:', videosData);
        
        setImages(imagesData);
        setVideos(videosData);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des médias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    setUploading(true);
    const newImages = [];
    
    for (const file of files) {
      try {
        const base64 = await convertFileToBase64(file);
        newImages.push({
          data: base64,
          alt_text: file.name,
          title: file.name,
          sort_order: images.length + newImages.length
        });
      } catch (error) {
        console.error('Erreur conversion base64:', error);
      }
    }

    if (newImages.length > 0) {
      try {
        const response = await productService.updateProduct(product.id, {
          images: newImages
        });
        if (response.success) {
          await loadProductMedia();
          onUpdate();
        }
      } catch (error) {
        console.error('Erreur upload images:', error);
      }
    }
    
    setUploading(false);
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Fonction utilitaire pour obtenir l'URL de l'image
  const getImageUrl = (image) => {
    console.log('=== DEBUG getImageUrl ===');
    console.log('Image reçue:', image);
    console.log('Clés disponibles:', Object.keys(image));
    
    // Priorité 1: media_path (URL complète de l'API)
    if (image.media_path && image.media_path.startsWith('http')) {
      console.log('✅ Utilisation media_path (URL complète):', image.media_path);
      return image.media_path;
    }
    
    // Priorité 2: data (base64 pour les nouvelles images)
    if (image.data && image.data.startsWith('data:')) {
      console.log('✅ Utilisation data (base64):', image.data.substring(0, 50) + '...');
      return image.data;
    }
    
    // Priorité 3: autres propriétés possibles
    if (image.url) {
      console.log('✅ Utilisation url:', image.url);
      return image.url;
    }
    if (image.image_url) {
      console.log('✅ Utilisation image_url:', image.image_url);
      return image.image_url;
    }
    if (image.path) {
      console.log('✅ Utilisation path:', image.path);
      return image.path;
    }
    if (image.src) {
      console.log('✅ Utilisation src:', image.src);
      return image.src;
    }
    
    // Fallback : essayer de construire l'URL depuis l'API
    if (image.id && image.id !== 'main') {
      const fallbackUrl = `${API_CONFIG.BASE_URL}/storage/products/${image.id}`;
      console.log('⚠️ Fallback URL construite:', fallbackUrl);
      return fallbackUrl;
    }
    
    console.warn('❌ Impossible de trouver l\'URL pour l\'image:', image);
    return null;
  };

  const deleteMedia = async (mediaId, mediaType) => {
    try {
      const response = await imageService.deleteImage(mediaId);
      if (response.success) {
        await loadProductMedia();
        onUpdate();
      }
    } catch (error) {
      console.error('Erreur suppression média:', error);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Gestion des médias" size="4xl">
      <div className="space-y-6">
        {/* Zone de drop pour upload */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Glissez-déposez vos images/vidéos ici ou{' '}
            <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleFileUpload(Array.from(e.target.files))}
              />
              sélectionnez des fichiers
            </label>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formats supportés : JPG, PNG, GIF, WEBP, MP4, AVI, MOV
          </p>
        </div>

        {uploading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Upload en cours...</p>
          </div>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <PhotoIcon className="h-5 w-5 mr-2" />
              Images ({images.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => {
                console.log('🖼️ Rendu image dans le map:', image);
                console.log('🖼️ Clés de l\'image:', Object.keys(image));
                const imageUrl = getImageUrl(image);
                console.log('🖼️ URL générée:', imageUrl);
                
                return (
                  <div key={image.id} className="relative">
                    <img
                      src={imageUrl}
                      alt={image.alt_text || 'Image produit'}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        console.error('❌ Erreur chargement image:', image);
                        console.error('❌ Élément img:', e.target);
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('✅ Image chargée avec succès:', image);
                      }}
                    />
                    
                    {/* Bouton de suppression visible */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMedia(image.id, 'image')}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vidéos */}
        {videos.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <VideoCameraIcon className="h-5 w-5 mr-2" />
              Vidéos ({videos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="relative">
                  <video
                    src={video.media_path}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    controls
                  />
                  {/* Bouton de suppression visible */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMedia(video.id, 'video')}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length === 0 && videos.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <PhotoIcon className="mx-auto h-16 w-16 text-gray-300" />
            <p className="mt-2">Aucun média pour ce produit</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImageManager;
