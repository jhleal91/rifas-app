// Helpers para tests
const jwt = require('jsonwebtoken');

/**
 * Generar token JWT para testing
 */
const generateTestToken = (userId = 'test-user-id', expiresIn = '1h') => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only',
    { expiresIn }
  );
};

/**
 * Generar token de anunciante para testing
 */
const generateAdvertiserToken = (advertiserId = 'test-advertiser-id', expiresIn = '1h') => {
  return jwt.sign(
    { advertiserId },
    process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only',
    { expiresIn }
  );
};

/**
 * Crear headers de autenticación
 */
const getAuthHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Limpiar base de datos de test (usar con cuidado)
 */
const cleanTestDatabase = async (query) => {
  // Solo en entorno de test
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('cleanTestDatabase solo puede usarse en entorno de test');
  }
  
  // Aquí puedes agregar queries para limpiar datos de test
  // Por seguridad, no limpiar todo, solo datos específicos de test
};

module.exports = {
  generateTestToken,
  generateAdvertiserToken,
  getAuthHeaders,
  cleanTestDatabase
};

