const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Middleware básico
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Rifas Digital - Test',
    version: '1.0.0'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor de prueba iniciado');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log('✅ Listo para recibir peticiones');
});
