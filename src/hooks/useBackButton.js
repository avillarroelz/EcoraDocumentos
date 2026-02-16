import { useEffect, useCallback, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Hook para manejar el botón de retroceso nativo de Android
 *
 * Funcionalidades:
 * - Navega hacia atrás en el historial
 * - Cierra modales abiertos antes de navegar
 * - Muestra confirmación antes de salir de la app (en la pantalla principal)
 * - Solo se activa en dispositivos Android nativos
 */
const useBackButton = (options = {}) => {
  const history = useHistory();
  const location = useLocation();
  const lastBackPressRef = useRef(0);
  const toastTimeoutRef = useRef(null);

  const {
    // Callback personalizado para manejar el back button
    onBackPress,
    // Si hay un modal abierto, esta función lo cierra
    closeModal,
    // Si hay un modal abierto
    isModalOpen = false,
    // Rutas donde mostrar confirmación antes de salir
    exitRoutes = ['/home', '/login'],
    // Habilitar/deshabilitar el comportamiento
    enabled = true
  } = options;

  // Función para mostrar toast usando el DOM (compatible con web y nativo)
  const showExitToast = useCallback(() => {
    // Remover toast anterior si existe
    const existingToast = document.getElementById('ecora-exit-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Crear toast element
    const toast = document.createElement('div');
    toast.id = 'ecora-exit-toast';
    toast.textContent = 'Presiona de nuevo para salir';
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 30, 30, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      font-family: var(--md-font-secondary, -apple-system, sans-serif);
      font-size: 14px;
      font-weight: 500;
      z-index: 99999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: toastFadeIn 0.2s ease-out;
    `;

    // Agregar estilos de animación si no existen
    if (!document.getElementById('ecora-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'ecora-toast-styles';
      style.textContent = `
        @keyframes toastFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastFadeOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Remover después de 2 segundos
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      toast.style.animation = 'toastFadeOut 0.2s ease-out forwards';
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }, []);

  const handleBackButton = useCallback(() => {
    // Si hay un callback personalizado, ejecutarlo primero
    if (onBackPress) {
      const handled = onBackPress();
      if (handled) return; // Si el callback manejó el evento, no hacer nada más
    }

    // Si hay un modal abierto, cerrarlo
    if (isModalOpen && closeModal) {
      closeModal();
      return;
    }

    // Verificar si estamos en una ruta de salida (home o login)
    const isExitRoute = exitRoutes.some(route => location.pathname === route);

    if (isExitRoute) {
      // Doble tap para salir
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        // Salir de la aplicación
        App.exitApp();
      } else {
        lastBackPressRef.current = now;
        console.log('[Ecora] Presiona de nuevo para salir');
        showExitToast();
      }
      return;
    }

    // Navegar hacia atrás en el historial
    if (history.length > 1) {
      history.goBack();
    } else {
      // Si no hay historial, ir a home
      history.replace('/home');
    }
  }, [history, location, onBackPress, closeModal, isModalOpen, exitRoutes, showExitToast]);

  useEffect(() => {
    // Solo activar en Android nativo
    if (!enabled || Capacitor.getPlatform() !== 'android') {
      return;
    }

    // Registrar el listener del back button
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      console.log('[Ecora] Back button presionado, canGoBack:', canGoBack);
      handleBackButton();
    });

    // Cleanup al desmontar
    return () => {
      backButtonListener.then(listener => listener.remove());
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [enabled, handleBackButton]);

  // Retornar función para navegación manual hacia atrás
  return {
    goBack: handleBackButton,
    canGoBack: history.length > 1
  };
};

export default useBackButton;
