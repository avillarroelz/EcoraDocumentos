const db = require("../models/db");
const { Op } = require("sequelize");

class AuthService {
  /**
   * Buscar o crear usuario desde Google OAuth
   */
  async upsertGoogleUser(googleProfile) {
    try {
      const { id: googleId, email, name, picture } = googleProfile;

      // Buscar usuario existente
      let usuario = await db.Usuario.findOne({
        where: {
          [Op.or]: [
            { googleId },
            { email }
          ]
        },
        include: [
          {
            model: db.Rol,
            as: "roles",
            through: { attributes: [] }
          },
          {
            model: db.UnidadNegocio,
            as: "unidadesNegocio",
            through: { attributes: [] },
            include: [{
              model: db.LineaNegocio,
              as: "lineaNegocio"
            }]
          }
        ]
      });

      if (usuario) {
        // Actualizar información del usuario
        await usuario.update({
          nombre: name,
          fotoPerfil: picture,
          ultimoLogin: new Date(),
          googleId: googleId // Asegurar que googleId esté actualizado
        });
      } else {
        // Crear nuevo usuario con rol viewer por defecto
        const viewerRole = await db.Rol.findOne({
          where: { nombre: "viewer" }
        });

        usuario = await db.Usuario.create({
          googleId,
          email,
          nombre: name,
          fotoPerfil: picture,
          estado: true,
          ultimoLogin: new Date()
        });

        // Asignar rol viewer por defecto
        if (viewerRole) {
          await usuario.addRole(viewerRole);
        }

        // Recargar con asociaciones
        usuario = await db.Usuario.findByPk(usuario.id, {
          include: [
            {
              model: db.Rol,
              as: "roles",
              through: { attributes: [] }
            },
            {
              model: db.UnidadNegocio,
              as: "unidadesNegocio",
              through: { attributes: [] },
              include: [{
                model: db.LineaNegocio,
                as: "lineaNegocio"
              }]
            }
          ]
        });
      }

      return usuario;
    } catch (error) {
      console.error("Error en upsertGoogleUser:", error);
      throw error;
    }
  }

  /**
   * Buscar o crear usuario desde Sign in with Apple.
   * Apple solo entrega el nombre/email en el PRIMER inicio de sesión, por eso
   * se vincula por email a un usuario existente y se persiste el appleId.
   */
  async upsertAppleUser(appleProfile) {
    try {
      const { sub: appleId, email, name } = appleProfile;

      const includeAssociations = [
        {
          model: db.Rol,
          as: "roles",
          through: { attributes: [] }
        },
        {
          model: db.UnidadNegocio,
          as: "unidadesNegocio",
          through: { attributes: [] },
          include: [{
            model: db.LineaNegocio,
            as: "lineaNegocio"
          }]
        }
      ];

      // Buscar por appleId o por email (vinculación con cuenta Google existente)
      const orConditions = [{ appleId }];
      if (email) {
        orConditions.push({ email });
      }

      let usuario = await db.Usuario.findOne({
        where: { [Op.or]: orConditions },
        include: includeAssociations
      });

      if (usuario) {
        // Vincular appleId si aún no estaba y actualizar último login
        const updates = { ultimoLogin: new Date(), appleId };
        if (!usuario.nombre && name) {
          updates.nombre = name;
        }
        await usuario.update(updates);
      } else {
        // Crear nuevo usuario con rol viewer por defecto
        const viewerRole = await db.Rol.findOne({
          where: { nombre: "viewer" }
        });

        usuario = await db.Usuario.create({
          appleId,
          email,
          nombre: name || (email ? email.split("@")[0] : "Usuario Apple"),
          estado: true,
          ultimoLogin: new Date()
        });

        if (viewerRole) {
          await usuario.addRole(viewerRole);
        }

        usuario = await db.Usuario.findByPk(usuario.id, {
          include: includeAssociations
        });
      }

      return usuario;
    } catch (error) {
      console.error("Error en upsertAppleUser:", error);
      throw error;
    }
  }

