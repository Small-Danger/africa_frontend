import React, { useState, useEffect, useRef } from 'react';
import { PhotoIcon, VideoCameraIcon, TrashIcon, CameraIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { imageService, productService } from '../../services/api';
import { API_CONFIG } from '../../config/api';

const ImageManager = ({ product, onClose, onUpdate }) => {
  const mountedRef = useRef(true);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (product) {
      loadProductMedia();
    }
    
    return () => {
      mountedRef.current = false;
    };
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
        
        if (mountedRef.current) {
          setImages(imagesData);
          setVideos(videosData);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des médias:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      // Ajouter chaque fichier au FormData avec les bons noms de champs
      Array.from(files).forEach((file, index) => {
        formData.append(`media_files[]`, file);
        formData.append(`alt_texts[]`, file.name);
        formData.append(`titles[]`, file.name);
        formData.append(`sort_orders[]`, (images.length + index).toString());
      });
      
      console.log('📤 Upload des images:', files.length, 'fichiers');
      
      // Debug FormData
      console.log('📤 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      const response = await imageService.createImages(product.id, formData);
      console.log('📡 Réponse upload:', response);
      
      if (response.success) {
        console.log('✅ Images uploadées avec succès');
        await loadProductMedia();
        if (onUpdate) onUpdate();
      } else {
        console.error('❌ Échec de l\'upload:', response);
        alert(response.message || 'Erreur lors de l\'upload des images');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      alert(error.message || 'Erreur lors de l\'upload des images');
    } finally {
      setUploading(false);
    }
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

  // Fonction utilitaire pour obtenir l'URL de l'image/vidéo
  const getMediaUrl = (media) => {
    console.log('=== DEBUG getMediaUrl ===');
    console.log('Média reçu:', media);
    
    // Priorité 1: media_path (URL complète du backend)
    if (media.media_path) {
      console.log('✅ Utilisation media_path:', media.media_path);
      return media.media_path;
    }
    
    // Priorité 2: data (base64 pour les nouveaux médias)
    if (media.data && media.data.startsWith('data:')) {
      console.log('✅ Utilisation data (base64):', media.data.substring(0, 50) + '...');
      return media.data;
    }
    
    // Priorité 3: autres propriétés possibles
    if (media.url) {
      console.log('✅ Utilisation url:', media.url);
      return media.url;
    }
    if (media.image_url) {
      console.log('✅ Utilisation image_url:', media.image_url);
      return media.image_url;
    }
    
    console.warn('❌ Impossible de trouver l\'URL pour le média:', media);
    return null;
  };

  const deleteMedia = async (mediaId, mediaType) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      console.log('🗑️ Suppression image:', mediaId);
      
      const response = await imageService.deleteImage(product.id, mediaId);
      console.log('📡 Réponse suppression:', response);
      
      if (response.success) {
        console.log('✅ Image supprimée avec succès');
        await loadProductMedia();
        if (onUpdate) onUpdate();
      } else {
        console.error('❌ Échec de la suppression:', response);
        alert(response.message || 'Erreur lors de la suppression de l\'image');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(error.message || 'Erreur lors de la suppression de l\'image');
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
                const imageUrl = getMediaUrl(image);
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
              {videos.map((video) => {
                const videoUrl = getMediaUrl(video);
                console.log('🎥 URL vidéo générée:', videoUrl);
                
                return (
                  <div key={video.id} className="relative">
                    <video
                      src={videoUrl}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      controls
                      onError={(e) => {
                        console.error('❌ Erreur chargement vidéo:', video);
                        console.error('❌ Élément video:', e.target);
                      }}
                      onLoad={() => {
                        console.log('✅ Vidéo chargée avec succès:', video);
                      }}
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
                );
              })}
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
