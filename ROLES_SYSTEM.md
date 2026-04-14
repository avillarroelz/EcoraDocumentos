# 🔐 Sistema de Roles y Organización - Ecora SGI

Documentación completa del sistema de roles, permisos y estructura organizacional implementado en Ecora SGI.

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Estructura Organizacional](#estructura-organizacional)
3. [Roles y Permisos](#roles-y-permisos)
4. [Autenticación con Google](#autenticación-con-google)
5. [Endpoints API](#endpoints-api)
6. [Flujo de Trabajo](#flujo-de-trabajo)
7. [Casos de Uso](#casos-de-uso)
8. [Seguridad](#seguridad)

---

## 🎯 Visión General

El sistema de roles de Ecora permite:

- ✅ **Autenticación con Google OAuth 2.0** (sin contraseñas)
- ✅ **Jerarquía organizacional**: Líneas de Negocio → Unidades de Negocio
- ✅ **5 niveles de roles** con permisos granulares
- ✅ **Control de acceso basado en roles (RBAC)**
- ✅ **Filtrado de datos** según línea/unidad del usuario
- ✅ **Gestión centralizada** de usuarios y organización

---

## 🏢 Estructura Organizacional

### Jerarquía

```
Ecora (Empresa)
├── Línea de Negocio 1: Construcción
│   ├── Unidad: Obras Civiles
│   └── Unidad: Edificación
├── Línea de Negocio 2: Mantención
│   ├── Unidad: Mantención Preventiva
│   └── Unidad: Mantención Correctiva
└── Línea de Negocio 3: Ingeniería
    ├── Unidad: Ingeniería de Proyectos
    └── Unidad: Consultoría Técnica
```

### Líneas de Negocio

Representan las grandes áreas de negocio de Ecora:

- **Construcción**: Proyectos de obras civiles y edificación
- **Mantención**: Servicios de mantenimiento de infraestructura
- **Ingeniería**: Servicios de ingeniería y consultoría

### Unidades de Negocio

Subdivisiones dentro de cada línea de negocio. Cada usuario puede pertenecer a:
- Una línea de negocio específica
- Una unidad de negocio específica
- Todas (solo super_admin)

---

## 👥 Roles y Permisos

### 1. Super Admin (super_admin)

**Descripción**: Acceso total al sistema

**Permisos**:
- ✅ Gestionar usuarios en toda la organización
- ✅ Crear/editar/eliminar líneas y unidades de negocio
- ✅ Ver y gestionar todas las secciones
- ✅ Importar desde Google Drive
- ✅ Exportar datos
- ✅ Asignar cualquier rol

**Alcance**: Todo el sistema

**Usuario por defecto**:
- Email: `admin@ecora.cl`
- Se crea automáticamente al iniciar el sistema

---

### 2. Admin (admin)

**Descripción**: Administrador de una línea de negocio

**Permisos**:
- ✅ Gestionar usuarios de su línea de negocio
- ✅ Crear/editar unidades de negocio en su línea
- ✅ Ver y gestionar secciones de su línea
- ✅ Eliminar secciones de su línea
- ✅ Importar desde Google Drive
- ✅ Exportar datos de su línea
- ❌ No puede crear super_admin
- ❌ No puede modificar otras líneas

**Alcance**: Su línea de negocio y todas sus unidades

---

### 3. Manager (manager)

**Descripción**: Gestor de una unidad de negocio

**Permisos**:
- ✅ Ver y gestionar secciones de su unidad
- ✅ Crear y editar secciones
- ✅ Importar desde Google Drive
- ✅ Exportar datos de su unidad
- ❌ No puede eliminar secciones
- ❌ No puede gestionar usuarios
- ❌ No puede modificar la organización

**Alcance**: Su unidad de negocio específica

---

### 4. User (user)

**Descripción**: Usuario estándar con permisos de creación/edición

**Permisos**:
- ✅ Ver secciones de su unidad
- ✅ Crear nuevas secciones
- ✅ Editar secciones existentes
- ❌ No puede eliminar secciones
- ❌ No puede exportar datos
- ❌ No puede importar desde Drive

**Alcance**: Su unidad de negocio específica

---

### 5. Viewer (viewer)

**Descripción**: Solo lectura

**Permisos**:
- ✅ Ver secciones de su unidad
- ❌ No puede crear
- ❌ No puede editar
- ❌ No puede eliminar
- ❌ No puede exportar
- ❌ No puede importar

**Alcance**: Su unidad de negocio específica (solo lectura)

**Nota**: Es el rol por defecto para nuevos usuarios que se autentican por primera vez

---

## 🔐 Autenticación con Google

### Flujo de Autenticación

1. **Usuario hace clic en "Iniciar sesión con Google"**
   - Frontend abre ventana emergente con URL de autenticación
   - Endpoint: `GET /api/google/auth`

2. **Usuario autoriza en Google**
   - Selecciona cuenta de Google
   - Acepta permisos solicitados
   - Google redirige a callback del backend

3. **Backend procesa la autenticación**
   - Endpoint: `GET /api/google/callback`
   - Intercambia código por tokens de acceso
   - Obtiene información del usuario de Google
   - **Busca o crea usuario en la base de datos**
   - Asigna rol (viewer por defecto si es nuevo)
   - Guarda sesión con rol y permisos

4. **Usuario accede al sistema**
   - Sesión activa con rol asignado
   - Permisos aplicados automáticamente
   - Interfaz adaptada según permisos

### Registro Automático de Usuarios

Cuando un usuario se autentica por primera vez:

```javascript
// Información recibida de Google
{
  id: "google-user-id-12345",
  email: "usuario@ecora.cl",
  name: "Juan Pérez",
  picture: "https://...",
  verified_email: true
}

// Usuario creado en el sistema
{
  id: "uuid-generado",
  googleId: "google-user-id-12345",
  email: "usuario@ecora.cl",
  name: "Juan Pérez",
  picture: "https://...",
  role: "viewer",              // ← Rol por defecto
  businessLineId: null,        // ← Sin asignar
  businessUnitId: null,        // ← Sin asignar
  isActive: true,
  createdAt: "2025-11-14...",
  lastLogin: "2025-11-14..."
}
```

**Importante**: Un administrador debe asignar:
- Línea de negocio
- Unidad de negocio
- Rol apropiado

---

## 🌐 Endpoints API

### Autenticación

#### Obtener perfil del usuario actual
```http
GET /api/users/me
Authorization: Session cookie (automático)
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@ecora.cl",
    "name": "Juan Pérez",
    "role": "admin",
    "businessLineId": "uuid-linea",
    "businessUnitId": null,
    "permissions": {
      "canManageUsers": true,
      "canManageSections": true,
      "canDeleteSections": true,
      ...
    }
  }
}
```

---

### Usuarios

#### Listar usuarios (según permisos)
```http
GET /api/users
Authorization: Requerida
```

**Filtrado automático**:
- `super_admin`: Ve todos los usuarios
- `admin`: Ve usuarios de su línea de negocio
- `manager`: Ve usuarios de su unidad de negocio
- `user/viewer`: Solo se ve a sí mismo

#### Crear usuario manualmente
```http
POST /api/users
Authorization: super_admin o admin
Content-Type: application/json

{
  "email": "nuevo@ecora.cl",
  "name": "Nuevo Usuario",
  "role": "user",
  "businessLineId": "uuid-linea",
  "businessUnitId": "uuid-unidad"
}
```

#### Actualizar usuario
```http
PUT /api/users/:id
Authorization: super_admin o admin
Content-Type: application/json

{
  "name": "Nombre Actualizado",
  "role": "manager",
  "businessLineId": "uuid-linea-nueva"
}
```

#### Desactivar usuario
```http
POST /api/users/:id/deactivate
Authorization: super_admin o admin
```

#### Activar usuario
```http
POST /api/users/:id/activate
Authorization: super_admin o admin
```

#### Listar roles disponibles
```http
GET /api/users/system/roles
Authorization: Requerida
```

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "role": "super_admin",
      "permissions": { ... }
    },
    {
      "role": "admin",
      "permissions": { ... }
    }
    ...
  ]
}
```

---

### Organización

#### Obtener jerarquía completa
```http
GET /api/organization/hierarchy
Authorization: Requerida
```

**Respuesta** (filtrada según permisos):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-linea",
      "name": "Construcción",
      "description": "Proyectos de obras civiles",
      "businessUnits": [
        {
          "id": "uuid-unidad",
          "name": "Obras Civiles",
          "description": "...",
          "businessLineId": "uuid-linea"
        }
      ]
    }
  ]
}
```

#### Líneas de Negocio

```http
# Listar todas
GET /api/organization/business-lines

# Obtener una
GET /api/organization/business-lines/:id

# Crear (solo super_admin)
POST /api/organization/business-lines
{
  "name": "Nueva Línea",
  "description": "Descripción"
}

# Actualizar (solo super_admin)
PUT /api/organization/business-lines/:id

# Eliminar (solo super_admin)
DELETE /api/organization/business-lines/:id
```

#### Unidades de Negocio

```http
# Listar todas
GET /api/organization/business-units

# Listar por línea
GET /api/organization/business-lines/:lineId/units

# Obtener una
GET /api/organization/business-units/:id

# Crear (super_admin o admin)
POST /api/organization/business-units
{
  "name": "Nueva Unidad",
  "description": "Descripción",
  "businessLineId": "uuid-linea"
}

# Actualizar (super_admin o admin)
PUT /api/organization/business-units/:id

# Eliminar (super_admin o admin)
DELETE /api/organization/business-units/:id
```

---

## 🔄 Flujo de Trabajo

### Caso 1: Nuevo Empleado se une a Ecora

1. **Empleado inicia sesión** con su cuenta de Google `@ecora.cl`
2. **Sistema crea usuario automáticamente** con rol `viewer`
3. **Administrador recibe notificación** (futuro)
4. **Administrador asigna**:
   - Línea de negocio apropiada
   - Unidad de negocio
   - Rol según responsabilidades
5. **Empleado accede** con permisos completos

### Caso 2: Promoción de Usuario

1. Manager es promovido a Admin de línea
2. **Super Admin actualiza**:
   ```http
   PUT /api/users/:id
   {
     "role": "admin",
     "businessUnitId": null  // Ahora gestiona toda la línea
   }
   ```
3. Usuario ahora puede gestionar toda su línea

### Caso 3: Reorganización de Unidades

1. Se crea nueva unidad "Mantención Predictiva"
2. **Admin de Mantención crea**:
   ```http
   POST /api/organization/business-units
   {
     "name": "Mantención Predictiva",
     "businessLineId": "uuid-mantencion"
   }
   ```
3. **Reasigna usuarios** a la nueva unidad

---

## 🔒 Seguridad

### Principios de Seguridad

1. **Autenticación fuerte**: OAuth 2.0 con Google
2. **Sesiones seguras**: HttpOnly cookies, HTTPS en producción
3. **Principio de mínimo privilegio**: Cada usuario solo accede a lo necesario
4. **Auditoría**: Registro de accesos y cambios (lastLogin, updatedAt)
5. **Validación en backend**: Nunca confiar en el frontend

### Protecciones Implementadas

- ✅ Middleware de autenticación en rutas protegidas
- ✅ Validación de permisos por rol
- ✅ Filtrado de datos según alcance del usuario
- ✅ Prevención de escalada de privilegios
- ✅ Usuarios inactivos no pueden acceder
- ✅ Super admin no puede ser eliminado

### Mejores Prácticas

```javascript
// ❌ MAL - No verificar permisos en frontend
async function deleteSection(id) {
  await api.delete(`/sections/${id}`);
}

// ✅ BIEN - El backend valida permisos
async function deleteSection(id) {
  try {
    await api.delete(`/sections/${id}`);
  } catch (error) {
    if (error.status === 403) {
      alert('No tienes permiso para eliminar');
    }
  }
}
```

---

## 📊 Diagrama de Permisos

```
┌─────────────────────────────────────────────────────┐
│                    SUPER ADMIN                       │
│  ✓ Todo el sistema                                   │
│  ✓ Gestión completa de usuarios y organización      │
└─────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────┐
         │                                         │
┌────────▼────────┐                  ┌─────────────▼────────┐
│  ADMIN          │                  │  ADMIN               │
│  Línea: Const.  │                  │  Línea: Mantención   │
│  ✓ Su línea     │                  │  ✓ Su línea          │
│  ✓ Sus unidades │                  │  ✓ Sus unidades      │
└────────┬────────┘                  └─────────────┬────────┘
         │                                         │
    ┌────┴────┐                              ┌─────┴─────┐
    │         │                              │           │
┌───▼──┐  ┌──▼───┐                      ┌───▼──┐    ┌──▼───┐
│MANAGER│ │MANAGER│                     │MANAGER│   │MANAGER│
│Obras  │ │Edific.│                     │Prev.  │   │Correc.│
│Civiles│ │      │                      │       │   │       │
└───┬───┘ └──┬───┘                      └───┬───┘   └──┬───┘
    │        │                              │          │
┌───▼──┐ ┌──▼───┐                      ┌───▼──┐   ┌──▼───┐
│ USER │ │ USER │                      │ USER │   │ USER │
│VIEWER│ │VIEWER│                      │VIEWER│   │VIEWER│
└──────┘ └──────┘                      └──────┘   └──────┘
```

---

## 🚀 Próximos Pasos

### Mejoras Futuras

1. **Notificaciones**
   - Email cuando nuevo usuario se registra
   - Alertas de cambios de rol

2. **Auditoría Avanzada**
   - Log completo de todas las acciones
   - Historial de cambios en secciones

3. **Base de Datos Persistente**
   - Migrar de memoria a PostgreSQL/MongoDB
   - Backups automáticos

4. **Autenticación Multi-Factor**
   - 2FA opcional para roles sensibles

5. **API Keys**
   - Para integraciones externas

6. **Roles Personalizados**
   - Definir permisos granulares por usuario

---

## 📞 Soporte

Para dudas sobre el sistema de roles:

- **Documentación técnica**: `backend/models/userRoles.js`
- **Endpoints**: `backend/routes/users.js`, `backend/routes/organization.js`
- **Middleware**: `backend/middleware/auth.js`

---

**Valores Ecora**: Innovación · Seguridad · Excelencia

**Versión del Sistema**: 2.0.0
**Fecha**: Noviembre 2025
**Autor**: Sistema Ecora SGI
