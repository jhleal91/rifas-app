#!/usr/bin/env node

/**
 * Script para limpiar todas las rifas y datos relacionados
 * MANTIENE: usuarios, catálogos, anunciantes, cupones, planes
 */

const fs = require('fs');
const path = require('path');
const { query, pool } = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanRifasData() {
  console.log('\n⚠️  ADVERTENCIA: Este script eliminará TODAS las rifas, anunciantes, anuncios y cupones.');
  console.log('📋 Se eliminará:');
  console.log('   - Todas las rifas y datos relacionados');
  console.log('   - Todos los anunciantes');
  console.log('   - Todos los anuncios y sus estadísticas');
  console.log('   - Todos los cupones y sus usos');
  console.log('   - Transacciones de crédito de anunciantes');
  console.log('   - Planes de anuncios');
  console.log('\n✅ Se MANTENDRÁ:');
  console.log('   - Usuarios (tabla usuarios)');
  console.log('   - Catálogos (paises, estados)');
  console.log('   - Planes de creadores (creator_plans)');
  console.log('   - Suscripciones de usuarios (user_plan_subscriptions)');
  console.log('   - Usuarios participantes registrados\n');

  const answer = await askQuestion('¿Estás seguro de que deseas continuar? (escribe "SI" para confirmar): ');
  
  if (answer !== 'SI') {
    console.log('❌ Operación cancelada.');
    rl.close();
    process.exit(0);
  }

  try {
    console.log('\n🔄 Iniciando limpieza...\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../migrations/clean_rifas_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Separar las sentencias SQL (excluyendo la parte de verificación)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.includes('SELECT') && !s.includes('UNION ALL'))
      .filter(s => s.length > 0);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      console.log('📝 Ejecutando limpieza...\n');

      for (const statement of statements) {
        if (statement.includes('BEGIN') || statement.includes('COMMIT')) {
          continue; // Ya manejamos BEGIN/COMMIT manualmente
        }
        
        if (statement.includes('SET session_replication_role')) {
          await client.query(statement);
          continue;
        }

        if (statement.startsWith('DELETE')) {
          const tableName = statement.match(/FROM (\w+)/i)?.[1];
          if (tableName) {
            try {
              const result = await client.query(statement);
              console.log(`   ✅ ${tableName}: ${result.rowCount} registros eliminados`);
            } catch (err) {
              // Si la tabla no existe, continuar
              if (err.message.includes('does not exist')) {
                console.log(`   ⚠️  ${tableName}: tabla no existe, omitiendo`);
              } else {
                throw err;
              }
            }
          }
        } else if (statement.trim().length > 0 && !statement.includes('SELECT')) {
          try {
            await client.query(statement);
          } catch (err) {
            // Ignorar errores de tablas que no existen
            if (!err.message.includes('does not exist')) {
              throw err;
            }
          }
        }
      }

      await client.query('COMMIT');
      console.log('\n✅ Limpieza completada exitosamente!\n');

      // Verificación
      console.log('📊 Verificando resultados...\n');
      const verification = await client.query(`
        SELECT 
            'rifas' as tabla, COUNT(*)::int as registros FROM rifas
        UNION ALL
        SELECT 'premios', COUNT(*)::int FROM premios
        UNION ALL
        SELECT 'fotos_premios', COUNT(*)::int FROM fotos_premios
        UNION ALL
        SELECT 'formas_pago', COUNT(*)::int FROM formas_pago
        UNION ALL
        SELECT 'participantes', COUNT(*)::int FROM participantes
        UNION ALL
        SELECT 'elementos_vendidos', COUNT(*)::int FROM elementos_vendidos
        UNION ALL
        SELECT 'elementos_reservados', COUNT(*)::int FROM elementos_reservados
        UNION ALL
        SELECT 'calificaciones (con rifa_id)', COUNT(*)::int FROM calificaciones WHERE rifa_id IS NOT NULL
        UNION ALL
        SELECT 'rifa_notifications', COUNT(*)::int FROM rifa_notifications
        UNION ALL
        SELECT 'anunciantes', COUNT(*)::int FROM anunciantes
        UNION ALL
        SELECT 'anuncios', COUNT(*)::int FROM anuncios
        UNION ALL
        SELECT 'ad_impressions', COUNT(*)::int FROM ad_impressions
        UNION ALL
        SELECT 'ad_clicks', COUNT(*)::int FROM ad_clicks
        UNION ALL
        SELECT 'advertiser_credit_transactions', COUNT(*)::int FROM advertiser_credit_transactions
        UNION ALL
        SELECT 'ad_plans', COUNT(*)::int FROM ad_plans
        UNION ALL
        SELECT 'cupones', COUNT(*)::int FROM cupones
        UNION ALL
        SELECT 'cupon_usos', COUNT(*)::int FROM cupon_usos
        UNION ALL
        SELECT 'usuarios (MANTENIDOS)', COUNT(*)::int FROM usuarios
        UNION ALL
        SELECT 'paises (MANTENIDOS)', COUNT(*)::int FROM paises
        UNION ALL
        SELECT 'estados (MANTENIDOS)', COUNT(*)::int FROM estados
        UNION ALL
        SELECT 'creator_plans (MANTENIDOS)', COUNT(*)::int FROM creator_plans
        UNION ALL
        SELECT 'user_plan_subscriptions (MANTENIDOS)', COUNT(*)::int FROM user_plan_subscriptions
        UNION ALL
        SELECT 'usuarios_participantes (MANTENIDOS)', COUNT(*)::int FROM usuarios_participantes
        ORDER BY tabla
      `);

      console.table(verification.rows);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Ejecutar
cleanRifasData()
  .then(() => {
    console.log('\n✨ Proceso completado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

