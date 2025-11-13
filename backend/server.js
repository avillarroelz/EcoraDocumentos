const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const GoogleDriveService = require('./googleDriveConfig');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:8100'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Session middleware para almacenar tokens temporalmente
app.use(session({
  secret: process.env.SESSION_SECRET || 'ecora-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Instancia del servicio de Google Drive
const googleDrive = new GoogleDriveService();

// Base de datos en memoria (en producción usar MongoDB, PostgreSQL, etc.)
let sections = [
  {
    id: '1',
    title: 'Proyectos de Obras Civiles',
    description: 'Gestión integral de proyectos de construcción',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [
      {
        id: '1-1',
        title: 'Planificación',
        description: 'Etapa de diseño y planificación del proyecto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [
          {
            id: '1-1-1',
            title: 'Estudios de Factibilidad',
            description: 'Análisis técnico y económico',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            children: []
          }
        ]
      },
      {
        id: '1-2',
        title: 'Ejecución',
        description: 'Construcción y desarrollo del proyecto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: []
      }
    ]
  },
  {
    id: '2',
    title: 'Mantención de Infraestructura',
    description: 'Servicios de mantenimiento preventivo y correctivo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [
      {
        id: '2-1',
        title: 'Mantenimiento Preventivo',
        description: 'Inspecciones y mantenimiento programado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: []
      }
    ]
  }
];

// Funciones auxiliares
const findSection = (items, id) => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children && item.children.length > 0) {
      const found = findSection(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

const addChildToSection = (items, parentId, newChild) => {
  return items.map(item => {
    if (item.id === parentId) {
      return {
        ...item,
        children: [...(item.children || []), newChild],
        updatedAt: new Date().toISOString()
      };
    } else if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: addChildToSection(item.children, parentId, newChild)
      };
    }
    return item;
  });
};

const updateSection = (items, id, updates) => {
  return items.map(item => {
    if (item.id === id) {
      return {
        ...item,
        ...updates,
        id: item.id, // Preservar ID
        updatedAt: new Date().toISOString()
      };
    } else if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: updateSection(item.children, id, updates)
      };
    }
    return item;
  });
};

const deleteSection = (items, id) => {
  return items
    .filter(item => item.id !== id)
    .map(item => ({
      ...item,
      children: item.children ? deleteSection(item.children, id) : []
    }));
};

const countSections = (items) => {
  return items.reduce((total, item) => {
    const childCount = item.children ? countSections(item.children) : 0;
    return total + 1 + childCount;
  }, 0);
};

// Rutas API - Google Drive Integration

// Iniciar proceso de autenticación con Google
app.get('/api/google/auth', (req, res) => {
  try {
    const authUrl = googleDrive.getAuthUrl();
    res.json({
      success: true,
      authUrl: authUrl,
      message: 'Redirigir al usuario a esta URL para autenticación'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al generar URL de autenticación',
      message: error.message
    });
  }
});

// Callback de Google OAuth (recibe el código de autorización)
app.get('/api/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error de Autenticación</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .message {
              text-align: center;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h2>❌ Error de Autenticación</h2>
            <p>No se proporcionó código de autorización</p>
            <p>Esta ventana se cerrará automáticamente...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
        </html>
      `);
    }

    // Intercambiar código por tokens
    const tokens = await googleDrive.getTokens(code);

    // Establecer credenciales para obtener info del usuario
    googleDrive.setCredentials(tokens);

    // Obtener información del usuario
    const userInfo = await googleDrive.getUserInfo();

    // Guardar tokens e información del usuario en sesión
    req.session.googleTokens = tokens;
    req.session.user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      verified_email: userInfo.verified_email
    };

    // Enviar página HTML que cierra la ventana y notifica al opener
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autenticación Exitosa</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .message {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .success {
            color: #28a745;
            font-size: 48px;
          }
        </style>
      </head>
      <body>
        <div class="message">
          <div class="success">✓</div>
          <h2>Autenticación Exitosa</h2>
          <p>Conectado con Google Drive</p>
          <p>Esta ventana se cerrará automáticamente...</p>
        </div>
        <script>
          // Notificar a la ventana padre si existe
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
          }
          // Cerrar ventana después de 1.5 segundos
          setTimeout(() => {
            window.close();
          }, 1500);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error en callback de Google:', error);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error de Autenticación</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .message {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .error {
            color: #dc3545;
            font-size: 48px;
          }
        </style>
      </head>
      <body>
        <div class="message">
          <div class="error">✗</div>
          <h2>Error de Autenticación</h2>
          <p>No se pudo completar la autenticación con Google</p>
          <p>Esta ventana se cerrará automáticamente...</p>
        </div>
        <script>
          // Notificar a la ventana padre si existe
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR' }, '*');
          }
          // Cerrar ventana después de 2 segundos
          setTimeout(() => {
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
    `);
  }
});

