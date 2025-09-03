import React from 'react';
import Modal from '../ui/Modal';
import Form from '../ui/Form';
import Button from '../ui/Button';

const ModalForm = ({
  isOpen,
  onClose,
  title,
  fields,
  initialData = {},
  onSubmit,
  submitText = 'Enregistrer',
  cancelText = 'Annuler',
  loading = false,
  errors = {},
  size = 'md'
}) => {
  const handleSubmit = async (data) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      // L'erreur sera gérée par le composant parent
      console.error('Erreur lors de la soumission:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
    >
      <Form
        fields={fields}
        initialData={initialData}
        onSubmit={handleSubmit}
        errors={errors}
        submitButton={
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              {submitText}
            </Button>
          </div>
        }
      />
    </Modal>
  );
};

export default ModalForm;
