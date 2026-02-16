const dbConfig = require("../../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  port: dbConfig.port,
  pool: dbConfig.pool,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Para AWS RDS
    },
    typeCast: function (field, next) {
      if (field.type === "DATETIME" || field.type === "TIMESTAMP") {
        return new Date(field.string() + "Z");
      }
      return next();
    },
  },
  timezone: "-03:00",
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importar modelos
db.Usuario = require("./usuario.model")(sequelize, Sequelize);
db.LineaNegocio = require("./lineaNegocio.model")(sequelize, Sequelize);
db.UnidadNegocio = require("./unidadNegocio.model")(sequelize, Sequelize);
db.Rol = require("./rol.model")(sequelize, Sequelize);
db.UsuarioRol = require("./usuarioRol.model")(sequelize, Sequelize);
db.UsuarioUnidadNegocio = require("./usuarioUnidadNegocio.model")(sequelize, Sequelize);
db.Seccion = require("./seccion.model")(sequelize, Sequelize);

// ========================================
// RELACIONES
// ========================================

// LineaNegocio - UnidadNegocio (1:N)
db.LineaNegocio.hasMany(db.UnidadNegocio, {
  as: "unidadesNegocio",
  foreignKey: "lineaNegocioId"
});
db.UnidadNegocio.belongsTo(db.LineaNegocio, {
  as: "lineaNegocio",
  foreignKey: "lineaNegocioId"
});

// Usuario - Roles (N:M)
db.Usuario.belongsToMany(db.Rol, {
  through: db.UsuarioRol,
  foreignKey: "usuarioId",
  otherKey: "rolId",
  as: "roles"
});
db.Rol.belongsToMany(db.Usuario, {
  through: db.UsuarioRol,
  foreignKey: "rolId",
  otherKey: "usuarioId",
  as: "usuarios"
});

// Usuario - UnidadNegocio (N:M)
db.Usuario.belongsToMany(db.UnidadNegocio, {
  through: db.UsuarioUnidadNegocio,
  foreignKey: "usuarioId",
  otherKey: "unidadNegocioId",
  as: "unidadesNegocio"
});
db.UnidadNegocio.belongsToMany(db.Usuario, {
  through: db.UsuarioUnidadNegocio,
  foreignKey: "unidadNegocioId",
  otherKey: "usuarioId",
  as: "usuarios"
});

// Seccion - LineaNegocio (N:1)
db.Seccion.belongsTo(db.LineaNegocio, {
  as: "lineaNegocio",
  foreignKey: "lineaNegocioId"
});
db.LineaNegocio.hasMany(db.Seccion, {
  as: "secciones",
  foreignKey: "lineaNegocioId"
});

// Seccion - UnidadNegocio (N:1)
db.Seccion.belongsTo(db.UnidadNegocio, {
  as: "unidadNegocio",
  foreignKey: "unidadNegocioId"
});
db.UnidadNegocio.hasMany(db.Seccion, {
  as: "secciones",
  foreignKey: "unidadNegocioId"
});

// Seccion - Usuario (creador) (N:1)
db.Seccion.belongsTo(db.Usuario, {
  as: "creador",
  foreignKey: "creadoPor"
});
db.Usuario.hasMany(db.Seccion, {
  as: "seccionesCreadas",
  foreignKey: "creadoPor"
});

// Seccion - Seccion (jerarquía) (1:N)
db.Seccion.hasMany(db.Seccion, {
  as: "hijos",
  foreignKey: "parentId"
});
db.Seccion.belongsTo(db.Seccion, {
  as: "padre",
  foreignKey: "parentId"
});

module.exports = db;
