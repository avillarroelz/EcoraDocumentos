/**
 * Rutas para gestión de usuarios y roles
 */

const express = require('express');
const router = express.Router();
const db = require('../models/db');
const {
  ROLES,
  ROLE_PERMISSIONS,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getUsersByPermission
} = require('../models/userRoles');

const {
  requireAuth,
  requirePermission,
  requireRole
} = require('../middleware/auth');

// GET - Obtener el perfil del usuario actual
router.get('/me', requireAuth, (req, res) => {
  try {
    // Obtener permisos del usuario
    const permissions = ROLE_PERMISSIONS[req.user.role] || {};

    res.json({
      success: true,
      data: {
        ...req.user,
        permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener perfil de usuario',
      message: error.message
    });
  }
});

// GET - Obtener todos los usuarios (con filtro según permisos)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Construir la query según los permisos del usuario
    let whereClause = {};

    // Si es admin, solo ver usuarios de sus líneas de negocio
    if (req.user.role === 'admin') {
      // Obtener IDs de las líneas de negocio del usuario
      const lineaNegocioIds = [...new Set(req.user.unidadesNegocio.map(un => un.lineaNegocioId))];

      whereClause = {
        '$unidadesNegocio.lineaNegocioId$': lineaNegocioIds
      };
    }
    // Super admin ve todos los usuarios

    const usuarios = await db.Usuario.findAll({
      where: whereClause,
      include: [
        {
          model: db.Rol,
          as: 'roles',
          through: { attributes: [] }
        },
        {
          model: db.UnidadNegocio,
          as: 'unidadesNegocio',
          through: { attributes: [] },
          include: [{
            model: db.LineaNegocio,
            as: 'lineaNegocio'
          }]
        }
      ],
      order: [['nombre', 'ASC']]
    });

    // Transformar a formato esperado por el frontend
    const usuariosFormateados = usuarios.map(u => ({
      id: u.id,
      googleId: u.googleId,
      email: u.email,
      nombre: u.nombre,
      fotoPerfil: u.fotoPerfil,
      estado: u.estado,
      roles: u.roles.map(r => r.nombre),
      role: u.roles.length > 0 ? u.roles[0].nombre : 'viewer',
      unidadesNegocio: u.unidadesNegocio,
      ultimoLogin: u.ultimoLogin,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    res.json({
      success: true,
      data: usuariosFormateados,
      meta: {
        total: usuariosFormateados.length,
        viewingAs: req.user.role
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
      message: error.message
    });
  }
});

// GET - Obtener un usuario por ID
router.get('/:id', requireAuth, (req, res) => {
  try {
    const user = getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar permisos para ver este usuario
    const allowedUsers = getUsersByPermission(req.user);
    const canView = allowedUsers.some(u => u.id === user.id);

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'No tiene permisos para ver este usuario'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario',
      message: error.message
    });
  }
});

// POST - Crear nuevo usuario manualmente (solo super_admin y admin)
router.post('/',
  requireAuth,
  requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  (req, res) => {
    try {
      const { googleId, email, name, picture, role, businessLineId, businessUnitId } = req.body;

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El email es requerido'
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El nombre es requerido'
        });
      }

      // Si es ADMIN, solo puede crear usuarios en su línea de negocio
      if (req.user.role === ROLES.ADMIN) {
        if (businessLineId && businessLineId !== req.user.businessLineId) {
          return res.status(403).json({
            success: false,
            error: 'Solo puede crear usuarios en su línea de negocio'
          });
        }

        // No puede crear super_admin
        if (role === ROLES.SUPER_ADMIN) {
          return res.status(403).json({
            success: false,
            error: 'No tiene permisos para crear super administradores'
          });
        }
      }

      const newUser = createUser({
        googleId: googleId || email,  // Si no hay googleId, usar email
        email,
        name,
        picture,
        role: role || ROLES.USER,
        businessLineId,
        businessUnitId
      });

      res.status(201).json({
        success: true,
        data: newUser,
        message: 'Usuario creado exitosamente'
      });
    } catch (error) {
      if (error.message === 'El usuario ya existe') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al crear usuario',
        message: error.message
      });
    }
  }
);

