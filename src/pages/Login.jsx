import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner
} from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:3001/api';

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Obtener URL de autenticación
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
          // Verificar origen del mensaje
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            // Autenticación exitosa
            window.removeEventListener('message', handleMessage);
            setIsLoading(false);

            // Obtener información del usuario
            const userResponse = await fetch(`${API_BASE}/google/status`, {
              credentials: 'include'
            });
            const userData = await userResponse.json();

            if (userData.authenticated && userData.user) {
              // Guardar usuario en localStorage
              localStorage.setItem('ecoraUser', JSON.stringify(userData.user));
              onLoginSuccess(userData.user);
            }
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            // Error en autenticación
            window.removeEventListener('message', handleMessage);
            setIsLoading(false);
            setError('Error al autenticar con Google. Por favor, intenta nuevamente.');
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
              const userResponse = await fetch(`${API_BASE}/google/status`, {
                credentials: 'include'
              });
              const userData = await userResponse.json();

              if (userData.authenticated && userData.user) {
                localStorage.setItem('ecoraUser', JSON.stringify(userData.user));
                onLoginSuccess(userData.user);
              }
            }
          } catch (e) {
            // Ignorar errores
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error iniciando autenticación:', error);
      setError('Error al conectar con el servidor. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-content">
        <div className="login-container">
          {/* Logo de Ecora */}
          <div className="login-logo">
            <h1 className="ecora-title">ecora</h1>
            <div className="ecora-subtitle">Sistema de Gestión de Información (SGI)</div>
          </div>

          {/* Descripción */}
          <IonText color="medium" className="login-description">
            <p>
              Encuentra todo lo que quieras en un solo clic
            </p>
          </IonText>

          {/* Botón de Login con Google */}
          <IonButton
            expand="block"
            size="large"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="google-login-button"
          >
            {isLoading ? (
              <>
                <IonSpinner name="crescent" />
                <span style={{ marginLeft: '10px' }}>Conectando...</span>
              </>
            ) : (
              <>
                <IonIcon icon={logoGoogle} slot="start" />
                Iniciar sesión con Google
              </>
            )}
          </IonButton>

          {/* Mensaje de error */}
          {error && (
            <IonText color="danger" className="error-message">
              <p>{error}</p>
            </IonText>
          )}

          {/* Footer con valores de Ecora */}
          <div className="login-footer">
            <IonText color="medium">
              <p className="valores-ecora">Innovación · Seguridad · Excelencia</p>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
