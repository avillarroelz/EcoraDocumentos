# Guía de Deployment - Ecora Documentos

## 🚀 Deploy en Vercel (Recomendado)

### Opción 1: Deploy Automático desde GitHub

1. **Ir a Vercel**
   - Visita https://vercel.com
   - Haz clic en "Sign Up" o "Log In"
   - Selecciona "Continue with GitHub"

2. **Importar el Proyecto**
   - Una vez autenticado, haz clic en "Add New..." → "Project"
   - Busca el repositorio `EcoraDocumentos`
   - Haz clic en "Import"

3. **Configurar el Proyecto**
   - Vercel detectará automáticamente que es un proyecto Vite
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Variables de Entorno (Opcional)**
   - Si quieres habilitar Google OAuth en producción, agrega:
     - `VITE_GOOGLE_CLIENT_ID`: Tu Client ID de Google
     - Backend URL si es necesario

5. **Deploy**
   - Haz clic en "Deploy"
   - Espera 2-3 minutos
   - ¡Tu app estará en línea!

### Opción 2: Deploy desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

---

## 🌐 Deploy en Netlify

1. **Ir a Netlify**
   - Visita https://netlify.com
   - Inicia sesión con GitHub

2. **Importar desde GitHub**
   - "Add new site" → "Import an existing project"
   - Conecta con GitHub
   - Selecciona `EcoraDocumentos`

3. **Configurar Build**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

4. **Deploy**
   - Haz clic en "Deploy site"

---

## 📋 Características del Deploy

### ✅ Funcionalidades que funcionarán:
- Interfaz de usuario completa
- Sistema de secciones jerárquicas
- Búsqueda de secciones
- Drag & drop para reorganizar
- Modo de edición para administradores
- Persistencia en localStorage por usuario
- Vista responsive (desktop/mobile)

### ⚠️ Limitaciones (solo frontend):
- **Google OAuth**: Requiere backend en servidor separado
- **Google Drive**: Requiere backend configurado
- Los datos se guardan en el navegador (localStorage)

---

## 🔧 Para habilitar funcionalidad completa (OAuth + Drive)

Necesitarás deployar el backend por separado:

### Backend en Railway/Render:

1. Crea cuenta en https://railway.app o https://render.com
2. Conecta el repositorio
3. Configura las variables de entorno del backend
4. Actualiza la URL del backend en el frontend

---

## 📝 Notas Importantes

- El deploy de Vercel/Netlify es **GRATUITO**
- Se actualiza **automáticamente** cada vez que haces push a GitHub
- Incluye **HTTPS** automático
- Tiene **CDN global** para velocidad óptima

---

## 🎯 URL de Ejemplo

Después del deploy, recibirás una URL como:
- Vercel: `https://ecora-documentos.vercel.app`
- Netlify: `https://ecora-documentos.netlify.app`

Puedes personalizar el dominio en la configuración del proyecto.

---

## 💡 Tips

- Usa Vercel si planeas agregar funciones serverless después
- Usa Netlify si quieres simplemente hosting estático
- Ambos tienen excelente soporte para React y Vite
