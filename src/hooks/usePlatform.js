import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook para detectar la plataforma actual (Android, iOS, Web)
 * Aplica clases CSS específicas al body para estilos por plataforma
 */
const usePlatform = () => {
  const [platform, setPlatform] = useState('web');
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Detectar plataforma usando Capacitor
    const detectedPlatform = Capacitor.getPlatform();
    const native = Capacitor.isNativePlatform();

    setPlatform(detectedPlatform);
    setIsNative(native);

    // Limpiar clases anteriores
    document.body.classList.remove('platform-android', 'platform-ios', 'platform-web');

    // Aplicar clase según plataforma
    if (detectedPlatform === 'android') {
      document.body.classList.add('platform-android');
    } else if (detectedPlatform === 'ios') {
      document.body.classList.add('platform-ios');
    } else {
      document.body.classList.add('platform-web');

      // En web, detectar si es navegador móvil para simular estilos
      const userAgent = navigator.userAgent.toLowerCase();
      if (/android/i.test(userAgent)) {
        document.body.classList.add('platform-android');
      } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        document.body.classList.add('platform-ios');
      }
    }

    // Log para debug
    console.log(`[Ecora] Plataforma detectada: ${detectedPlatform}, Nativo: ${native}`);
  }, []);

  return {
    platform,
    isNative,
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web'
  };
};

export default usePlatform;
