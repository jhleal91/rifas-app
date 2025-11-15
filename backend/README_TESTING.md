# 🧪 Guía de Testing - SorteoHub

## 📋 Setup

### Instalación
```bash
npm install
```

### Configuración
1. Crear base de datos de test:
```sql
CREATE DATABASE rifas_digital_test;
```

2. Configurar variables de entorno en `config.env`:
```env
TEST_DB_NAME=rifas_digital_test
NODE_ENV=test
```

## 🚀 Ejecutar Tests

```bash
# Todos los tests
npm test

# Modo watch (desarrollo)
npm run test:watch

# Con coverage report
npm run test:coverage
```

## 📊 Coverage Actual

Ejecuta `npm run test:coverage` para ver el reporte de cobertura.

**Objetivo:** 60% mínimo en endpoints críticos

## ✅ Tests Implementados

### Autenticación (`tests/routes/auth.test.js`)
- ✅ POST /api/auth/register - Registro exitoso
- ✅ POST /api/auth/register - Rechazo de email duplicado
- ✅ POST /api/auth/register - Validación de campos requeridos
- ✅ POST /api/auth/login - Login exitoso
- ✅ POST /api/auth/login - Rechazo de password incorrecto
- ✅ POST /api/auth/login - Rechazo de email inexistente
- ✅ GET /api/auth/me - Obtener usuario autenticado
- ✅ GET /api/auth/me - Rechazo sin token

### Rifas (`tests/routes/rifas.test.js`)
- ✅ POST /api/rifas - Crear rifa exitosamente
- ✅ POST /api/rifas - Rechazo sin autenticación
- ✅ GET /api/rifas - Listar rifas públicas
- ✅ GET /api/rifas/:id - Obtener detalles de rifa
- ✅ GET /api/rifas/:id - Retornar 404 para rifa inexistente

## 🔧 Helpers

### `testHelpers.js`
- `generateTestToken(userId)` - Genera token JWT para testing
- `generateAdvertiserToken(advertiserId)` - Genera token de anunciante
- `getAuthHeaders(token)` - Crea headers de autenticación

## 📝 Escribir Nuevos Tests

```javascript
const request = require('supertest');
const { generateTestToken, getAuthHeaders } = require('../helpers/testHelpers');

describe('Mi Endpoint', () => {
  it('debería hacer algo', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set(getAuthHeaders(token))
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## ⚠️ Notas Importantes

1. **Base de Datos de Test**: Usa una BD separada para no afectar datos de desarrollo
2. **Limpieza**: Los tests limpian datos después de ejecutarse
3. **Variables de Entorno**: Se configuran automáticamente en `tests/setup.js`
4. **Timeouts**: Tests tienen timeout de 10 segundos

## 🎯 Próximos Tests a Implementar

- [ ] Tests de participantes
- [ ] Tests de anunciantes
- [ ] Tests de cupones
- [ ] Tests de middleware (auth, rate limiting)
- [ ] Tests de validación
- [ ] Tests E2E de flujos completos

