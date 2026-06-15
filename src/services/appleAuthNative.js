/**
 * Servicio de Sign in with Apple para Capacitor (iOS).
 *
 * Usa el plugin @capacitor-community/apple-sign-in para autenticación nativa.
 * Requerido por la guía 4.8 de App Store: ofrecer un login equivalente a Google
 * que limite la recolección de datos a nombre y email.
 */

import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { API_BASE } from '../config/api';

/**
 * Inicia sesión con Apple usando el plugin nativo y valida en el backend.
 *
 * @returns {Promise<Object>} Datos del usuario autenticado
 */
export const signInWithApple = async () => {
  try {
    console.log('[AppleAuthNative] Iniciando Sign in with Apple...');

    let result;
    try {
      result = await SignInWithApple.authorize({
        // clientId/redirectURI no son necesarios en el flujo nativo iOS,
        // pero el plugin acepta scopes para solicitar nombre y email.
        scopes: 'email name'
      });
    } catch (authError) {
      console.error('[AppleAuthNative] Error en authorize():', authError);
      // El usuario canceló el diálogo nativo
      if (authError?.code === '1001' || /cancel/i.test(authError?.message || '')) {
        throw new Error('Inicio de sesión con Apple cancelado.');
      }
      throw new Error(`Error de Sign in with Apple: ${authError?.message || 'desconocido'}`);
    }

    const response = result?.response;
    if (!response?.identityToken) {
      throw new Error('Apple no devolvió un token de identidad.');
    }

    // Apple solo entrega givenName/familyName/email en el PRIMER inicio de sesión.
    const backendUrl = `${API_BASE}/auth/apple`;

    let res;
    let data;
    try {
      res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identityToken: response.identityToken,
          authorizationCode: response.authorizationCode,
          user: {
            email: response.email || null,
            givenName: response.givenName || null,
            familyName: response.familyName || null
          }
        })
      });

      const responseText = await res.text();
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Error del servidor: ${res.status} - ${responseText.substring(0, 100)}`);
      }
    } catch (fetchError) {
      console.error('[AppleAuthNative] Error de conexión:', fetchError);
      throw new Error(`No se pudo conectar al servidor. Verifica tu conexión a internet. (${fetchError.message})`);
    }

    if (!res.ok || !data.success) {
      throw new Error(data?.message || `Error del servidor: ${res.status}`);
    }

    console.log('[AppleAuthNative] Backend validó correctamente');
    return data.user;

  } catch (error) {
    console.error('[AppleAuthNative] Error en login:', error);
    throw error;
  }
};

export default { signInWithApple };
