const request = require('supertest');
const express = require('express');
const rifasRoutes = require('../../routes/rifas');
const { query } = require('../../config/database');
const { generateTestToken, getAuthHeaders } = require('../helpers/testHelpers');

// Crear app de test
const app = express();
app.use(express.json());
app.use('/api/rifas', rifasRoutes);

describe('Rifas Routes', () => {
  let testUserId;
  let testToken;
  let testRifaId;

  beforeAll(async () => {
    // Crear usuario de test
    const userResult = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, activo, rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['Test Admin', `test_admin_${Date.now()}@example.com`, 'hash', true, 'admin']
    );
    testUserId = userResult.rows[0].id;
    testToken = generateTestToken(testUserId);
  });

  afterAll(async () => {
    // Limpiar datos de test
    if (testRifaId) {
      await query('DELETE FROM rifas WHERE id = $1', [testRifaId]);
    }
    if (testUserId) {
      await query('DELETE FROM usuarios WHERE id = $1', [testUserId]);
    }
  });

  describe('POST /api/rifas', () => {
    it('debería crear una rifa exitosamente', async () => {
      const rifaData = {
        nombre: 'Test Rifa',
        descripcion: 'Descripción de test',
        precio: 100,
        fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tipo: 'numeros',
        cantidadElementos: 100,
        elementosPersonalizados: Array.from({ length: 100 }, (_, i) => i + 1),
        premios: [],
        reglas: 'Reglas de test',
        formasPago: {
          transferencia: true,
          clabe: '123456789012345678',
          banco: 'Test Bank',
          numeroCuenta: '1234567890',
          nombreTitular: 'Test User',
          telefono: '1234567890'
        },
        esPrivada: false
      };

      const response = await request(app)
        .post('/api/rifas')
        .set(getAuthHeaders(testToken))
        .send(rifaData)
        .expect(201);

      expect(response.body).toHaveProperty('rifa');
      expect(response.body.rifa.nombre).toBe(rifaData.nombre);
      testRifaId = response.body.rifa.id;
    });

    it('debería rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/rifas')
        .send({ nombre: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/rifas', () => {
    it('debería listar rifas públicas', async () => {
      const response = await request(app)
        .get('/api/rifas')
        .expect(200);

      expect(response.body).toHaveProperty('rifas');
      expect(Array.isArray(response.body.rifas)).toBe(true);
    });
  });

  describe('GET /api/rifas/:id', () => {
    it('debería obtener detalles de una rifa', async () => {
      if (!testRifaId) {
        // Crear rifa si no existe
        const result = await query(
          `INSERT INTO rifas (nombre, descripcion, precio, fecha_fin, tipo, cantidad_elementos, creador_id, activa)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          ['Test Rifa', 'Desc', 100, new Date(), 'numeros', 100, testUserId, true]
        );
        testRifaId = result.rows[0].id;
      }

      const response = await request(app)
        .get(`/api/rifas/${testRifaId}`)
        .expect(200);

      expect(response.body).toHaveProperty('rifa');
      expect(response.body.rifa.id).toBe(testRifaId);
    });

    it('debería retornar 404 para rifa inexistente', async () => {
      const response = await request(app)
        .get('/api/rifas/999999999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});

