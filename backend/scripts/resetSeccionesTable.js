const db = require("../models/db");

async function resetSeccionesTable() {
  try {
    console.log("🔄 Eliminando y recreando tabla secciones...");

    // Eliminar la tabla usando SQL directo
    await db.sequelize.query('DROP TABLE IF EXISTS "secciones" CASCADE;');
    console.log("✅ Tabla secciones eliminada");

    // Recrear la tabla con el esquema correcto
    await db.Seccion.sync({ force: false });
    console.log("✅ Tabla secciones recreada");

    // Verificar que la tabla existe
    const [results] = await db.sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'secciones'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 Estructura de la tabla secciones:");
    results.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
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
  resetSeccionesTable()
    .then(() => {
      console.log("\n🎉 Proceso completado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Error fatal:", error);
      process.exit(1);
    });
}

module.exports = resetSeccionesTable;
