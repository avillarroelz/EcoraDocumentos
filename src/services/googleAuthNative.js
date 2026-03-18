/**
 * Servicio de Autenticación Google Nativa para Capacitor
 *
 * Usa el plugin @codetrix-studio/capacitor-google-auth para autenticación
 * nativa en Android/iOS con selector de cuentas dentro de la app.
 */

import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { API_BASE } from '../config/api';

// Inicializar el plugin de Google Auth
export const initGoogleAuth = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[GoogleAuthNative] No es plataforma nativa, omitiendo inicialización');
    return;
  }

  try {
    await GoogleAuth.initialize({
      clientId: '331686188304-ucgqkqh4q7qj5lqrl7epn52i85ka3n0d.apps.googleusercontent.com',
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'],
      grantOfflineAccess: true
    });
    console.log('[GoogleAuthNative] Plugin inicializado correctamente');
  } catch (error) {
    console.error('[GoogleAuthNative] Error inicializando plugin:', error);
  }
};

/**
 * Inicia sesión con Google usando el plugin nativo.
 * Muestra el selector de cuentas nativo dentro de la app.
 *
 * @returns {Promise<Object>} Datos del usuario autenticado
 */
export const signInWithGoogle = async () => {
  try {
    console.log('[GoogleAuthNative] Iniciando login nativo...');
    console.log('[GoogleAuthNative] API_BASE:', API_BASE);

    // El plugin muestra el selector de cuentas nativo
    let googleUser;
    try {
      googleUser = await GoogleAuth.signIn();
    } catch (signInError) {
      console.error('[GoogleAuthNative] Error en GoogleAuth.signIn():', signInError);
      console.error('[GoogleAuthNative] Error code:', signInError.code);
      console.error('[GoogleAuthNative] Error message:', signInError.message);
      throw new Error(`Error de Google Sign-In: ${signInError.message || signInError.code || 'desconocido'}`);
    }

    // Enviar tokens al backend para validación y creación de sesión
    const backendUrl = `${API_BASE}/google/auth/native`;

    let response;
    let data;

    try {
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          idToken: googleUser.authentication?.idToken,
          accessToken: googleUser.authentication?.accessToken,
          serverAuthCode: googleUser.serverAuthCode,
          user: {
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name || googleUser.givenName,
            givenName: googleUser.givenName,
            familyName: googleUser.familyName,
            imageUrl: googleUser.imageUrl
          }
        })
      });

      // Intentar parsear la respuesta
      const responseText = await response.text();

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[GoogleAuthNative] Error parseando respuesta:', parseError);
        throw new Error(`Error del servidor: ${response.status} - ${responseText.substring(0, 100)}`);
      }
    } catch (fetchError) {
      console.error('[GoogleAuthNative] Error de conexión:', fetchError);
      throw new Error(`No se pudo conectar al servidor. Verifica tu conexión a internet. (${fetchError.message})`);
    }

    if (!response.ok) {
      // Hacer logout del plugin si el backend rechaza
      await GoogleAuth.signOut();
      throw new Error(data.message || `Error del servidor: ${response.status}`);
    }

    if (!data.success) {
      await GoogleAuth.signOut();
      throw new Error(data.message || 'Autenticación fallida');
    }

    console.log('[GoogleAuthNative] Backend validó correctamente');
    return data.user;

  } catch (error) {
    console.error('[GoogleAuthNative] Error en login:', error);

    // Intentar hacer logout en caso de error parcial
    try {
      await GoogleAuth.signOut();
    } catch (logoutError) {
      console.warn('[GoogleAuthNative] Error al hacer logout:', logoutError);
    }

    throw error;
  }
};

/**
 * Cierra sesión de Google
 */
export const signOutGoogle = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
      console.log('[GoogleAuthNative] Sesión cerrada en plugin');
    }
  } catch (error) {
    console.warn('[GoogleAuthNative] Error cerrando sesión:', error);
  }
};

/**
 * Verifica si el usuario está actualmente autenticado en el plugin
 */
export const isSignedIn = async () => {
  try {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    const isAuthorized = await GoogleAuth.refresh();
    return !!isAuthorized?.accessToken;
  } catch (error) {
    return false;
  }
};

export default {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  isSignedIn
};
