#!/usr/bin/env node

/**
 * Script completo para configurar la base de datos de test
 * Incluye creación de BD y copia del esquema desde desarrollo
 * Uso: node scripts/setup-test-db-complete.js
 */

const { execSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

const TEST_DB_NAME = process.env.TEST_DB_NAME || 'rifas_digital_test';
const DEV_DB_NAME = process.env.DB_NAME || 'rifas_digital';
const DB_USER = process.env.DB_USER || 'postgres';

async function setupTestDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando base de datos de test...');
    
    // Verificar si la BD de test existe
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [TEST_DB_NAME]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`✅ La base de datos "${TEST_DB_NAME}" ya existe.`);
      console.log('💡 Si quieres recrearla, elimínala primero:');
      console.log(`   DROP DATABASE ${TEST_DB_NAME};`);
      client.release();
      return;
    }
    
    // Verificar si existe la BD de desarrollo
    const devCheckResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DEV_DB_NAME]
    );
    
    if (devCheckResult.rows.length === 0) {
      console.log(`⚠️  La base de datos de desarrollo "${DEV_DB_NAME}" no existe.`);
      console.log('📝 Creando solo la BD de test vacía...');
      await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
      console.log(`✅ Base de datos "${TEST_DB_NAME}" creada (vacía).`);
      console.log('💡 Necesitarás ejecutar las migraciones manualmente.');
      client.release();
      return;
    }
    
    // Crear la base de datos de test
    console.log(`📦 Creando base de datos "${TEST_DB_NAME}"...`);
    await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    client.release();
    
    // Copiar esquema desde desarrollo
    console.log(`📋 Copiando esquema desde "${DEV_DB_NAME}"...`);
    try {
      const password = process.env.DB_PASSWORD ? `PGPASSWORD=${process.env.DB_PASSWORD} ` : '';
      const dumpCommand = `${password}pg_dump -U ${DB_USER} -h ${process.env.DB_HOST || 'localhost'} -d ${DEV_DB_NAME} --schema-only --no-owner --no-acl`;
      const restoreCommand = `${password}psql -U ${DB_USER} -h ${process.env.DB_HOST || 'localhost'} -d ${TEST_DB_NAME}`;
      
      execSync(`${dumpCommand} | ${restoreCommand}`, {
        stdio: 'inherit',
        shell: '/bin/bash'
      });
      
      console.log(`✅ Esquema copiado exitosamente a "${TEST_DB_NAME}".`);
      console.log('\n✅ Base de datos de test configurada correctamente!');
      console.log('\n🚀 Puedes ejecutar tests ahora:');
      console.log('   npm test');
      
    } catch (error) {
      console.log('⚠️  No se pudo copiar el esquema automáticamente.');
      console.log('💡 Copia manual del esquema:');
      console.log(`   pg_dump -U ${DB_USER} -d ${DEV_DB_NAME} --schema-only | psql -U ${DB_USER} -d ${TEST_DB_NAME}`);
    }
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`✅ La base de datos "${TEST_DB_NAME}" ya existe.`);
    } else {
      console.error('❌ Error configurando base de datos de test:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

setupTestDatabase();

