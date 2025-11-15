const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const { query } = require('../../config/database');
const { generateTestToken, getAuthHeaders } = require('../helpers/testHelpers');

// Crear app de test
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  let testUserId;
  let testToken;

  beforeAll(async () => {
    // Limpiar usuarios de test anteriores
    await query("DELETE FROM usuarios WHERE email LIKE 'test_%'");
  });

  afterAll(async () => {
    // Limpiar después de tests
    if (testUserId) {
      await query('DELETE FROM usuarios WHERE id = $1', [testUserId]);
    }
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const testEmail = `test_${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User',
          email: testEmail,
          password: 'TestPassword123!',
          telefono: '1234567890'
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testEmail);
      testUserId = response.body.user.id;
      testToken = response.body.token;
    });

    it('debería rechazar registro con email duplicado', async () => {
      const testEmail = `test_${Date.now()}@example.com`;
      
      // Primer registro
      await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User 1',
          email: testEmail,
          password: 'TestPassword123!'
        })
        .expect(201);

      // Segundo registro con mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User 2',
          email: testEmail,
          password: 'TestPassword123!'
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });

    it('debería rechazar registro sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User'
          // Falta email y password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    let loginEmail;
    let loginPassword;

    beforeAll(async () => {
      // Crear usuario para login
      loginEmail = `test_login_${Date.now()}@example.com`;
      loginPassword = 'TestPassword123!';
      
      await query(
        `INSERT INTO usuarios (nombre, email, password_hash, activo)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          'Login Test User',
          loginEmail,
          require('bcryptjs').hashSync(loginPassword, 12),
          true
        ]
      );
    });

    afterAll(async () => {
      if (loginEmail) {
        await query('DELETE FROM usuarios WHERE email = $1', [loginEmail]);
      }
    });

    it('debería hacer login exitosamente con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginEmail,
          password: loginPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginEmail);
    });

    it('debería rechazar login con password incorrecto', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginEmail,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('debería rechazar login con email inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('debería retornar información del usuario autenticado', async () => {
      // Crear usuario real en la BD para obtener su ID numérico
      const userResult = await query(
        `INSERT INTO usuarios (nombre, email, password_hash, activo, rol)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Test User Me', `test_me_${Date.now()}@example.com`, 'hash', true, 'admin']
      );
      
      const realUserId = userResult.rows[0].id;
      const token = generateTestToken(realUserId);

      const response = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body).toHaveProperty('user');
      
      // Limpiar
      await query('DELETE FROM usuarios WHERE id = $1', [realUserId]);
    });

    it('debería rechazar request sin token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});

