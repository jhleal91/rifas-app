# Testing - SorteoHub Backend

## Configuración

Los tests están configurados con Jest y Supertest.

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Modo watch (desarrollo)
npm run test:watch

# Con coverage
npm run test:coverage
```

## Estructura

```
tests/
├── setup.js              # Configuración global de tests
├── helpers/
│   └── testHelpers.js    # Funciones helper para tests
└── routes/
    ├── auth.test.js      # Tests de autenticación
    └── rifas.test.js     # Tests de rifas
```

## Tests Críticos

### Autenticación
- ✅ Registro de usuarios
- ✅ Login
- ✅ Validación de tokens
- ✅ Protección de rutas

### Rifas
- ✅ Crear rifa
- ✅ Listar rifas
- ✅ Obtener detalles
- ✅ Validaciones

## Coverage

Objetivo mínimo: 60% en endpoints críticos

## Notas

- Los tests usan una base de datos de test separada
- Variables de entorno de test se configuran en `tests/setup.js`
- Los tests limpian datos después de ejecutarse

