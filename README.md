# Ecora - Aplicación de Gestión Jerárquica

Aplicación híbrida (móvil y web) desarrollada con React + Ionic para la gestión de secciones y subsecciones con estructura jerárquica infinita, siguiendo la identidad de marca de Ecora.

## 🎨 Características de Diseño

- **Colores de marca Ecora**: Basado en el manual de marca oficial
  - Azul principal (#002873)
  - Azul secundario (#0676e8)
  - Azul brillante (#0032ff)
  - Azul claro (#90e0ff)
  - Coral (#ff9976)

- **Tipografías**:
  - IBM Plex Mono (títulos y elementos principales)
  - Spectral (textos de lectura)

- **Elementos visuales**:
  - Retícula/trama característica de Ecora
  - Líneas decorativas cyan
  - Sistema de diseño cohesivo

## ✨ Funcionalidades

### Gestión de Secciones
- ✅ Crear secciones de nivel raíz
- ✅ Agregar subitems infinitos a cualquier sección
- ✅ Editar título y descripción de secciones
- ✅ Eliminar secciones (con confirmación)
- ✅ Expandir/contraer ramas del árbol
- ✅ Indicadores visuales de profundidad jerárquica
- ✅ Búsqueda y filtrado avanzado
- ✅ Drag & drop para reordenar

### Integración con Google Drive ⭐ NUEVO
- ✅ Autenticación OAuth 2.0 con Google
- ✅ Importar estructura de carpetas desde Drive
- ✅ Soporte para tres alcances:
  - Mi Drive completo
  - Carpetas compartidas conmigo
  - Carpeta específica por ID
- ✅ Preservar jerarquía infinita de carpetas
- ✅ Incluir archivos con enlaces a Drive
- ✅ Sincronización manual bajo demanda

### Interfaz y Persistencia
- ✅ Persistencia de datos con localStorage
- ✅ Interfaz responsive (móvil y web)
- ✅ Animaciones suaves y transiciones
- ✅ Backend API REST completo

## 🚀 Instalación

### Prerrequisitos

- Node.js 16+ y npm instalados
- Para desarrollo móvil: Android Studio o Xcode

### Pasos de instalación

1. **Clonar o acceder al proyecto**
   ```bash
   cd C:\Users\ECORA\Documents\GitHub\EcoraDocumentos
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo (Web)**
   ```bash
   npm start
   ```
   La aplicación se abrirá en `http://localhost:3000`

4. **Compilar para producción**
   ```bash
   npm run build
   ```

## 📱 Desarrollo Móvil

### Android

1. **Agregar plataforma Android**
   ```bash
   npm install @capacitor/android
   npx cap add android
   ```

2. **Sincronizar código**
   ```bash
   npm run build
   npx cap sync android
   ```

3. **Abrir en Android Studio**
   ```bash
   npx cap open android
   ```

### iOS

1. **Agregar plataforma iOS** (requiere macOS)
   ```bash
   npm install @capacitor/ios
   npx cap add ios
   ```

2. **Sincronizar código**
   ```bash
   npm run build
   npx cap sync ios
   ```

3. **Abrir en Xcode**
   ```bash
   npx cap open ios
   ```

## 📖 Uso de la Aplicación

### Crear una sección raíz
1. Presiona el botón flotante `+` (esquina inferior derecha)
2. Ingresa el título y descripción (opcional)
3. Presiona "Crear Sección"

### Agregar subsección
1. Presiona el ícono `+` junto a cualquier sección existente
2. Completa el formulario
3. La nueva subsección aparecerá anidada bajo la sección padre

### Editar una sección
1. Desliza la sección hacia la izquierda
2. Presiona el botón "Editar"
3. Modifica los datos y guarda

### Eliminar una sección
1. Desliza la sección hacia la izquierda
2. Presiona el botón "Eliminar"
3. Confirma la eliminación
   - **Nota**: Se eliminarán también todas las subsecciones

### Expandir/Contraer
- Toca cualquier sección que tenga hijos para expandir/contraer sus subsecciones

### Restablecer datos
- Presiona el ícono de actualización en la barra superior para volver a los datos de ejemplo

## 🗂️ Estructura del Proyecto

```
EcoraDocumentos/
├── src/
│   ├── components/
│   │   ├── SectionItem.jsx          # Componente individual de sección
│   │   ├── SectionItem.css
│   │   ├── AddSectionModal.jsx      # Modal para agregar/editar
│   │   └── AddSectionModal.css
│   ├── pages/
│   │   ├── Home.jsx                 # Página principal
│   │   └── Home.css
│   ├── theme/
│   │   ├── variables.css            # Variables de color Ecora
│   │   └── global.css               # Estilos globales
│   ├── App.jsx                      # Componente raíz
│   └── main.jsx                     # Punto de entrada
├── public/
├── index.html
├── package.json
├── vite.config.js
├── capacitor.config.json
└── README.md
```

## 🎯 Arquitectura Técnica

### Stack Tecnológico
- **Framework**: React 18
- **UI Framework**: Ionic 7
- **Bundler**: Vite 5
- **Plataforma móvil**: Capacitor 5
- **Estilos**: CSS custom properties + Ionic components
- **Persistencia**: localStorage (browser/webview)

### Estructura de Datos

Los datos se almacenan en formato JSON recursivo:

```javascript
{
  id: "unique-id",
  title: "Título de la sección",
  description: "Descripción opcional",
  children: [
    {
      id: "child-id",
      title: "Subsección",
      description: "",
      children: [...]
    }
  ]
}
```

### Gestión de Estado
- Estado local con React hooks (`useState`, `useEffect`)
- Persistencia automática en localStorage
- Operaciones recursivas para manipular el árbol

## 🔧 Personalización

### Cambiar colores
Edita `src/theme/variables.css` y modifica las variables CSS:
```css
:root {
  --ecora-blue-primary: #002873;
  --ecora-blue-secondary: #0676e8;
  /* ... otros colores */
}
```

### Modificar tipografías
Las fuentes se cargan desde Google Fonts en `index.html`. Para cambiarlas, actualiza:
1. El enlace en `index.html`
2. Las variables en `src/theme/variables.css`

### Ajustar niveles de jerarquía
Los estilos de profundidad se definen en `src/components/SectionItem.css`:
```css
.section-item.level-0 { /* Nivel raíz */ }
.section-item.level-1 { /* Primer nivel */ }
/* ... más niveles */
```

## 🔗 Integración con Google Drive

La aplicación permite importar la estructura completa de carpetas y archivos desde Google Drive.

### Configuración Inicial

Para habilitar la integración con Google Drive, siga la guía detallada:

📖 **[GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)** - Configuración paso a paso

### Uso Rápido

1. **Conectar con Google Drive**
   - Click en el botón "Drive" en la barra superior
   - Click en "Conectar con Google"
   - Autorizar los permisos solicitados

2. **Importar Carpetas**
   - Seleccionar alcance (Mi Drive / Compartidos / Carpeta específica)
   - Click en "Importar Estructura"
   - Las carpetas aparecerán como secciones en Ecora

3. **Características**
   - Las carpetas se importan con toda su jerarquía
   - Los archivos incluyen enlaces directos a Drive
   - Los metadatos (fechas, tamaño) se preservan
   - La estructura se sincroniza manualmente

### Requisitos

- Cuenta de Google
- Credenciales OAuth 2.0 (ver guía de configuración)
- Variables de entorno configuradas en backend/.env

## 📱 Compatibilidad

- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ iOS 13+
- ✅ Android 6.0+ (API level 23+)
- ✅ Tablets y dispositivos grandes
- ✅ Modo oscuro (respeta preferencias del sistema)

## 🐛 Solución de Problemas

### La aplicación no inicia
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
npm start
```

### Cambios no se reflejan
```bash
# Limpiar caché de Vite
npm run build -- --force
```

### Error en sincronización móvil
```bash
# Re-sincronizar Capacitor
npx cap sync
```

## 📄 Licencia

Aplicación desarrollada para Ecora - Todos los derechos reservados.

## 👥 Contacto

**Ecora**
- Sitio web: www.ecora.cl
- Email: contacto@ecora.cl
- Dirección: Av. Argentina 2355, Antofagasta

---

**Valores Ecora**: Innovación · Seguridad · Excelencia
