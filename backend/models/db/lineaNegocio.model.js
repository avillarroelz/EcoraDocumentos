module.exports = (sequelize, Sequelize) => {
  const LineaNegocio = sequelize.define("lineaNegocio", {
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
    }
  }, {
    tableName: "linea_negocios",
    timestamps: true,
    underscored: true
  });

  return LineaNegocio;
};
