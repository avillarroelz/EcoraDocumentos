const express = require('express');
const router = express.Router();
const db = require('../models/db');
const GoogleDriveService = require('../googleDriveConfig');

const googleDrive = new GoogleDriveService();

/**
 * POST /api/sections/:id/sync
 * Sincroniza una carpeta con su contenido actual en Google Drive
 */
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔄 Iniciando sincronización para sección ${id}`);

    // Verificar autenticación
    if (!req.session.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado con Google Drive'
      });
    }

    // Configurar cliente OAuth2
    googleDrive.oauth2Client.setCredentials(req.session.googleTokens);

    // Buscar la sección en la BD
    const seccion = await db.Seccion.findByPk(id);

    if (!seccion) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada'
      });
    }

    // Verificar que tenga driveId
    const driveId = seccion.driveMetadata?.id || seccion.driveId;
    if (!driveId) {
      return res.status(400).json({
        success: false,
        error: 'Esta sección no está vinculada a Google Drive'
      });
    }

    console.log(`📁 Sincronizando carpeta Drive ID: ${driveId}`);

    // Obtener contenido actual de Drive
    const driveContent = await googleDrive.buildHierarchy(driveId, -1);

    console.log(`📦 Contenido de Drive: ${driveContent.length} elementos`);

    // Obtener contenido actual de la BD (hijos de esta sección)
    const childrenInDb = await db.Seccion.findAll({
      where: { parentId: id }
    });

    console.log(`💾 Contenido en BD: ${childrenInDb.length} elementos`);

    // Mapas para comparación
    const driveMap = new Map();
    const dbMap = new Map();

    // Función recursiva para construir mapa de Drive
    const buildDriveMap = (items, parentId = id) => {
      items.forEach(item => {
        const driveItemId = item.id;
        driveMap.set(driveItemId, {
          ...item,
          parentId
        });

        // Recursivo para hijos
        if (item.children && item.children.length > 0) {
          buildDriveMap(item.children, driveItemId);
        }
      });
    };

    buildDriveMap(driveContent);

    // Construir mapa de BD (todos los descendientes)
    const getAllDescendants = async (parentId) => {
      const children = await db.Seccion.findAll({
        where: { parentId }
      });

      for (const child of children) {
        const childDriveId = child.driveMetadata?.id || child.driveId;
        if (childDriveId) {
          dbMap.set(childDriveId, child);
        }
        // Recursivo
        await getAllDescendants(child.id);
      }
    };

    await getAllDescendants(id);

    console.log(`🗺️ Items en Drive map: ${driveMap.size}`);
    console.log(`🗺️ Items en DB map: ${dbMap.size}`);

    // Sincronización
    const stats = {
      added: 0,
      updated: 0,
      deleted: 0,
      unchanged: 0
    };

    const { v4: uuidv4 } = require('uuid');

    // 1. Agregar/actualizar items de Drive
    for (const [driveItemId, driveItem] of driveMap) {
      const existingItem = dbMap.get(driveItemId);

      if (existingItem) {
        // Actualizar si cambió el nombre
        if (existingItem.titulo !== driveItem.title) {
          await existingItem.update({
            titulo: driveItem.title,
            descripcion: driveItem.description || existingItem.descripcion,
            driveMetadata: driveItem.driveMetadata
          });
          stats.updated++;
          console.log(`✏️ Actualizado: ${driveItem.title}`);
        } else {
          stats.unchanged++;
        }
      } else {
        // Crear nuevo
        const isFolder = driveItem.driveMetadata?.isFolder || driveItem.driveMetadata?.mimeType === 'application/vnd.google-apps.folder';

        // Determinar parentId correcto
        let dbParentId = id; // Por defecto, la carpeta raíz que se está sincronizando

        // Si el item tiene un padre en Drive, buscar su equivalente en BD
        if (driveItem.parentId && driveItem.parentId !== id) {
          const parentInDb = dbMap.get(driveItem.parentId);
          if (parentInDb) {
            dbParentId = parentInDb.id;
          }
        }

        const newSeccion = await db.Seccion.create({
          id: uuidv4(),
          titulo: driveItem.title,
          descripcion: driveItem.description || '',
          tipo: isFolder ? 'folder' : 'file',
          parentId: dbParentId,
          driveMetadata: {
            ...driveItem.driveMetadata,
            id: driveItemId
          },
          webViewLink: driveItem.driveMetadata?.webViewLink,
          tags: [],
          orden: 0
        });

        dbMap.set(driveItemId, newSeccion);
        stats.added++;
        console.log(`➕ Agregado: ${driveItem.title}`);
      }
    }

    // 2. Eliminar items que ya no existen en Drive
    for (const [driveItemId, dbItem] of dbMap) {
      if (!driveMap.has(driveItemId)) {
        await dbItem.destroy();
        stats.deleted++;
        console.log(`🗑️ Eliminado: ${dbItem.titulo}`);
      }
    }

    console.log(`\n📊 Estadísticas de sincronización:`);
    console.log(`   ➕ Agregados: ${stats.added}`);
    console.log(`   ✏️ Actualizados: ${stats.updated}`);
    console.log(`   🗑️ Eliminados: ${stats.deleted}`);
    console.log(`   ✓ Sin cambios: ${stats.unchanged}`);

    res.json({
      success: true,
      message: 'Sincronización completada',
      stats
    });

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al sincronizar con Google Drive',
      message: error.message
    });
  }
});

/**
 * PATCH /api/sections/:id/move
 * Mueve una sección (archivo o carpeta) a otra carpeta destino
 */
router.patch('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { newParentId } = req.body;

    console.log(`🔄 Moviendo sección ${id} a padre ${newParentId}`);

    // Buscar la sección a mover
    const seccion = await db.Seccion.findByPk(id);
    if (!seccion) {
      return res.status(404).json({
        success: false,
        error: 'Sección no encontrada'
      });
    }

    // Si newParentId es null, mover a raíz
    if (newParentId === null) {
      await seccion.update({ parentId: null });
      console.log(`✅ Sección movida a raíz`);
      return res.json({
        success: true,
        message: 'Sección movida a raíz correctamente'
      });
    }

    // Verificar que el padre destino existe
    const parentDestino = await db.Seccion.findByPk(newParentId);
    if (!parentDestino) {
      return res.status(404).json({
        success: false,
        error: 'Carpeta destino no encontrada'
      });
    }

    // Verificar que el padre destino es una carpeta
    if (parentDestino.tipo !== 'folder') {
      return res.status(400).json({
        success: false,
        error: 'El destino debe ser una carpeta'
      });
    }

    // Verificar que no se esté moviendo a sí misma
    if (id === newParentId) {
      return res.status(400).json({
        success: false,
        error: 'No se puede mover una carpeta dentro de sí misma'
      });
    }

    // Verificar que no se esté moviendo a uno de sus hijos (evitar ciclos)
    const getAllDescendantIds = async (parentId) => {
      const children = await db.Seccion.findAll({
        where: { parentId }
      });
      let descendantIds = children.map(c => c.id);
      for (const child of children) {
        const childDescendants = await getAllDescendantIds(child.id);
        descendantIds = descendantIds.concat(childDescendants);
      }
      return descendantIds;
    };

    const descendantIds = await getAllDescendantIds(id);
    if (descendantIds.includes(newParentId)) {
      return res.status(400).json({
        success: false,
        error: 'No se puede mover una carpeta dentro de uno de sus descendientes'
      });
    }

    // Mover la sección
    await seccion.update({ parentId: newParentId });

    console.log(`✅ Sección "${seccion.titulo}" movida a "${parentDestino.titulo}"`);

    res.json({
      success: true,
      message: `"${seccion.titulo}" movido a "${parentDestino.titulo}" correctamente`
    });

  } catch (error) {
    console.error('❌ Error al mover sección:', error);
    res.status(500).json({
      success: false,
      error: 'Error al mover la sección',
      message: error.message
    });
  }
});

module.exports = router;
