module.exports = (sequelize, Sequelize) => {
  const Seccion = sequelize.define("seccion", {
    id: {
      type: Sequelize.TEXT, // Cambiado a TEXT para mantener compatibilidad con IDs de frontend
      primaryKey: true
    },
    titulo: {
      type: Sequelize.STRING,
      allowNull: false
    },
    descripcion: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    tipo: {
      type: Sequelize.ENUM('folder', 'file'),
      defaultValue: 'folder',
      allowNull: false
    },
    parentId: {
      type: Sequelize.TEXT,
      allowNull: true,
      references: {
        model: "secciones",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    lineaNegocioId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "linea_negocios",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    unidadNegocioId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "unidad_negocios",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    creadoPor: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    orden: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    tags: {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    },
    webViewLink: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    driveMetadata: {
      type: Sequelize.JSONB,
      allowNull: true
    },
    keepExpanded: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: "secciones",
    timestamps: true,
    underscored: true
  });

  return Seccion;
};
