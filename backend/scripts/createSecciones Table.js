const db = require("../models/db");

async function createSeccionesTable() {
  try {
    console.log("🔄 Creando tabla secciones...");

    // Sincronizar solo el modelo Seccion
    await db.Seccion.sync({ alter: true });

    console.log("✅ Tabla secciones creada/actualizada exitosamente");

    // Verificar que la tabla existe
    const tableInfo = await db.sequelize.getQueryInterface().describeTable('secciones');
    console.log("\n📋 Estructura de la tabla secciones:");
    Object.keys(tableInfo).forEach(column => {
      console.log(`   - ${column}: ${tableInfo[column].type}`);
    });

  } catch (error) {
    console.error("❌ Error al crear tabla secciones:", error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createSeccionesTable()
    .then(() => {
      console.log("\n🎉 Proceso completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Error fatal:", error);
      process.exit(1);
    });
}

module.exports = createSeccionesTable;
