# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Siempre comunicarse en español con el usuario.

## Proyecto

**Ecora Documentos** — Aplicación híbrida (web/Android/iOS) para gestión documental con secciones jerárquicas e integración Google Drive. Monorepo con frontend React+Ionic y backend Express+PostgreSQL.

## Comandos de desarrollo

### Frontend (raíz del proyecto)
```bash
npm start              # Dev server Vite en puerto 3000
npm run build          # Build producción → dist/
npm run build:android  # Build + cap sync Android
npm run build:ios      # Build + cap sync iOS
npm run android        # Build + ejecutar en Android
npm run ios            # Build + ejecutar en iOS
npm run sync           # Capacitor sync
```

### Backend (directorio backend/)
```bash
cd backend
npm run dev            # Nodemon en puerto 3001
npm start              # Producción
npm test               # Jest con cobertura
node scripts/initDatabase.js  # Inicializar BD
```

### Android APK
```bash
cd android && ./gradlew assembleRelease
# O desde raíz: build-apk.bat
```

### Proxy de desarrollo
Vite proxea `/api` → `http://localhost:3001` (configurado en `vite.config.js`). Para desarrollo local ejecutar ambos servidores simultáneamente.

## Arquitectura

### Frontend: React 18 + Ionic 7 + Capacitor 5
- **Páginas** en `src/pages/`: Home (principal), Login, SectionDetail, AdminOrganization, AdminUsers
- **Componentes** en `src/components/`: SectionItem (recursivo, núcleo de la jerarquía), GoogleDriveModal, SyncFolderModal, MoveSectionModal, CompactView, AdvancedFilters, FilePreviewModal
- **Config API** en `src/config/api.js`: detecta plataforma (Capacitor nativo vs web) y selecciona URL base
- **Auth nativa** en `src/services/googleAuthNative.js`: plugin Capacitor para Google Sign-In en Android/iOS
- **Hooks**: `useBackButton` (navegación), `usePlatform` (detección plataforma)
- **Temas**: variables CSS Ecora en `src/theme/`, con estilos separados por plataforma (`platform-android.css`, `platform-ios.css`, `platform-web.css`)

### Backend: Express + Sequelize + PostgreSQL (AWS RDS)
- **server.js**: punto de entrada, configura Express, CORS dinámico, sesiones, rutas OAuth y API
- **Modelos Sequelize** en `backend/models/db/`: Usuario, Rol, LineaNegocio, UnidadNegocio, Seccion, tablas intermedias N:M
- **Rutas** en `backend/routes/`: sections.js, organization.sequelize.js, users.sequelize.js (las versiones `.sequelize.js` son las que usan BD; las sin sufijo usan almacenamiento en memoria)
- **Middleware auth** en `backend/middleware/auth.js`: requireAuth, requirePermission, requireRole, requireBusinessLineAccess, requireBusinessUnitAccess
- **Servicios** en `backend/services/`: authService.js, organizationService.js

### Modelo de datos clave
- **Secciones**: jerarquía infinita padre-hijo (parentId auto-referencial), con metadata de Drive
- **Roles**: 5 niveles (super_admin, admin, manager, user, viewer) con permisos JSONB
- **Organización**: LineaNegocio → UnidadNegocio (1:N), usuarios asignados vía tablas N:M

### Integración Google Drive
- OAuth 2.0 con scopes: profile, email, drive.readonly
- Importación recursiva de carpetas preservando jerarquía
- Sincronización manual bajo demanda
- Auth diferente para web (popup) vs nativo (plugin Capacitor)

### Despliegue
- **Frontend**: Vercel (configurado en `vercel.json`, SPA rewrite)
- **Backend**: AWS (configuración en `CONFIGURACION_AWS_PRODUCCION.md`)
- **BD**: PostgreSQL en AWS RDS (región sa-east-1)
- **Android**: APK firmado con `ecora-release-key.jks`

## Colores de marca Ecora
- Azul principal: `#002873` (dominante)
- Azul secundario: `#0676e8`
- Azul brillante: `#0032ff`
- Azul claro: `#90e0ff`
- Coral: `#ff9976`
- Tipografía: Poppins (títulos), Inter (texto)

## Reglas de Control de Versiones (Git)

- Cuando el usuario confirme que algo funciona ("funciona", "listo", "perfecto"), SIEMPRE preguntar si desea guardar en git con un commit.
- Antes de cambios significativos (>50 líneas, 3+ archivos, configs críticas, refactorizaciones, eliminación de código), preguntar si hacer commit de respaldo.
- Si algo deja de funcionar después de cambios, ofrecer restaurar con `git checkout` antes de intentar arreglar manualmente.
