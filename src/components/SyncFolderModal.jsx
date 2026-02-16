import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonProgressBar,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox
} from '@ionic/react';
import {
  closeOutline,
  syncOutline,
  checkmarkCircleOutline,
  folderOutline,
  documentOutline,
  alertCircleOutline,
  refreshOutline,
  cloudDoneOutline,
  cloudUploadOutline
} from 'ionicons/icons';
import './SyncFolderModal.css';

const SyncFolderModal = ({ isOpen, onClose, folder, onSync, onImportFromDrive }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'completed', 'error'
  const [syncResults, setSyncResults] = useState(null);
  const [syncRecursive, setSyncRecursive] = useState(true);

  const handleSync = async () => {
    if (!folder || !folder.driveMetadata || !folder.driveMetadata.id) {
      setError('Esta carpeta no tiene información de Google Drive asociada');
      return;
    }

    try {
      setIsLoading(true);
      setSyncStatus('syncing');
      setError('');
      setSyncProgress(0);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Llamar a la función de sincronización
      const results = await onSync(folder.id, folder.driveMetadata.id, syncRecursive);

      clearInterval(progressInterval);
      setSyncProgress(100);
      setSyncStatus('completed');
      setSyncResults(results);

      // Auto-cerrar y recargar después de 2 segundos
      setTimeout(() => {
        handleClose();
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error sincronizando:', error);
      setError(error.message || 'Error al sincronizar desde Google Drive');
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSyncStatus('idle');
    setSyncProgress(0);
    setSyncResults(null);
    setError('');
    onClose();
  };

  const hasDriveMetadata = folder?.driveMetadata?.id;

  // Debug: verificar qué se está recibiendo
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔍 SyncFolderModal abierto');
      console.log('📁 Folder recibido:', folder);
      console.log('✅ Tiene driveMetadata?:', hasDriveMetadata);
    }
  }, [isOpen, folder, hasDriveMetadata]);

  // Si no hay folder, mostrar mensaje
  if (isOpen && !folder) {
    return (
      <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="sync-folder-modal">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Sincronizar Carpeta</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleClose}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardContent>
              <IonText color="danger">
                <h3>Error: No se pudo cargar la carpeta</h3>
                <p>Por favor, intenta de nuevo.</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonModal>
    );
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="sync-folder-modal">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            <div className="modal-header-title">
              <IonIcon icon={syncOutline} className="header-icon" />
              Sincronizar Carpeta
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={isLoading}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {console.log('🎨 Renderizando IonContent')}
        {console.log('📊 hasDriveMetadata:', hasDriveMetadata)}
        {console.log('🔄 syncStatus:', syncStatus)}

        {/* Información de la carpeta */}
        <IonCard className="folder-info-card">
          <IonCardHeader>
            <IonCardTitle className="card-title">
              <IonIcon icon={folderOutline} />
              Carpeta Seleccionada
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="folder-info">
              <div className="folder-name">
                <IonIcon icon={folderOutline} color="primary" />
                <h3>{folder?.title || 'Sin nombre'}</h3>
              </div>
              {folder?.description && (
                <p className="folder-description">{folder.description}</p>
              )}

              {/* Estado de conexión con Drive */}
              <div className={`drive-status ${hasDriveMetadata ? 'connected' : 'disconnected'}`}>
                <IonIcon
                  icon={hasDriveMetadata ? cloudDoneOutline : alertCircleOutline}
                  color={hasDriveMetadata ? 'success' : 'warning'}
                />
                <span>
                  {hasDriveMetadata
                    ? 'Conectada con Google Drive'
                    : 'No conectada con Google Drive'}
                </span>
              </div>

              {hasDriveMetadata && folder.driveMetadata.webViewLink && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => window.open(folder.driveMetadata.webViewLink, '_blank')}
                  style={{ marginTop: '8px' }}
                >
                  <IonIcon icon={folderOutline} slot="start" />
                  Ver en Google Drive
                </IonButton>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Opciones de sincronización */}
        {hasDriveMetadata && syncStatus === 'idle' && (
          <IonCard className="sync-options-card">
            <IonCardHeader>
              <IonCardTitle className="card-title">
                <IonIcon icon={refreshOutline} />
                Opciones de Sincronización
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem lines="none">
                  <IonCheckbox
                    slot="start"
                    checked={syncRecursive}
                    onIonChange={e => setSyncRecursive(e.detail.checked)}
                  />
                  <IonLabel>
                    <h3>Sincronizar recursivamente</h3>
                    <p>Actualizar también todas las subcarpetas y archivos</p>
                  </IonLabel>
                </IonItem>
              </IonList>

              <div className="sync-info">
                <IonIcon icon={alertCircleOutline} color="primary" />
                <IonText color="medium">
                  <small>
                    <strong>¿Qué hace la sincronización?</strong><br/>
                    • Detecta archivos nuevos en Google Drive y los agrega aquí<br/>
                    • Actualiza archivos existentes que hayan cambiado<br/>
                    • Elimina archivos que fueron borrados en Drive<br/>
                    • Refleja la estructura actual de tu carpeta en Google Drive
                  </small>
                </IonText>
              </div>

              {folder?.driveMetadata?.webViewLink && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={() => window.open(folder.driveMetadata.webViewLink, '_blank')}
                  >
                    <IonIcon icon={folderOutline} slot="start" />
                    Ver carpeta en Google Drive
                  </IonButton>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Estado de sincronización */}
        {syncStatus === 'syncing' && (
          <IonCard className="sync-progress-card">
            <IonCardContent>
              <div className="sync-progress">
                <IonSpinner name="crescent" color="primary" />
                <h3>Sincronizando...</h3>
                <p>Actualizando contenido desde Google Drive</p>
                <IonProgressBar value={syncProgress / 100} />
                <span className="progress-text">{syncProgress}%</span>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Resultado de sincronización */}
        {syncStatus === 'completed' && (
          <IonCard className="sync-result-card success">
            <IonCardContent>
              <div className="sync-result">
                <IonIcon icon={checkmarkCircleOutline} color="success" className="result-icon" />
                <h3>Sincronización Completada</h3>
                <p>La carpeta se ha sincronizado exitosamente</p>
                {syncResults && (
                  <div className="sync-stats">
                    <div className="stat-item">
                      <IonIcon icon={documentOutline} />
                      <span>{syncResults.filesUpdated || 0} archivos actualizados</span>
                    </div>
                    <div className="stat-item">
                      <IonIcon icon={folderOutline} />
                      <span>{syncResults.foldersUpdated || 0} carpetas actualizadas</span>
                    </div>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Error */}
        {error && (
          <div className="error-alert">
            <IonIcon icon={alertCircleOutline} color="danger" />
            <IonText color="danger">
              <strong>Error:</strong> {error}
            </IonText>
          </div>
        )}

        {/* Advertencia si no tiene metadata de Drive */}
        {!hasDriveMetadata && (
          <IonCard className="warning-card">
            <IonCardContent>
              <div className="warning-content">
                <IonIcon icon={alertCircleOutline} color="warning" className="warning-icon" />
                <div>
                  <h3>⚠️ Carpeta no vinculada</h3>
                  <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                    Esta carpeta <strong>no está conectada con Google Drive</strong>.
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    <strong>Pasos para vincular:</strong><br/>
                    1. Haz click en "Vincular con Google Drive"<br/>
                    2. Selecciona una carpeta de tu Google Drive<br/>
                    3. El contenido se importará y quedará vinculado<br/>
                    4. Luego podrás sincronizar cambios automáticamente
                  </p>
                  {onImportFromDrive && (
                    <IonButton
                      color="primary"
                      expand="block"
                      size="large"
                      onClick={() => {
                        handleClose();
                        onImportFromDrive(folder);
                      }}
                    >
                      <IonIcon icon={cloudUploadOutline} slot="start" />
                      Vincular con Google Drive
                    </IonButton>
                  )}
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Botones de acción */}
        <div className="action-buttons">
          <IonButton
            fill="outline"
            color="medium"
            onClick={handleClose}
            disabled={isLoading}
          >
            {syncStatus === 'completed' ? 'Cerrar' : 'Cancelar'}
          </IonButton>
          {hasDriveMetadata && syncStatus === 'idle' && (
            <IonButton
              color="primary"
              onClick={handleSync}
              disabled={isLoading}
              size="large"
            >
              <IonIcon icon={syncOutline} slot="start" />
              Sincronizar Ahora
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default SyncFolderModal;
