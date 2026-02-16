const express = require('express');
const router = express.Router();
const organizationService = require('../services/organizationService');
const authService = require('../services/authService');
const db = require('../models/db');

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
 * GET /api/organization/hierarchy
 * Obtener jerarquía completa (filtrada según permisos)
 */
router.get('/hierarchy', requireAuth, async (req, res) => {
  try {
    const lineas = await organizationService.getHierarchy(req.session.user.id);

    res.json({
      success: true,
      data: lineas
    });
  } catch (error) {
    console.error('Error obteniendo jerarquía:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo jerarquía organizacional'
    });
  }
});

// ========================================
// LÍNEAS DE NEGOCIO
// ========================================

/**
 * GET /api/organization/business-lines
 * Listar todas las líneas de negocio
 */
router.get('/business-lines', requireAuth, async (req, res) => {
  try {
    const lineas = await db.LineaNegocio.findAll({
      include: [{
        model: db.UnidadNegocio,
        as: 'unidadesNegocio'
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: lineas
    });
  } catch (error) {
    console.error('Error listando líneas de negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo líneas de negocio'
    });
  }
});

/**
 * GET /api/organization/business-lines/:id
 * Obtener una línea de negocio específica
 */
router.get('/business-lines/:id', requireAuth, async (req, res) => {
  try {
    const linea = await db.LineaNegocio.findByPk(req.params.id, {
      include: [{
        model: db.UnidadNegocio,
        as: 'unidadesNegocio'
      }]
    });

    if (!linea) {
      return res.status(404).json({
        success: false,
        message: 'Línea de negocio no encontrada'
      });
    }

    res.json({
      success: true,
      data: linea
    });
  } catch (error) {
    console.error('Error obteniendo línea de negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo línea de negocio'
    });
  }
});

/**
 * POST /api/organization/business-lines
 * Crear nueva línea de negocio (solo super_admin)
 */
router.post('/business-lines', requireAuth, requirePermission('canManageOrganization'), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    const linea = await organizationService.createLineaNegocio({ nombre, descripcion });

    res.status(201).json({
      success: true,
      data: linea,
      message: 'Línea de negocio creada exitosamente'
    });
  } catch (error) {
    console.error('Error creando línea de negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando línea de negocio'
    });
  }
});

/**
 * PUT /api/organization/business-lines/:id
 * Actualizar línea de negocio
 */
router.put('/business-lines/:id', requireAuth, requirePermission('canManageOrganization'), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const linea = await organizationService.updateLineaNegocio(req.params.id, { nombre, descripcion });

    res.json({
      success: true,
      data: linea,
      message: 'Línea de negocio actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando línea de negocio:', error);

    if (error.message === 'Línea de negocio no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error actualizando línea de negocio'
    });
  }
});

/**
 * DELETE /api/organization/business-lines/:id
 * Eliminar línea de negocio
 */
router.delete('/business-lines/:id', requireAuth, requirePermission('canManageOrganization'), async (req, res) => {
  try {
    await organizationService.deleteLineaNegocio(req.params.id);

    res.json({
      success: true,
      message: 'Línea de negocio eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando línea de negocio:', error);

    if (error.message === 'Línea de negocio no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('unidades asociadas')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error eliminando línea de negocio'
    });
  }
});

// ========================================
// UNIDADES DE NEGOCIO
// ========================================

/**
 * GET /api/organization/business-units
 * Listar todas las unidades de negocio
 */
router.get('/business-units', requireAuth, async (req, res) => {
  try {
    const unidades = await db.UnidadNegocio.findAll({
      include: [{
        model: db.LineaNegocio,
        as: 'lineaNegocio'
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: unidades
    });
  } catch (error) {
    console.error('Error listando unidades de negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo unidades de negocio'
    });
  }
});

/**
 * GET /api/organization/business-units/:id
 * Obtener una unidad de negocio específica
 */
router.get('/business-units/:id', requireAuth, async (req, res) => {
  try {
    const unidad = await db.UnidadNegocio.findByPk(req.params.id, {
      include: [{
        model: db.LineaNegocio,
        as: 'lineaNegocio'
      }]
    });

    if (!unidad) {
      return res.status(404).json({
        success: false,
        message: 'Unidad de negocio no encontrada'
      });
    }

    res.json({
      success: true,
      data: unidad
    });
  } catch (error) {
    console.error('Error obteniendo unidad de negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo unidad de negocio'
    });
  }
});

/**
 * POST /api/organization/business-units
 * Crear nueva unidad de negocio
 */
router.post('/business-units', requireAuth, requirePermission('canManageOrganization'), async (req, res) => {
  try {
    const { nombre, descripcion, lineaNegocioId } = req.body;

    if (!nombre || !lineaNegocioId) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y la línea de negocio son requeridos'
      });
    }

    const unidad = await organizationService.createUnidadNegocio({ nombre, descripcion, lineaNegocioId });

    res.status(201).json({
      success: true,
      data: unidad,
      message: 'Unidad de negocio creada exitosamente'
    });
  } catch (error) {
    console.error('Error creando unidad de negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando unidad de negocio'
    });
  }
});

/**
 * PUT /api/organization/business-units/:id
 * Actualizar unidad de negocio
 */
router.put('/business-units/:id', requireAuth, requirePermission('canManageOrganization'), async (req, res) => {
  try {
    const { nombre, descripcion, lineaNegocioId } = req.body;

    const unidad = await organizationService.updateUnidadNegocio(req.params.id, { nombre, descripcion, lineaNegocioId });

    res.json({
      success: true,
      data: unidad,
      message: 'Unidad de negocio actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando unidad de negocio:', error);

    if (error.message === 'Unidad de negocio no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error actualizando unidad de negocio'
    });
  }
});

