import React, { useState, useEffect } from 'react';
import Input from './Input';
import Textarea from './Textarea';
import { Select } from './Select';

const Form = ({ 
  fields, 
  initialData = {}, 
  onSubmit, 
  submitButton,
  loading = false,
  errors = {},
  className = "" 
}) => {
  const [data, setData] = useState(() => {
    // Initialiser avec les valeurs par défaut des champs
    const initialDataWithDefaults = { ...initialData };
    
    console.log('=== INITIALISATION DU FORMULAIRE ===');
    console.log('Données initiales:', initialData);
    console.log('Champs définis:', fields.map(f => ({ name: f.name, defaultValue: f.defaultValue, required: f.required })));
    
    fields.forEach(field => {
      if (initialDataWithDefaults[field.name] === undefined && field.defaultValue !== undefined) {
        initialDataWithDefaults[field.name] = field.defaultValue;
        console.log(`✅ Valeur par défaut appliquée pour ${field.name}:`, field.defaultValue);
      } else if (initialDataWithDefaults[field.name] !== undefined) {
        console.log(`✅ Valeur existante pour ${field.name}:`, initialDataWithDefaults[field.name]);
      } else {
        console.log(`⚠️ Aucune valeur pour ${field.name} (obligatoire: ${field.required})`);
      }
    });
    
    console.log('Données finales après initialisation:', initialDataWithDefaults);
    return initialDataWithDefaults;
  });

  // Réinitialiser les données quand initialData change
  useEffect(() => {
    const newData = { ...initialData };
    fields.forEach(field => {
      if (newData[field.name] === undefined && field.defaultValue !== undefined) {
        newData[field.name] = field.defaultValue;
        console.log(`🔄 useEffect: Valeur par défaut appliquée pour ${field.name}:`, field.defaultValue);
      } else if (newData[field.name] !== undefined) {
        console.log(`🔄 useEffect: Valeur existante pour ${field.name}:`, newData[field.name]);
      }
    });
    console.log('🔄 useEffect: Mise à jour des données du formulaire:', newData);
    setData(newData);
  }, [initialData, fields]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('=== SOUMISSION DU FORMULAIRE ===');
    console.log('Données du formulaire avant envoi:', data);
    console.log('Champs du formulaire:', fields.map(f => ({ name: f.name, value: data[f.name], type: f.type })));
    console.log('Vérification des champs obligatoires:');
    fields.forEach(field => {
      if (field.required) {
        console.log(`${field.name} (obligatoire):`, data[field.name], 'Valide:', !!data[field.name]);
      }
    });
    
    // Vérifier que tous les champs obligatoires sont remplis
    const missingFields = fields
      .filter(field => field.required && (!data[field.name] || data[field.name].toString().trim() === ''))
      .map(field => field.name);
    
    if (missingFields.length > 0) {
      console.error('Champs obligatoires manquants:', missingFields);
      return;
    }
    
    if (onSubmit) onSubmit(data);
  };

  const handleFieldChange = (field, value) => {
    console.log(`🔄 Changement du champ ${field}:`, value);
    console.log(`📝 Type de la valeur:`, typeof value);
    console.log(`📝 Valeur précédente:`, data[field]);
    
    setData(prev => {
      const newData = { ...prev, [field]: value };
      console.log(`📝 Nouvelles données:`, newData);
      return newData;
    });
  };

  // Fonction pour gérer les changements des champs personnalisés
  const handleCustomFieldChange = (fieldName, value) => {
    console.log(`Changement du champ personnalisé ${fieldName}:`, value);
    setData(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderField = (field) => {
    // Si le champ a un rendu personnalisé, l'utiliser
    if (field.customRender) {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.customRender}
          {errors[field.name] && (
            <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
          )}
        </div>
      );
    }

         const commonProps = {
       value: data[field.name] || '',
       onChange: (e) => {
         console.log(`🔄 onChange appelé pour ${field.name}:`, e.target.value);
         handleFieldChange(field.name, e.target.value);
       },
       error: errors[field.name],
       disabled: loading
     };

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Textarea
              placeholder={field.placeholder}
              {...commonProps}
            />
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
      
      case 'select':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Select
              value={data[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={loading}
              error={!!errors[field.name]}
            >
              <option value="">Sélectionner...</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center">
            <input
              type="checkbox"
              id={field.name}
              checked={data[field.name] || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              disabled={loading}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={field.name} className="ml-2 block text-sm text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600 ml-6">{errors[field.name]}</p>
            )}
          </div>
        );
      
      case 'radio':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    id={`${field.name}-${option.value}`}
                    name={field.name}
                    value={option.value}
                    checked={data[field.name] === option.value}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    disabled={loading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`${field.name}-${option.value}`} className="ml-2 block text-sm text-gray-900">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              <input
                type="file"
                name={field.name}
                onChange={(e) => handleFieldChange(field.name, e.target.files[0])}
                disabled={loading}
                accept={field.accept}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {field.accept && (
                <p className="text-xs text-gray-500">
                  Formats acceptés : {field.accept.replace(/image\//g, '').toUpperCase()}
                </p>
              )}
              {data[field.name] && data[field.name] instanceof File && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Fichier sélectionné : {data[field.name].name}</span>
                  </div>
                  
                  {/* Prévisualisation de l'image si c'est une image */}
                  {field.accept && field.accept.includes('image/') && (
                    <div className="relative">
                      <div className="w-32 h-32 rounded-lg border-2 border-gray-200 overflow-hidden">
                        <img
                          src={URL.createObjectURL(data[field.name])}
                          alt="Prévisualisation"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
      
      default:
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type={field.type || 'text'}
              placeholder={field.placeholder}
              {...commonProps}
            />
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Debug: Affichage des données en temps réel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-gray-100 rounded-lg text-xs">
          <h4 className="font-semibold mb-2">🔍 Debug - Données du formulaire:</h4>
          <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {fields.map(renderField)}
      </div>
      
      {submitButton}
    </form>
  );
};

export default Form;
