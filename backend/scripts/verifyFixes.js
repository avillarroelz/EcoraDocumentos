const db = require("../models/db");

async function verifyFixes() {
  console.log('\n🔍 VERIFICANDO CORRECCIONES APLICADAS\n');

  try {
    // Verificar permisos de roles
    console.log('1️⃣ PERMISOS DE ROLES:\n');
    const roles = await db.Rol.findAll({ order: [['nombre', 'ASC']] });

    roles.forEach(rol => {
      console.log(`📌 ${rol.nombre} (${rol.nombreDescriptivo}):`);
      Object.entries(rol.permisos).forEach(([perm, value]) => {
        const symbol = value ? '✅' : '❌';
        console.log(`   ${symbol} ${perm}`);
      });
      console.log('');
    });

    // Verificar usuarios activos
    console.log('\n2️⃣ ESTADO DE USUARIOS:\n');
    const usuarios = await db.Usuario.findAll();

    usuarios.forEach(usuario => {
      const estadoSymbol = usuario.estado ? '✅ ACTIVO' : '❌ INACTIVO';
      console.log(`${estadoSymbol} | ${usuario.nombre} (${usuario.email})`);
    });

    // Verificar códigos
    console.log('\n3️⃣ CÓDIGOS DE ORGANIZACIÓN:\n');

    const lineas = await db.LineaNegocio.findAll();
    console.log('📌 Líneas de Negocio:');
    lineas.forEach(linea => {
      console.log(`   ${linea.codigo || 'SIN CÓDIGO'} - ${linea.nombre}`);
    });

    const unidades = await db.UnidadNegocio.findAll();
    console.log('\n📌 Unidades de Negocio:');
    unidades.forEach(unidad => {
      console.log(`   ${unidad.codigo || 'SIN CÓDIGO'} - ${unidad.nombre}`);
    });

    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

if (require.main === module) {
  verifyFixes().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = verifyFixes;
