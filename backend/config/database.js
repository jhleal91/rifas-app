const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

// Determinar qué base de datos usar según el entorno
const getDatabaseName = () => {
  // Si estamos en modo test, usar BD de test
  if (process.env.NODE_ENV === 'test') {
    return process.env.TEST_DB_NAME || 'rifas_digital_test';
  }
  // Si hay TEST_DB_NAME pero no estamos en test, usar la BD normal
  // (para evitar confusiones)
  return process.env.DB_NAME || 'rifas_digital';
};

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'navidabigailalvarezsilva',
  host: process.env.DB_HOST || 'localhost',
  database: getDatabaseName(),
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  // Configuraciones adicionales para producción
  max: 20, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // cerrar conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 2000, // timeout de conexión de 2 segundos
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    client.release();
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    process.exit(1);
  }
};

// Función para ejecutar consultas
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    throw error;
  }
};

// Función para obtener un cliente del pool
const getClient = async () => {
  return await pool.connect();
};

// Función para cerrar el pool (útil para tests)
const closePool = async () => {
  await pool.end();
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool
};
