const express = require('express');
const { query } = require('../../config/database');
const { authenticateAdvertiser } = require('../../middleware/advertiserAuth');

const router = express.Router();

// Función para extraer IP real y verificar si es privada
const extractRealIP = (ip) => {
  if (!ip) return null;
  if (ip.startsWith('::ffff:')) return ip.substring(7);
  if (ip.includes('::ffff:')) {
    const parts = ip.split('::ffff:');
    if (parts.length > 1) return parts[parts.length - 1];
  }
  return ip;
};

const isPrivateIP = (ip) => {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
      (ip.startsWith('172.') && parseInt(ip.split('.')[1] || '0') >= 16 && parseInt(ip.split('.')[1] || '0') <= 31)) return true;
  if (ip.startsWith('169.254.')) return true;
  return false;
};

// GET estadísticas básicas
router.get('/stats', authenticateAdvertiser, async (req, res) => {
  try {
    // Estadísticas generales
    const [adsResult, impressionsResult, clicksResult] = await Promise.all([
      query('SELECT COUNT(*) as total, SUM(CASE WHEN activo = true THEN 1 ELSE 0 END) as activos FROM anuncios WHERE anunciante_id = $1', [req.advertiser.id]),
      query('SELECT COUNT(*) as total FROM ad_impressions WHERE anuncio_id IN (SELECT id FROM anuncios WHERE anunciante_id = $1)', [req.advertiser.id]),
      query('SELECT COUNT(*) as total FROM ad_clicks WHERE anuncio_id IN (SELECT id FROM anuncios WHERE anunciante_id = $1)', [req.advertiser.id])
    ]);

    const adsTotal = parseInt(adsResult.rows[0]?.total || '0', 10) || 0;
    const adsActivos = parseInt(adsResult.rows[0]?.activos || '0', 10) || 0;
    const impressions = parseInt(impressionsResult.rows[0]?.total || '0', 10) || 0;
    const clicks = parseInt(clicksResult.rows[0]?.total || '0', 10) || 0;

    // Estadísticas de últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [recentImpressionsResult, recentClicksResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM ad_impressions WHERE anuncio_id IN (SELECT id FROM anuncios WHERE anunciante_id = $1) AND created_at >= $2', [req.advertiser.id, sevenDaysAgo]),
      query('SELECT COUNT(*) as total FROM ad_clicks WHERE anuncio_id IN (SELECT id FROM anuncios WHERE anunciante_id = $1) AND created_at >= $2', [req.advertiser.id, sevenDaysAgo])
    ]);

    const recentImpressions = parseInt(recentImpressionsResult.rows[0]?.total || '0', 10) || 0;
    const recentClicks = parseInt(recentClicksResult.rows[0]?.total || '0', 10) || 0;

    // Estadísticas de 7 días anteriores (8-14 días atrás)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const [previousImpressionsResult, previousClicksResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM ad_impressions WHERE anuncio_id IN (SELECT id FROM anuncios WHERE anunciante_id = $1) AND created_at >= $2 AND created_at < $3', 
        [req.advertiser.id, fourteenDaysAgo, sevenDaysAgo]),
      query('SELECT COUNT(*) as total FROM ad_clicks WHERE anuncio_id IN (SELECT id FROM anuncios WHERE anunciante_id = $1) AND created_at >= $2 AND created_at < $3', 
        [req.advertiser.id, fourteenDaysAgo, sevenDaysAgo])
    ]);

    const previousImpressions = parseInt(previousImpressionsResult.rows[0]?.total || '0', 10) || 0;
    const previousClicks = parseInt(previousClicksResult.rows[0]?.total || '0', 10) || 0;

    // Calcular cambios porcentuales
    const impressionsChange = previousImpressions > 0 
      ? ((recentImpressions - previousImpressions) / previousImpressions * 100).toFixed(1)
      : recentImpressions > 0 ? '100' : '0';
    
    const clicksChange = previousClicks > 0 
      ? ((recentClicks - previousClicks) / previousClicks * 100).toFixed(1)
      : recentClicks > 0 ? '100' : '0';

    // Calcular CTR
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';

    // Calcular gasto mensual total (modelo híbrido)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    // Obtener impresiones y clicks del mes, y configuración de cada anuncio
    const anunciosResult = await query(
      'SELECT id, modelo_facturacion, costo_por_mil, costo_por_click FROM anuncios WHERE anunciante_id = $1',
      [req.advertiser.id]
    );
    
    const [impressionsMesResult, clicksMesResult] = await Promise.all([
      query('SELECT anuncio_id, COUNT(*) as total FROM ad_impressions WHERE anuncio_id IN (SELECT id FROM anuncios WHERE anunciante_id = $1) AND created_at >= $2 GROUP BY anuncio_id', [req.advertiser.id, inicioMes]),
      query('SELECT anuncio_id, COUNT(*) as total FROM ad_clicks WHERE anuncio_id IN (SELECT id FROM anuncios WHERE anunciante_id = $1) AND created_at >= $2 GROUP BY anuncio_id', [req.advertiser.id, inicioMes])
    ]);
    
    // Crear mapas para acceso rápido
    const impressionsMap = {};
    impressionsMesResult.rows.forEach(row => {
      impressionsMap[row.anuncio_id] = parseInt(row.total || '0', 10);
    });
    
    const clicksMap = {};
    clicksMesResult.rows.forEach(row => {
      clicksMap[row.anuncio_id] = parseInt(row.total || '0', 10);
    });
    
    // Calcular gasto total sumando el gasto de cada anuncio según su modelo
    let gastoMensual = 0;
    anunciosResult.rows.forEach(ad => {
      const modelo = ad.modelo_facturacion || 'HYBRID';
      const costoPorMil = parseFloat(ad.costo_por_mil || 2.00);
      const costoPorClick = parseFloat(ad.costo_por_click || 0.50);
      const impresiones = impressionsMap[ad.id] || 0;
      const clicks = clicksMap[ad.id] || 0;
      
      if (modelo === 'CPM') {
        gastoMensual += (impresiones / 1000) * costoPorMil;
      } else if (modelo === 'CPC') {
        gastoMensual += clicks * costoPorClick;
      } else {
        // HYBRID
        gastoMensual += ((impresiones / 1000) * costoPorMil) + (clicks * costoPorClick);
      }
    });

    // Obtener presupuesto total asignado a anuncios activos
    const presupuestoResult = await query(
      'SELECT COALESCE(SUM(presupuesto_mensual), 0) as total FROM anuncios WHERE anunciante_id = $1 AND activo = true AND presupuesto_mensual > 0',
      [req.advertiser.id]
    );
    const presupuestoTotal = parseFloat(presupuestoResult.rows[0]?.total || '0', 10);

    res.json({
      ads: {
        total: adsTotal,
        activos: adsActivos
      },
      impressions: impressions,
      clicks: clicks,
      ctr: parseFloat(ctr),
      gasto: {
        mensual: gastoMensual,
        presupuestoTotal: presupuestoTotal,
        disponible: presupuestoTotal > 0 ? presupuestoTotal - gastoMensual : null,
        porcentajeUsado: presupuestoTotal > 0 ? ((gastoMensual / presupuestoTotal) * 100).toFixed(2) : 0
      },
      recent: {
        impressions: recentImpressions,
        clicks: recentClicks,
        impressionsChange: parseFloat(impressionsChange),
        clicksChange: parseFloat(clicksChange)
      },
      previous: {
        impressions: previousImpressions,
        clicks: previousClicks
      }
    });
  } catch (e) {
    console.error('Error obteniendo estadísticas:', e);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// GET /api/advertisers/ads/:adId/clicks - Detalle de clicks por anuncio con filtros
router.get('/ads/:adId/clicks', authenticateAdvertiser, async (req, res) => {
  try {
    const { adId } = req.params;
    
    // Verificar que el anuncio pertenece al anunciante
    const adCheck = await query(
      'SELECT id FROM anuncios WHERE id = $1 AND anunciante_id = $2',
      [adId, req.advertiser.id]
    );
    
    if (adCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    // Parámetros de paginación y filtros
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    // Construir query con filtros
    let whereConditions = ['anuncio_id = $1'];
    let queryParams = [adId];
    let paramIndex = 2;

    if (req.query.fechaDesde) {
      whereConditions.push(`DATE(created_at) >= $${paramIndex}`);
      queryParams.push(req.query.fechaDesde);
      paramIndex++;
    }

    if (req.query.fechaHasta) {
      whereConditions.push(`DATE(created_at) <= $${paramIndex}`);
      queryParams.push(req.query.fechaHasta);
      paramIndex++;
    }

    if (req.query.ciudad) {
      whereConditions.push(`ciudad = $${paramIndex}`);
      queryParams.push(req.query.ciudad);
      paramIndex++;
    }

    if (req.query.estado) {
      whereConditions.push(`estado = $${paramIndex}`);
      queryParams.push(req.query.estado);
      paramIndex++;
    }

    if (req.query.pais) {
      whereConditions.push(`pais = $${paramIndex}`);
      queryParams.push(req.query.pais);
      paramIndex++;
    }

    if (req.query.navegador) {
      // Filtrar por navegador basado en user_agent
      const navegador = req.query.navegador.toLowerCase();
      if (navegador === 'chrome') {
        whereConditions.push(`user_agent ILIKE $${paramIndex}`);
        queryParams.push('%Chrome%');
      } else if (navegador === 'firefox') {
        whereConditions.push(`user_agent ILIKE $${paramIndex}`);
        queryParams.push('%Firefox%');
      } else if (navegador === 'safari') {
        whereConditions.push(`user_agent ILIKE $${paramIndex} AND user_agent NOT ILIKE $${paramIndex + 1}`);
        queryParams.push('%Safari%', '%Chrome%');
        paramIndex++;
      } else if (navegador === 'edge') {
        whereConditions.push(`user_agent ILIKE $${paramIndex}`);
        queryParams.push('%Edge%');
      } else if (navegador === 'opera') {
        whereConditions.push(`user_agent ILIKE $${paramIndex}`);
        queryParams.push('%Opera%');
      }
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Query para obtener clicks
    const clicksQuery = `
      SELECT id, path, ip, user_agent, ciudad, estado, pais, pais_codigo, created_at
      FROM ad_clicks
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const clicksResult = await query(clicksQuery, queryParams);

    // Query para contar total (con mismos filtros)
    const countQuery = `SELECT COUNT(*) as total FROM ad_clicks ${whereClause}`;
    const totalResult = await query(countQuery, queryParams.slice(0, -2)); // Sin limit y offset

    const total = parseInt(totalResult.rows[0]?.total || '0', 10);

    res.json({
      clicks: clicksResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error('Error obteniendo clicks:', e);
    res.status(500).json({ error: 'Error obteniendo clicks' });
  }
});

// GET /api/advertisers/clicks/all - Obtener todos los clicks de todos los anuncios del anunciante
router.get('/clicks/all', authenticateAdvertiser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    // Construir query con filtros
    let whereConditions = ['anuncio_id IN (SELECT id FROM anuncios WHERE anunciante_id = $1)'];
    let queryParams = [req.advertiser.id];
    let paramIndex = 2;

    if (req.query.fechaDesde) {
      whereConditions.push(`DATE(created_at) >= $${paramIndex}`);
      queryParams.push(req.query.fechaDesde);
      paramIndex++;
    }

    if (req.query.fechaHasta) {
      whereConditions.push(`DATE(created_at) <= $${paramIndex}`);
      queryParams.push(req.query.fechaHasta);
      paramIndex++;
    }

    if (req.query.ciudad) {
      whereConditions.push(`ciudad = $${paramIndex}`);
      queryParams.push(req.query.ciudad);
      paramIndex++;
    }

    if (req.query.estado) {
      whereConditions.push(`estado = $${paramIndex}`);
      queryParams.push(req.query.estado);
      paramIndex++;
    }

    if (req.query.pais) {
      whereConditions.push(`pais = $${paramIndex}`);
      queryParams.push(req.query.pais);
      paramIndex++;
    }

    if (req.query.navegador) {
      // Filtrar por navegador basado en user_agent
      const navegador = req.query.navegador.toLowerCase();
      if (navegador === 'chrome') {
        whereConditions.push(`c.user_agent ILIKE $${paramIndex}`);
        queryParams.push('%Chrome%');
      } else if (navegador === 'firefox') {
        whereConditions.push(`c.user_agent ILIKE $${paramIndex}`);
        queryParams.push('%Firefox%');
      } else if (navegador === 'safari') {
        whereConditions.push(`c.user_agent ILIKE $${paramIndex} AND c.user_agent NOT ILIKE $${paramIndex + 1}`);
        queryParams.push('%Safari%', '%Chrome%');
        paramIndex++;
      } else if (navegador === 'edge') {
        whereConditions.push(`c.user_agent ILIKE $${paramIndex}`);
        queryParams.push('%Edge%');
      } else if (navegador === 'opera') {
        whereConditions.push(`c.user_agent ILIKE $${paramIndex}`);
        queryParams.push('%Opera%');
      }
      paramIndex++;
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Query para obtener clicks con info del anuncio
    const clicksQuery = `
      SELECT 
        c.id, 
        c.path, 
        c.ip, 
        c.user_agent, 
        c.ciudad, 
        c.estado, 
        c.pais, 
        c.pais_codigo, 
        c.created_at,
        a.titulo as anuncio_titulo,
        a.id as anuncio_id
      FROM ad_clicks c
      INNER JOIN anuncios a ON c.anuncio_id = a.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const clicksResult = await query(clicksQuery, queryParams);

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM ad_clicks c INNER JOIN anuncios a ON c.anuncio_id = a.id ${whereClause}`;
    const totalResult = await query(countQuery, queryParams.slice(0, -2));

    const total = parseInt(totalResult.rows[0]?.total || '0', 10);

    res.json({
      clicks: clicksResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error('Error obteniendo todos los clicks:', e);
    res.status(500).json({ error: 'Error obteniendo clicks' });
  }
});

// GET /api/advertisers/ads/:adId/clicks/update-locations - Actualizar ubicaciones de clicks existentes sin ubicación
router.get('/ads/:adId/clicks/update-locations', authenticateAdvertiser, async (req, res) => {
  try {
    const { adId } = req.params;
    
    // Verificar que el anuncio pertenece al anunciante
    const adCheck = await query(
      'SELECT id FROM anuncios WHERE id = $1 AND anunciante_id = $2',
      [adId, req.advertiser.id]
    );
    
    if (adCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    // Obtener clicks sin ubicación
    const clicksResult = await query(
      `SELECT id, ip FROM ad_clicks 
       WHERE anuncio_id = $1 AND (ciudad IS NULL OR estado IS NULL OR pais IS NULL)`,
      [adId]
    );

    let updated = 0;
    let skipped = 0;

    for (const click of clicksResult.rows) {
      const realIP = extractRealIP(click.ip);
      
      if (isPrivateIP(realIP)) {
        skipped++;
        continue;
      }

      try {
        const response = await fetch(`http://ip-api.com/json/${realIP}?fields=status,message,country,countryCode,regionName,city&lang=es`);
        const data = await response.json();
        
        if (data.status === 'success') {
          await query(
            `UPDATE ad_clicks 
             SET ciudad = $1, estado = $2, pais = $3, pais_codigo = $4 
             WHERE id = $5`,
            [
              data.city || null,
              data.regionName || null,
              data.country || null,
              data.countryCode || null,
              click.id
            ]
          );
          updated++;
        }
        
        // Esperar un poco para no exceder límite de rate (45 req/min)
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.error(`Error actualizando ubicación para click ${click.id}:`, e.message);
      }
    }

    res.json({ 
      success: true,
      updated,
      skipped,
      total: clicksResult.rows.length
    });
  } catch (e) {
    console.error('Error actualizando ubicaciones:', e);
    res.status(500).json({ error: 'Error actualizando ubicaciones' });
  }
});

module.exports = router;

