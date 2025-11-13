# 🔗 Configuración de Integración con Google Drive

Guía completa para configurar la integración de Google Drive con la aplicación Ecora.

---

## 📋 Requisitos Previos

1. **Cuenta de Google** (Gmail / Google Workspace)
2. **Acceso a Google Cloud Console**
3. **Proyecto Ecora** instalado y funcionando
4. **Navegador web** moderno (Chrome, Firefox, Edge, Safari)

---

## 🚀 Paso 1: Crear Proyecto en Google Cloud

### 1.1 Acceder a Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Iniciar sesión con su cuenta de Google
3. En la parte superior, hacer click en "Select a project"
4. Click en "**NEW PROJECT**"

### 1.2 Configurar el Proyecto

```
Nombre del proyecto: Ecora Drive Integration
Organization: (su organización o dejar en blanco)
Location: (su organización o dejar en blanco)
```

5. Click en "**CREATE**"
6. Esperar unos segundos mientras se crea el proyecto
7. Seleccionar el proyecto recién creado desde el menú superior

---

## 🔑 Paso 2: Habilitar Google Drive API

### 2.1 Acceder a la Biblioteca de APIs

1. En el menú lateral, ir a **APIs & Services > Library**
2. En el buscador, escribir: `Google Drive API`
3. Click en "**Google Drive API**"
4. Click en el botón "**ENABLE**"
5. Esperar a que se habilite la API

---

## 🎫 Paso 3: Crear Credenciales OAuth 2.0

### 3.1 Configurar Pantalla de Consentimiento

1. Ir a **APIs & Services > OAuth consent screen**
2. Seleccionar tipo de usuario:
   - **Internal** (si es para su organización Google Workspace)
   - **External** (si es para cualquier usuario de Google)
3. Click en "**CREATE**"

### 3.2 Completar Información de la Aplicación

**Información de la app OAuth:**
```
App name: Ecora Document Manager
User support email: (su email)
App logo: (opcional - puede subir el logo de Ecora)
```

**Dominio de la aplicación:**
```
Application home page: http://localhost:3000
Application privacy policy link: (opcional)
Application terms of service link: (opcional)
```

**Authorized domains:**
```
localhost
```

**Developer contact information:**
```
Email addresses: (su email)
```

4. Click en "**SAVE AND CONTINUE**"

### 3.3 Configurar Scopes (Alcances)

1. Click en "**ADD OR REMOVE SCOPES**"
2. Buscar y seleccionar los siguientes scopes:

```
.../auth/drive.readonly
.../auth/drive.metadata.readonly
```

3. Click en "**UPDATE**"
4. Click en "**SAVE AND CONTINUE**"

### 3.4 Usuarios de Prueba (solo para External)

Si eligió "External", agregar usuarios de prueba:

1. Click en "**ADD USERS**"
2. Agregar los emails que podrán probar la aplicación
3. Click en "**ADD**"
4. Click en "**SAVE AND CONTINUE**"

### 3.5 Revisar y Finalizar

1. Revisar la información
2. Click en "**BACK TO DASHBOARD**"

---

## 🔐 Paso 4: Crear Credenciales OAuth Client ID

### 4.1 Crear OAuth Client ID

1. Ir a **APIs & Services > Credentials**
2. Click en "**+ CREATE CREDENTIALS**"
3. Seleccionar "**OAuth client ID**"

### 4.2 Configurar Client ID

```
Application type: Web application
Name: Ecora Web Client
```

**Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:8100
```

**Authorized redirect URIs:**
```
http://localhost:3001/api/google/callback
```

4. Click en "**CREATE**"

### 4.3 Guardar Credenciales

Aparecerá un modal con sus credenciales:

```
Your Client ID: algo como 123456789-abcdef.apps.googleusercontent.com
Your Client Secret: algo como GOCSPX-abc123xyz
```

**⚠️ IMPORTANTE:**
- Copiar el **Client ID** y el **Client Secret**
- NO compartir estas credenciales públicamente
- Guardarlas en un lugar seguro

5. Click en "**OK**"

---

## ⚙️ Paso 5: Configurar Variables de Entorno en el Backend

### 5.1 Crear archivo .env

1. Navegar a la carpeta `backend/` del proyecto
2. Crear un archivo llamado `.env` (sin extensión)
3. Copiar el contenido de `.env.example`

### 5.2 Configurar las Credenciales

Editar el archivo `.env` y reemplazar los valores:

```env
# Puerto del servidor
PORT=3001

# Entorno
NODE_ENV=development

# CORS - Orígenes permitidos (separados por comas)
CORS_ORIGIN=http://localhost:3000,http://localhost:8100

# Logging
LOG_LEVEL=dev

# Google Drive API Configuration
GOOGLE_CLIENT_ID=TU_CLIENT_ID_AQUI.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback

