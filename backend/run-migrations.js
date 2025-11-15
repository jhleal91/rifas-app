const fs = require('fs');
const path = require('path');
const { query } = require('./config/database');

async function runMigrations() {
  try {
    console.log('🔄 Ejecutando migraciones...\n');

    // Leer y ejecutar create_anunciantes.sql
    console.log('📝 Ejecutando migración: create_anunciantes.sql');
    const anunciantesSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_anunciantes.sql'),
      'utf8'
    );
    await query(anunciantesSQL);
    console.log('✅ Tabla anunciantes creada\n');

    // Leer y ejecutar create_anuncios.sql
    console.log('📝 Ejecutando migración: create_anuncios.sql');
    const anunciosSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_anuncios.sql'),
      'utf8'
    );
    await query(anunciosSQL);
    console.log('✅ Tablas anuncios, ad_impressions y ad_clicks creadas\n');

    console.log('🎉 ¡Migraciones completadas exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  }
}

runMigrations();

