const express = require('express');
const { query } = require('../../config/database');
const { sanitizeInput } = require('../../middleware/validation');
const { authenticateAdvertiser } = require('../../middleware/advertiserAuth');

const router = express.Router();

// Función para validar URL de imagen
const isValidImageUrl = (url) => {
  if (!url) return true; // URL opcional, si está vacía es válida
  // Rechazar URLs de redirección
  if (url.includes('google.com/url?') || url.includes('images.google.com') || 
      url.includes('shutterstock.com/search') || url.includes('redirect')) {
    return false;
  }
  // Debe ser una URL válida
  try {
    const urlObj = new URL(url);
    return (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') &&
           (urlObj.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || url.includes('cdn') || url.includes('img'));
  } catch {
    return false;
  }
};

// GET mis anuncios con estadísticas
router.get('/ads', authenticateAdvertiser, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM anuncios WHERE anunciante_id = $1 ORDER BY created_at DESC',
      [req.advertiser.id]
    );

    // Obtener estadísticas por anuncio (modelo híbrido)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const adsWithStats = await Promise.all(
      result.rows.map(async (ad) => {
        const modelo = ad.modelo_facturacion || 'HYBRID';
        const costoPorMil = parseFloat(ad.costo_por_mil || 2.00);
        const costoPorClick = parseFloat(ad.costo_por_click || 0.50);
        
        const [impressionsRes, clicksRes, impressionsMesRes, clicksMesRes] = await Promise.all([
          query('SELECT COUNT(*) as total FROM ad_impressions WHERE anuncio_id = $1', [ad.id]),
          query('SELECT COUNT(*) as total FROM ad_clicks WHERE anuncio_id = $1', [ad.id]),
          query('SELECT COUNT(*) as total FROM ad_impressions WHERE anuncio_id = $1 AND created_at >= $2', [ad.id, inicioMes]),
          query('SELECT COUNT(*) as total FROM ad_clicks WHERE anuncio_id = $1 AND created_at >= $2', [ad.id, inicioMes])
        ]);

        const impressions = parseInt(impressionsRes.rows[0]?.total || '0', 10) || 0;
        const clicks = parseInt(clicksRes.rows[0]?.total || '0', 10) || 0;
        const impressionsMes = parseInt(impressionsMesRes.rows[0]?.total || '0', 10) || 0;
        const clicksMes = parseInt(clicksMesRes.rows[0]?.total || '0', 10) || 0;
        
        // Calcular gasto según el modelo
        let gastoMensual = 0;
        if (modelo === 'CPM') {
          gastoMensual = (impressionsMes / 1000) * costoPorMil;
        } else if (modelo === 'CPC') {
          gastoMensual = clicksMes * costoPorClick;
        } else {
          // HYBRID
          gastoMensual = ((impressionsMes / 1000) * costoPorMil) + (clicksMes * costoPorClick);
        }
        
        const presupuesto = parseFloat(ad.presupuesto_mensual || 0);

        return {
          ...ad,
          stats: {
            impressions: impressions,
            clicks: clicks,
            ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00',
            gasto: {
              mensual: gastoMensual,
              presupuesto: presupuesto,
              disponible: presupuesto > 0 ? presupuesto - gastoMensual : null,
              porcentajeUsado: presupuesto > 0 ? ((gastoMensual / presupuesto) * 100).toFixed(2) : '0.00',
              cercaDelLimite: presupuesto > 0 && (gastoMensual / presupuesto) >= 0.8 // Alerta si usó 80% o más
            },
            modelo: modelo,
            costoPorMil: costoPorMil,
            costoPorClick: costoPorClick
          }
        };
      })
    );

    res.json({ ads: adsWithStats });
  } catch (e) {
    console.error('Error listando anuncios:', e);
    res.status(500).json({ error: 'Error listando anuncios' });
  }
});