// Verificar estado de autenticación
app.get('/api/google/status', (req, res) => {
  const isAuthenticated = !!req.session.googleTokens;
  res.json({
    success: true,
    authenticated: isAuthenticated,
    user: isAuthenticated ? req.session.user : null,
    message: isAuthenticated ? 'Usuario autenticado con Google' : 'No autenticado'
  });
});

// Importar estructura de carpetas desde Google Drive
app.post('/api/google/import', async (req, res) => {
  try {
    // Verificar autenticación
    if (!req.session.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado con Google Drive',
        message: 'Primero debe autenticarse'
      });
    }

    const { scope, folderId, maxDepth } = req.body;

    // Establecer credenciales
    googleDrive.setCredentials(req.session.googleTokens);

    let driveStructure;

    if (scope === 'folder' && folderId) {
      // Importar carpeta específica
      driveStructure = await googleDrive.buildHierarchy(folderId, maxDepth || -1);
    } else {
      // Importar desde raíz o compartidos
      const rootId = scope === 'shared' ? null : 'root';
      driveStructure = await googleDrive.buildHierarchy(rootId || 'root', maxDepth || -1);
    }

    // Convertir a formato de Ecora
    const ecoraStructure = googleDrive.convertToEcoraSections(driveStructure);

    res.json({
      success: true,
      data: ecoraStructure,
      meta: {
        scope: scope || 'all',
        folderId: folderId || null,
        itemsCount: ecoraStructure.length,
        timestamp: new Date().toISOString()
      },
      message: 'Estructura importada exitosamente desde Google Drive'
    });
  } catch (error) {
    console.error('Error importando desde Google Drive:', error);
    res.status(500).json({
      success: false,
      error: 'Error al importar desde Google Drive',
      message: error.message
    });
  }
});

// Listar carpetas de Drive (sin construir jerarquía completa)
app.post('/api/google/list', async (req, res) => {
  try {
    if (!req.session.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado con Google Drive'
      });
    }

    const { scope, folderId } = req.body;

    googleDrive.setCredentials(req.session.googleTokens);
    const items = await googleDrive.listDriveContents(scope || 'all', folderId);

    res.json({
      success: true,
      data: items,
      meta: {
        count: items.length,
        scope: scope || 'all'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al listar archivos de Drive',
      message: error.message
    });
  }
});

