import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonList
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import './AddSectionModal.css';

const AddSectionModal = ({
  isOpen,
  onClose,
  onSave,
  editingSection = null,
  parentTitle = null
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingSection) {
      setTitle(editingSection.title || '');
      setDescription(editingSection.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [editingSection, isOpen]);

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim()
    });

    // Limpiar formulario
    setTitle('');
    setDescription('');
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            {editingSection ? 'Editar Sección' : 'Nueva Sección'}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose}>
              <ion-icon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        <div className="modal-inner">
          {/* Información del padre si existe */}
          {parentTitle && (
            <div className="parent-info ecora-line-accent">
              <p className="parent-label">Subsección de:</p>
              <h3 className="parent-title">{parentTitle}</h3>
            </div>
          )}

          {/* Formulario */}
          <IonList className="form-list">
            <IonItem className="form-item">
              <IonLabel position="stacked" className="form-label">
                Título <span className="required">*</span>
              </IonLabel>
              <IonInput
                value={title}
                onIonInput={(e) => setTitle(e.detail.value)}
                placeholder="Ej: Mantención de Infraestructura"
                className="form-input"
                required
              />
            </IonItem>

            <IonItem className="form-item">
              <IonLabel position="stacked" className="form-label">
                Descripción (opcional)
              </IonLabel>
              <IonTextarea
                value={description}
                onIonInput={(e) => setDescription(e.detail.value)}
                placeholder="Describe brevemente esta sección..."
                rows={4}
                className="form-textarea"
              />
            </IonItem>
          </IonList>

          {/* Botones de acción */}
          <div className="action-buttons">
            <IonButton
              expand="block"
              onClick={handleSave}
              disabled={!title.trim()}
              className="save-button"
            >
              {editingSection ? 'Guardar Cambios' : 'Crear Sección'}
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              onClick={handleClose}
              className="cancel-button"
            >
              Cancelar
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default AddSectionModal;
