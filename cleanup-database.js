#!/usr/bin/env node

/**
 * Script de Limpieza de Base de Datos
 * Elimina todas las rifas y datos relacionados
 * MANTIENE: usuarios, configuracion_sistema, logs_sistema
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rifas_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
};

// Función para confirmar la acción
function confirmAction() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n⚠️  ADVERTENCIA: Esta acción eliminará TODAS las rifas y datos relacionados.');
    console.log('📊 Se mantendrán: usuarios, configuraciones del sistema, logs de usuarios');
    console.log('🗑️  Se eliminarán: rifas, participantes, premios, elementos vendidos/reservados');
    console.log('\n¿Estás seguro de que quieres continuar? (escribe "CONFIRMAR" para proceder)');
    
    rl.question('> ', (answer) => {
      rl.close();
      resolve(answer === 'CONFIRMAR');
    });
  });
}

// Función para ejecutar la limpieza
async function cleanupDatabase() {
  const pool = new Pool(dbConfig);
  let client;

  try {
    console.log('🔌 Conectando a la base de datos...');
    client = await pool.connect();
    console.log('✅ Conexión establecida');

    // Leer el script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'cleanup-database.sql'), 'utf8');
    
    console.log('🧹 Ejecutando limpieza de base de datos...');
    
    // Ejecutar el script
    await client.query(sqlScript);
    
    console.log('✅ Limpieza completada exitosamente');
    
    // Mostrar estadísticas finales
    console.log('\n📊 ESTADÍSTICAS FINALES:');
    const result = await client.query(`
      SELECT 
        'usuarios' as tabla, 
        COUNT(*) as registros 
      FROM usuarios
      UNION ALL
      SELECT 
        'rifas' as tabla, 
        COUNT(*) as registros 
      FROM rifas
      UNION ALL
      SELECT 
        'participantes' as tabla, 
        COUNT(*) as registros 
      FROM participantes
      UNION ALL
      SELECT 
        'premios' as tabla, 
        COUNT(*) as registros 
      FROM premios
      UNION ALL
      SELECT 
        'elementos_vendidos' as tabla, 
        COUNT(*) as registros 
      FROM elementos_vendidos
      UNION ALL
      SELECT 
        'elementos_reservados' as tabla, 
        COUNT(*) as registros 
      FROM elementos_reservados
      UNION ALL
      SELECT 
        'configuracion_sistema' as tabla, 
        COUNT(*) as registros 
      FROM configuracion_sistema
      UNION ALL
      SELECT 
        'logs_sistema' as tabla, 
        COUNT(*) as registros 
      FROM logs_sistema
      ORDER BY tabla;
    `);
    
    result.rows.forEach(row => {
      console.log(`  ${row.tabla}: ${row.registros} registros`);
    });
    
    console.log('\n🎉 Base de datos limpia y lista para producción');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Función principal
async function main() {
  console.log('🚀 Script de Limpieza de Base de Datos - SorteoHub');
  console.log('================================================');
  
  // Verificar que estamos en el directorio correcto
  if (!fs.existsSync('cleanup-database.sql')) {
    console.error('❌ Error: No se encontró el archivo cleanup-database.sql');
    console.log('   Asegúrate de ejecutar este script desde el directorio raíz del proyecto');
    process.exit(1);
  }
  
  // Confirmar la acción
  const confirmed = await confirmAction();
  
  if (!confirmed) {
    console.log('❌ Operación cancelada por el usuario');
    process.exit(0);
  }
  
  // Ejecutar limpieza
  await cleanupDatabase();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { cleanupDatabase };
