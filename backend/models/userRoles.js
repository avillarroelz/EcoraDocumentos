/**
 * Modelo de Usuarios y Roles
 * Gestión de usuarios autenticados con Google y sus roles
 */

const { v4: uuidv4 } = require('uuid');

// Definición de roles del sistema
const ROLES = {
  SUPER_ADMIN: 'super_admin',        // Acceso total al sistema
  ADMIN: 'admin',                     // Administrador de línea/unidad
  MANAGER: 'manager',                 // Gestor de unidad de negocio
  USER: 'user',                       // Usuario estándar
  VIEWER: 'viewer'                    // Solo lectura
};

// Permisos por rol
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    canManageUsers: true,
    canManageOrganization: true,
    canManageSections: true,
    canViewAllSections: true,
    canEditAllSections: true,
    canDeleteSections: true,
    canExportData: true,
    canImportFromDrive: true
  },
  [ROLES.ADMIN]: {
    canManageUsers: true,              // Solo de su línea/unidad
    canManageOrganization: false,
    canManageSections: true,           // Solo de su línea/unidad
    canViewAllSections: false,         // Solo su línea/unidad
    canEditAllSections: false,
    canDeleteSections: true,           // Solo su línea/unidad
    canExportData: true,
    canImportFromDrive: true
  },
  [ROLES.MANAGER]: {
    canManageUsers: false,
    canManageOrganization: false,
    canManageSections: true,           // Solo su unidad
    canViewAllSections: false,         // Solo su unidad
    canEditAllSections: false,
    canDeleteSections: false,
    canExportData: true,
    canImportFromDrive: true
  },
  [ROLES.USER]: {
    canManageUsers: false,
    canManageOrganization: false,
    canManageSections: true,           // Crear/editar solo
    canViewAllSections: false,         // Solo su unidad
    canEditAllSections: false,
    canDeleteSections: false,
    canExportData: false,
    canImportFromDrive: false
  },
  [ROLES.VIEWER]: {
    canManageUsers: false,
    canManageOrganization: false,
    canManageSections: false,
    canViewAllSections: false,         // Solo su unidad
    canEditAllSections: false,
    canDeleteSections: false,
    canExportData: false,
    canImportFromDrive: false
  }
};

// Base de datos en memoria para usuarios
let users = [
  // Usuario super admin de ejemplo
  {
    id: uuidv4(),
    googleId: 'admin@ecora.cl',
    email: 'admin@ecora.cl',
    name: 'Administrador Ecora',
    picture: null,
    role: ROLES.SUPER_ADMIN,
    businessLineId: null,               // null = acceso a todas
    businessUnitId: null,               // null = acceso a todas
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: null
  }
];

// Funciones CRUD para usuarios

const getAllUsers = () => {
  return users;
};

const getUserById = (id) => {
  return users.find(u => u.id === id);
};

const getUserByGoogleId = (googleId) => {
  return users.find(u => u.googleId === googleId);
};

const getUserByEmail = (email) => {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

const createUser = (data) => {
  // Verificar si el usuario ya existe
  const existingUser = getUserByGoogleId(data.googleId);
  if (existingUser) {
    throw new Error('El usuario ya existe');
  }

  const newUser = {
    id: uuidv4(),
    googleId: data.googleId,
    email: data.email,
    name: data.name,
    picture: data.picture || null,
    role: data.role || ROLES.USER,
    businessLineId: data.businessLineId || null,
    businessUnitId: data.businessUnitId || null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users.push(newUser);
  return newUser;
};

const updateUser = (id, data) => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  // No permitir cambiar googleId o email
  const { googleId, email, createdAt, ...updateData } = data;

  users[index] = {
    ...users[index],
    ...updateData,
    id: users[index].id,
    googleId: users[index].googleId,
    email: users[index].email,
    createdAt: users[index].createdAt,
    updatedAt: new Date().toISOString()
  };

  return users[index];
};

const updateLastLogin = (id) => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  users[index].lastLogin = new Date().toISOString();
  return users[index];
};

