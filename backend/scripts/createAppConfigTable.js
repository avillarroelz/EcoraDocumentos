/**
 * Script para crear la tabla app_config sin afectar tablas existentes.
 * Ejecutar: node scripts/createAppConfigTable.js
 */
const db = require('../models/db');

async function createTable() {
  try {
    console.log('Conectando a la base de datos...');
    await db.sequelize.authenticate();
    console.log('Conexión exitosa.');

    // Crear solo la tabla app_config si no existe
    await db.AppConfig.sync({ force: false });
    console.log('Tabla app_config creada/verificada exitosamente.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTable();
