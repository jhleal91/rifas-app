#!/usr/bin/env node

/**
 * Script para configurar la base de datos de test
 * Uso: node scripts/setup-test-db.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Conectarse a postgres para crear la BD
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

const TEST_DB_NAME = process.env.TEST_DB_NAME || 'rifas_digital_test';

async function setupTestDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando si existe la base de datos de test...');
    
    // Verificar si la BD existe
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [TEST_DB_NAME]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`✅ La base de datos "${TEST_DB_NAME}" ya existe.`);
      console.log('💡 Si quieres recrearla, elimínala primero con:');
      console.log(`   DROP DATABASE ${TEST_DB_NAME};`);
      return;
    }
    
    // Crear la base de datos
    console.log(`📦 Creando base de datos "${TEST_DB_NAME}"...`);
    await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    
    console.log(`✅ Base de datos "${TEST_DB_NAME}" creada exitosamente.`);
    console.log('\n📝 Próximos pasos:');
    console.log('1. Copiar el esquema de la BD de desarrollo a la BD de test:');
    console.log(`   pg_dump -U ${process.env.DB_USER || 'postgres'} -d rifas_digital --schema-only | psql -U ${process.env.DB_USER || 'postgres'} -d ${TEST_DB_NAME}`);
    console.log('\n   O ejecutar las migraciones manualmente en orden:');
    console.log('   - create_usuarios_participantes.sql');
    console.log('   - create_creator_plans.sql');
    console.log('   - create_anunciantes.sql');
    console.log('   - create_anuncios.sql');
    console.log('   - create_cupones.sql');
    console.log('   - (y las demás migraciones en orden)');
    console.log('\n2. Ejecutar tests:');
    console.log('   npm test');
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`✅ La base de datos "${TEST_DB_NAME}" ya existe.`);
    } else {
      console.error('❌ Error configurando base de datos de test:', error.message);
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestDatabase();

