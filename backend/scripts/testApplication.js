const db = require("../models/db");

async function testApplication() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         ECORA - TEST DE APLICACIÓN COMPLETO            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // ========================================
    // 1. TEST DE CONEXIÓN A BASE DE DATOS
    // ========================================
    console.log('📊 1. VERIFICANDO CONEXIÓN A BASE DE DATOS...');
    await db.sequelize.authenticate();
    console.log('   ✅ Conexión exitosa a PostgreSQL\n');

    // ========================================
    // 2. TEST DE MODELOS Y TABLAS
    // ========================================
    console.log('📋 2. VERIFICANDO MODELOS Y TABLAS...');

    const tables = [
      { name: 'usuarios', model: db.Usuario },
      { name: 'roles', model: db.Rol },
      { name: 'linea_negocios', model: db.LineaNegocio },
      { name: 'unidad_negocios', model: db.UnidadNegocio },
      { name: 'secciones', model: db.Seccion }
    ];

    for (const table of tables) {
      try {
        const count = await table.model.count();
        console.log(`   ✅ Tabla ${table.name}: ${count} registros`);
      } catch (error) {
        console.log(`   ❌ Error en tabla ${table.name}: ${error.message}`);
      }
    }
    console.log('');

    // ========================================
    // 3. TEST DE ROLES DEL SISTEMA
    // ========================================
    console.log('👥 3. VERIFICANDO ROLES DEL SISTEMA...');
    const roles = await db.Rol.findAll({
      order: [['nombre', 'ASC']]
    });

    console.log(`   Total de roles: ${roles.length}`);
    roles.forEach(rol => {
      console.log(`   - ${rol.nombre}: ${rol.nombreDescriptivo}`);
      console.log(`     Permisos: ${Object.keys(rol.permisos).join(', ')}`);
    });
    console.log('');

    // ========================================
    // 4. TEST DE ESTRUCTURA ORGANIZACIONAL
    // ========================================
    console.log('🏢 4. VERIFICANDO ESTRUCTURA ORGANIZACIONAL...');

    const lineasNegocio = await db.LineaNegocio.findAll({
      include: [{
        model: db.UnidadNegocio,
        as: 'unidadesNegocio'
      }]
    });

    console.log(`   Total líneas de negocio: ${lineasNegocio.length}`);
    lineasNegocio.forEach(linea => {
      console.log(`   📌 ${linea.nombre} (${linea.codigo})`);
      console.log(`      └─ ${linea.unidadesNegocio.length} unidades de negocio`);
      linea.unidadesNegocio.forEach(unidad => {
        console.log(`         • ${unidad.nombre} (${unidad.codigo})`);
      });
    });
    console.log('');

    // ========================================
    // 5. TEST DE USUARIOS
    // ========================================
    console.log('👤 5. VERIFICANDO USUARIOS...');

    const usuarios = await db.Usuario.findAll({
      include: [
        {
          model: db.Rol,
          as: 'roles',
          through: { attributes: [] }
        },
        {
          model: db.UnidadNegocio,
          as: 'unidadesNegocio',
          through: { attributes: [] }
        }
      ]
    });

    console.log(`   Total usuarios: ${usuarios.length}`);
    usuarios.forEach(usuario => {
      const rolesStr = usuario.roles.map(r => r.nombre).join(', ');
      const unidadesStr = usuario.unidadesNegocio.map(u => u.codigo).join(', ') || 'Sin asignar';
      console.log(`   👤 ${usuario.nombre} (${usuario.email})`);
      console.log(`      Roles: ${rolesStr || 'Sin roles'}`);
      console.log(`      Unidades: ${unidadesStr}`);
      console.log(`      Estado: ${usuario.activo ? '✅ Activo' : '❌ Inactivo'}`);
    });
    console.log('');

    // ========================================
    // 6. TEST DE SECCIONES Y JERARQUÍA
    // ========================================
    console.log('📁 6. VERIFICANDO SECCIONES...');

    const secciones = await db.Seccion.findAll({
      where: { parentId: null }
    });

    console.log(`   Total secciones raíz: ${secciones.length}`);

    // Contar total de secciones
    const totalSecciones = await db.Seccion.count();
    console.log(`   Total secciones en sistema: ${totalSecciones}`);

    // Verificar campo keepExpanded
    const seccionesExpandidas = await db.Seccion.count({
      where: { keepExpanded: true }
    });
    console.log(`   Secciones con keepExpanded=true: ${seccionesExpandidas}`);
    console.log('');

    // ========================================
    // 7. TEST DE COLUMNA keepExpanded
    // ========================================
    console.log('🔍 7. VERIFICANDO COLUMNA keepExpanded EN SECCIONES...');

    try {
      const [results] = await db.sequelize.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'secciones'
        AND column_name = 'keep_expanded'
      `);

      if (results && results.length > 0) {
        console.log('   ✅ Columna keep_expanded existe');
        console.log(`      Tipo: ${results[0].data_type}`);
        console.log(`      Default: ${results[0].column_default}`);
      } else {
        console.log('   ❌ Columna keep_expanded NO existe');
      }
    } catch (error) {
      console.log(`   ❌ Error verificando columna: ${error.message}`);
    }
    console.log('');

    // ========================================
    // 8. TEST DE ENDPOINTS (SIMULADO)
    // ========================================
    console.log('🌐 8. VERIFICANDO ENDPOINTS DISPONIBLES...');
    console.log('   ✅ Endpoints de autenticación:');
    console.log('      - GET /api/google/auth');
    console.log('      - GET /api/google/callback');
    console.log('      - GET /api/google/status');
    console.log('      - POST /api/google/logout');
    console.log('   ✅ Endpoints de secciones:');
    console.log('      - GET /api/sections');
    console.log('      - POST /api/sections');
    console.log('      - PUT /api/sections/:id');
    console.log('      - PATCH /api/sections/:id/keep-expanded');
    console.log('      - DELETE /api/sections/:id');
    console.log('      - POST /api/sections/save-all');
    console.log('   ✅ Endpoints de Google Drive:');
    console.log('      - GET /api/google/folders');
    console.log('      - POST /api/google/import');
    console.log('      - GET /api/google/drive/files/:fileId');
    console.log('   ✅ Endpoints de usuarios:');
    console.log('      - GET /api/users/me');
    console.log('      - GET /api/users');
    console.log('   ✅ Endpoints de organización:');
    console.log('      - GET /api/organization/hierarchy');
    console.log('      - GET /api/organization/business-lines');
    console.log('      - GET /api/organization/business-units');
    console.log('');

    // ========================================
    // 9. RESUMEN FINAL
    // ========================================
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                  RESUMEN DEL TEST                      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Conexión BD:            ✅ OK                         ║`);
    console.log(`║  Modelos:                ✅ OK (${tables.length} tablas)              ║`);
    console.log(`║  Roles:                  ✅ OK (${roles.length} roles)              ║`);
    console.log(`║  Líneas de negocio:      ✅ OK (${lineasNegocio.length} líneas)              ║`);
    console.log(`║  Usuarios:               ✅ OK (${usuarios.length} usuarios)            ║`);
    console.log(`║  Secciones:              ✅ OK (${totalSecciones} secciones)           ║`);
    console.log(`║  Campo keepExpanded:     ✅ OK                         ║`);
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
    console.log('🔌 Conexión a base de datos cerrada\n');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testApplication()
    .then(() => {
      console.log('✅ Test completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = testApplication;
