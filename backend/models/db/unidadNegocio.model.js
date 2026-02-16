module.exports = (sequelize, Sequelize) => {
  const UnidadNegocio = sequelize.define("unidadNegocio", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    codigo: {
      type: Sequelize.STRING(20),
      allowNull: true,
      unique: true
    },
    nombre: {
      type: Sequelize.STRING,
      allowNull: false
    },
    descripcion: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    lineaNegocioId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "linea_negocios",
        key: "id"
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    }
  }, {
    tableName: "unidad_negocios",
    timestamps: true,
    underscored: true
  });

  return UnidadNegocio;
};
