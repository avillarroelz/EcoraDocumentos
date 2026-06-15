/**
 * Crea (o reactiva) la cuenta de demostración para la revisión de App Store.
 *
 * La contraseña NO se guarda en la base de datos: vive en la variable de entorno
 * DEMO_USER_PASSWORD que valida la ruta POST /api/auth/demo. Este script solo
 * asegura que el usuario exista en la BD con rol viewer.
 *
 * Uso:
 *   cd backend
 *   DEMO_USER_EMAIL=demo@ecora.cl node scripts/createDemoUser.js
 *   (o con DEMO_USER_EMAIL ya definido en el entorno)
 */
const db = require("../models/db");

async function run() {
  const email = (process.env.DEMO_USER_EMAIL || "demo@ecora.cl").trim().toLowerCase();

  try {
    await db.sequelize.authenticate();
    console.log("Conectado a la base de datos.");

    const viewerRole = await db.Rol.findOne({ where: { nombre: "viewer" } });
    if (!viewerRole) {
      console.error("No existe el rol 'viewer'. Ejecuta primero la inicialización de roles.");
      process.exitCode = 1;
      return;
    }

    let usuario = await db.Usuario.findOne({ where: { email } });

    if (usuario) {
      await usuario.update({ estado: true });
      console.log(`Usuario demo ya existía (${email}); reactivado.`);
    } else {
      usuario = await db.Usuario.create({
        email,
        nombre: "Cuenta Demo (App Review)",
        estado: true
      });
      await usuario.addRole(viewerRole);
      console.log(`Usuario demo creado: ${email} (rol viewer).`);
    }

    // Garantizar que tenga el rol viewer aunque ya existiera
    const tieneViewer = await usuario.hasRole(viewerRole);
    if (!tieneViewer) {
      await usuario.addRole(viewerRole);
      console.log("Rol viewer asignado.");
    }

    console.log("Listo. Recuerda configurar DEMO_USER_EMAIL y DEMO_USER_PASSWORD en el backend (AWS).");
  } catch (error) {
    console.error("Error creando la cuenta demo:", error.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

run();
