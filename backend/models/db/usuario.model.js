module.exports = (sequelize, Sequelize) => {
  const Usuario = sequelize.define("usuario", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    googleId: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    nombre: {
      type: Sequelize.STRING,
      allowNull: false
    },
    fotoPerfil: {
      type: Sequelize.STRING,
      allowNull: true
    },
    estado: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    ultimoLogin: {
      type: Sequelize.DATE,
      allowNull: true
    }
  }, {
    tableName: "usuarios",
    timestamps: true,
    underscored: true
  });

  return Usuario;
};