# Session Secret (cambiar a un valor aleatorio seguro)
SESSION_SECRET=mi_clave_secreta_super_segura_y_aleatoria_12345
```

**Ejemplo con credenciales reales:**
```env
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789jkl
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback
SESSION_SECRET=8f7d6e5c4b3a2910fedcba9876543210
```

### 5.3 Generar Session Secret Seguro

Para generar una clave secreta aleatoria, puede usar:

**En Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**En Bash/Terminal:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎯 Paso 6: Reiniciar el Backend

### 6.1 Detener el Servidor Actual

Si el backend está corriendo, detenerlo con `Ctrl + C`

### 6.2 Reiniciar el Servidor

```bash
cd backend
npm start
```

Debería ver el mensaje de inicio con los endpoints de Google Drive:

```
╔═══════════════════════════════════════════════╗
║   🚀 Ecora Backend API Server                ║
║                                               ║
║   Endpoints - Google Drive:                   ║
║   - GET    /api/google/auth                   ║
║   - GET    /api/google/callback               ║
║   - GET    /api/google/status                 ║
║   - POST   /api/google/import                 ║
║   - POST   /api/google/list                   ║
║   - POST   /api/google/logout                 ║
╚═══════════════════════════════════════════════╝
```

---

## ✅ Paso 7: Probar la Integración

### 7.1 Iniciar la Aplicación

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   npm start
   ```

### 7.2 Conectar con Google Drive

1. Abrir http://localhost:3000
2. Click en el botón "**Drive**" en la barra superior
3. Se abrirá el modal de Google Drive
4. Click en "**Conectar con Google**"
5. Se abrirá una ventana emergente de autenticación de Google
6. Seleccionar su cuenta de Google
7. Revisar los permisos solicitados:
   - Ver y descargar todos sus archivos de Google Drive
   - Ver información sobre sus archivos de Google Drive
8. Click en "**Permitir**"
9. La ventana se cerrará y volverá a la aplicación
10. Debería ver "**Conectado con Google Drive**" ✅

### 7.3 Importar Estructura

1. Seleccionar el alcance de importación:
   - **Mi Drive completo**: Toda su estructura de carpetas
   - **Carpetas compartidas conmigo**: Solo carpetas compartidas
   - **Carpeta específica**: Una carpeta por su ID

2. Click en "**Importar Estructura**"
3. Esperar mientras se importa (puede tomar unos segundos)
4. Las carpetas y archivos aparecerán como secciones en Ecora

---

## 🔧 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Problema:** La URI de redirección no coincide

**Solución:**
1. Verificar que en Google Cloud Console, en **Credentials > OAuth 2.0 Client IDs**,
   la URI autorizada sea exactamente: `http://localhost:3001/api/google/callback`
2. Verificar que en `.env` el valor sea: `GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback`
3. NO debe haber barra final (/)

### Error: "invalid_client"

**Problema:** Client ID o Secret incorrectos

**Solución:**
1. Verificar que copiaste correctamente el Client ID y Secret
2. No debe haber espacios al inicio o final
3. Revisar el archivo `.env`

### Error: "access_denied"

**Problema:** El usuario no tiene acceso a la aplicación

**Solución:**
1. Si la app está en modo "External" y "Testing", agregar el email como usuario de prueba
2. Ir a **OAuth consent screen > Test users > ADD USERS**

### La ventana emergente no se cierra

**Problema:** Bloqueo de ventanas emergentes

**Solución:**
1. Permitir ventanas emergentes en el navegador para localhost:3000
2. Chrome: Click en el ícono de bloqueo en la barra de dirección
3. Permitir ventanas emergentes y redirecciones

---

## 📊 Estructura de Datos Importados

Cada carpeta/archivo de Drive se convierte en una sección de Ecora con la siguiente estructura:

```javascript
{
  id: "uuid-generado",
  title: "Nombre del archivo/carpeta",
  description: "Descripción del archivo (si existe)",
  driveId: "ID original de Google Drive",
  driveMetadata: {
    mimeType: "application/vnd.google-apps.folder",
    createdTime: "2024-01-15T10:30:00.000Z",
    modifiedTime: "2024-01-20T15:45:00.000Z",
    size: "1024",
    webViewLink: "https://drive.google.com/...",
    iconLink: "https://drive-thirdparty.googleusercontent.com/...",
    isFolder: true
  },
  children: [...]
}
```

---

## 🔒 Seguridad

### Mejores Prácticas

1. **NO subir el archivo `.env` a Git**
   - Ya está en `.gitignore`

2. **Cambiar SESSION_SECRET en producción**
   - Usar un valor largo y aleatorio

3. **Usar HTTPS en producción**
   - Actualizar las URIs autorizadas a `https://`

4. **Limitar scopes al mínimo necesario**
   - Solo usamos `readonly` y `metadata.readonly`

---

## 📝 Recursos Adicionales

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## 🎓 Capacitación

### Video Tutorial (próximamente)

Se recomienda crear un video tutorial mostrando:
1. Configuración en Google Cloud Console
2. Configuración del archivo .env
3. Primera autenticación
4. Importación de carpetas

---

**Documento creado para Ecora**
**Valores Ecora**: Innovación · Seguridad · Excelencia
**Versión**: 1.0.0
**Fecha**: Noviembre 2025
