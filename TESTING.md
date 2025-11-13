# Plan de Pruebas - Aplicación Ecora

Documento de pruebas funcionales para la aplicación híbrida Ecora.

## 📋 Pruebas del Frontend

### 1. Pruebas de UI/UX

#### 1.1 Carga Inicial
- [ ] La aplicación carga correctamente en http://localhost:3000
- [ ] El logo "ecora" se muestra en el header
- [ ] Los colores coinciden con el manual de marca (azul #002873, #0676e8, etc.)
- [ ] Las tipografías IBM Plex Mono y Spectral se cargan correctamente
- [ ] Se muestran los datos de ejemplo iniciales

#### 1.2 Diseño Responsivo
- [ ] La aplicación se adapta correctamente en desktop (1920x1080)
- [ ] La aplicación se adapta correctamente en tablet (768x1024)
- [ ] La aplicación se adapta correctamente en móvil (375x667)
- [ ] No hay scroll horizontal no deseado
- [ ] El botón FAB (+) es accesible en todas las resoluciones

### 2. Funcionalidad CRUD

#### 2.1 Crear Sección
- [ ] Click en botón FAB (+) abre el modal
- [ ] El modal muestra el formulario vacío
- [ ] No permite guardar sin título
- [ ] Permite guardar solo con título (descripción opcional)
- [ ] La nueva sección aparece en la lista
- [ ] El modal se cierra después de guardar
- [ ] Los datos persisten en localStorage

#### 2.2 Crear Subsección
- [ ] Click en (+) junto a una sección abre el modal
- [ ] El modal muestra el nombre de la sección padre
- [ ] La nueva subsección aparece anidada correctamente
- [ ] La indentación visual muestra el nivel jerárquico
- [ ] Se puede crear subsecciones de subsecciones (múltiples niveles)

#### 2.3 Editar Sección
- [ ] Deslizar sección a la izquierda muestra opciones
- [ ] Click en "Editar" abre el modal con datos actuales
- [ ] Los cambios se reflejan inmediatamente
- [ ] No afecta a las subsecciones
- [ ] Los cambios persisten en localStorage

#### 2.4 Eliminar Sección
- [ ] Deslizar sección a la izquierda muestra opciones
- [ ] Click en "Eliminar" muestra alerta de confirmación
- [ ] La alerta explica que eliminará subsecciones
- [ ] "Cancelar" cierra sin eliminar
- [ ] "Eliminar" remueve la sección y todas sus subsecciones
- [ ] Los cambios persisten en localStorage

### 3. Búsqueda y Filtrado

#### 3.1 Barra de Búsqueda
- [ ] La barra de búsqueda aparece en la parte superior
- [ ] El placeholder dice "Buscar secciones..."
- [ ] Tiene debounce (no busca en cada tecla)
- [ ] Muestra un chip con el número de resultados

#### 3.2 Funcionalidad de Búsqueda
- [ ] Busca en títulos de secciones
- [ ] Busca en descripciones de secciones
- [ ] Busca en todos los niveles de jerarquía
- [ ] Resalta el texto encontrado en color coral
- [ ] Filtra correctamente mostrando solo coincidencias
- [ ] Si un hijo coincide, muestra también el padre
- [ ] Muestra mensaje "No se encontraron resultados" si no hay coincidencias
- [ ] Limpiar búsqueda (X en el chip) restaura toda la lista

### 4. Drag & Drop (Reordenar)

#### 4.1 Arrastrar y Soltar
- [ ] El cursor cambia a "move" sobre una sección
- [ ] Al arrastrar, la sección se vuelve semi-transparente
- [ ] Solo permite reordenar en el mismo nivel
- [ ] Al soltar, la sección se mueve a la nueva posición
- [ ] El orden se mantiene después de recargar
- [ ] Los cambios persisten en localStorage

### 5. Expandir/Contraer

#### 5.1 Navegación Jerárquica
- [ ] Secciones con hijos muestran ícono de flecha
- [ ] Click en la sección expande/contrae los hijos
- [ ] La flecha rota según el estado (abajo = expandido, derecha = contraído)
- [ ] Los estados se mantienen durante la sesión
- [ ] Expandir/contraer es suave con animación

### 6. Persistencia de Datos

#### 6.1 LocalStorage
- [ ] Los datos se guardan automáticamente en localStorage
- [ ] Recargar la página mantiene los datos
- [ ] Cerrar y abrir el navegador mantiene los datos
- [ ] El botón de reset restablece los datos de ejemplo
- [ ] Después de reset, la página se recarga automáticamente

## 🔧 Pruebas del Backend

### 1. Servidor

#### 1.1 Inicio del Servidor
```bash
cd backend
npm install
npm start
```
- [ ] El servidor inicia sin errores
- [ ] Muestra el mensaje ASCII de bienvenida
- [ ] Corre en el puerto 3001
- [ ] Lista todos los endpoints disponibles

#### 1.2 Health Check
```bash
curl http://localhost:3001/api/health
```
- [ ] Devuelve status 200
- [ ] Respuesta contiene "status": "OK"
- [ ] Incluye timestamp

### 2. Endpoints CRUD

#### 2.1 GET /api/sections
```bash
curl http://localhost:3001/api/sections
```
- [ ] Devuelve status 200
- [ ] Respuesta incluye array "data"
- [ ] Respuesta incluye "meta" con total
- [ ] Los datos tienen la estructura correcta

#### 2.2 GET /api/sections/:id
```bash
curl http://localhost:3001/api/sections/1
```
- [ ] Devuelve status 200 para ID existente
- [ ] Devuelve status 404 para ID inexistente
- [ ] Incluye datos de la sección y sus hijos

#### 2.3 POST /api/sections
```bash
curl -X POST http://localhost:3001/api/sections \
  -H "Content-Type: application/json" \
  -d '{"title": "Nueva Sección", "description": "Prueba"}'
```
- [ ] Devuelve status 201
- [ ] Crea la sección correctamente
- [ ] Genera un ID único (UUID)
- [ ] Incluye timestamps createdAt y updatedAt

#### 2.4 POST /api/sections (con parentId)
```bash
curl -X POST http://localhost:3001/api/sections \
  -H "Content-Type: application/json" \
  -d '{"title": "Subsección", "parentId": "1"}'
```
- [ ] Devuelve status 201
- [ ] Crea la subsección bajo el padre correcto
- [ ] Actualiza el updatedAt del padre

#### 2.5 PUT /api/sections/:id
```bash
curl -X PUT http://localhost:3001/api/sections/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Título Actualizado", "description": "Nueva descripción"}'
```
- [ ] Devuelve status 200
- [ ] Actualiza los campos correctamente
- [ ] Actualiza el timestamp updatedAt
- [ ] Devuelve status 404 para ID inexistente

#### 2.6 DELETE /api/sections/:id
```bash
curl -X DELETE http://localhost:3001/api/sections/1
```
- [ ] Devuelve status 200
- [ ] Elimina la sección
- [ ] Elimina también todas las subsecciones
- [ ] Devuelve status 404 para ID inexistente

#### 2.7 POST /api/sections/search
```bash
curl -X POST http://localhost:3001/api/sections/search \
  -H "Content-Type: application/json" \
  -d '{"query": "mantenimiento"}'
```
- [ ] Devuelve status 200
- [ ] Filtra correctamente por título
- [ ] Filtra correctamente por descripción
- [ ] Incluye resultados anidados
- [ ] Devuelve el total correcto

#### 2.8 POST /api/sections/reset
```bash
curl -X POST http://localhost:3001/api/sections/reset
```
- [ ] Devuelve status 200
- [ ] Restablece los datos de ejemplo
- [ ] Respuesta incluye los nuevos datos

### 3. Validaciones

#### 3.1 Validación de Entrada
- [ ] POST sin título devuelve error 400
- [ ] PUT sin título devuelve error 400
- [ ] POST con parentId inexistente devuelve error 404
- [ ] Todos los errores incluyen mensaje descriptivo

#### 3.2 CORS
- [ ] Acepta peticiones desde localhost:3000
- [ ] Acepta peticiones desde localhost:8100
- [ ] Las opciones preflight funcionan correctamente

## 🔗 Pruebas de Integración

### 1. Frontend + Backend

#### 1.1 Configurar Integración
1. Iniciar backend: `cd backend && npm start`
2. Iniciar frontend: `npm start`
3. Ambos deben correr simultáneamente

#### 1.2 Flujo Completo
- [ ] Frontend puede obtener datos del backend
- [ ] Crear sección desde frontend actualiza backend
- [ ] Editar sección sincroniza correctamente
- [ ] Eliminar sección funciona end-to-end
- [ ] Búsqueda funciona con datos del backend
- [ ] No hay errores de CORS

## 📱 Pruebas Móviles (Opcional)

### 1. Compilar para Android

```bash
npm run build
npx cap sync android
npx cap open android
```

#### 1.1 Funcionalidad Móvil
- [ ] La app se instala correctamente
- [ ] La interfaz es touch-friendly
- [ ] Los gestos de deslizar funcionan
- [ ] El drag & drop funciona con touch
- [ ] El teclado virtual no cubre inputs
- [ ] La app es responsive en diferentes tamaños

### 2. Compilar para iOS (requiere Mac)

```bash
npm run build
npx cap sync ios
npx cap open ios
```

## 📊 Resultados de Pruebas

### Fecha: _________________
### Probador: _________________

| Categoría | Pruebas Totales | Pasadas | Fallidas | Notas |
|-----------|----------------|---------|----------|-------|
| UI/UX Frontend | | | | |
| CRUD Frontend | | | | |
| Búsqueda | | | | |
| Drag & Drop | | | | |
| Backend API | | | | |
| Integración | | | | |
| **TOTAL** | | | | |

## 🐛 Bugs Encontrados

| ID | Descripción | Severidad | Estado | Notas |
|----|-------------|-----------|--------|-------|
| | | | | |

## ✅ Checklist Final

Antes de considerar la aplicación lista para producción:

- [ ] Todas las pruebas de frontend pasan
- [ ] Todas las pruebas de backend pasan
- [ ] La integración funciona correctamente
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en los logs del servidor
- [ ] La documentación está actualizada
- [ ] Los datos persisten correctamente
- [ ] La UI cumple con el manual de marca
- [ ] La aplicación es responsive
- [ ] Los errores se manejan gracefully

---

**Firma del Responsable de QA**: _________________

**Fecha de Aprobación**: _________________
