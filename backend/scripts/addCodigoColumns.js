const db = require("../models/db");

async function addCodigoColumns() {
  console.log('\n🔧 Agregando columnas "codigo" a tablas de organización...\n');

  try {
    const queryInterface = db.sequelize.getQueryInterface();

    // Verificar y agregar columna "codigo" a linea_negocios
    console.log('📋 Verificando tabla linea_negocios...');
    try {
      await queryInterface.addColumn('linea_negocios', 'codigo', {
        type: db.Sequelize.STRING(20),
        allowNull: true,
        unique: true
      });
      console.log('   ✅ Columna "codigo" agregada a linea_negocios');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Columna "codigo" ya existe en linea_negocios');
      } else {
        throw error;
      }
    }

    // Verificar y agregar columna "codigo" a unidad_negocios
    console.log('📋 Verificando tabla unidad_negocios...');
    try {
      await queryInterface.addColumn('unidad_negocios', 'codigo', {
        type: db.Sequelize.STRING(20),
        allowNull: true,
        unique: true
      });
      console.log('   ✅ Columna "codigo" agregada a unidad_negocios');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Columna "codigo" ya existe en unidad_negocios');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Columnas agregadas exitosamente\n');

  } catch (error) {
    console.error('\n❌ Error agregando columnas:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addCodigoColumns()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = addCodigoColumns;
