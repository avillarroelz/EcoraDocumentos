# Ecora Backend API

API REST para la gestión de secciones jerárquicas de Ecora.

## 🚀 Inicio Rápido

### Instalación

```bash
cd backend
npm install
```

### Configuración

1. Copiar el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env
```

2. Editar `.env` según sea necesario

### Ejecutar el servidor

**Modo desarrollo (con hot reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor se iniciará en `http://localhost:3001`

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

**Respuesta:**
```json
{
  "status": "OK",
  "message": "Ecora API Server is running",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Obtener todas las secciones
```http
GET /api/sections
```

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 10,
    "timestamp": "2025-10-28T12:00:00.000Z"
  }
}
```

### Obtener una sección por ID
```http
GET /api/sections/:id
```

**Parámetros:**
- `id` (string): ID de la sección

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Proyectos de Obras Civiles",
    "description": "Gestión integral de proyectos",
    "children": [...],
    "createdAt": "2025-10-28T12:00:00.000Z",
    "updatedAt": "2025-10-28T12:00:00.000Z"
  }
}
```

### Crear una nueva sección
```http
POST /api/sections
Content-Type: application/json

{
  "title": "Nueva Sección",
  "description": "Descripción opcional",
  "parentId": "1" // Opcional, si se omite crea una sección raíz
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Sección creada exitosamente"
}
```

### Actualizar una sección
```http
PUT /api/sections/:id
Content-Type: application/json

{
  "title": "Título actualizado",
  "description": "Descripción actualizada"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Sección actualizada exitosamente"
}
```

### Eliminar una sección
```http
DELETE /api/sections/:id
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Sección eliminada exitosamente",
  "deletedId": "1"
}
```

**Nota:** Al eliminar una sección, también se eliminan todas sus subsecciones.

### Buscar secciones
```http
POST /api/sections/search
Content-Type: application/json

{
  "query": "mantenimiento"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 3,
    "query": "mantenimiento",
    "timestamp": "2025-10-28T12:00:00.000Z"
  }
}
```

### Restablecer datos de ejemplo
```http
POST /api/sections/reset
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Datos restablecidos exitosamente",
  "data": [...]
}
```

## 🧪 Testing

```bash
npm test
```

## 📂 Estructura del Proyecto

```
backend/
├── server.js          # Servidor Express principal
├── package.json       # Dependencias y scripts
├── .env.example       # Ejemplo de variables de entorno
├── .gitignore         # Archivos ignorados por Git
└── README.md          # Este archivo
```

## 🔧 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **CORS** - Cross-Origin Resource Sharing
- **UUID** - Generación de IDs únicos
- **Morgan** - Logger HTTP
- **Nodemon** - Hot reload en desarrollo
- **Jest** - Framework de testing

## 📝 Notas Técnicas

### Base de Datos

Actualmente utiliza una base de datos **en memoria** (array en JavaScript). Los datos se pierden al reiniciar el servidor.

**Para producción**, se recomienda integrar una base de datos real:

- **MongoDB** con Mongoose
- **PostgreSQL** con Sequelize o TypeORM
- **MySQL** con Sequelize

### CORS

El servidor acepta peticiones desde:
- `http://localhost:3000` (frontend web)
- `http://localhost:8100` (Ionic dev server)

Configurar orígenes adicionales en `.env`

### Estructura de Datos

Las secciones se almacenan en una estructura jerárquica:

```javascript
{
  id: "uuid",
  title: "Título",
  description: "Descripción",
  children: [...],  // Array de subsecciones
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

### Códigos de Estado HTTP

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## 🚢 Despliegue

### Heroku

```bash
heroku create ecora-api
git push heroku main
```

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Variables de Entorno en Producción

```bash
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://ecora-app.com
```

## 📞 Soporte

Para reportar problemas o sugerencias, contactar a contacto@ecora.cl

---

**Ecora Backend API v1.0.0**
