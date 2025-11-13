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
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonInput,
  IonText,
  IonSpinner,
  IonList,
  IonNote
} from '@ionic/react';
import { closeOutline, logoGoogle, cloudDone } from 'ionicons/icons';
import './GoogleDriveModal.css';

const GoogleDriveModal = ({ isOpen, onClose, onImport }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState('all');
  const [folderId, setFolderId] = useState('');
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:3001/api';

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/google/status`, {
        credentials: 'include'
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setIsAuthenticated(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/google/auth`);
      const data = await response.json();

      if (data.success && data.authUrl) {
        // Abrir ventana de autenticación
        const width = 600;
        const height = 700;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        const authWindow = window.open(
          data.authUrl,
          'Google Authentication',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Escuchar mensajes de la ventana emergente
        const handleMessage = async (event) => {
          // Verificar origen del mensaje (seguridad)
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            // Autenticación exitosa
            window.removeEventListener('message', handleMessage);
            setIsLoading(false);
            await checkAuthStatus();
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            // Error en autenticación
            window.removeEventListener('message', handleMessage);
            setIsLoading(false);
            setError('Error al autenticar con Google Drive');
          }
        };

        window.addEventListener('message', handleMessage);

        // Backup: verificar si la ventana se cerró manualmente
        const checkAuth = setInterval(async () => {
          try {
            if (authWindow.closed) {
              clearInterval(checkAuth);
              window.removeEventListener('message', handleMessage);
              setIsLoading(false);
              // Verificar si se autenticó
              await checkAuthStatus();
            }
          } catch (e) {
            // Ignorar errores de cross-origin
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error iniciando autenticación:', error);
      setError('Error al conectar con Google Drive');
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError('');

      const requestBody = {
        scope: scope,
        folderId: scope === 'folder' ? folderId : null,
        maxDepth: -1 // Jerarquía infinita
      };

      const response = await fetch(`${API_BASE}/google/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        // Pasar los datos importados al componente padre
        onImport(data.data);
        onClose();
      } else {
        setError(data.error || 'Error al importar desde Google Drive');
      }
    } catch (error) {
      console.error('Error importando desde Google Drive:', error);
      setError('Error al importar. Verifique su conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/google/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="google-drive-modal">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Importar desde Google Drive</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {!isAuthenticated ? (
          <div className="auth-section">
            <IonIcon icon={logoGoogle} className="google-icon" />
            <IonText color="medium">
              <h2>Conectar con Google Drive</h2>
              <p>
                Para importar la estructura de carpetas desde Google Drive,
                primero debe autenticarse con su cuenta de Google.
              </p>
            </IonText>

            <IonButton
              expand="block"
              color="primary"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="auth-button"
            >
              {isLoading ? (
                <IonSpinner name="crescent" />
              ) : (
                <>
                  <IonIcon icon={logoGoogle} slot="start" />
                  Conectar con Google
                </>
              )}
            </IonButton>
          </div>
        ) : (
          <div className="import-section">
            <div className="auth-success">
              <IonIcon icon={cloudDone} color="success" />
              <IonText color="success">
                <p>Conectado con Google Drive</p>
              </IonText>
              <IonButton
                fill="clear"
                size="small"
                color="medium"
                onClick={handleLogout}
              >
                Desconectar
              </IonButton>
            </div>

            <IonList>
              <IonItem lines="none">
                <IonLabel>
                  <h3>Seleccione el alcance de importación:</h3>
                </IonLabel>
              </IonItem>

              <IonRadioGroup value={scope} onIonChange={e => setScope(e.detail.value)}>
                <IonItem>
                  <IonRadio slot="start" value="all" />
                  <IonLabel>
                    <h3>Mi Drive completo</h3>
                    <IonNote>Importar todas las carpetas de Mi Drive</IonNote>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonRadio slot="start" value="shared" />
                  <IonLabel>
                    <h3>Carpetas compartidas conmigo</h3>
                    <IonNote>Solo carpetas que otros han compartido</IonNote>
                  </IonLabel>
                </IonItem>

                <IonItem>
                  <IonRadio slot="start" value="folder" />
                  <IonLabel>
                    <h3>Carpeta específica</h3>
                    <IonNote>Importar una carpeta por su ID</IonNote>
                  </IonLabel>
                </IonItem>
              </IonRadioGroup>

              {scope === 'folder' && (
                <IonItem>
                  <IonLabel position="stacked">
                    ID de la Carpeta
                  </IonLabel>
                  <IonInput
                    value={folderId}
                    onIonChange={e => setFolderId(e.detail.value)}
                    placeholder="Ejemplo: 1A2B3C4D5E6F7G8H9I0J"
                  />
                  <IonNote slot="helper">
                    El ID se encuentra en la URL de la carpeta en Drive
                  </IonNote>
                </IonItem>
              )}
            </IonList>

            {error && (
              <IonText color="danger" className="error-text">
                <p>{error}</p>
              </IonText>
            )}

            <div className="button-group">
              <IonButton
                expand="block"
                color="primary"
                onClick={handleImport}
                disabled={isLoading || (scope === 'folder' && !folderId)}
              >
                {isLoading ? (
                  <>
                    <IonSpinner name="crescent" slot="start" />
                    Importando...
                  </>
                ) : (
                  'Importar Estructura'
                )}
              </IonButton>
            </div>

            <IonText color="medium" className="info-note">
              <p>
                <strong>Nota:</strong> La importación preservará toda la estructura
                jerárquica de carpetas y archivos. Los archivos se incluirán como
                secciones con enlaces a Drive.
              </p>
            </IonText>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default GoogleDriveModal;
