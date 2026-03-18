// Configuración de API para diferentes plataformas
import { Capacitor } from '@capacitor/core';

// URL del backend en producción (AWS Elastic Beanstalk)
const PRODUCTION_API_URL = 'http://ecora-prod-v3.eba-tdqgyq2z.us-east-1.elasticbeanstalk.com/api';

// URL del backend local para pruebas
// 10.0.2.2 es el alias del host desde el emulador Android
const LOCAL_API_URL = 'http://10.0.2.2:3001/api';

// Cambiar a true para usar el backend local en pruebas
const USE_LOCAL_BACKEND = true;

const getApiBase = () => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  console.log('[API Config] Platform:', platform, '| isNative:', isNative);

  // En Android/iOS nativo
  if (isNative || platform === 'android' || platform === 'ios') {
    if (USE_LOCAL_BACKEND) {
      console.log('[API Config] Using LOCAL URL:', LOCAL_API_URL);
      return LOCAL_API_URL;
    }
    console.log('[API Config] Using production URL:', PRODUCTION_API_URL);
    return PRODUCTION_API_URL;
  }

  // En web (desarrollo), usar ruta relativa (el proxy de Vite lo maneja)
  console.log('[API Config] Using web URL: /api');
  return '/api';
};

export const API_BASE = getApiBase();
console.log('[API Config] Final API_BASE:', API_BASE);
export default API_BASE;
