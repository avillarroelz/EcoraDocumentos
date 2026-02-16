const db = require("../models/db");
const { Op } = require("sequelize");

class OrganizationService {
  /**
   * Obtener jerarquía completa de la organización
   */
  async getHierarchy(userId = null) {
    try {
      let whereClause = {};

      // Si hay usuario, filtrar según permisos
      if (userId) {
        const usuario = await db.Usuario.findByPk(userId, {
          include: [
            {
              model: db.Rol,
              as: "roles"
            },
            {
              model: db.UnidadNegocio,
              as: "unidadesNegocio",
              include: [{
                model: db.LineaNegocio,
                as: "lineaNegocio"
              }]
            }
          ]
        });

        // Si no es super_admin, filtrar por sus líneas de negocio
        const isSuperAdmin = usuario.roles.some(r => r.nombre === "super_admin");

        if (!isSuperAdmin && usuario.unidadesNegocio && usuario.unidadesNegocio.length > 0) {
          const lineaIds = [...new Set(usuario.unidadesNegocio.map(u => u.lineaNegocio.id))];
          whereClause.id = { [Op.in]: lineaIds };
        }
      }

      const lineas = await db.LineaNegocio.findAll({
        where: whereClause,
        include: [{
          model: db.UnidadNegocio,
          as: "unidadesNegocio"
        }],
        order: [
          ['nombre', 'ASC'],
          [{ model: db.UnidadNegocio, as: "unidadesNegocio" }, 'nombre', 'ASC']
        ]
      });

      return lineas;
    } catch (error) {
      console.error("Error en getHierarchy:", error);
      throw error;
    }
  }

  /**
   * Crear línea de negocio
   */
  async createLineaNegocio(data) {
    try {
      const linea = await db.LineaNegocio.create({
        nombre: data.nombre,
        descripcion: data.descripcion
      });

      return linea;
    } catch (error) {
      console.error("Error en createLineaNegocio:", error);
      throw error;
    }
  }

  /**
   * Actualizar línea de negocio
   */
  async updateLineaNegocio(id, data) {
    try {
      const linea = await db.LineaNegocio.findByPk(id);

      if (!linea) {
        throw new Error("Línea de negocio no encontrada");
      }

      await linea.update({
        nombre: data.nombre,
        descripcion: data.descripcion
      });

      return linea;
    } catch (error) {
      console.error("Error en updateLineaNegocio:", error);
      throw error;
    }
  }

  /**
   * Eliminar línea de negocio
   */
  async deleteLineaNegocio(id) {
    try {
      const linea = await db.LineaNegocio.findByPk(id, {
        include: [{
          model: db.UnidadNegocio,
          as: "unidadesNegocio"
        }]
      });

      if (!linea) {
        throw new Error("Línea de negocio no encontrada");
      }

      // Verificar que no tenga unidades asociadas
      if (linea.unidadesNegocio && linea.unidadesNegocio.length > 0) {
        throw new Error("No se puede eliminar una línea de negocio con unidades asociadas");
      }

      await linea.destroy();
      return true;
    } catch (error) {
      console.error("Error en deleteLineaNegocio:", error);
      throw error;
    }
  }

  /**
   * Crear unidad de negocio
   */
  async createUnidadNegocio(data) {
    try {
      const unidad = await db.UnidadNegocio.create({
        nombre: data.nombre,
        descripcion: data.descripcion,
        lineaNegocioId: data.lineaNegocioId
      });

      // Recargar con línea de negocio
      await unidad.reload({
        include: [{
          model: db.LineaNegocio,
          as: "lineaNegocio"
        }]
      });

      return unidad;
    } catch (error) {
      console.error("Error en createUnidadNegocio:", error);
      throw error;
    }
  }

  /**
   * Actualizar unidad de negocio
   */
  async updateUnidadNegocio(id, data) {
    try {
      const unidad = await db.UnidadNegocio.findByPk(id);

      if (!unidad) {
        throw new Error("Unidad de negocio no encontrada");
      }

      await unidad.update({
        nombre: data.nombre,
        descripcion: data.descripcion,
        lineaNegocioId: data.lineaNegocioId
      });

      // Recargar con línea de negocio
      await unidad.reload({
        include: [{
          model: db.LineaNegocio,
          as: "lineaNegocio"
        }]
      });

      return unidad;
    } catch (error) {
      console.error("Error en updateUnidadNegocio:", error);
      throw error;
    }
  }

  /**
   * Eliminar unidad de negocio
   */
  async deleteUnidadNegocio(id) {
    try {
      const unidad = await db.UnidadNegocio.findByPk(id);

      if (!unidad) {
        throw new Error("Unidad de negocio no encontrada");
      }

      await unidad.destroy();
      return true;
    } catch (error) {
      console.error("Error en deleteUnidadNegocio:", error);
      throw error;
    }
  }

  /**
   * Obtener unidades por línea de negocio
   */
  async getUnidadesByLinea(lineaId) {
    try {
      const unidades = await db.UnidadNegocio.findAll({
        where: { lineaNegocioId: lineaId },
        include: [{
          model: db.LineaNegocio,
          as: "lineaNegocio"
        }],
        order: [['nombre', 'ASC']]
      });

      return unidades;
    } catch (error) {
      console.error("Error en getUnidadesByLinea:", error);
      throw error;
    }
  }
}

module.exports = new OrganizationService();
