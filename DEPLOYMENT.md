# Guía de Deployment - Ecora Documentos

> **Todo el despliegue de Ecora Documentos se realiza en AWS.** No se utiliza Vercel
> ni Netlify. El backend Express y el frontend web se sirven desde AWS, la base de
> datos vive en AWS RDS, y las apps móviles se distribuyen por App Store / Play Store.

La configuración detallada de infraestructura (VPC, Elastic Beanstalk, RDS, dominio
y certificado HTTPS) está en **`CONFIGURACION_AWS_PRODUCCION.md`**.

---

## 🌐 Arquitectura de despliegue

| Componente | Dónde se despliega |
|---|---|
| **CDN** | CloudFront (distribución `E3B6DL411P45K1`, `d114wag0prx756.cloudfront.net`) delante de todo `clic.ecoraapp.com`; cachea/comprime estáticos, `/api/*` pasa sin caché |
| **Backend (Express + Sequelize)** | AWS Elastic Beanstalk (`ecora-backend` / `ecora-prod-v3`, us-east-1), origen de CloudFront |
| **Frontend web** | Build de Vite (`npm run build` → `dist/`) copiado a `backend/dist`; Express lo sirve (`express.static` + fallback SPA) |
| **Páginas públicas** (ej. Política de Privacidad `/privacidad`) | Servidas directamente por el backend Express |
| **Base de datos** | PostgreSQL en AWS RDS (región `sa-east-1`) |
| **App Android** | APK firmado con `ecora-release-key.jks` → Google Play |
| **App iOS** | Build nativo Capacitor (Xcode) → App Store Connect |

---

## 🚀 Desplegar el backend (+ frontend web) en AWS

1. **Build / preparación**
   ```bash
   npm run build                    # genera dist/ en la raíz
   # copiar dist/ → backend/dist (el ZIP de deploy empaqueta solo backend/)
   cd backend
   npm install --production
   ```

2. **Variables de entorno requeridas** (en la consola de Elastic Beanstalk → Configuration → Environment properties):
   - `NODE_ENV=production`
   - `SESSION_SECRET` (obligatorio en producción)
   - `CORS_ORIGIN` (lista separada por comas de orígenes permitidos)
   - Credenciales de BD (host RDS, usuario, contraseña, nombre)
   - Credenciales de Google OAuth (Client ID / Secret)

3. **Deploy a Elastic Beanstalk**
   - Vía consola AWS (subir bundle ZIP), o
   - Vía EB CLI:
     ```bash
     eb deploy
     ```

4. **Invalidar la caché de CloudFront** (obligatorio tras cada deploy con frontend nuevo,
   porque `index.html` queda cacheado en el edge):
   ```bash
   aws cloudfront create-invalidation --distribution-id E3B6DL411P45K1 --paths "/*"
   ```

5. **Verificar**
   - `https://clic.ecoraapp.com/` → debe cargar la aplicación web (SPA)
   - `https://clic.ecoraapp.com/api/health` (o el endpoint de salud correspondiente)
   - `https://clic.ecoraapp.com/privacidad` → debe mostrar la Política de Privacidad

> Consulta `CONFIGURACION_AWS_PRODUCCION.md` para los pasos completos de
> infraestructura, dominio y certificado HTTPS.

---

## 📱 Build de apps móviles

### Android
```bash
npm run build:android
cd android && ./gradlew assembleRelease   # APK firmado con ecora-release-key.jks
```

### iOS (requiere macOS con Xcode)
```bash
npm run build:ios
npx cap open ios     # Product → Archive → Distribute App → App Store Connect
```

---

## 📋 Características funcionales en producción

- Interfaz completa, secciones jerárquicas, búsqueda y reorganización (drag & drop)
- Modo de edición para administradores, roles y permisos
- Vista responsive (desktop / mobile)
- **Google OAuth + Google Drive**: operativos gracias al backend en AWS
- Datos persistidos en PostgreSQL (AWS RDS)