// POST crear anuncio
router.post('/ads', authenticateAdvertiser, sanitizeInput, async (req, res) => {
  try {
    const {
      titulo, descripcion_corta, url_destino, imagen_url, categoria,
      ubicacion_display, pais, estado, ciudades, presupuesto_mensual,
      modelo_facturacion, costo_por_mil, costo_por_click,
      fecha_inicio, fecha_fin
    } = req.body;

    // Validar ubicaciones (puede ser array o string para compatibilidad)
    let ubicacionesArray = [];
    if (Array.isArray(ubicacion_display)) {
      ubicacionesArray = ubicacion_display;
    } else if (typeof ubicacion_display === 'string') {
      ubicacionesArray = [ubicacion_display];
    }

    if (!titulo || !url_destino || ubicacionesArray.length === 0) {
      return res.status(400).json({ error: 'Título, URL y al menos una ubicación son requeridos' });
    }

    // Validar URL de imagen
    if (imagen_url && !isValidImageUrl(imagen_url)) {
      return res.status(400).json({ 
        error: 'URL de imagen inválida. Debe ser una URL directa a una imagen (no URLs de redirección)' 
      });
    }

    // Validar y normalizar modelo de facturación
    const modelo = (modelo_facturacion || 'HYBRID').toUpperCase();
    
    // Validar que el modelo sea válido
    if (!['CPM', 'CPC', 'HYBRID'].includes(modelo)) {
      return res.status(400).json({ error: 'Modelo de facturación inválido. Debe ser: CPM, CPC o HYBRID' });
    }
    
    // Validar que el presupuesto mensual no exceda los créditos disponibles
    const presupuestoMensual = parseFloat(presupuesto_mensual || 0);
    if (presupuestoMensual > 0) {
      const creditoResult = await query(
        'SELECT credito_actual FROM anunciantes WHERE id = $1',
        [req.advertiser.id]
      );
      
      if (creditoResult.rows.length > 0) {
        const creditoActual = parseFloat(creditoResult.rows[0].credito_actual || 0);
        if (presupuestoMensual > creditoActual) {
          return res.status(400).json({ 
            error: `El límite de presupuesto mensual ($${presupuestoMensual.toFixed(2)}) no puede ser mayor a tus créditos disponibles ($${creditoActual.toFixed(2)}). Por favor, reduce el límite o carga más créditos.` 
          });
        }
      }
    }
    
    // PRECIOS FIJOS DEFINIDOS POR LA PLATAFORMA
    // Estos precios pueden ser configurados desde el panel de administración en el futuro
    const PRECIOS_FIJOS = {
      CPM: 2.00,  // $2.00 USD por cada 1,000 impresiones
      CPC: 0.50   // $0.50 USD por cada click
    };
    
    const costoMil = PRECIOS_FIJOS.CPM;
    const costoClic = PRECIOS_FIJOS.CPC;

    const result = await query(
      `INSERT INTO anuncios (
        anunciante_id, titulo, descripcion_corta, url_destino, imagen_url, categoria,
        ubicacion_display, pais, estado, ciudades, presupuesto_mensual, 
        modelo_facturacion, costo_por_mil, costo_por_click,
        fecha_inicio, fecha_fin
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        req.advertiser.id, titulo, descripcion_corta || null, url_destino, imagen_url || null, categoria || null,
        JSON.stringify(ubicacionesArray), pais || null, estado || null, JSON.stringify(ciudades || []), presupuesto_mensual || 0,
        modelo, costoMil, costoClic,
        fecha_inicio || null, fecha_fin || null
      ]
    );

    res.status(201).json({ ad: result.rows[0] });
  } catch (e) {
    console.error('Error creando anuncio:', e);
    res.status(500).json({ error: 'Error creando anuncio' });
  }
});

// PUT actualizar anuncio
router.put('/ads/:id', authenticateAdvertiser, sanitizeInput, async (req, res) => {
  try {
    const adId = req.params.id;
    const {
      titulo, descripcion_corta, url_destino, imagen_url, categoria,
      ubicacion_display, pais, estado, ciudades, presupuesto_mensual,
      modelo_facturacion, costo_por_mil, costo_por_click,
      activo, fecha_inicio, fecha_fin
    } = req.body;

    // Validar URL de imagen
    if (imagen_url && !isValidImageUrl(imagen_url)) {
      return res.status(400).json({ 
        error: 'URL de imagen inválida. Debe ser una URL directa a una imagen (no URLs de redirección)' 
      });
    }

    // Manejar ubicaciones (puede ser array o string para compatibilidad)
    let ubicacionesArray = null;
    if (ubicacion_display !== undefined && ubicacion_display !== null) {
      if (Array.isArray(ubicacion_display)) {
        ubicacionesArray = ubicacion_display.length > 0 ? JSON.stringify(ubicacion_display) : null;
      } else if (typeof ubicacion_display === 'string') {
        ubicacionesArray = JSON.stringify([ubicacion_display]);
      }
    }

    // Validar y normalizar modelo de facturación si se proporciona
    let modelo = null;
    
    if (modelo_facturacion !== undefined) {
      modelo = (modelo_facturacion || 'HYBRID').toUpperCase();
      if (!['CPM', 'CPC', 'HYBRID'].includes(modelo)) {
        return res.status(400).json({ error: 'Modelo de facturación inválido. Debe ser: CPM, CPC o HYBRID' });
      }
    }
    
    // Validar presupuesto mensual si se proporciona
    if (presupuesto_mensual !== undefined && presupuesto_mensual !== null) {
      const presupuestoMensual = parseFloat(presupuesto_mensual);
      if (presupuestoMensual > 0) {
        const creditoResult = await query(
          'SELECT credito_actual FROM anunciantes WHERE id = $1',
          [req.advertiser.id]
        );
        
        if (creditoResult.rows.length > 0) {
          const creditoActual = parseFloat(creditoResult.rows[0].credito_actual || 0);
          if (presupuestoMensual > creditoActual) {
            return res.status(400).json({ 
              error: `El límite de presupuesto mensual ($${presupuestoMensual.toFixed(2)}) no puede ser mayor a tus créditos disponibles ($${creditoActual.toFixed(2)}). Por favor, reduce el límite o carga más créditos.` 
            });
          }
        }
      }
    }
    
    // PRECIOS FIJOS DEFINIDOS POR LA PLATAFORMA
    // Estos precios pueden ser configurados desde el panel de administración en el futuro
    const PRECIOS_FIJOS = {
      CPM: 2.00,  // $2.00 USD por cada 1,000 impresiones
      CPC: 0.50   // $0.50 USD por cada click
    };
    
    // Los precios se asignan automáticamente según el modelo
    const costoMil = modelo === 'CPC' ? null : PRECIOS_FIJOS.CPM;
    const costoClic = modelo === 'CPM' ? null : PRECIOS_FIJOS.CPC;

    const result = await query(
      `UPDATE anuncios SET
        titulo = COALESCE($1, titulo),
        descripcion_corta = COALESCE($2, descripcion_corta),
        url_destino = COALESCE($3, url_destino),
        imagen_url = COALESCE($4, imagen_url),
        categoria = COALESCE($5, categoria),
        ubicacion_display = COALESCE($6::jsonb, ubicacion_display),
        pais = COALESCE($7, pais),
        estado = COALESCE($8, estado),
        ciudades = COALESCE($9::jsonb, ciudades),
        presupuesto_mensual = COALESCE($10, presupuesto_mensual),
        modelo_facturacion = COALESCE($11, modelo_facturacion),
        costo_por_mil = COALESCE($12, costo_por_mil),
        costo_por_click = COALESCE($13, costo_por_click),
        activo = COALESCE($14, activo),
        fecha_inicio = COALESCE($15, fecha_inicio),
        fecha_fin = COALESCE($16, fecha_fin)
      WHERE id = $17 AND anunciante_id = $18
      RETURNING *`,
      [
        titulo || null, descripcion_corta || null, url_destino || null, imagen_url || null, categoria || null,
        ubicacionesArray, pais || null, estado || null, ciudades ? JSON.stringify(ciudades) : null,
        presupuesto_mensual || null, modelo, costoMil, costoClic,
        activo, fecha_inicio || null, fecha_fin || null, adId, req.advertiser.id
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Anuncio no encontrado' });
    res.json({ ad: result.rows[0] });
  } catch (e) {
    console.error('Error actualizando anuncio:', e);
    res.status(500).json({ error: 'Error actualizando anuncio' });
  }
});

// DELETE anuncio
router.delete('/ads/:id', authenticateAdvertiser, async (req, res) => {
  try {
    const adId = req.params.id;
    const result = await query('DELETE FROM anuncios WHERE id = $1 AND anunciante_id = $2 RETURNING id', [adId, req.advertiser.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anuncio no encontrado' });
    res.json({ success: true });
  } catch (e) {
    console.error('Error eliminando anuncio:', e);
    res.status(500).json({ error: 'Error eliminando anuncio' });
  }
});

// Toggle activo
router.post('/ads/:id/toggle', authenticateAdvertiser, async (req, res) => {
  try {
    const adId = req.params.id;
    const result = await query(
      'UPDATE anuncios SET activo = NOT activo WHERE id = $1 AND anunciante_id = $2 RETURNING *',
      [adId, req.advertiser.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anuncio no encontrado' });
    res.json({ ad: result.rows[0] });
  } catch (e) {
    console.error('Error alternando anuncio:', e);
    res.status(500).json({ error: 'Error alternando anuncio' });
  }
});

module.exports = router;

