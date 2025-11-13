# Guía de Deployment del Backend - Ecora Documentos

El backend de Ecora necesita estar en un servidor separado ya que Netlify solo soporta archivos estáticos (frontend).

## 🚂 Opción 1: Railway.app (Recomendado - MÁS FÁCIL)

Railway es la opción más simple y tiene plan gratuito generoso.

### Pasos:

1. **Crear cuenta en Railway**
   - Ve a https://railway.app
   - Haz clic en "Start a New Project"
   - Inicia sesión con GitHub

2. **Deploy desde GitHub**
   - Click en "Deploy from GitHub repo"
   - Selecciona el repositorio `EcoraDocumentos`
   - Railway detectará automáticamente la carpeta `backend`
   - Click en "Deploy Now"

3. **Configurar Variables de Entorno**

   En el panel de Railway, ve a "Variables" y agrega:

   ```
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://TU-APP.netlify.app
   SESSION_SECRET=genera_un_secret_aleatorio_aqui
   GOOGLE_CLIENT_ID=tu_google_client_id
   GOOGLE_CLIENT_SECRET=tu_google_client_secret
   GOOGLE_REDIRECT_URI=https://TU-BACKEND.up.railway.app/api/google/callback
   ```

4. **Obtener la URL del Backend**
   - Railway te dará una URL como: `https://tu-backend.up.railway.app`
   - Copia esta URL

5. **Actualizar el Frontend (Netlify)**
   - En tu proyecto, necesitarás actualizar las llamadas API para apuntar a esta URL
   - Las rutas cambiarán de `http://localhost:3001/api/*` a `https://tu-backend.up.railway.app/api/*`

---

## 🎨 Opción 2: Render.com

Render también es gratuito y fácil de usar.

### Pasos:

1. **Crear cuenta**
   - Ve a https://render.com
   - Registrate con GitHub

2. **Crear Web Service**
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio `EcoraDocumentos`
   - Configuración:
     - **Name**: ecora-backend
     - **Root Directory**: `backend`
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Variables de Entorno**

   Agrega las mismas variables que en Railway:

   ```
   NODE_ENV=production
   CORS_ORIGIN=https://TU-APP.netlify.app
   SESSION_SECRET=genera_un_secret_aleatorio_aqui
   GOOGLE_CLIENT_ID=tu_google_client_id
   GOOGLE_CLIENT_SECRET=tu_google_client_secret
   GOOGLE_REDIRECT_URI=https://tu-backend.onrender.com/api/google/callback
   ```

4. **Deploy**
   - Click en "Create Web Service"
   - Render comenzará el deployment automáticamente

---

## ☁️ Opción 3: Heroku

### Preparación:

1. **Instalar Heroku CLI**
   ```bash
   # En Windows
   winget install Heroku.HerokuCLI
   ```

2. **Login y crear app**
   ```bash
   heroku login
   cd backend
   heroku create ecora-backend
   ```

3. **Configurar variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://TU-APP.netlify.app
   heroku config:set SESSION_SECRET=tu_secret_aqui
   heroku config:set GOOGLE_CLIENT_ID=tu_client_id
   heroku config:set GOOGLE_CLIENT_SECRET=tu_secret
   heroku config:set GOOGLE_REDIRECT_URI=https://ecora-backend.herokuapp.com/api/google/callback
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

---

## 🔗 Conectar Frontend con Backend

Una vez que el backend esté deployado, necesitas actualizar el frontend:

### Si usaste variables de entorno en el código:

En tu proyecto de Netlify, agrega una variable de entorno:

```
VITE_API_URL=https://tu-backend.up.railway.app
```

### Si las URLs están hardcodeadas:

Necesitarás actualizar manualmente las URLs en el código del frontend de:
```javascript
http://localhost:3001/api/...
```

a:
```javascript
https://tu-backend.up.railway.app/api/...
```

---

## 📝 Configurar Google OAuth para Producción

1. **Ve a Google Cloud Console**
   - https://console.cloud.google.com/apis/credentials

2. **Actualiza las URLs autorizadas**
   - **JavaScript origins**: Agrega `https://TU-APP.netlify.app`
   - **Redirect URIs**: Agrega `https://TU-BACKEND.up.railway.app/api/google/callback`

3. **Actualiza las credenciales**
   - Copia el Client ID y Client Secret
   - Agrégalos como variables de entorno en Railway/Render

---

## ✅ Verificar que funciona

1. **Test del backend**
   - Ve a: `https://tu-backend.up.railway.app/api/health`
   - Deberías ver: `{"status":"OK","message":"Ecora API Server is running"}`

2. **Test de CORS**
   - Desde tu app de Netlify, intenta hacer una petición
   - Si hay error de CORS, verifica la variable `CORS_ORIGIN`

3. **Test de Google OAuth**
   - Intenta autenticarte desde el frontend
   - Verifica que el redirect funcione correctamente

---

## 🎯 Resumen Rápido

**Para Railway (MÁS SIMPLE):**
1. railway.app → Deploy from GitHub
2. Selecciona `EcoraDocumentos/backend`
3. Agrega variables de entorno
4. Copia la URL generada
5. Actualiza CORS_ORIGIN en las variables
6. Actualiza frontend para usar esa URL

**Costo:** GRATIS (con límites generosos)

**Tiempo estimado:** 10-15 minutos

---

## 🆘 Troubleshooting

### Error: "Cannot GET /"
✅ Esto es normal. El backend es una API, no tiene página principal.
Prueba: `/api/health`

### Error de CORS
✅ Verifica que `CORS_ORIGIN` incluya la URL exacta de Netlify (con https://)

### Error 503 / Backend no responde
✅ Revisa los logs en Railway/Render
✅ Verifica que todas las variables de entorno estén configuradas

### Google OAuth no funciona
✅ Verifica las URLs en Google Cloud Console
✅ Asegúrate de que `GOOGLE_REDIRECT_URI` apunte al backend deployado
