/**
 * Asigna un rol a un usuario por email (lo crea si no existe) y le da acceso
 * a todas las unidades de negocio.
 *
 * Uso: node scripts/grantRole.js <email> <rol>
 * Roles válidos: super_admin, admin, manager, user, viewer
 */
const db = require('../models/db');

async function grantRole() {
  const [email, rolNombre] = process.argv.slice(2);

  if (!email || !rolNombre) {
    console.error('Uso: node scripts/grantRole.js <email> <rol>');
    console.error('Roles: super_admin, admin, manager, user, viewer');
    process.exit(1);
  }

  try {
    console.log('🔄 Conectando a PostgreSQL...');
    await db.sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    const rol = await db.Rol.findOne({ where: { nombre: rolNombre } });
    if (!rol) {
      console.error(`❌ Rol "${rolNombre}" no encontrado`);
      process.exit(1);
    }

    let usuario = await db.Usuario.findOne({
      where: { email },
      include: [{ model: db.Rol, as: 'roles' }]
    });

    if (!usuario) {
      console.log(`⚠️  Usuario ${email} no existe. Creándolo...`);
      usuario = await db.Usuario.create({
        email,
        nombre: email.split('@')[0],
        estado: true
      });
      console.log('✅ Usuario creado (el nombre se actualizará en su primer login con Google)');
    } else {
      console.log(`✅ Usuario encontrado: ${usuario.nombre} (roles: ${usuario.roles.map(r => r.nombre).join(', ') || 'ninguno'})`);
    }

    const tieneRol = await db.UsuarioRol.findOne({
      where: { usuarioId: usuario.id, rolId: rol.id }
    });

    if (tieneRol) {
      console.log(`✅ Ya tenía el rol ${rolNombre}`);
    } else {
      await usuario.addRole(rol);
      console.log(`🔐 Rol ${rolNombre} asignado`);
    }

    const unidades = await db.UnidadNegocio.findAll();
    for (const unidad of unidades) {
      const tiene = await db.UsuarioUnidadNegocio.findOne({
        where: { usuarioId: usuario.id, unidadNegocioId: unidad.id }
      });
      if (!tiene) {
        await db.UsuarioUnidadNegocio.create({ usuarioId: usuario.id, unidadNegocioId: unidad.id });
        console.log(`  ✅ Unidad asignada: ${unidad.nombre}`);
      }
    }

    const final = await db.Usuario.findOne({
      where: { email },
      include: [
        { model: db.Rol, as: 'roles' },
        { model: db.UnidadNegocio, as: 'unidadesNegocio' }
      ]
    });

    console.log('\n═══════════════════════════════════');
    console.log(`Usuario: ${final.nombre} <${final.email}>`);
    console.log(`Estado: ${final.estado ? 'Activo' : 'Inactivo'}`);
    console.log(`Roles: ${final.roles.map(r => `${r.nombreDescriptivo} (${r.nombre})`).join(', ')}`);
    console.log(`Unidades: ${final.unidadesNegocio.map(u => u.nombre).join(', ')}`);
    console.log('═══════════════════════════════════');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

grantRole();
