const db = require("../models/db");

const rolesData = [
  {
    nombre: "super_admin",
    nombreDescriptivo: "Super Administrador",
    permisos: {
      canManageUsers: true,
      canManageOrganization: true,
      canManageSections: true,
      canDeleteSections: true,
      canImportDrive: true,
      canExportData: true,
      canViewAll: true,
      canManageRoles: true
    }
  },
  {
    nombre: "admin",
    nombreDescriptivo: "Administrador de Línea",
    permisos: {
      canManageUsers: true,
      canManageOrganization: true,
      canManageSections: true,
      canDeleteSections: true,
      canImportDrive: true,
      canExportData: true,
      canViewAll: false,
      canManageRoles: false
    }
  },
  {
    nombre: "manager",
    nombreDescriptivo: "Gestor de Unidad",
    permisos: {
      canManageUsers: false,
      canManageOrganization: false,
      canManageSections: true,
      canDeleteSections: false,
      canImportDrive: true,
      canExportData: true,
      canViewAll: false,
      canManageRoles: false
    }
  },
  {
    nombre: "user",
    nombreDescriptivo: "Usuario Estándar",
    permisos: {
      canManageUsers: false,
      canManageOrganization: false,
      canManageSections: true,
      canDeleteSections: false,
      canImportDrive: false,
      canExportData: false,
      canViewAll: false,
      canManageRoles: false
    }
  },
  {
    nombre: "viewer",
    nombreDescriptivo: "Solo Lectura",
    permisos: {
      canManageUsers: false,
      canManageOrganization: false,
      canManageSections: false,
      canDeleteSections: false,
      canImportDrive: false,
      canExportData: false,
      canViewAll: false,
      canManageRoles: false
    }
  }
];

const lineasNegocioData = [
  {
    nombre: "Construcción",
    descripcion: "Proyectos de obras civiles y edificación"
  },
  {
    nombre: "Mantención",
    descripcion: "Servicios de mantenimiento de infraestructura"
  },
  {
    nombre: "Ingeniería",
    descripcion: "Servicios de ingeniería y consultoría técnica"
  }
];

async function initDatabase() {
  try {
    console.log("🔄 Iniciando sincronización de base de datos...");

    // Sincronizar modelos con la base de datos
    await db.sequelize.sync({ force: true });
    console.log("✅ Base de datos sincronizada");

    // Crear roles
    console.log("\n🔐 Creando roles...");
    const roles = await db.Rol.bulkCreate(rolesData);
    console.log(`✅ ${roles.length} roles creados`);

    // Crear líneas de negocio
    console.log("\n🏢 Creando líneas de negocio...");
    const lineas = await db.LineaNegocio.bulkCreate(lineasNegocioData);
    console.log(`✅ ${lineas.length} líneas de negocio creadas`);

    // Crear unidades de negocio
    console.log("\n📊 Creando unidades de negocio...");

    const construccionLine = lineas.find(l => l.nombre === "Construcción");
    const mantencionLine = lineas.find(l => l.nombre === "Mantención");
    const ingenieriaLine = lineas.find(l => l.nombre === "Ingeniería");

    const unidadesData = [
      // Construcción
      {
        nombre: "Obras Civiles",
        descripcion: "Construcción de infraestructura pública y privada",
        lineaNegocioId: construccionLine.id
      },
      {
        nombre: "Edificación",
        descripcion: "Construcción de edificios y estructuras",
        lineaNegocioId: construccionLine.id
      },
      // Mantención
      {
        nombre: "Mantención Preventiva",
        descripcion: "Mantenimiento programado de instalaciones",
        lineaNegocioId: mantencionLine.id
      },
      {
        nombre: "Mantención Correctiva",
        descripcion: "Reparaciones y correcciones de fallas",
        lineaNegocioId: mantencionLine.id
      },
      // Ingeniería
      {
        nombre: "Ingeniería de Proyectos",
        descripcion: "Diseño y desarrollo de proyectos de ingeniería",
        lineaNegocioId: ingenieriaLine.id
      },
      {
        nombre: "Consultoría Técnica",
        descripcion: "Asesoría técnica especializada",
        lineaNegocioId: ingenieriaLine.id
      }
    ];

    const unidades = await db.UnidadNegocio.bulkCreate(unidadesData);
    console.log(`✅ ${unidades.length} unidades de negocio creadas`);

    // Crear usuario super admin por defecto
    console.log("\n👤 Creando usuario super admin...");
    const superAdminRole = roles.find(r => r.nombre === "super_admin");

    const superAdmin = await db.Usuario.create({
      email: "admin@ecora.cl",
      nombre: "Administrador Ecora",
      googleId: null,
      estado: true
    });

    await superAdmin.addRole(superAdminRole);
    console.log("✅ Usuario super admin creado");

    console.log("\n✨ Base de datos inicializada correctamente\n");
    console.log("📋 Resumen:");
    console.log(`   - ${roles.length} roles`);
    console.log(`   - ${lineas.length} líneas de negocio`);
    console.log(`   - ${unidades.length} unidades de negocio`);
    console.log(`   - 1 usuario super admin (admin@ecora.cl)\n`);

  } catch (error) {
    console.error("❌ Error al inicializar base de datos:", error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log("🎉 Proceso completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error fatal:", error);
      process.exit(1);
    });
}

module.exports = initDatabase;
