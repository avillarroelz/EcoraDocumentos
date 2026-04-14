# 🚀 Guía Rápida - Sistema de Roles Ecora

Referencia rápida para trabajar con el sistema de roles y organización.

---

## 🎯 Conceptos Clave

### Jerarquía Organizacional
```
Ecora
└── Línea de Negocio (ej: Construcción)
    └── Unidad de Negocio (ej: Obras Civiles)
        └── Usuarios con roles
```

### 5 Roles Disponibles

| Rol | Acceso | Puede gestionar usuarios | Puede eliminar |
|-----|--------|--------------------------|----------------|
| **super_admin** | Todo | ✅ Todos | ✅ Sí |
| **admin** | Su línea | ✅ De su línea | ✅ De su línea |
| **manager** | Su unidad | ❌ No | ❌ No |
| **user** | Su unidad | ❌ No | ❌ No |
| **viewer** | Su unidad (solo lectura) | ❌ No | ❌ No |

---

## 🔐 Login con Google

### Primera vez (Usuario Nuevo)

1. Click en "Iniciar sesión con Google"
2. Seleccionar cuenta @ecora.cl
3. **Sistema crea usuario con rol `viewer`**
4. Esperar a que administrador asigne:
   - Línea de negocio
   - Unidad de negocio
   - Rol apropiado

### Usuario Existente

1. Click en "Iniciar sesión con Google"
2. Sistema carga rol y permisos
3. Acceso inmediato con permisos configurados

---

## 📋 Tareas Comunes

### Como Super Admin

#### Crear nueva línea de negocio
```bash
POST /api/organization/business-lines
{
  "name": "Nueva Línea",
  "description": "Descripción"
}
```

#### Crear nueva unidad de negocio
```bash
POST /api/organization/business-units
{
  "name": "Nueva Unidad",
  "description": "Descripción",
  "businessLineId": "uuid-de-la-linea"
}
```

#### Asignar rol a usuario
```bash
PUT /api/users/:userId
{
  "role": "admin",
  "businessLineId": "uuid-linea",
  "businessUnitId": null
}
```

---

### Como Admin de Línea

#### Ver mis usuarios
```bash
GET /api/users
# Automáticamente filtrado a tu línea
```

#### Crear unidad en mi línea
```bash
POST /api/organization/business-units
{
  "name": "Nueva Unidad",
  "businessLineId": "mi-linea-id"
}
```

#### Asignar usuario a mi unidad
```bash
PUT /api/users/:userId
{
  "businessUnitId": "uuid-unidad",
  "role": "user"
}
```

#### Desactivar usuario
```bash
POST /api/users/:userId/deactivate
```

---

### Como Manager/User/Viewer

#### Ver mi perfil
```bash
GET /api/users/me
```

#### Ver jerarquía (filtrada a mi acceso)
```bash
GET /api/organization/hierarchy
```

---

## 🏢 Estructura de Datos

### Línea de Negocio
```json
{
  "id": "uuid",
  "name": "Construcción",
  "description": "Proyectos de obras civiles",
  "createdAt": "2025-11-14...",
  "updatedAt": "2025-11-14..."
}
```

### Unidad de Negocio
```json
{
  "id": "uuid",
  "name": "Obras Civiles",
  "description": "Construcción de infraestructura",
  "businessLineId": "uuid-linea-padre",
  "createdAt": "2025-11-14...",
  "updatedAt": "2025-11-14..."
}
```

### Usuario
```json
{
  "id": "uuid",
  "googleId": "google-user-id",
  "email": "usuario@ecora.cl",
  "name": "Juan Pérez",
  "picture": "https://...",
  "role": "admin",
  "businessLineId": "uuid-linea",
  "businessUnitId": "uuid-unidad",
  "isActive": true,
  "createdAt": "2025-11-14...",
  "updatedAt": "2025-11-14...",
  "lastLogin": "2025-11-14..."
}
```

---

## ⚠️ Restricciones Importantes

### Super Admin
- ❌ **No puede ser eliminado**
- ✅ Email por defecto: `admin@ecora.cl`

### Admin
- ❌ No puede crear `super_admin`
- ❌ No puede modificar usuarios fuera de su línea
- ❌ No puede eliminar líneas de negocio

### Manager/User/Viewer
- ❌ No pueden gestionar usuarios
- ❌ No pueden modificar organización
- ❌ Solo ven datos de su unidad

### Eliminación de Línea
- ❌ No se puede eliminar si tiene unidades asociadas
- ✅ Primero eliminar todas las unidades

---

## 🔍 Consultas Útiles

### ¿Qué roles puede ver un admin?
```bash
GET /api/users/system/roles
# NO incluirá super_admin en la respuesta
```

### ¿Qué usuarios puedo ver?
```bash
GET /api/users
# Automáticamente filtrado según tu rol:
# - super_admin: todos
# - admin: tu línea
# - manager: tu unidad
# - user/viewer: solo tú
```

### ¿A qué secciones tengo acceso?
```bash
GET /api/sections
# Futuro: filtrado automático según businessLineId/businessUnitId
```

---

## 🚨 Solución de Problemas

### "No autenticado"
- Verificar que iniciaste sesión con Google
- Revisar que la sesión no haya expirado (24 horas)
- Intentar cerrar sesión y volver a entrar

### "Permiso denegado"
- Verificar tu rol actual: `GET /api/users/me`
- Contactar a tu administrador para cambio de rol
- Verificar que estés asignado a una línea/unidad

### "Usuario desactivado"
- Contactar al administrador del sistema
- Solo super_admin o admin pueden reactivar

---

## 📊 Matriz de Permisos

| Acción | super_admin | admin | manager | user | viewer |
|--------|-------------|-------|---------|------|--------|
| Ver todo | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver su línea | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver su unidad | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear secciones | ✅ | ✅ | ✅ | ✅ | ❌ |
| Editar secciones | ✅ | ✅ | ✅ | ✅ | ❌ |
| Eliminar secciones | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ✅ (su línea) | ❌ | ❌ | ❌ |
| Gestionar organización | ✅ | ✅ (su línea) | ❌ | ❌ | ❌ |
| Importar Drive | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exportar datos | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🔗 Enlaces Útiles

- [Documentación Completa](./ROLES_SYSTEM.md)
- [Documentación del Backend](./backend/README.md)
- [Guía de Configuración Google](./GOOGLE_DRIVE_SETUP.md)

---

## 📝 Notas

- **Nuevos usuarios** siempre comienzan como `viewer`
- **Sesiones** duran 24 horas
- **Cambios de rol** requieren cerrar sesión y volver a entrar
- **Email corporativo** (@ecora.cl) recomendado

---

**Valores Ecora**: Innovación · Seguridad · Excelencia

**Versión**: 2.0.0
