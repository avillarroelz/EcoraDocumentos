import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonInput
} from '@ionic/react';
import { logoGoogle, logoApple } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import API_BASE from '../config/api';
import { initGoogleAuth, signInWithGoogle } from '../services/googleAuthNative';
import { signInWithApple } from '../services/appleAuthNative';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';

  // Inicializar Google Auth en plataformas nativas
  useEffect(() => {
    if (isNative) {
      initGoogleAuth();
    }
  }, [isNative]);

  // Login nativo para Android/iOS
  const handleNativeLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      console.log('[Login] Iniciando login nativo...');
      const user = await signInWithGoogle();

      console.log('[Login] Usuario autenticado:', user);
      localStorage.setItem('ecoraUser', JSON.stringify(user));
      onLoginSuccess(user);

    } catch (error) {
      console.error('[Login] Error en login nativo:', error);
      setError(error.message || 'Error al autenticar con Google. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login de cuenta demo (revisión de App Store) — correo + contraseña
  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${API_BASE}/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: demoEmail, password: demoPassword })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo iniciar la sesión demo.');
      }

      localStorage.setItem('ecoraUser', JSON.stringify(data.user));
      onLoginSuccess(data.user);

    } catch (error) {
      console.error('[Login] Error en login demo:', error);
      setError(error.message || 'Error al iniciar la sesión demo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login con Apple (solo iOS nativo)
  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      const user = await signInWithApple();

      localStorage.setItem('ecoraUser', JSON.stringify(user));
      onLoginSuccess(user);

    } catch (error) {
      console.error('[Login] Error en login con Apple:', error);
      // No mostrar error si el usuario simplemente canceló
      if (!/cancel/i.test(error.message || '')) {
        setError(error.message || 'Error al autenticar con Apple. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Login web con popup
  const handleWebLogin = async () => {
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
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            setIsLoading(false);

            const userResponse = await fetch(`${API_BASE}/google/status`, {
              credentials: 'include'
            });
            const userData = await userResponse.json();

            if (userData.authenticated && userData.user) {
              localStorage.setItem('ecoraUser', JSON.stringify(userData.user));
              onLoginSuccess(userData.user);
            }
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
            setIsLoading(false);
            setError('Error al autenticar con Google. Por favor, intenta nuevamente.');
          }
        };

        window.addEventListener('message', handleMessage);

        // Verificar si la ventana se cerró
        const checkAuth = setInterval(async () => {
          try {
            if (authWindow.closed) {
              clearInterval(checkAuth);
              window.removeEventListener('message', handleMessage);
              setIsLoading(false);

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

  // Seleccionar método de login según plataforma
  const handleGoogleLogin = () => {
    if (isNative) {
      handleNativeLogin();
    } else {
      handleWebLogin();
    }
  };

  return (
    <IonPage>
      <IonContent className="login-content">
        <div className="login-container">
          {/* Logo de Ecora */}
          <div className="login-logo">
            <h1 className="ecora-title">ecora clic</h1>
            <div className="ecora-subtitle">Todo en un clic</div>
          </div>

          {/* Descripción */}
          <IonText color="medium" className="login-description">
            <p>
              Encuentra todo lo que quieras en un solo clic
            </p>
          </IonText>

          {/* Botón de Sign in with Apple (solo iOS, requisito guía 4.8) */}
          {isIOS && (
            <IonButton
              expand="block"
              size="large"
              onClick={handleAppleLogin}
              disabled={isLoading}
              className="apple-login-button"
            >
              <IonIcon icon={logoApple} slot="start" />
              Iniciar sesión con Apple
            </IonButton>
          )}

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

          {/* Acceso demo para revisión de App Store */}
          {showDemo && (
            <div className="demo-login-form">
              <IonInput
                className="demo-input"
                type="email"
                placeholder="Correo demo"
                autocapitalize="off"
                value={demoEmail}
                onIonInput={(e) => setDemoEmail(e.detail.value || '')}
              />
              <IonInput
                className="demo-input"
                type="password"
                placeholder="Contraseña"
                value={demoPassword}
                onIonInput={(e) => setDemoPassword(e.detail.value || '')}
              />
              <IonButton
                expand="block"
                onClick={handleDemoLogin}
                disabled={isLoading || !demoEmail || !demoPassword}
                className="demo-submit-button"
              >
                {isLoading ? <IonSpinner name="crescent" /> : 'Ingresar'}
              </IonButton>
            </div>
          )}

          <button
            type="button"
            className="demo-toggle-link"
            onClick={() => setShowDemo((v) => !v)}
          >
            {showDemo ? 'Ocultar acceso demo' : 'Acceso demo'}
          </button>

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
