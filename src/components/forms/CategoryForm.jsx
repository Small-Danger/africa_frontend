import React, { useState, useEffect } from 'react';
import ModalForm from './ModalForm';

const CategoryForm = ({
  isOpen,
  onClose,
  onSubmit,
  category = null,
  loading = false,
  errors = {},
  parentCategories = [] // Pour la sélection de catégorie parente
}) => {
  const isEditing = !!category;
  const title = isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie';
  // Pas besoin de gérer l'image localement, le composant Form s'en charge

  const fields = [
    {
      name: 'name',
      label: 'Nom de la catégorie',
      type: 'text',
      required: true,
      placeholder: 'Ex: Vêtements, Électronique, Livres...',
      defaultValue: category?.name || ''
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      placeholder: 'Description détaillée de la catégorie...',
      defaultValue: category?.description || ''
    },
    {
      name: 'parent_id',
      label: 'Catégorie parente',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'Aucune (catégorie principale)' },
        ...parentCategories
          .filter(cat => cat.id !== category?.id) // Éviter les boucles hiérarchiques
          .map(cat => ({
            value: cat.id.toString(),
            label: `${cat.name}${cat.subcategories_count > 0 ? ` (${cat.subcategories_count} sous-catégories)` : ''}`
          }))
      ],
      defaultValue: category?.parent_id || ''
    },
    {
      name: 'image_main',
      label: 'Image principale',
      type: 'file',
      required: false,
      accept: 'image/jpeg,image/png,image/jpg,image/gif,image/webp',
      defaultValue: null
    },
    {
      name: 'sort_order',
      label: 'Ordre de tri',
      type: 'number',
      required: false,
      placeholder: '0',
      min: '0',
      defaultValue: category?.sort_order || 0
    },
    {
      name: 'is_active',
      label: 'Catégorie active',
      type: 'checkbox',
      required: false,
      defaultValue: category?.is_active !== undefined ? category.is_active : true
    }
  ];

  const handleSubmit = async (data) => {
    console.log('=== CATEGORYFORM - DONNÉES REÇUES ===');
    console.log('Données reçues du formulaire:', data);
    console.log('Type de données:', typeof data);
    console.log('Clés des données:', Object.keys(data));
    console.log('Valeur du nom:', data.name);
    console.log('Type du nom:', typeof data.name);
    
    // Vérifier que le nom est bien présent
    if (!data.name) {
      console.error('❌ ERREUR: Le champ "name" est manquant dans les données');
      console.error('❌ Données complètes reçues:', data);
      console.error('❌ Clés disponibles:', Object.keys(data));
      alert('ERREUR: Le champ "name" est manquant. Vérifiez la console pour plus de détails.');
      return;
    }
    
    if (data.name.trim() === '') {
      console.error('❌ ERREUR: Le champ "name" est vide');
      console.error('❌ Valeur exacte du name:', JSON.stringify(data.name));
      alert('ERREUR: Le champ "name" est vide. Vérifiez la console pour plus de détails.');
      return;
    }
    
    console.log('✅ Le nom est valide:', data.name.trim());
    
    // Préparer les données de base
    const jsonData = {
      name: data.name.trim(),
      description: data.description && data.description.trim() !== '' ? data.description.trim() : null,
      parent_id: data.parent_id && data.parent_id !== '' ? parseInt(data.parent_id) : null,
      sort_order: data.sort_order !== undefined && data.sort_order !== '' ? parseInt(data.sort_order) || 0 : 0,
      is_active: data.is_active !== undefined ? data.is_active : true // Corrigé: vérifier explicitement si la valeur est définie
    };

    // Convertir l'image en base64 si elle est présente
    if (data.image_main && data.image_main instanceof File) {
      console.log('📸 Image détectée, conversion en base64...');
      try {
        const base64Image = await convertImageToBase64(data.image_main);
        jsonData.image_main = base64Image;
        console.log('✅ Image convertie en base64, taille:', base64Image.length);
      } catch (error) {
        console.error('❌ Erreur lors de la conversion de l\'image:', error);
        // Continuer sans l'image si la conversion échoue
      }
    }

    console.log('=== DONNÉES JSON CRÉÉES ===');
    console.log('Données à envoyer:', jsonData);
    
    // Envoyer les données de la catégorie avec l'image en base64
    await onSubmit(jsonData);
  };

  // Fonction pour convertir une image en base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      fields={fields}
      initialData={category ? {
        name: category.name,
        description: category.description,
        parent_id: category.parent_id,
        sort_order: category.sort_order,
        is_active: category.is_active
      } : {}}
      onSubmit={handleSubmit}
      submitText={isEditing ? 'Mettre à jour' : 'Créer'}
      loading={loading}
      errors={errors}
      size="lg"
    />
  );
};

export default CategoryForm;
