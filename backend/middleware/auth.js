/**
 * Middleware de Autenticación y Autorización
 */

const { getUserById, hasPermission } = require('../models/userRoles');
const db = require('../models/db');

/**
 * Middleware para verificar que el usuario está autenticado
 */
const requireAuth = async (req, res, next) => {
  try {
    // Verificar si hay sesión de Google
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debe iniciar sesión para acceder a este recurso'
      });
    }

    // Buscar usuario en la base de datos de Sequelize
    const usuario = await db.Usuario.findByPk(req.session.user.id, {
      include: [
        {
          model: db.Rol,
          as: 'roles',
          through: { attributes: [] }
        },
        {
          model: db.UnidadNegocio,
          as: 'unidadesNegocio',
          through: { attributes: [] },
          include: [{
            model: db.LineaNegocio,
            as: 'lineaNegocio'
          }]
        }
      ]
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
        message: 'Su usuario no está registrado en el sistema'
      });
    }

    // Verificar que el usuario está activo
    if (usuario.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        error: 'Usuario desactivado',
        message: 'Su cuenta ha sido desactivada. Contacte al administrador'
      });
    }

    // Agregar usuario al request con formato compatible
    req.user = {
      id: usuario.id,
      googleId: usuario.googleId,
      email: usuario.email,
      nombre: usuario.nombre,
      fotoPerfil: usuario.fotoPerfil,
      estado: usuario.estado,
      roles: usuario.roles.map(r => r.nombre),
      role: usuario.roles.length > 0 ? usuario.roles[0].nombre : 'viewer',
      unidadesNegocio: usuario.unidadesNegocio
    };

    next();
  } catch (error) {
    console.error('Error en requireAuth:', error);
    return res.status(500).json({
      success: false,
      error: 'Error de autenticación',
      message: error.message
    });
  }
};

/**
 * Middleware para verificar permisos específicos
 * @param {string} permission - Nombre del permiso a verificar
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debe iniciar sesión primero'
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        error: 'Permiso denegado',
        message: `No tiene permiso para: ${permission}`
      });
    }

    next();
  };
};

/**
 * Middleware para verificar rol específico
 * @param {string|string[]} roles - Rol o array de roles permitidos
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debe iniciar sesión primero'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: 'No tiene el rol necesario para acceder a este recurso',
        requiredRoles: allowedRoles,
        currentRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no está autenticado, solo agrega el usuario si existe
 */
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    const user = getUserById(req.session.user.id);
    if (user && user.isActive) {
      req.user = user;
    }
  }
  next();
};

/**
 * Middleware para verificar que el usuario puede acceder a una línea de negocio
 */
const requireBusinessLineAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado'
    });
  }

  // Obtener businessLineId del body, params o query
  const businessLineId = req.body.businessLineId || req.params.businessLineId || req.query.businessLineId;

  if (!businessLineId) {
    return res.status(400).json({
      success: false,
      error: 'businessLineId es requerido'
    });
  }

  const { canAccessBusinessLine } = require('../models/userRoles');

  if (!canAccessBusinessLine(req.user, businessLineId)) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado',
      message: 'No tiene acceso a esta línea de negocio'
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario puede acceder a una unidad de negocio
 */
const requireBusinessUnitAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado'
    });
  }

  // Obtener businessUnitId del body, params o query
  const businessUnitId = req.body.businessUnitId || req.params.businessUnitId || req.query.businessUnitId;

  if (!businessUnitId) {
    return res.status(400).json({
      success: false,
      error: 'businessUnitId es requerido'
    });
  }

  const { canAccessBusinessUnit } = require('../models/userRoles');

  if (!canAccessBusinessUnit(req.user, businessUnitId)) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado',
      message: 'No tiene acceso a esta unidad de negocio'
    });
  }

  next();
};

module.exports = {
  requireAuth,
  requirePermission,
  requireRole,
  optionalAuth,
  requireBusinessLineAccess,
  requireBusinessUnitAccess
};
