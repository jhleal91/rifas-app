const { query } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runRatingsMigration() {
  try {
    console.log('🔄 Ejecutando migración de calificaciones...\n');

    // Leer el archivo SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_ratings_table.sql'),
      'utf8'
    );

    // Ejecutar la migración
    await query(migrationSQL);
    
    console.log('✅ Migración de calificaciones completada exitosamente!');
    console.log('📊 Tablas y vistas creadas:');
    console.log('   - calificaciones');
    console.log('   - estadisticas_calificaciones_rifas (vista)');
    console.log('   - estadisticas_calificaciones_creadores (vista)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    console.error('📊 Detalles:', error);
    process.exit(1);
  }
}

runRatingsMigration();

