# 🧪 Guía Práctica de Testing - SorteoHub

## 📋 Índice
1. [¿Por qué una BD de Test Separada?](#por-qué-una-bd-de-test-separada)
2. [Configuración Inicial](#configuración-inicial)
3. [Ejecutar Tests](#ejecutar-tests)
4. [Escribir Nuevos Tests](#escribir-nuevos-tests)
5. [Troubleshooting](#troubleshooting)

---

## ¿Por qué una BD de Test Separada?

### Razones Principales

1. **Seguridad de Datos**
   - Evita borrar datos de producción/desarrollo por error
   - Permite pruebas destructivas sin riesgo

2. **Aislamiento**
   - Tests no afectan datos reales
   - Múltiples desarrolladores pueden correr tests simultáneamente

3. **Velocidad**
   - Base de datos más pequeña = tests más rápidos
   - Puedes truncar tablas sin preocuparte

4. **Reproducibilidad**
   - Cada test empieza con un estado conocido
   - No hay dependencias de datos previos

### Configuración Automática

El sistema detecta automáticamente el entorno de test:
- Si `NODE_ENV=test`, usa `rifas_digital_test`
- Si no, usa `rifas_digital` (desarrollo/producción)

---

## 🚀 Inicio Rápido

### 1. Configurar Base de Datos de Test

```bash
# Conectarse a PostgreSQL
psql -U tu_usuario

# Crear base de datos de test
CREATE DATABASE rifas_digital_test;

# Salir
\q
```

### 2. Configurar Variables de Entorno

Edita `backend/config.env` y agrega:

```env
TEST_DB_NAME=rifas_digital_test
NODE_ENV=test
```

### 3. Ejecutar Tests

```bash
# Ir al directorio backend
cd backend

# Ejecutar todos los tests
npm test

# Modo watch (se ejecuta automáticamente al guardar cambios)
npm run test:watch

# Con reporte de cobertura
npm run test:coverage
```

## 📝 Ejemplo Práctico: Crear un Test

### Test de Participantes

Crea el archivo `backend/tests/routes/participantes.test.js`:

```javascript
const request = require('supertest');
const express = require('express');
const participantesRoutes = require('../../routes/participantes');
const { query } = require('../../config/database');
const { generateTestToken, getAuthHeaders } = require('../helpers/testHelpers');

// Crear app de test
const app = express();
app.use(express.json());
app.use('/api/participantes', participantesRoutes);

describe('Participantes Routes', () => {
  let testUserId;
  let testRifaId;
  let testToken;

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

    // Crear rifa de test
    const rifaResult = await query(
      `INSERT INTO rifas (nombre, descripcion, precio, fecha_fin, tipo, cantidad_numeros, creador_id, activa)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      ['Test Rifa', 'Desc', 100, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'numeros', 100, testUserId, true]
    );
    testRifaId = rifaResult.rows[0].id;
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

  describe('POST /api/participantes/:rifaId', () => {
    it('debería registrar un participante exitosamente', async () => {
      const response = await request(app)
        .post(`/api/participantes/${testRifaId}`)
        .send({
          nombre: 'Test Participant',
          email: 'test@example.com',
          telefono: '1234567890',
          numerosSeleccionados: ['1', '2', '3'],
          quiereRegistro: true
        })
        .expect(201);

      expect(response.body).toHaveProperty('participante');
      expect(response.body.participante.nombre).toBe('Test Participant');
    });

    it('debería rechazar participación sin campos requeridos', async () => {
      const response = await request(app)
        .post(`/api/participantes/${testRifaId}`)
        .send({
          nombre: 'Test'
          // Falta email y números
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
```

## 🎯 Comandos Útiles

### Ejecutar un test específico

```bash
# Por nombre de archivo
npm test -- participantes.test.js

# Por patrón
npm test -- --testNamePattern="debería registrar"

# Por ruta
npm test -- tests/routes/participantes.test.js
```

### Ver coverage detallado

```bash
npm run test:coverage

# Abrir reporte HTML (si está disponible)
open coverage/lcov-report/index.html
```

### Modo debug

```bash
# Ejecutar con Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📊 Estructura de un Test

```javascript
describe('Nombre del Módulo', () => {
  // Setup antes de todos los tests
  beforeAll(async () => {
    // Preparar datos de test
  });

  // Setup antes de cada test
  beforeEach(async () => {
    // Limpiar o preparar estado
  });

  // Cleanup después de cada test
  afterEach(async () => {
    // Limpiar datos temporales
  });

  // Cleanup después de todos los tests
  afterAll(async () => {
    // Limpiar datos de test
  });

  describe('Funcionalidad específica', () => {
    it('debería hacer algo específico', async () => {
      // Arrange: Preparar datos
      const input = { ... };

      // Act: Ejecutar acción
      const result = await funcion(input);

      // Assert: Verificar resultado
      expect(result).toBe(expected);
    });
  });
});
```

## 🔧 Helpers Disponibles

### `testHelpers.js`

```javascript
// Generar token JWT
const token = generateTestToken('user-id');

// Generar token de anunciante
const advertiserToken = generateAdvertiserToken('advertiser-id');

// Crear headers de autenticación
const headers = getAuthHeaders(token);
```

## ✅ Checklist para Nuevos Tests

- [ ] Test cubre caso exitoso
- [ ] Test cubre caso de error
- [ ] Test valida campos requeridos
- [ ] Test valida autenticación/autorización
- [ ] Test limpia datos después de ejecutarse
- [ ] Test tiene nombre descriptivo
- [ ] Test está en el archivo correcto

## 🐛 Debugging Tests

### Ver logs durante tests

```javascript
// En el test
console.log('Debug info:', data);

// O usar debugger
debugger; // Pausa la ejecución
```

### Ver qué está pasando

```bash
# Ejecutar con verbose
npm test -- --verbose

# Ver solo tests que fallan
npm test -- --onlyFailures
```

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

