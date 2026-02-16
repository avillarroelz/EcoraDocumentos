/**
 * Rutas para gestión de estructura organizacional
 * Líneas de Negocio y Unidades de Negocio
 */

const express = require('express');
const router = express.Router();
const {
  getAllBusinessLines,
  getBusinessLineById,
  createBusinessLine,
  updateBusinessLine,
  deleteBusinessLine,
  getAllBusinessUnits,
  getBusinessUnitById,
  getBusinessUnitsByLineId,
  createBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit,
  getOrganizationalHierarchy
} = require('../models/organizationStructure');

const {
  requireAuth,
  requirePermission,
  requireRole
} = require('../middleware/auth');

const { ROLES } = require('../models/userRoles');

// ============ LÍNEAS DE NEGOCIO ============

// GET - Obtener todas las líneas de negocio
router.get('/business-lines', requireAuth, (req, res) => {
  try {
    const businessLines = getAllBusinessLines();
    res.json({
      success: true,
      data: businessLines,
      meta: {
        total: businessLines.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener líneas de negocio',
      message: error.message
    });
  }
});

// GET - Obtener una línea de negocio por ID
router.get('/business-lines/:id', requireAuth, (req, res) => {
  try {
    const businessLine = getBusinessLineById(req.params.id);
    if (!businessLine) {
      return res.status(404).json({
        success: false,
        error: 'Línea de negocio no encontrada'
      });
    }

    res.json({
      success: true,
      data: businessLine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener línea de negocio',
      message: error.message
    });
  }
});

// POST - Crear nueva línea de negocio (solo super_admin)
router.post('/business-lines',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El nombre es requerido'
        });
      }

      const newBusinessLine = createBusinessLine({ name, description });

      res.status(201).json({
        success: true,
        data: newBusinessLine,
        message: 'Línea de negocio creada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al crear línea de negocio',
        message: error.message
      });
    }
  }
);

// PUT - Actualizar línea de negocio (solo super_admin)
router.put('/business-lines/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El nombre es requerido'
        });
      }

      const updatedBusinessLine = updateBusinessLine(req.params.id, { name, description });

      if (!updatedBusinessLine) {
        return res.status(404).json({
          success: false,
          error: 'Línea de negocio no encontrada'
        });
      }

      res.json({
        success: true,
        data: updatedBusinessLine,
        message: 'Línea de negocio actualizada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al actualizar línea de negocio',
        message: error.message
      });
    }
  }
);

// DELETE - Eliminar línea de negocio (solo super_admin)
router.delete('/business-lines/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  (req, res) => {
    try {
      const deleted = deleteBusinessLine(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Línea de negocio no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Línea de negocio eliminada exitosamente'
      });
    } catch (error) {
      if (error.message.includes('unidades asociadas')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al eliminar línea de negocio',
        message: error.message
      });
    }
  }
);

// ============ UNIDADES DE NEGOCIO ============

// GET - Obtener todas las unidades de negocio
router.get('/business-units', requireAuth, (req, res) => {
  try {
    const businessUnits = getAllBusinessUnits();
    res.json({
      success: true,
      data: businessUnits,
      meta: {
        total: businessUnits.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener unidades de negocio',
      message: error.message
    });
  }
});

// GET - Obtener unidades de negocio por línea
router.get('/business-lines/:lineId/units', requireAuth, (req, res) => {
  try {
    const businessUnits = getBusinessUnitsByLineId(req.params.lineId);
    res.json({
      success: true,
      data: businessUnits,
      meta: {
        total: businessUnits.length,
        businessLineId: req.params.lineId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener unidades de negocio',
      message: error.message
    });
  }
});

// GET - Obtener una unidad de negocio por ID
router.get('/business-units/:id', requireAuth, (req, res) => {
  try {
    const businessUnit = getBusinessUnitById(req.params.id);
    if (!businessUnit) {
      return res.status(404).json({
        success: false,
        error: 'Unidad de negocio no encontrada'
      });
    }

    res.json({
      success: true,
      data: businessUnit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener unidad de negocio',
      message: error.message
    });
  }
});

// POST - Crear nueva unidad de negocio (super_admin o admin)
router.post('/business-units',
  requireAuth,
  requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  (req, res) => {
    try {
      const { name, description, businessLineId } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El nombre es requerido'
        });
      }

      if (!businessLineId) {
        return res.status(400).json({
          success: false,
          error: 'businessLineId es requerido'
        });
      }

      // Si es admin, verificar que sea de su línea
      if (req.user.role === ROLES.ADMIN && req.user.businessLineId !== businessLineId) {
        return res.status(403).json({
          success: false,
          error: 'Solo puede crear unidades en su línea de negocio'
        });
      }

      const newBusinessUnit = createBusinessUnit({ name, description, businessLineId });

      res.status(201).json({
        success: true,
        data: newBusinessUnit,
        message: 'Unidad de negocio creada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al crear unidad de negocio',
        message: error.message
      });
    }
  }
);