  /**
   * Buscar o crear la cuenta de demostración (para revisión de App Store).
   * Siempre con rol viewer (solo lectura).
   */
  async upsertDemoUser({ email, name }) {
    try {
      const includeAssociations = [
        {
          model: db.Rol,
          as: "roles",
          through: { attributes: [] }
        },
        {
          model: db.UnidadNegocio,
          as: "unidadesNegocio",
          through: { attributes: [] },
          include: [{
            model: db.LineaNegocio,
            as: "lineaNegocio"
          }]
        }
      ];

      let usuario = await db.Usuario.findOne({
        where: { email },
        include: includeAssociations
      });

      if (usuario) {
        await usuario.update({ ultimoLogin: new Date(), estado: true });
      } else {
        const viewerRole = await db.Rol.findOne({ where: { nombre: "viewer" } });

        usuario = await db.Usuario.create({
          email,
          nombre: name || "Cuenta Demo",
          estado: true,
          ultimoLogin: new Date()
        });

        if (viewerRole) {
          await usuario.addRole(viewerRole);
        }

        usuario = await db.Usuario.findByPk(usuario.id, {
          include: includeAssociations
        });
      }

      return usuario;
    } catch (error) {
      console.error("Error en upsertDemoUser:", error);
      throw error;
    }
  }

  /**
   * Obtener usuario con permisos
   */
  async getUserWithPermissions(userId) {
    try {
      const usuario = await db.Usuario.findByPk(userId, {
        include: [
          {
            model: db.Rol,
            as: "roles",
            through: { attributes: [] }
          },
          {
            model: db.UnidadNegocio,
            as: "unidadesNegocio",
            through: { attributes: [] },
            include: [{
              model: db.LineaNegocio,
              as: "lineaNegocio"
            }]
          }
        ]
      });

      if (!usuario) {
        return null;
      }

      // Calcular permisos consolidados
      const permisos = this.calculatePermissions(usuario);

      return {
        ...usuario.toJSON(),
        permisos
      };
    } catch (error) {
      console.error("Error en getUserWithPermissions:", error);
      throw error;
    }
  }

  /**
   * Calcular permisos del usuario basado en sus roles
   */
  calculatePermissions(usuario) {
    if (!usuario.roles || usuario.roles.length === 0) {
      return {
        canManageUsers: false,
        canManageOrganization: false,
        canManageSections: false,
        canDeleteSections: false,
        canImportDrive: false,
        canExportData: false,
        canViewAll: false,
        canManageRoles: false
      };
    }

    // Si tiene rol super_admin, tiene todos los permisos
    const isSuperAdmin = usuario.roles.some(r => r.nombre === "super_admin");
    if (isSuperAdmin) {
      return {
        canManageUsers: true,
        canManageOrganization: true,
        canManageSections: true,
        canDeleteSections: true,
        canImportDrive: true,
        canExportData: true,
        canViewAll: true,
        canManageRoles: true
      };
    }

    // Consolidar permisos de todos los roles
    const consolidatedPermissions = {};

    usuario.roles.forEach(rol => {
      if (rol.permisos) {
        Object.keys(rol.permisos).forEach(permiso => {
          if (rol.permisos[permiso]) {
            consolidatedPermissions[permiso] = true;
          }
        });
      }
    });

    return {
      canManageUsers: consolidatedPermissions.canManageUsers || false,
      canManageOrganization: consolidatedPermissions.canManageOrganization || false,
      canManageSections: consolidatedPermissions.canManageSections || false,
      canDeleteSections: consolidatedPermissions.canDeleteSections || false,
      canImportDrive: consolidatedPermissions.canImportDrive || false,
      canExportData: consolidatedPermissions.canExportData || false,
      canViewAll: consolidatedPermissions.canViewAll || false,
      canManageRoles: consolidatedPermissions.canManageRoles || false
    };
  }

  /**
   * Verificar si usuario tiene un permiso específico
   */
  async hasPermission(userId, permission) {
    try {
      const userData = await this.getUserWithPermissions(userId);
      return userData && userData.permisos[permission];
    } catch (error) {
      console.error("Error en hasPermission:", error);
      return false;
    }
  }

  /**
   * Obtener rol principal del usuario
   */
  getPrimaryRole(usuario) {
    if (!usuario.roles || usuario.roles.length === 0) {
      return "viewer";
    }

    const roleHierarchy = ["super_admin", "admin", "manager", "user", "viewer"];

    for (const roleName of roleHierarchy) {
      if (usuario.roles.some(r => r.nombre === roleName)) {
        return roleName;
      }
    }

    return "viewer";
  }
}

module.exports = new AuthService();