// PUT - Actualizar usuario
router.put('/:id',
  requireAuth,
  requirePermission('canManageUsers'),
  (req, res) => {
    try {
      const { name, picture, role, businessLineId, businessUnitId, isActive } = req.body;

      const existingUser = getUserById(req.params.id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Verificar permisos específicos
      if (req.user.role === ROLES.ADMIN) {
        // Admin solo puede modificar usuarios de su línea
        if (existingUser.businessLineId !== req.user.businessLineId) {
          return res.status(403).json({
            success: false,
            error: 'Solo puede modificar usuarios de su línea de negocio'
          });
        }

        // No puede modificar super_admin ni crear super_admin
        if (existingUser.role === ROLES.SUPER_ADMIN || role === ROLES.SUPER_ADMIN) {
          return res.status(403).json({
            success: false,
            error: 'No tiene permisos para modificar super administradores'
          });
        }

        // No puede mover usuarios fuera de su línea
        if (businessLineId && businessLineId !== req.user.businessLineId) {
          return res.status(403).json({
            success: false,
            error: 'No puede mover usuarios fuera de su línea de negocio'
          });
        }
      }

      const updatedUser = updateUser(req.params.id, {
        name,
        picture,
        role,
        businessLineId,
        businessUnitId,
        isActive
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'Usuario actualizado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al actualizar usuario',
        message: error.message
      });
    }
  }
);

// DELETE - Eliminar usuario
router.delete('/:id',
  requireAuth,
  requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  (req, res) => {
    try {
      const existingUser = getUserById(req.params.id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Admin solo puede eliminar de su línea
      if (req.user.role === ROLES.ADMIN) {
        if (existingUser.businessLineId !== req.user.businessLineId) {
          return res.status(403).json({
            success: false,
            error: 'Solo puede eliminar usuarios de su línea de negocio'
          });
        }

        if (existingUser.role === ROLES.SUPER_ADMIN) {
          return res.status(403).json({
            success: false,
            error: 'No puede eliminar super administradores'
          });
        }
      }

      deleteUser(req.params.id);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      if (error.message.includes('super administrador')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al eliminar usuario',
        message: error.message
      });
    }
  }
);

// POST - Desactivar usuario
router.post('/:id/deactivate',
  requireAuth,
  requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  (req, res) => {
    try {
      const existingUser = getUserById(req.params.id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Validaciones similares a delete
      if (req.user.role === ROLES.ADMIN) {
        if (existingUser.businessLineId !== req.user.businessLineId) {
          return res.status(403).json({
            success: false,
            error: 'Solo puede desactivar usuarios de su línea de negocio'
          });
        }
      }

      const updatedUser = deactivateUser(req.params.id);

      res.json({
        success: true,
        data: updatedUser,
        message: 'Usuario desactivado exitosamente'
      });
    } catch (error) {
      if (error.message.includes('super administrador')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al desactivar usuario',
        message: error.message
      });
    }
  }
);

// POST - Activar usuario
router.post('/:id/activate',
  requireAuth,
  requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  (req, res) => {
    try {
      const existingUser = getUserById(req.params.id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      if (req.user.role === ROLES.ADMIN) {
        if (existingUser.businessLineId !== req.user.businessLineId) {
          return res.status(403).json({
            success: false,
            error: 'Solo puede activar usuarios de su línea de negocio'
          });
        }
      }

      const updatedUser = activateUser(req.params.id);

      res.json({
        success: true,
        data: updatedUser,
        message: 'Usuario activado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al activar usuario',
        message: error.message
      });
    }
  }
);

// GET - Obtener lista de roles disponibles
router.get('/system/roles', requireAuth, (req, res) => {
  try {
    // Filtrar roles según permisos
    let availableRoles = Object.values(ROLES);

    // Admin no puede ver/asignar SUPER_ADMIN
    if (req.user.role === ROLES.ADMIN) {
      availableRoles = availableRoles.filter(role => role !== ROLES.SUPER_ADMIN);
    }

    const rolesWithPermissions = availableRoles.map(role => ({
      role,
      permissions: ROLE_PERMISSIONS[role]
    }));

    res.json({
      success: true,
      data: rolesWithPermissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener roles',
      message: error.message
    });
  }
});

module.exports = router;
