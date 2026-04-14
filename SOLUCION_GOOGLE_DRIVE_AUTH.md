# Solución al Problema de Autenticación con Google Drive

## Problema Identificado

El proceso de autenticación con Google Drive se quedaba "colgado" eternamente en el paso de "Conectando" debido a que los mensajes `postMessage` entre la ventana popup y la ventana principal no llegaban correctamente.

## Causas Posibles

1. **Timing Issues**: La ventana popup se cerraba antes de que el mensaje llegara
2. **Bloqueo de postMessage**: Algunos navegadores bloquean `postMessage` entre ventanas
3. **Problemas de CORS**: Origen de mensajes no coincidente
4. **Cookies de sesión**: Problemas con `sameSite` en las cookies

## Soluciones Implementadas

### 1. **Sistema de Comunicación Triple Redundante**

Ahora la autenticación usa 3 métodos simultáneos:

- **Método A: postMessage** - Comunicación directa entre ventanas
- **Método B: localStorage** - Polling cada 300ms como fallback
- **Método C: Verificación de sesión** - Consulta al servidor cuando la ventana se cierra

### 2. **Timeout Aumentado**

- Ventana popup se cierra después de **3 segundos** (antes 2 segundos)
- Timeout de seguridad de **30 segundos** para evitar carga infinita
- La página de callback reintenta enviar el mensaje **5 veces** cada 200ms

### 3. **Mejor Logging y Debug**

Ahora puedes ver en la consola del navegador:
```
🎯 Iniciando notificación de autenticación exitosa...
✅ localStorage establecido
📤 Enviando postMessage a ventana padre...
✅ postMessage enviado con origen: http://localhost:3000
🔄 Intento de notificación #1
🔄 Intento de notificación #2
...
```

### 4. **Detección de Bloqueo de Popups**

Si el navegador bloquea la ventana popup, ahora muestra un mensaje claro:
> "No se pudo abrir la ventana de autenticación. Verifica que los popups estén permitidos."

### 5. **Manejo de Ventana Cerrada Manualmente**

Si el usuario cierra la ventana antes de completar la autenticación, el sistema:
- Espera 500ms para que la sesión se establezca
- Verifica el estado de autenticación con el servidor
- Muestra mensaje apropiado si falló

## Cómo Probar

1. **Abre la consola del navegador** (F12)
2. Ve a la pestaña Console
3. Intenta conectarte a Google Drive
4. Observa los logs para ver qué método funcionó

## Troubleshooting Adicional

### Si sigue sin funcionar:

#### 1. Verificar que los popups están permitidos
- Chrome: Icono en la barra de direcciones (extremo derecho)
- Edge: Similar a Chrome
- Firefox: Barra de información en la parte superior

#### 2. Verificar credenciales de Google
Asegúrate de que en `backend/.env`:
```env
GOOGLE_CLIENT_ID=<TU_GOOGLE_CLIENT_ID>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<TU_GOOGLE_CLIENT_SECRET>
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback
```

#### 3. Verificar URIs autorizados en Google Cloud Console

Ve a: https://console.cloud.google.com/apis/credentials

Asegúrate de que estén configurados:
- **JavaScript origins**: `http://localhost:3000`, `http://localhost:8100`
- **Redirect URIs**: `http://localhost:3001/api/google/callback`

#### 4. Limpiar localStorage y cookies

Si hubo intentos fallidos previos:
```javascript
// En la consola del navegador
localStorage.clear();
```

Luego recarga la página (Ctrl+F5).

#### 5. Verificar que el backend está ejecutándose

```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ Conexión a PostgreSQL establecida
🚀 Ecora Backend API Server v2.0
Server: http://localhost:3001
```

#### 6. Probar manualmente el flujo

1. Abre: http://localhost:3001/api/google/auth
2. Deberías ver:
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

3. Copia la `authUrl` y pégala en una nueva pestaña
4. Completa la autenticación
5. Deberías ser redirigido a `/api/google/callback`
6. Si ves "✓ Autenticación Exitosa", el backend funciona correctamente

#### 7. Revisar logs del servidor

Mira la consola donde ejecutas `npm run dev` en el backend:
```
💾 Sesión guardada exitosamente
📋 Session ID: ...
👤 Usuario guardado: tu-email@gmail.com
🔑 Tokens guardados: true
```

## Cambios Técnicos Realizados

### Frontend (`src/components/GoogleDriveModal.jsx`)

```javascript
// Antes: Solo postMessage
window.addEventListener('message', handleMessage);

// Ahora: Triple sistema redundante
1. Event listener para postMessage
2. Polling de localStorage cada 300ms
3. Verificación de estado cuando se cierra la ventana
4. Timeout de seguridad de 30 segundos
```

### Backend (`backend/server.js`)

```javascript
// Antes: 1 intento de postMessage, cierre en 2s
window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
setTimeout(() => window.close(), 2000);

// Ahora: 5 intentos cada 200ms, localStorage, cierre en 3s
- localStorage.setItem('googleAuthSuccess', 'true')
- 5 intentos de postMessage (cada 200ms)
- Cierre después de 3 segundos
```

## Resultado Esperado

Ahora deberías ver uno de estos escenarios:

### Escenario Exitoso 1: postMessage funciona
```
📩 Mensaje recibido: {type: 'GOOGLE_AUTH_SUCCESS'} desde: http://localhost:3001
✅ Autenticación exitosa vía postMessage
```

### Escenario Exitoso 2: localStorage funciona
```
✅ Autenticación exitosa vía localStorage
```

### Escenario Exitoso 3: Verificación de sesión funciona
```
🔄 Ventana cerrada, verificando estado de autenticación...
```

Y luego avanzarás automáticamente al **Paso 2: Configurar** ✅

## Notas Importantes

- Los cambios son **retrocompatibles** y no afectan importaciones existentes
- Si un método falla, automáticamente intenta los otros
- El sistema es más robusto y tolerante a fallos
- Los logs ayudan a diagnosticar problemas específicos

## Próximos Pasos

Una vez que la autenticación funcione:

1. Selecciona qué deseas importar:
   - Todo Mi Drive
   - Compartido conmigo
   - Carpetas específicas
   - Carpetas compartidas específicas

2. Confirma la importación

3. Los archivos se importarán con su estructura jerárquica completa

---

**Autor**: Claude Sonnet 4.5
**Fecha**: 2026-01-05
**Versión**: 2.0
