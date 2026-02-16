const db = require("../models/db");

async function recreateSeccionesTable() {
  try {
    console.log("🔄 Eliminando y recreando tabla secciones...");

    // Eliminar la tabla si existe
    await db.Seccion.drop();
    console.log("✅ Tabla secciones eliminada");

    // Recrear la tabla con el esquema correcto
    await db.Seccion.sync({ force: true });
    console.log("✅ Tabla secciones recreada");

    // Verificar que la tabla existe
    const tableInfo = await db.sequelize.getQueryInterface().describeTable('secciones');
    console.log("\n📋 Estructura de la tabla secciones:");
    Object.keys(tableInfo).forEach(column => {
      console.log(`   - ${column}: ${tableInfo[column].type}`);
    });

  } catch (error) {
    console.error("❌ Error al recrear tabla secciones:", error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  recreateSeccionesTable()
    .then(() => {
      console.log("\n🎉 Proceso completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Error fatal:", error);
      process.exit(1);
    });
}

module.exports = recreateSeccionesTable;
