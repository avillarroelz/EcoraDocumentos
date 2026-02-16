const db = require('../models/db');

async function assignAdminRole() {
  try {
    console.log('🔄 Conectando a PostgreSQL...');
    await db.sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    // Buscar el usuario avillarroel@ecora.cl
    const email = 'avillarroel@ecora.cl';
    console.log(`\n🔍 Buscando usuario: ${email}`);

    let usuario = await db.Usuario.findOne({
      where: { email },
      include: [
        {
          model: db.Rol,
          as: 'roles'
        },
        {
          model: db.UnidadNegocio,
          as: 'unidadesNegocio',
          include: [{
            model: db.LineaNegocio,
            as: 'lineaNegocio'
          }]
        }
      ]
    });

    if (!usuario) {
      console.log('⚠️  Usuario no encontrado. Creando usuario...');

      // Crear usuario
      usuario = await db.Usuario.create({
        email,
        nombre: 'Administrador Ecora',
        estado: true,
        ultimoLogin: new Date()
      });

      console.log('✅ Usuario creado');
    } else {
      console.log('✅ Usuario encontrado:', {
        nombre: usuario.nombre,
        email: usuario.email,
        estado: usuario.estado,
        rolesActuales: usuario.roles.map(r => r.nombre)
      });
    }

    // Buscar el rol super_admin
    console.log('\n🔍 Buscando rol super_admin...');
    const superAdminRole = await db.Rol.findOne({
      where: { nombre: 'super_admin' }
    });

    if (!superAdminRole) {
      console.log('❌ Rol super_admin no encontrado. Ejecuta npm run db:init primero.');
      process.exit(1);
    }

    console.log('✅ Rol super_admin encontrado');

    // Verificar si ya tiene el rol
    const tieneRol = await db.UsuarioRol.findOne({
      where: {
        usuarioId: usuario.id,
        rolId: superAdminRole.id
      }
    });

    if (tieneRol) {
      console.log('\n✅ El usuario ya tiene el rol super_admin asignado');
    } else {
      // Asignar el rol super_admin
      console.log('\n🔐 Asignando rol super_admin...');
      await usuario.addRole(superAdminRole);
      console.log('✅ Rol super_admin asignado correctamente');
    }

    // Asignar todas las unidades de negocio (opcional, para que pueda gestionar todo)
    console.log('\n📊 Verificando unidades de negocio asignadas...');
    const todasLasUnidades = await db.UnidadNegocio.findAll();

    for (const unidad of todasLasUnidades) {
      const tieneUnidad = await db.UsuarioUnidadNegocio.findOne({
        where: {
          usuarioId: usuario.id,
          unidadNegocioId: unidad.id
        }
      });

      if (!tieneUnidad) {
        await db.UsuarioUnidadNegocio.create({
          usuarioId: usuario.id,
          unidadNegocioId: unidad.id
        });
        console.log(`  ✅ Asignada unidad: ${unidad.nombre}`);
      } else {
        console.log(`  ⏭️  Ya tiene unidad: ${unidad.nombre}`);
      }
    }

    // Verificar permisos finales
    console.log('\n📋 Verificando permisos finales...');
    const usuarioFinal = await db.Usuario.findOne({
      where: { email },
      include: [
        {
          model: db.Rol,
          as: 'roles'
        },
        {
          model: db.UnidadNegocio,
          as: 'unidadesNegocio',
          include: [{
            model: db.LineaNegocio,
            as: 'lineaNegocio'
          }]
        }
      ]
    });

    console.log('\n✅ CONFIGURACIÓN COMPLETADA:');
    console.log('═══════════════════════════════════════════════');
    console.log('Usuario:', usuarioFinal.nombre);
    console.log('Email:', usuarioFinal.email);
    console.log('Estado:', usuarioFinal.estado ? 'Activo' : 'Inactivo');
    console.log('\nRoles asignados:');
    usuarioFinal.roles.forEach(rol => {
      console.log(`  - ${rol.nombreDescriptivo} (${rol.nombre})`);
      console.log('    Permisos:', JSON.stringify(rol.permisos, null, 2));
    });
    console.log('\nUnidades de negocio asignadas:');
    usuarioFinal.unidadesNegocio.forEach(unidad => {
      console.log(`  - ${unidad.nombre} (${unidad.lineaNegocio.nombre})`);
    });
    console.log('═══════════════════════════════════════════════');

    console.log('\n🎉 El usuario avillarroel@ecora.cl ahora es SUPER ADMINISTRADOR');
    console.log('   Puede iniciar sesión y gestionar:');
    console.log('   ✅ Usuarios del sistema');
    console.log('   ✅ Roles y permisos');
    console.log('   ✅ Líneas de negocio');
    console.log('   ✅ Unidades de negocio');
    console.log('   ✅ Toda la organización\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

assignAdminRole();
