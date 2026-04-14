const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * GET /api/config/defaults
 * Obtiene la configuración predeterminada (jerarquía + expandidos)
 * Acceso: cualquier usuario autenticado
 */
router.get('/defaults', async (req, res) => {
  try {
    const [hierarchy, expandedIds] = await Promise.all([
      db.AppConfig.findOne({ where: { clave: 'default_hierarchy' } }),
      db.AppConfig.findOne({ where: { clave: 'default_expanded_ids' } })
    ]);

    res.json({
      success: true,
      data: {
        hierarchy: hierarchy ? hierarchy.valor : null,
        expandedIds: expandedIds ? expandedIds.valor : null
      }
    });
  } catch (error) {
    console.error('Error obteniendo defaults:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración predeterminada'
    });
  }
});

/**
 * PUT /api/config/defaults
 * Guarda la configuración predeterminada (jerarquía + expandidos)
 * Acceso: solo super_admin o admin
 */
router.put('/defaults', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { hierarchy, expandedIds } = req.body;

    if (!hierarchy || !Array.isArray(hierarchy)) {
      return res.status(400).json({
        success: false,
        error: 'La jerarquía es requerida y debe ser un array'
      });
    }

    // Upsert de la jerarquía
    await db.AppConfig.upsert({
      clave: 'default_hierarchy',
      valor: hierarchy,
      actualizadoPor: req.user.id
    });

    // Upsert de los IDs expandidos
    if (expandedIds) {
      await db.AppConfig.upsert({
        clave: 'default_expanded_ids',
        valor: expandedIds,
        actualizadoPor: req.user.id
      });
    }

    res.json({
      success: true,
      message: 'Configuración predeterminada guardada exitosamente'
    });
  } catch (error) {
    console.error('Error guardando defaults:', error);
    res.status(500).json({
      success: false,
      error: 'Error al guardar configuración predeterminada'
    });
  }
});

module.exports = router;
