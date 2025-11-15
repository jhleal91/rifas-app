// Setup global para tests
// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'rifas_digital_test';

// Suprimir logs durante tests (opcional)
if (process.env.SUPPRESS_LOGS === 'true') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}

// Timeout global para tests
jest.setTimeout(10000);