// PUT - Actualizar unidad de negocio
router.put('/business-units/:id',
  requireAuth,
  requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  (req, res) => {
    try {
      const { name, description, businessLineId } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El nombre es requerido'
        });
      }

      // Si es admin, verificar permisos
      const existingUnit = getBusinessUnitById(req.params.id);
      if (!existingUnit) {
        return res.status(404).json({
          success: false,
          error: 'Unidad de negocio no encontrada'
        });
      }

      if (req.user.role === ROLES.ADMIN && req.user.businessLineId !== existingUnit.businessLineId) {
        return res.status(403).json({
          success: false,
          error: 'Solo puede modificar unidades de su línea de negocio'
        });
      }

      const updatedBusinessUnit = updateBusinessUnit(req.params.id, { name, description, businessLineId });

      res.json({
        success: true,
        data: updatedBusinessUnit,
        message: 'Unidad de negocio actualizada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al actualizar unidad de negocio',
        message: error.message
      });
    }
  }
);

// DELETE - Eliminar unidad de negocio
router.delete('/business-units/:id',
  requireAuth,
  requireRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  (req, res) => {
    try {
      const existingUnit = getBusinessUnitById(req.params.id);
      if (!existingUnit) {
        return res.status(404).json({
          success: false,
          error: 'Unidad de negocio no encontrada'
        });
      }

      // Si es admin, verificar permisos
      if (req.user.role === ROLES.ADMIN && req.user.businessLineId !== existingUnit.businessLineId) {
        return res.status(403).json({
          success: false,
          error: 'Solo puede eliminar unidades de su línea de negocio'
        });
      }

      const deleted = deleteBusinessUnit(req.params.id);

      res.json({
        success: true,
        message: 'Unidad de negocio eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al eliminar unidad de negocio',
        message: error.message
      });
    }
  }
);

// ============ JERARQUÍA COMPLETA ============

// GET - Obtener jerarquía organizacional completa
router.get('/hierarchy', requireAuth, (req, res) => {
  try {
    const hierarchy = getOrganizationalHierarchy();

    // Filtrar según permisos del usuario
    let filteredHierarchy = hierarchy;

    if (req.user.role !== ROLES.SUPER_ADMIN) {
      if (req.user.businessLineId) {
        // Filtrar solo su línea de negocio
        filteredHierarchy = hierarchy.filter(line => line.id === req.user.businessLineId);

        // Si tiene unidad específica, filtrar también
        if (req.user.businessUnitId) {
          filteredHierarchy = filteredHierarchy.map(line => ({
            ...line,
            businessUnits: line.businessUnits.filter(unit => unit.id === req.user.businessUnitId)
          }));
        }
      } else {
        // Sin línea asignada = sin acceso
        filteredHierarchy = [];
      }
    }

    res.json({
      success: true,
      data: filteredHierarchy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener jerarquía organizacional',
      message: error.message
    });
  }
});

module.exports = router;
