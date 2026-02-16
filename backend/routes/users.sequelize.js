const express = require('express');
const router = express.Router();
const db = require('../models/db');
const authService = require('../services/authService');
const { Op } = require('sequelize');

/**
 * Middleware de autenticación
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }
  next();
};

/**
 * Middleware de verificación de permisos
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const hasPermission = await authService.hasPermission(req.session.user.id, permission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Permiso denegado'
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

/**
 * GET /api/users/me
 * Obtener información del usuario actual
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userData = await authService.getUserWithPermissions(req.session.user.id);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos del usuario'
    });
  }
});

/**
 * GET /api/users
 * Listar usuarios (filtrado según permisos)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const currentUser = await db.Usuario.findByPk(req.session.user.id, {
      include: [{
        model: db.Rol,
        as: 'roles'
      }, {
        model: db.UnidadNegocio,
        as: 'unidadesNegocio',
        include: [{
          model: db.LineaNegocio,
          as: 'lineaNegocio'
        }]
      }]
    });

    const primaryRole = authService.getPrimaryRole(currentUser);
    let whereClause = {};

    // Filtrar según rol
    if (primaryRole === 'super_admin') {
      // Ver todos los usuarios
    } else if (primaryRole === 'admin') {
      // Ver usuarios de su línea de negocio
      if (currentUser.unidadesNegocio && currentUser.unidadesNegocio.length > 0) {
        const lineaIds = [...new Set(currentUser.unidadesNegocio.map(u => u.lineaNegocio.id))];

        // Buscar usuarios que tengan unidades en las mismas líneas
        const usuariosEnLinea = await db.Usuario.findAll({
          include: [{
            model: db.UnidadNegocio,
            as: 'unidadesNegocio',
            where: {
              lineaNegocioId: { [Op.in]: lineaIds }
            },
            required: true
          }]
        });

        const userIds = usuariosEnLinea.map(u => u.id);
        whereClause.id = { [Op.in]: userIds };
      }
    } else {
      // Otros roles solo se ven a sí mismos
      whereClause.id = currentUser.id;
    }

    const usuarios = await db.Usuario.findAll({
      where: whereClause,
      include: [{
        model: db.Rol,
        as: 'roles',
        through: { attributes: [] }
      }, {
        model: db.UnidadNegocio,
        as: 'unidadesNegocio',
        through: { attributes: [] },
        include: [{
          model: db.LineaNegocio,
          as: 'lineaNegocio'
        }]
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: usuarios,
      meta: {
        total: usuarios.length
      }
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios'
    });
  }
});

/**
 * GET /api/users/:id
 * Obtener un usuario específico
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const usuario = await db.Usuario.findByPk(req.params.id, {
      include: [{
        model: db.Rol,
        as: 'roles',
        through: { attributes: [] }
      }, {
        model: db.UnidadNegocio,
        as: 'unidadesNegocio',
        through: { attributes: [] },
        include: [{
          model: db.LineaNegocio,
          as: 'lineaNegocio'
        }]
      }]
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const permisos = authService.calculatePermissions(usuario);

    res.json({
      success: true,
      data: {
        ...usuario.toJSON(),
        permisos
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuario'
    });
  }
});

/**
 * PUT /api/users/:id
 * Actualizar usuario (solo admin o super_admin)
 */
router.put('/:id', requireAuth, requirePermission('canManageUsers'), async (req, res) => {
  try {
    const { nombre, estado, roleIds, unidadNegocioIds } = req.body;

    const usuario = await db.Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar datos básicos
    if (nombre) usuario.nombre = nombre;
    if (typeof estado === 'boolean') usuario.estado = estado;

    await usuario.save();

    // Actualizar roles si se proporcionan
    if (roleIds && Array.isArray(roleIds)) {
      const roles = await db.Rol.findAll({
        where: { id: { [Op.in]: roleIds } }
      });
      await usuario.setRoles(roles);
    }

    // Actualizar unidades de negocio si se proporcionan
    if (unidadNegocioIds && Array.isArray(unidadNegocioIds)) {
      const unidades = await db.UnidadNegocio.findAll({
        where: { id: { [Op.in]: unidadNegocioIds } }
      });
      await usuario.setUnidadesNegocio(unidades);
    }

    // Recargar con todas las relaciones
    await usuario.reload({
      include: [{
        model: db.Rol,
        as: 'roles',
        through: { attributes: [] }
      }, {
        model: db.UnidadNegocio,
        as: 'unidadesNegocio',
        through: { attributes: [] },
        include: [{
          model: db.LineaNegocio,
          as: 'lineaNegocio'
        }]
      }]
    });

    res.json({
      success: true,
      data: usuario,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando usuario'
    });
  }
});

/**
 * POST /api/users/:id/activate
 * Activar usuario
 */
router.post('/:id/activate', requireAuth, requirePermission('canManageUsers'), async (req, res) => {
  try {
    const usuario = await db.Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    usuario.estado = true;
    await usuario.save();

    res.json({
      success: true,
      data: usuario,
      message: 'Usuario activado exitosamente'
    });
  } catch (error) {
    console.error('Error activando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error activando usuario'
    });
  }
});

/**
 * POST /api/users/:id/deactivate
 * Desactivar usuario
 */
router.post('/:id/deactivate', requireAuth, requirePermission('canManageUsers'), async (req, res) => {
  try {
    const usuario = await db.Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir desactivar super admin
    const roles = await usuario.getRoles();
    if (roles.some(r => r.nombre === 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: 'No se puede desactivar un super administrador'
      });
    }

    usuario.estado = false;
    await usuario.save();

    res.json({
      success: true,
      data: usuario,
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error desactivando usuario'
    });
  }
});

/**
 * GET /api/users/system/roles
 * Listar todos los roles disponibles
 */
router.get('/system/roles', requireAuth, async (req, res) => {
  try {
    const currentUser = await db.Usuario.findByPk(req.session.user.id, {
      include: [{ model: db.Rol, as: 'roles' }]
    });

    const isSuperAdmin = currentUser.roles.some(r => r.nombre === 'super_admin');

    let whereClause = {};

    // Si no es super_admin, no mostrar el rol super_admin
    if (!isSuperAdmin) {
      whereClause.nombre = { [Op.ne]: 'super_admin' };
    }

    const roles = await db.Rol.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo roles'
    });
  }
});

module.exports = router;
