import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  IonBadge
} from '@ionic/react';
import {
  closeOutline,
  openOutline,
  downloadOutline,
  informationCircleOutline,
  documentTextOutline,
  imageOutline,
  documentsOutline
} from 'ionicons/icons';
import './FilePreviewModal.css';

const FilePreviewModal = ({ isOpen, onClose, file }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setError(null);
      // Simular carga
      setTimeout(() => setLoading(false), 500);
    }
  }, [isOpen, file]);

  if (!file) return null;

  const getFileType = () => {
    const title = file.title?.toLowerCase() || '';

    if (title.endsWith('.pdf')) return 'pdf';
    if (title.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (title.match(/\.(doc|docx)$/)) return 'document';
    if (title.match(/\.(xls|xlsx)$/)) return 'spreadsheet';
    if (title.match(/\.(ppt|pptx)$/)) return 'presentation';

    return 'other';
  };

  const fileType = getFileType();

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="preview-loading">
          <IonSpinner name="crescent" color="primary" />
          <p>Cargando vista previa...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="preview-error">
          <IonIcon icon={informationCircleOutline} color="danger" />
          <p>{error}</p>
        </div>
      );
    }

    // Vista previa según el tipo de archivo
    switch (fileType) {
      case 'pdf':
        return (
          <div className="preview-container">
            {file.driveMetadata?.webViewLink ? (
              <iframe
                src={`${file.driveMetadata.webViewLink}?embedded=true`}
                title="PDF Preview"
                className="pdf-preview"
                onError={() => setError('No se pudo cargar la vista previa del PDF')}
              />
            ) : (
              <div className="no-preview">
                <IonIcon icon={documentTextOutline} color="primary" />
                <p>Vista previa no disponible</p>
                <IonText color="medium">
                  <small>El archivo no tiene un enlace de vista previa</small>
                </IonText>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="preview-container image-container">
            {file.driveMetadata?.webViewLink ? (
              <img
                src={file.driveMetadata.webViewLink}
                alt={file.title}
                className="image-preview"
                onError={() => setError('No se pudo cargar la imagen')}
              />
            ) : (
              <div className="no-preview">
                <IonIcon icon={imageOutline} color="primary" />
                <p>Vista previa no disponible</p>
              </div>
            )}
          </div>
        );

      case 'document':
      case 'spreadsheet':
      case 'presentation':
        return (
          <div className="preview-container">
            {file.driveMetadata?.webViewLink ? (
              <iframe
                src={`${file.driveMetadata.webViewLink}?embedded=true`}
                title="Document Preview"
                className="document-preview"
                onError={() => setError('No se pudo cargar la vista previa')}
              />
            ) : (
              <div className="no-preview">
                <IonIcon icon={documentsOutline} color="primary" />
                <p>Vista previa no disponible</p>
                <IonText color="medium">
                  <small>Abre el archivo en Google Drive para verlo</small>
                </IonText>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="no-preview">
            <IonIcon icon={documentsOutline} color="medium" />
            <p>Vista previa no disponible para este tipo de archivo</p>
            <IonText color="medium">
              <small>Tipo: {fileType}</small>
            </IonText>
          </div>
        );
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return documentTextOutline;
      case 'image':
        return imageOutline;
      default:
        return documentsOutline;
    }
  };

  const getFileTypeLabel = () => {
    const labels = {
      pdf: 'PDF',
      image: 'Imagen',
      document: 'Documento',
      spreadsheet: 'Hoja de cálculo',
      presentation: 'Presentación',
      other: 'Archivo'
    };
    return labels[fileType] || 'Archivo';
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="file-preview-modal"
    >
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>
            <div className="preview-title">
              <IonIcon icon={getFileIcon()} />
              <span className="file-name">{file.title}</span>
            </div>
          </IonTitle>
          <IonButtons slot="end">
            {file.driveMetadata?.webViewLink && (
              <IonButton
                onClick={() => window.open(file.driveMetadata.webViewLink, '_blank')}
                title="Abrir en Google Drive"
              >
                <IonIcon icon={openOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="preview-content">
          {/* Información del archivo */}
          <IonCard className="file-info-card">
            <IonCardContent>
              <div className="file-info-grid">
                <div className="info-item">
                  <span className="info-label">Tipo:</span>
                  <IonBadge color="primary">{getFileTypeLabel()}</IonBadge>
                </div>
                {file.description && (
                  <div className="info-item full-width">
                    <span className="info-label">Descripción:</span>
                    <span className="info-value">{file.description}</span>
                  </div>
                )}
                {file.tags && file.tags.length > 0 && (
                  <div className="info-item full-width">
                    <span className="info-label">Etiquetas:</span>
                    <div className="info-tags">
                      {file.tags.map((tag) => (
                        <IonBadge key={tag.id} style={{ marginRight: '0.5rem' }}>
                          {tag.name}
                        </IonBadge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Vista previa */}
          {renderPreview()}

          {/* Acciones */}
          <div className="preview-actions">
            {file.driveMetadata?.webViewLink && (
              <IonButton
                expand="block"
                color="primary"
                onClick={() => window.open(file.driveMetadata.webViewLink, '_blank')}
              >
                <IonIcon icon={openOutline} slot="start" />
                Abrir en Google Drive
              </IonButton>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default FilePreviewModal;
