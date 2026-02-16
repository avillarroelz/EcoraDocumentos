module.exports = (sequelize, Sequelize) => {
  const Rol = sequelize.define("rol", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    nombre: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    nombreDescriptivo: {
      type: Sequelize.STRING,
      allowNull: false
    },
    permisos: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: "roles",
    timestamps: true,
    underscored: true
  });

  return Rol;
};
