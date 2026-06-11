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
| **Backend (Express + Sequelize)** | AWS Elastic Beanstalk, tras el dominio propio HTTPS `clic.ecoraapp.com` |
| **Frontend web** | Servido desde AWS (no Vercel/Netlify) |
| **Páginas públicas** (ej. Política de Privacidad `/privacidad`) | Servidas directamente por el backend Express |
| **Base de datos** | PostgreSQL en AWS RDS (región `sa-east-1`) |
| **App Android** | APK firmado con `ecora-release-key.jks` → Google Play |
| **App iOS** | Build nativo Capacitor (Xcode) → App Store Connect |

---

## 🚀 Desplegar el backend en AWS

1. **Build / preparación**
   ```bash
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

4. **Verificar**
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
