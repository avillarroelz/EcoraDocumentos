/**
 * Migración: agregar columna apple_id a la tabla usuarios (Sign in with Apple).
 *
 * Uso:
 *   cd backend && node scripts/addAppleIdColumn.js
 *
 * Es idempotente: si la columna ya existe, no hace nada.
 */
const db = require("../models/db");

async function run() {
  const qi = db.sequelize.getQueryInterface();
  try {
    await db.sequelize.authenticate();
    console.log("Conectado a la base de datos.");

    const table = await qi.describeTable("usuarios");
    if (table.apple_id) {
      console.log("La columna apple_id ya existe. Nada que hacer.");
    } else {
      await qi.addColumn("usuarios", "apple_id", {
        type: db.Sequelize.STRING,
        allowNull: true,
        unique: true
      });
      console.log("Columna apple_id agregada correctamente.");
    }
  } catch (error) {
    console.error("Error en la migración:", error.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

run();