const deleteUser = (id) => {
  // No permitir eliminar al super admin
  const user = getUserById(id);
  if (user && user.role === ROLES.SUPER_ADMIN) {
    throw new Error('No se puede eliminar al super administrador');
  }

  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;

  users.splice(index, 1);
  return true;
};

const deactivateUser = (id) => {
  const user = getUserById(id);
  if (!user) return null;
  if (user.role === ROLES.SUPER_ADMIN) {
    throw new Error('No se puede desactivar al super administrador');
  }

  return updateUser(id, { isActive: false });
};

const activateUser = (id) => {
  return updateUser(id, { isActive: true });
};

// Funciones de verificación de permisos

const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  const permissions = ROLE_PERMISSIONS[user.role];
  return permissions && permissions[permission] === true;
};

const canAccessBusinessLine = (user, businessLineId) => {
  // Super admin tiene acceso a todo
  if (user.role === ROLES.SUPER_ADMIN) return true;

  // Si el usuario no tiene línea asignada, no tiene acceso
  if (!user.businessLineId) return false;

  // Verificar si la línea coincide
  return user.businessLineId === businessLineId;
};

const canAccessBusinessUnit = (user, businessUnitId) => {
  // Super admin tiene acceso a todo
  if (user.role === ROLES.SUPER_ADMIN) return true;

  // Si el usuario no tiene unidad asignada pero tiene rol admin, puede ver toda su línea
  if (!user.businessUnitId && user.role === ROLES.ADMIN && user.businessLineId) {
    // Verificar que la unidad pertenezca a su línea
    const { getBusinessUnitById } = require('./organizationStructure');
    const unit = getBusinessUnitById(businessUnitId);
    return unit && unit.businessLineId === user.businessLineId;
  }

  // Verificar si la unidad coincide
  return user.businessUnitId === businessUnitId;
};

// Función para filtrar usuarios según permisos del solicitante
const getUsersByPermission = (requestingUser) => {
  if (!requestingUser) return [];

  // Super admin ve todos
  if (requestingUser.role === ROLES.SUPER_ADMIN) {
    return users;
  }

  // Admin ve usuarios de su línea de negocio
  if (requestingUser.role === ROLES.ADMIN && requestingUser.businessLineId) {
    return users.filter(u => u.businessLineId === requestingUser.businessLineId);
  }

  // Manager ve usuarios de su unidad de negocio
  if (requestingUser.role === ROLES.MANAGER && requestingUser.businessUnitId) {
    return users.filter(u => u.businessUnitId === requestingUser.businessUnitId);
  }

  // Otros roles solo se ven a sí mismos
  return [requestingUser];
};

// Función para registrar o actualizar usuario desde Google OAuth
const upsertGoogleUser = (googleUserInfo) => {
  const existingUser = getUserByGoogleId(googleUserInfo.id);

  if (existingUser) {
    // Actualizar información del usuario existente
    updateUser(existingUser.id, {
      name: googleUserInfo.name,
      picture: googleUserInfo.picture
    });
    updateLastLogin(existingUser.id);
    return existingUser;
  }

  // Crear nuevo usuario con rol por defecto
  return createUser({
    googleId: googleUserInfo.id,
    email: googleUserInfo.email,
    name: googleUserInfo.name,
    picture: googleUserInfo.picture,
    role: ROLES.VIEWER,  // Nuevo usuario empieza como viewer
    businessLineId: null,
    businessUnitId: null
  });
};

module.exports = {
  // Constantes
  ROLES,
  ROLE_PERMISSIONS,

  // CRUD Usuarios
  getAllUsers,
  getUserById,
  getUserByGoogleId,
  getUserByEmail,
  createUser,
  updateUser,
  updateLastLogin,
  deleteUser,
  deactivateUser,
  activateUser,

  // Permisos
  hasPermission,
  canAccessBusinessLine,
  canAccessBusinessUnit,
  getUsersByPermission,

  // OAuth
  upsertGoogleUser
};
