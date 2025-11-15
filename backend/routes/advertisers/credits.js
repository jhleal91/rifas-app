const express = require('express');
const { query } = require('../../config/database');
const { sanitizeInput } = require('../../middleware/validation');
const { authenticateAdvertiser } = require('../../middleware/advertiserAuth');

const router = express.Router();

// GET /api/advertisers/credits - Obtener crédito disponible
router.get('/credits', authenticateAdvertiser, async (req, res) => {
  try {
    const result = await query(
      'SELECT credito_actual, credito_total_acumulado FROM anunciantes WHERE id = $1',
      [req.advertiser.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anunciante no encontrado' });
    }
    
    res.json({
      credito_actual: parseFloat(result.rows[0].credito_actual || 0),
      credito_total_acumulado: parseFloat(result.rows[0].credito_total_acumulado || 0)
    });
  } catch (e) {
    console.error('Error obteniendo crédito:', e);
    res.status(500).json({ error: 'Error obteniendo crédito' });
  }
});

// POST /api/advertisers/credits/load - Cargar créditos (pre-pago)
// NOTA: En producción, esto debe integrarse con un gateway de pagos (Stripe, PayPal, etc.)
router.post('/credits/load', authenticateAdvertiser, sanitizeInput, async (req, res) => {
  try {
    const { monto, referencia_pago, descripcion } = req.body;
    
    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'Monto inválido. Debe ser mayor a $0' });
    }
    
    const montoNum = parseFloat(monto);
    
    // En producción, aquí validarías el pago con el gateway de pagos
    // Por ahora, simulamos que el pago fue exitoso
    
    // Actualizar crédito del anunciante
    const result = await query(
      `UPDATE anunciantes 
       SET credito_actual = credito_actual + $1,
           credito_total_acumulado = credito_total_acumulado + $1
       WHERE id = $2
       RETURNING credito_actual, credito_total_acumulado`,
      [montoNum, req.advertiser.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anunciante no encontrado' });
    }
    
    // Registrar transacción de carga
    await query(
      `INSERT INTO advertiser_credit_transactions (anunciante_id, monto, tipo, descripcion, referencia_pago)
       VALUES ($1, $2, 'carga', $3, $4)`,
      [
        req.advertiser.id,
        montoNum,
        descripcion || `Carga de crédito de $${montoNum.toFixed(2)}`,
        referencia_pago || null
      ]
    );
    
    // Reactivar anuncios que estuvieron pausados por falta de crédito
    await query(
      `UPDATE anuncios 
       SET activo = true 
       WHERE anunciante_id = $1 
         AND activo = false 
         AND presupuesto_mensual > 0`,
      [req.advertiser.id]
    );
    
    res.json({
      success: true,
      credito_actual: parseFloat(result.rows[0].credito_actual),
      credito_total_acumulado: parseFloat(result.rows[0].credito_total_acumulado),
      message: `Crédito de $${montoNum.toFixed(2)} cargado exitosamente`
    });
  } catch (e) {
    console.error('Error cargando crédito:', e);
    res.status(500).json({ error: 'Error cargando crédito' });
  }
});

// GET /api/advertisers/credits/transactions - Historial de transacciones
router.get('/credits/transactions', authenticateAdvertiser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT id, monto, tipo, descripcion, referencia_pago, anuncio_id, created_at
       FROM advertiser_credit_transactions
       WHERE anunciante_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.advertiser.id, limit, offset]
    );
    
    const countResult = await query(
      'SELECT COUNT(*) as total FROM advertiser_credit_transactions WHERE anunciante_id = $1',
      [req.advertiser.id]
    );
    
    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10),
      page,
      limit
    });
  } catch (e) {
    console.error('Error obteniendo transacciones:', e);
    res.status(500).json({ error: 'Error obteniendo transacciones' });
  }
});

module.exports = router;

