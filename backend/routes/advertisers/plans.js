const express = require('express');
const { query } = require('../../config/database');
const { sanitizeInput } = require('../../middleware/validation');
const { authenticateAdvertiser } = require('../../middleware/advertiserAuth');

const router = express.Router();

// GET plan actual
router.get('/plan', authenticateAdvertiser, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM ad_plans WHERE anunciante_id = $1 AND activo = true ORDER BY fecha_contratacion DESC LIMIT 1',
      [req.advertiser.id]
    );
    res.json({ plan: result.rows[0] || null });
  } catch (e) {
    console.error('Error obteniendo plan:', e);
    res.status(500).json({ error: 'Error obteniendo plan' });
  }
});

// POST contratar plan
router.post('/plan/contract', authenticateAdvertiser, sanitizeInput, async (req, res) => {
  try {
    const { planType } = req.body;
    
    const plansConfig = {
      basico: { precio: 1500, ubicaciones: 1, impresiones: 10000 },
      profesional: { precio: 3500, ubicaciones: 3, impresiones: 50000 },
      enterprise: { precio: 7500, ubicaciones: 999, impresiones: null }
    };

    const plan = plansConfig[planType];
    if (!plan) return res.status(400).json({ error: 'Tipo de plan inválido' });

    // Desactivar planes anteriores
    await query(
      'UPDATE ad_plans SET activo = false WHERE anunciante_id = $1',
      [req.advertiser.id]
    );

    // Crear nuevo plan
    const result = await query(
      `INSERT INTO ad_plans (anunciante_id, plan_type, precio_mensual, ubicaciones_incluidas, impresiones_maximas)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.advertiser.id, planType, plan.precio, plan.ubicaciones, plan.impresiones]
    );

    res.status(201).json({ plan: result.rows[0] });
  } catch (e) {
    console.error('Error contratando plan:', e);
    res.status(500).json({ error: 'Error contratando plan' });
  }
});

module.exports = router;

