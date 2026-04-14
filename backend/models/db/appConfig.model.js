module.exports = (sequelize, Sequelize) => {
  const AppConfig = sequelize.define("app_config", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    clave: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true
    },
    valor: {
      type: Sequelize.JSONB,
      allowNull: false
    },
    actualizadoPor: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id"
      },
      onDelete: "SET NULL"
    }
  }, {
    tableName: "app_config",
    timestamps: true,
    underscored: true
  });

  return AppConfig;
};