// Cerrar sesión de Google
app.post('/api/google/logout', (req, res) => {
  req.session.googleTokens = null;
  res.json({
    success: true,
    message: 'Sesión de Google Drive cerrada'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Ecora API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GET - Obtener todas las secciones
app.get('/api/sections', (req, res) => {
  try {
    const total = countSections(sections);
    res.json({
      success: true,
      data: sections,
      meta: {
        total: total,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener las secciones',
      message: error.message
    });
  }
});

// GET - Obtener una sección específica por ID
app.get('/api/sections/:id', (req, res) => {
  try {
    const section = findSection(sections, req.params.id);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada'
      });
    }
    res.json({
      success: true,
      data: section
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener la sección',
      message: error.message
    });
  }
});

// POST - Crear una nueva sección raíz o hija
app.post('/api/sections', (req, res) => {
  try {
    const { title, description, parentId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El título es requerido'
      });
    }

    const newSection = {
      id: uuidv4(),
      title: title.trim(),
      description: description?.trim() || '',
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (parentId) {
      // Agregar como hijo
      const parent = findSection(sections, parentId);
      if (!parent) {
        return res.status(404).json({
          success: false,
          error: 'Sección padre no encontrada'
        });
      }
      sections = addChildToSection(sections, parentId, newSection);
    } else {
      // Agregar como raíz
      sections.push(newSection);
    }

    res.status(201).json({
      success: true,
      data: newSection,
      message: 'Sección creada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al crear la sección',
      message: error.message
    });
  }
});

// PUT - Actualizar una sección existente
app.put('/api/sections/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const section = findSection(sections, id);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada'
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El título es requerido'
      });
    }

    const updates = {
      title: title.trim(),
      description: description?.trim() || ''
    };

    sections = updateSection(sections, id, updates);
    const updatedSection = findSection(sections, id);

    res.json({
      success: true,
      data: updatedSection,
      message: 'Sección actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la sección',
      message: error.message
    });
  }
});

// DELETE - Eliminar una sección
app.delete('/api/sections/:id', (req, res) => {
  try {
    const { id } = req.params;

    const section = findSection(sections, id);
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada'
      });
    }

    sections = deleteSection(sections, id);

    res.json({
      success: true,
      message: 'Sección eliminada exitosamente',
      deletedId: id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la sección',
      message: error.message
    });
  }
});

// POST - Buscar secciones
app.post('/api/sections/search', (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El término de búsqueda es requerido'
      });
    }

    const searchTerm = query.toLowerCase().trim();

    const filterSections = (items) => {
      return items.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchTerm);
        const descMatch = item.description?.toLowerCase().includes(searchTerm);
        const hasMatchingChildren = item.children && filterSections(item.children).length > 0;
        return titleMatch || descMatch || hasMatchingChildren;
      }).map(item => ({
        ...item,
        children: item.children ? filterSections(item.children) : []
      }));
    };

    const results = filterSections(sections);
    const total = countSections(results);

    res.json({
      success: true,
      data: results,
      meta: {
        total: total,
        query: query,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al buscar secciones',
      message: error.message
    });
  }
});

// POST - Restablecer datos de ejemplo
app.post('/api/sections/reset', (req, res) => {
  try {
    sections = [
      {
        id: '1',
        title: 'Proyectos de Obras Civiles',
        description: 'Gestión integral de proyectos de construcción',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [
          {
            id: '1-1',
            title: 'Planificación',
            description: 'Etapa de diseño y planificación del proyecto',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            children: []
          }
        ]
      },
      {
        id: '2',
        title: 'Mantención de Infraestructura',
        description: 'Servicios de mantenimiento preventivo y correctivo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: []
      }
    ];

    res.json({
      success: true,
      message: 'Datos restablecidos exitosamente',
      data: sections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al restablecer los datos',
      message: error.message
    });
  }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   🚀 Ecora Backend API Server                ║
║                                               ║
║   Server running on: http://localhost:${PORT}   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                     ║
║   Timestamp: ${new Date().toLocaleString()}       ║
║                                               ║
║   Endpoints - Secciones:                      ║
║   - GET    /api/health                        ║
║   - GET    /api/sections                      ║
║   - GET    /api/sections/:id                  ║
║   - POST   /api/sections                      ║
║   - PUT    /api/sections/:id                  ║
║   - DELETE /api/sections/:id                  ║
║   - POST   /api/sections/search               ║
║   - POST   /api/sections/reset                ║
║                                               ║
║   Endpoints - Google Drive:                   ║
║   - GET    /api/google/auth                   ║
║   - GET    /api/google/callback               ║
║   - GET    /api/google/status                 ║
║   - POST   /api/google/import                 ║
║   - POST   /api/google/list                   ║
║   - POST   /api/google/logout                 ║
║                                               ║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
