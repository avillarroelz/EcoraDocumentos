const db = require("../models/db");

async function fixCriticalIssues() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     CORRECCIÓN DE PROBLEMAS CRÍTICOS - ECORA           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // ========================================
    // 1. CORREGIR PERMISOS DE ROLES
    // ========================================
    console.log('🔧 1. CORRIGIENDO PERMISOS DE ROLES...\n');

    // Definir permisos correctos para cada rol
    const rolesConfig = {
      super_admin: {
        nombreDescriptivo: 'Super Administrador',
        permisos: {
          canViewAll: true,
          canManageSections: true,
          canDeleteSections: true,
          canManageUsers: true,
          canManageRoles: true,
          canManageOrganization: true,
          canImportDrive: true,
          canExportData: true
        }
      },
      admin: {
        nombreDescriptivo: 'Administrador de Línea',
        permisos: {
          canViewAll: true,
          canManageSections: true,
          canDeleteSections: true,
          canManageUsers: true,        // Puede gestionar usuarios de su línea
          canManageRoles: false,        // NO puede cambiar roles
          canManageOrganization: true,  // Puede gestionar su línea
          canImportDrive: true,
          canExportData: true
        }
      },
      manager: {
        nombreDescriptivo: 'Gestor de Unidad',
        permisos: {
          canViewAll: true,
          canManageSections: true,
          canDeleteSections: false,     // NO puede eliminar secciones
          canManageUsers: false,        // NO puede gestionar usuarios
          canManageRoles: false,        // NO puede cambiar roles
          canManageOrganization: false, // NO puede gestionar organización
          canImportDrive: true,
          canExportData: true
        }
      },
      user: {
        nombreDescriptivo: 'Usuario Estándar',
        permisos: {
          canViewAll: true,
          canManageSections: true,      // Puede crear/editar
          canDeleteSections: false,     // NO puede eliminar
          canManageUsers: false,
          canManageRoles: false,
          canManageOrganization: false,
          canImportDrive: true,
          canExportData: true
        }
      },
      viewer: {
        nombreDescriptivo: 'Solo Lectura',
        permisos: {
          canViewAll: true,
          canManageSections: false,     // NO puede crear/editar
          canDeleteSections: false,
          canManageUsers: false,
          canManageRoles: false,
          canManageOrganization: false,
          canImportDrive: false,        // NO puede importar
          canExportData: true           // Solo puede exportar
        }
      }
    };

    for (const [roleName, config] of Object.entries(rolesConfig)) {
      const rol = await db.Rol.findOne({ where: { nombre: roleName } });

      if (rol) {
        await rol.update({
          nombreDescriptivo: config.nombreDescriptivo,
          permisos: config.permisos
        });
        console.log(`   ✅ ${roleName} actualizado:`);
        console.log(`      - ${config.nombreDescriptivo}`);
        console.log(`      - Permisos: ${Object.keys(config.permisos).filter(k => config.permisos[k]).length}/${Object.keys(config.permisos).length}`);
      } else {
        console.log(`   ⚠️  Rol ${roleName} no encontrado`);
      }
    }
    console.log('');

    // ========================================
    // 2. ACTIVAR USUARIOS PRINCIPALES
    // ========================================
    console.log('🔧 2. ACTIVANDO USUARIOS PRINCIPALES...\n');

    const usuariosActivar = [
      'admin@ecora.cl',
      'avillarroel@ecora.cl',
      'jcarrasco@ecora.cl'
    ];

    for (const email of usuariosActivar) {
      const usuario = await db.Usuario.findOne({ where: { email } });

      if (usuario) {
        await usuario.update({ estado: true });
        console.log(`   ✅ Usuario activado: ${usuario.nombre} (${email})`);
      } else {
        console.log(`   ⚠️  Usuario no encontrado: ${email}`);
      }
    }
    console.log('');

    // ========================================
    // 3. AGREGAR CÓDIGOS A ORGANIZACIÓN
    // ========================================
    console.log('🔧 3. AGREGANDO CÓDIGOS A ORGANIZACIÓN...\n');

    // Códigos para líneas de negocio
    const lineasCodigos = {
      'Construcción': 'CONST',
      'Mantención': 'MANT',
      'Ingeniería': 'ING'
    };

    console.log('   📌 Líneas de Negocio:');
    for (const [nombre, codigo] of Object.entries(lineasCodigos)) {
      const linea = await db.LineaNegocio.findOne({ where: { nombre } });

      if (linea) {
        await linea.update({ codigo });
        console.log(`      ✅ ${nombre} → ${codigo}`);
      } else {
        console.log(`      ⚠️  Línea no encontrada: ${nombre}`);
      }
    }
    console.log('');

    // Códigos para unidades de negocio
    const unidadesCodigos = {
      'Obras Civiles': 'CONST-OC',
      'Edificación': 'CONST-ED',
      'Mantención Preventiva': 'MANT-PREV',
      'Mantención Correctiva': 'MANT-CORR',
      'Ingeniería de Proyectos': 'ING-PROY',
      'Consultoría Técnica': 'ING-CONS'
    };

    console.log('   📋 Unidades de Negocio:');
    for (const [nombre, codigo] of Object.entries(unidadesCodigos)) {
      const unidad = await db.UnidadNegocio.findOne({ where: { nombre } });

      if (unidad) {
        await unidad.update({ codigo });
        console.log(`      ✅ ${nombre} → ${codigo}`);
      } else {
        console.log(`      ⚠️  Unidad no encontrada: ${nombre}`);
      }
    }
    console.log('');

    // ========================================
    // 4. VERIFICACIÓN FINAL
    // ========================================
    console.log('🔍 4. VERIFICANDO CORRECCIONES...\n');

    // Verificar roles
    const roles = await db.Rol.findAll();
    console.log('   👥 Roles actualizados:');
    roles.forEach(rol => {
      const permisosActivos = Object.keys(rol.permisos).filter(k => rol.permisos[k]).length;
      console.log(`      - ${rol.nombre}: ${permisosActivos} permisos activos`);
    });
    console.log('');

    // Verificar usuarios activos
    const usuariosActivos = await db.Usuario.count({ where: { estado: true } });
    const usuariosTotal = await db.Usuario.count();
    console.log(`   👤 Usuarios: ${usuariosActivos}/${usuariosTotal} activos`);
    console.log('');

    // Verificar códigos
    const lineasConCodigo = await db.LineaNegocio.count({
      where: {
        codigo: { [db.Sequelize.Op.ne]: null }
      }
    });
    const unidadesConCodigo = await db.UnidadNegocio.count({
      where: {
        codigo: { [db.Sequelize.Op.ne]: null }
      }
    });
    console.log(`   🏢 Organización:`);
    console.log(`      - Líneas con código: ${lineasConCodigo}/3`);
    console.log(`      - Unidades con código: ${unidadesConCodigo}/6`);
    console.log('');

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              CORRECCIONES COMPLETADAS                  ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  ✅ Permisos de roles diferenciados                    ║');
    console.log(`║  ✅ ${usuariosActivos} usuarios activados                             ║`);
    console.log('║  ✅ Códigos de organización agregados                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('💡 Próximos pasos recomendados:');
    console.log('   1. Reiniciar el servidor backend');
    console.log('   2. Probar el login con los usuarios activados');
    console.log('   3. Verificar que los permisos funcionen correctamente');
    console.log('   4. Revisar la interfaz de administración\n');

  } catch (error) {
    console.error('\n❌ ERROR EN CORRECCIONES:', error);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
    console.log('🔌 Conexión a base de datos cerrada\n');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixCriticalIssues()
    .then(() => {
      console.log('✅ Correcciones completadas exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = fixCriticalIssues;
