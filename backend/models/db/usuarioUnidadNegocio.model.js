module.exports = (sequelize, Sequelize) => {
  const UsuarioUnidadNegocio = sequelize.define("usuarioUnidadNegocio", {
    usuarioId: {
      type: Sequelize.UUID,
      primaryKey: true,
      references: {
        model: "usuarios",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    unidadNegocioId: {
      type: Sequelize.UUID,
      primaryKey: true,
      references: {
        model: "unidad_negocios",
        key: "id"
      },
      onDelete: "CASCADE"
    }
  }, {
    tableName: "usuario_unidad_negocio",
    timestamps: true,
    underscored: true
  });

  return UsuarioUnidadNegocio;
};
