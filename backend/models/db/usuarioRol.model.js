module.exports = (sequelize, Sequelize) => {
  const UsuarioRol = sequelize.define("usuarioRol", {
    usuarioId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    rolId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id"
      },
      onDelete: "CASCADE"
    }
  }, {
    tableName: "usuario_rol",
    timestamps: false,
    underscored: true
  });

  return UsuarioRol;
};