/**
 * DELETE /api/organization/business-units/:id
 * Eliminar unidad de negocio
 */
router.delete('/business-units/:id', requireAuth, requirePermission('canManageOrganization'), async (req, res) => {
  try {
    await organizationService.deleteUnidadNegocio(req.params.id);

    res.json({
      success: true,
      message: 'Unidad de negocio eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando unidad de negocio:', error);

    if (error.message === 'Unidad de negocio no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error eliminando unidad de negocio'
    });
  }
});

/**
 * GET /api/organization/business-lines/:id/units
 * Obtener unidades de una línea específica
 */
router.get('/business-lines/:id/units', requireAuth, async (req, res) => {
  try {
    const unidades = await organizationService.getUnidadesByLinea(req.params.id);

    res.json({
      success: true,
      data: unidades
    });
  } catch (error) {
    console.error('Error obteniendo unidades por línea:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo unidades de negocio'
    });
  }
});

// ========================================
// ASIGNACIÓN DE USUARIOS A UNIDADES
// ========================================

/**
 * GET /api/organization/business-units/:id/users
 * Obtener usuarios asignados a una unidad de negocio
 */
router.get('/business-units/:id/users', requireAuth, async (req, res) => {
  try {
    const unidad = await db.UnidadNegocio.findByPk(req.params.id, {
      include: [{
        model: db.Usuario,
        as: 'usuarios',
        attributes: ['id', 'nombre', 'email', 'fotoPerfil', 'estado'],
        through: { attributes: [] }, // No incluir atributos de la tabla intermedia
        include: [{
          model: db.Rol,
          as: 'roles',
          attributes: ['id', 'nombre', 'nombreDescriptivo']
        }]
      }]
    });

    if (!unidad) {
      return res.status(404).json({
        success: false,
        message: 'Unidad de negocio no encontrada'
      });
    }

    res.json({
      success: true,
      data: unidad.usuarios || []
    });
  } catch (error) {
    console.error('Error obteniendo usuarios de unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios asignados'
    });
  }
});

/**
 * GET /api/organization/business-units/:id/available-users
 * Obtener usuarios disponibles para asignar (no asignados a esta unidad)
 */
router.get('/business-units/:id/available-users', requireAuth, async (req, res) => {
  try {
    // Primero obtener los IDs de usuarios ya asignados
    const unidad = await db.UnidadNegocio.findByPk(req.params.id, {
      include: [{
        model: db.Usuario,
        as: 'usuarios',
        attributes: ['id']
      }]
    });

    if (!unidad) {
      return res.status(404).json({
        success: false,
        message: 'Unidad de negocio no encontrada'
      });
    }

    const usuariosAsignadosIds = unidad.usuarios.map(u => u.id);

    // Obtener todos los usuarios excepto los ya asignados
    const usuariosDisponibles = await db.Usuario.findAll({
      where: {
        id: {
          [db.Sequelize.Op.notIn]: usuariosAsignadosIds.length > 0 ? usuariosAsignadosIds : [0]
        },
        estado: true // Solo usuarios activos
      },
      attributes: ['id', 'nombre', 'email', 'fotoPerfil'],
      include: [{
        model: db.Rol,
        as: 'roles',
        attributes: ['id', 'nombre', 'nombreDescriptivo']
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: usuariosDisponibles
    });
  } catch (error) {
    console.error('Error obteniendo usuarios disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios disponibles'
    });
  }
});

/**
 * POST /api/organization/business-units/:id/users
 * Asignar usuarios a una unidad de negocio
 * Body: { usuarioIds: [1, 2, 3] }
 */
router.post('/business-units/:id/users', requireAuth, requirePermission('canManageOrganization'), async (req, res) => {
  try {
    const { usuarioIds } = req.body;

    if (!usuarioIds || !Array.isArray(usuarioIds) || usuarioIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de usuarios'
      });
    }

    const unidad = await db.UnidadNegocio.findByPk(req.params.id);

    if (!unidad) {
      return res.status(404).json({
        success: false,
        message: 'Unidad de negocio no encontrada'
      });
    }

    // Asignar usuarios (Sequelize maneja automáticamente duplicados)
    await unidad.addUsuarios(usuarioIds);

    // Obtener la lista actualizada de usuarios
    const usuariosActualizados = await db.UnidadNegocio.findByPk(req.params.id, {
      include: [{
        model: db.Usuario,
        as: 'usuarios',
        attributes: ['id', 'nombre', 'email', 'fotoPerfil', 'estado'],
        through: { attributes: [] }
      }]
    });

    res.json({
      success: true,
      data: usuariosActualizados.usuarios,
      message: `${usuarioIds.length} usuario(s) asignado(s) exitosamente`
    });
  } catch (error) {
    console.error('Error asignando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error asignando usuarios a la unidad'
    });
  }
});

/**
 * DELETE /api/organization/business-units/:id/users/:userId
 * Desasignar un usuario de una unidad de negocio
 */
router.delete('/business-units/:id/users/:userId', requireAuth, requirePermission('canManageOrganization'), async (req, res) => {
  try {
    const unidad = await db.UnidadNegocio.findByPk(req.params.id);

    if (!unidad) {
      return res.status(404).json({
        success: false,
        message: 'Unidad de negocio no encontrada'
      });
    }

    // Desasignar usuario
    await unidad.removeUsuario(req.params.userId);

    res.json({
      success: true,
      message: 'Usuario desasignado exitosamente'
    });
  } catch (error) {
    console.error('Error desasignando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error desasignando usuario de la unidad'
    });
  }
});

module.exports = router;
