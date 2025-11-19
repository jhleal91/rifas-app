const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateRifa, validateRifaId, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// GET /api/rifas - Obtener rifas públicas
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { tipo, precio_min, precio_max, disponibles, search, resultado_publicado, categoria } = req.query;
    let whereConditions = ['r.es_privada = false'];
    let queryParams = [];
    let paramCount = 0;

    // Si se busca por resultado_publicado, incluir rifas finalizadas
    if (resultado_publicado === 'true') {
      whereConditions.push('r.resultado_publicado = true');
    } else {
      // Por defecto, solo rifas activas
      whereConditions.push('r.activa = true');
      whereConditions.push('r.fecha_fin > CURRENT_TIMESTAMP');
    }

    // Filtro por tipo
    if (tipo) {
      paramCount++;
      whereConditions.push(`r.tipo = $${paramCount}`);
      queryParams.push(tipo);
    }

    // Filtro por categoría
    if (categoria && categoria !== 'all' && categoria !== 'todas') {
      paramCount++;
      whereConditions.push(`r.categoria = $${paramCount}`);
      queryParams.push(categoria);
    }

    // Filtro por rango de precio
    if (precio_min) {
      paramCount++;
      whereConditions.push(`r.precio >= $${paramCount}`);
      queryParams.push(parseFloat(precio_min));
    }

    if (precio_max) {
      paramCount++;
      whereConditions.push(`r.precio <= $${paramCount}`);
      queryParams.push(parseFloat(precio_max));
    }

    // Filtro por disponibilidad
    if (disponibles === 'true') {
      whereConditions.push('(r.cantidad_elementos - COALESCE(ev.count, 0) - COALESCE(er.count, 0)) > 0');
    }

    // Búsqueda por nombre
    if (search) {
      paramCount++;
      whereConditions.push(`r.nombre ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await query(`
      SELECT 
        r.*,
        u.nombre as creador_nombre,
        u.email as creador_email,
        u.telefono as creador_telefono,
        COALESCE(ev.count, 0) as elementos_vendidos,
        COALESCE(er.count, 0) as elementos_reservados,
        r.cantidad_elementos - COALESCE(ev.count, 0) - COALESCE(er.count, 0) as elementos_disponibles,
        COALESCE(p.count, 0) as total_participantes,
        COALESCE(tr.total, 0) as total_recaudado,
        COALESCE(ratings_stats.total_calificaciones, 0) as total_calificaciones,
        COALESCE(ratings_stats.promedio_calificacion_rifa, 0) as promedio_calificacion_rifa,
        (SELECT COUNT(*) FROM rifas WHERE usuario_id = u.id AND deleted_at IS NULL) as total_rifas_creador,
        COALESCE((SELECT json_agg(
          json_build_object(
            'id', f.id, 
            'url', f.url_foto, 
            'url_foto', f.url_foto, 
            'descripcion', f.descripcion, 
            'orden', f.orden, 
            'premio_id', f.premio_id, 
            'premio_nombre', p.nombre, 
            'premio_posicion', p.posicion
          ) ORDER BY COALESCE(p.posicion, 999), f.orden
        )
         FROM fotos_premios f 
         LEFT JOIN premios p ON f.premio_id = p.id 
         WHERE f.rifa_id = r.id), '[]'::json) as fotos_premios
      FROM rifas r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM elementos_vendidos
        GROUP BY rifa_id
      ) ev ON r.id = ev.rifa_id
      LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM elementos_reservados
        WHERE activo = true
        GROUP BY rifa_id
      ) er ON r.id = er.rifa_id
      LEFT JOIN (
        SELECT rifa_id, COUNT(*) as count
        FROM participantes
        GROUP BY rifa_id
      ) p ON r.id = p.rifa_id
      LEFT JOIN (
        SELECT rifa_id, SUM(total_pagado) as total
        FROM participantes
        WHERE estado = 'confirmado'
        GROUP BY rifa_id
      ) tr ON r.id = tr.rifa_id
      LEFT JOIN estadisticas_calificaciones_rifas ratings_stats ON r.id = ratings_stats.rifa_id
      WHERE ${whereClause} AND r.deleted_at IS NULL
      ORDER BY r.fecha_creacion DESC
    `, queryParams).catch(err => {
      // Si las vistas no existen, continuar sin estadísticas de calificaciones
      if (err.message.includes('does not exist')) {
        console.warn('⚠️ Vistas de calificaciones no encontradas, continuando sin ellas...');
        return query(`
          SELECT 
            r.*,
            u.nombre as creador_nombre,
            u.email as creador_email,
            u.telefono as creador_telefono,
            COALESCE(ev.count, 0) as elementos_vendidos,
            COALESCE(er.count, 0) as elementos_reservados,
            r.cantidad_elementos - COALESCE(ev.count, 0) - COALESCE(er.count, 0) as elementos_disponibles,
            COALESCE(p.count, 0) as total_participantes,
            COALESCE(tr.total, 0) as total_recaudado,
            0 as total_calificaciones,
            0 as promedio_calificacion_rifa,
            (SELECT COUNT(*) FROM rifas WHERE usuario_id = u.id AND deleted_at IS NULL) as total_rifas_creador,
            (SELECT json_agg(json_build_object('id', f.id, 'url', f.url_foto, 'url_foto', f.url_foto, 'descripcion', f.descripcion, 'orden', f.orden))
             FROM fotos_premios f WHERE f.rifa_id = r.id ORDER BY f.orden) as fotos_premios
          FROM rifas r
          JOIN usuarios u ON r.usuario_id = u.id
          LEFT JOIN (
            SELECT rifa_id, COUNT(*) as count
            FROM elementos_vendidos
            GROUP BY rifa_id
          ) ev ON r.id = ev.rifa_id
          LEFT JOIN (
            SELECT rifa_id, COUNT(*) as count
            FROM elementos_reservados
            WHERE activo = true
            GROUP BY rifa_id
          ) er ON r.id = er.rifa_id
          LEFT JOIN (
            SELECT rifa_id, COUNT(*) as count
            FROM participantes
            GROUP BY rifa_id
          ) p ON r.id = p.rifa_id
          LEFT JOIN (
            SELECT rifa_id, SUM(total_pagado) as total
            FROM participantes
            WHERE estado = 'confirmado'
            GROUP BY rifa_id
          ) tr ON r.id = tr.rifa_id
          WHERE ${whereClause}
          ORDER BY r.fecha_creacion DESC
        `, queryParams);
      }
      throw err;
    });

    // Para cada rifa, obtener los números vendidos y reservados
    const rifasConNumeros = await Promise.all(result.rows.map(async (rifa) => {
      const [vendidosResult, reservadosResult] = await Promise.all([
        query('SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1', [rifa.id]),
        query('SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true', [rifa.id])
      ]);

      // Normalizar fotosPremios
      let fotosPremios = rifa.fotos_premios || [];
      
      // Debug: Log para ver qué viene del backend
      if (rifa.id === '1762310069179') {
        console.log(`🔍 Debug Rifa ${rifa.id}:`);
        console.log('  - fotos_premios raw:', rifa.fotos_premios);
        console.log('  - tipo:', typeof rifa.fotos_premios);
      }
      
      if (typeof fotosPremios === 'string') {
        try {
          fotosPremios = JSON.parse(fotosPremios);
        } catch (e) {
          console.error(`Error parsing fotos_premios for rifa ${rifa.id}:`, e);
          fotosPremios = [];
        }
      }
      
      // Si es null (cuando json_agg no encuentra resultados), convertir a array vacío
      if (fotosPremios === null) {
        fotosPremios = [];
      }
      
      if (!Array.isArray(fotosPremios)) {
        console.warn(`⚠️ fotosPremios no es array para rifa ${rifa.id}:`, fotosPremios);
        fotosPremios = [];
      }
      
      // Asegurar que cada foto tenga tanto 'url' como 'url_foto'
      fotosPremios = fotosPremios.map(foto => ({
        ...foto,
        url: foto.url || foto.url_foto || '',
        url_foto: foto.url_foto || foto.url || ''
      }));

      // Debug: Log final
      if (rifa.id === '1762310069179') {
        console.log(`  - fotosPremios procesado:`, fotosPremios);
        console.log(`  - cantidad fotos:`, fotosPremios.length);
      }

      return {
        ...rifa,
        fotosPremios: fotosPremios,
        numerosVendidos: vendidosResult.rows.map(row => String(row.elemento)),
        numerosReservados: reservadosResult.rows.map(row => String(row.elemento))
      };
    }));

    res.json({
      rifas: rifasConNumeros,
      total: rifasConNumeros.length
    });

  } catch (error) {
    console.error('Error obteniendo rifas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/rifas/my - Obtener rifas del usuario autenticado (solo no eliminadas)
router.get('/my', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM rifas_con_estadisticas 
      WHERE usuario_id = $1
      ORDER BY fecha_creacion DESC
    `, [req.user.id]);

    res.json({
      rifas: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo mis rifas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/rifas/:id/formas-pago - Actualizar formas de pago de una rifa (DEBE IR ANTES DE /:id)
router.put('/:id/formas-pago', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const formasPago = req.body;

    console.log('📦 Formas de pago recibidas:', JSON.stringify(formasPago, null, 2));

    // Verificar que la rifa existe y pertenece al usuario
    const rifaResult = await query(
      'SELECT usuario_id FROM rifas WHERE id = $1',
      [id]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    if (rifaResult.rows[0].usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permiso para modificar esta rifa',
        code: 'FORBIDDEN'
      });
    }

    // Eliminar formas de pago existentes
    await query(
      'DELETE FROM formas_pago WHERE rifa_id = $1',
      [id]
    );

    // Insertar nueva forma de pago si se proporciona
    if (formasPago && (formasPago.banco || formasPago.clabe || formasPago.numero_cuenta || formasPago.nombre_titular)) {
      const valores = [
        id,
        formasPago.tipo_pago || 'transferencia',
        formasPago.banco || null,
        formasPago.clabe || null,
        formasPago.numero_cuenta || null,
        formasPago.nombre_titular || null,
        formasPago.telefono || null,
        formasPago.whatsapp || null,
        formasPago.otros_detalles || null
      ];
      
      console.log('💾 Insertando formas de pago con valores:', valores);
      
      await query(`
        INSERT INTO formas_pago (
          rifa_id, tipo_pago, banco, clabe, numero_cuenta, nombre_titular, 
          telefono, whatsapp, otros_detalles
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, valores);
      
      console.log('✅ Formas de pago insertadas correctamente');
    } else {
      console.log('⚠️ No se insertaron formas de pago - condición no cumplida');
    }

    // Obtener las formas de pago actualizadas
    const formasPagoResult = await query(
      'SELECT * FROM formas_pago WHERE rifa_id = $1',
      [id]
    );

    res.json({
      message: 'Formas de pago actualizadas exitosamente',
      formasPago: formasPagoResult.rows
    });

  } catch (error) {
    console.error('Error actualizando formas de pago:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/rifas/:id - Obtener rifa por ID
router.get('/:id', validateRifaId, optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la rifa existe
    const rifaResult = await query(`
      SELECT 
        r.*, 
        u.nombre as creador_nombre, 
        u.email as creador_email, 
        u.telefono as creador_telefono,
        (SELECT COUNT(*) FROM rifas WHERE usuario_id = u.id AND deleted_at IS NULL) as total_rifas_creador
      FROM rifas r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = $1
    `, [id]);

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    // Verificar si la rifa está eliminada (solo el owner puede ver rifas eliminadas)
    if (rifa.deleted_at && (!req.user || req.user.id !== rifa.usuario_id)) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    // Verificar si es privada y si el usuario tiene acceso
    if (rifa.es_privada && (!req.user || req.user.id !== rifa.usuario_id)) {
      return res.status(403).json({
        error: 'Acceso denegado a rifa privada',
        code: 'PRIVATE_RIFA_ACCESS_DENIED'
      });
    }

    // Obtener premios
    const premiosResult = await query(
      'SELECT * FROM premios WHERE rifa_id = $1 ORDER BY posicion',
      [id]
    );

    // Obtener fotos de premios (compatible con estructura antigua y nueva)
    let fotosResult;
    try {
      // Intentar con la nueva estructura (con premio_id)
      fotosResult = await query(
        `SELECT f.*, p.nombre as premio_nombre, p.posicion as premio_posicion 
         FROM fotos_premios f 
         LEFT JOIN premios p ON f.premio_id = p.id 
         WHERE f.rifa_id = $1 
         ORDER BY COALESCE(p.posicion, 999), f.orden`,
        [id]
      );
    } catch (err) {
      // Si la columna premio_id no existe, usar estructura antigua
      if (err.message.includes('premio_id') || err.message.includes('does not exist')) {
        fotosResult = await query(
          `SELECT f.*, NULL as premio_nombre, NULL as premio_posicion 
           FROM fotos_premios f 
           WHERE f.rifa_id = $1 
           ORDER BY f.orden`,
          [id]
        );
      } else {
        throw err;
      }
    }

    // Obtener formas de pago
    const formasPagoResult = await query(
      'SELECT * FROM formas_pago WHERE rifa_id = $1',
      [id]
    );

    // Obtener números vendidos
    const vendidosResult = await query(
      'SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1',
      [id]
    );

    // Obtener números reservados
    const reservadosResult = await query(
      'SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true',
      [id]
    );

    // Obtener estadísticas básicas
    // Calcular total_recaudado en subconsulta separada para evitar duplicación por JOINs
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(DISTINCT elemento) FROM elementos_vendidos WHERE rifa_id = $1) as elementos_vendidos,
        (SELECT COUNT(DISTINCT elemento) FROM elementos_reservados WHERE rifa_id = $1 AND activo = true) as elementos_reservados,
        (SELECT COUNT(DISTINCT id) FROM participantes WHERE rifa_id = $1) as total_participantes,
        COALESCE((
          SELECT SUM(total_pagado) 
          FROM participantes 
          WHERE rifa_id = $1 AND estado = 'confirmado'
        ), 0) as total_recaudado
    `, [id]);

    // Obtener estadísticas de calificaciones
    let ratingsStatsResult;
    try {
      ratingsStatsResult = await query(`
        SELECT * FROM estadisticas_calificaciones_rifas WHERE rifa_id = $1
      `, [id]);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.warn('⚠️ Vista de calificaciones no encontrada, usando valores por defecto...');
        ratingsStatsResult = { rows: [] };
      } else {
        throw err;
      }
    }

    // Si el usuario es el creador de la rifa, incluir participantes
    let participantes = [];
    if (req.user && req.user.id === rifa.usuario_id) {
      const participantesResult = await query(`
        SELECT * FROM participantes_detallados 
        WHERE rifa_id = $1 
        ORDER BY fecha_participacion DESC
      `, [id]);
      participantes = participantesResult.rows;
    }

    // Obtener estadísticas de calificaciones del creador
    let creadorStatsResult;
    try {
      creadorStatsResult = await query(`
        SELECT * FROM estadisticas_calificaciones_creadores WHERE creador_id = $1
      `, [rifa.usuario_id]);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.warn('⚠️ Vista de calificaciones de creador no encontrada, usando valores por defecto...');
        creadorStatsResult = { rows: [] };
      } else {
        throw err;
      }
    }

    const ratingsStats = ratingsStatsResult.rows[0] || {
      total_calificaciones: 0,
      promedio_calificacion_rifa: null,
      calificaciones_5: 0,
      calificaciones_4: 0,
      calificaciones_3: 0,
      calificaciones_2: 0,
      calificaciones_1: 0
    };

    const creadorStats = creadorStatsResult.rows[0] || {
      total_rifas_creadas: 0,
      total_calificaciones: 0,
      promedio_calificacion_creador: null,
      calificaciones_5: 0,
      calificaciones_4: 0,
      calificaciones_3: 0,
      calificaciones_2: 0,
      calificaciones_1: 0
    };

    // Normalizar fotosPremios para incluir información del premio
    const fotosPremiosNormalizadas = fotosResult.rows.map(foto => ({
      id: foto.id,
      url: foto.url_foto,
      url_foto: foto.url_foto,
      descripcion: foto.descripcion,
      orden: foto.orden,
      premio_id: foto.premio_id,
      premio_nombre: foto.premio_nombre,
      premio_posicion: foto.premio_posicion
    }));

    res.json({
      rifa: {
        ...rifa,
        premios: premiosResult.rows,
        fotosPremios: fotosPremiosNormalizadas,
        formasPago: formasPagoResult.rows,
        estadisticas: statsResult.rows[0],
        participantes: participantes,
        numerosVendidos: vendidosResult.rows.map(row => String(row.elemento)),
        numerosReservados: reservadosResult.rows.map(row => String(row.elemento)),
        calificaciones: ratingsStats,
        creador_stats: creadorStats
      }
    });

  } catch (error) {
    console.error('Error obteniendo rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/rifas/:id/resultado - Publicar/actualizar número ganador
router.put('/:id/resultado', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { numero_ganador, resultado_publicado } = req.body;

    await query(
      'UPDATE rifas SET numero_ganador = $1, resultado_publicado = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [numero_ganador || null, resultado_publicado === true, id]
    );

    const result = await query('SELECT numero_ganador, resultado_publicado FROM rifas WHERE id = $1', [id]);
    
    // Notificar cuando se selecciona un ganador
    if (numero_ganador && resultado_publicado) {
      try {
        const { notifyWinnerSelected } = require('../services/notifications');
        const io = req.app.get('io');
        await notifyWinnerSelected(id, numero_ganador, io);
      } catch (notifError) {
        console.error('❌ Error enviando notificación de ganador:', notifError);
        // No fallar la operación por error de notificación
      }
      
      // Enviar email al ganador
      try {
        // Buscar el participante que tiene el número ganador
        const ganadorResult = await query(`
          SELECT DISTINCT p.id, p.nombre, p.email, p.rifa_id, r.nombre as rifa_nombre
          FROM participantes p
          JOIN elementos_vendidos ev ON p.id = ev.participante_id AND p.rifa_id = ev.rifa_id
          JOIN rifas r ON p.rifa_id = r.id
          WHERE ev.rifa_id = $1 AND ev.elemento = $2 AND p.estado = 'confirmado'
          LIMIT 1
        `, [id, numero_ganador]);
        
        if (ganadorResult.rows.length > 0) {
          const ganador = ganadorResult.rows[0];
          const rifaInfo = await query('SELECT nombre FROM rifas WHERE id = $1', [id]);
          
          const emailService = require('../config/email');
          await emailService.sendWinnerNotification(
            {
              nombre: ganador.nombre,
              email: ganador.email
            },
            {
              id: id,
              nombre: rifaInfo.rows[0]?.nombre || ganador.rifa_nombre,
              numero_ganador: numero_ganador
            }
          );
          console.log('✅ Email al ganador enviado');
        } else {
          console.log('⚠️  No se encontró participante con el número ganador');
        }
      } catch (emailError) {
        console.error('❌ Error enviando email al ganador:', emailError);
        // No fallar la operación por error de email
      }
    }
    
    res.json({ message: 'Resultado actualizado', resultado: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando resultado de rifa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/rifas/:id/verificar?numero=123 - Verificar si el número es ganador
router.get('/:id/verificar', async (req, res) => {
  try {
    const { id } = req.params;
    const { numero } = req.query;
    if (!numero) return res.status(400).json({ error: 'Falta parámetro numero' });

    const result = await query('SELECT numero_ganador, resultado_publicado FROM rifas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rifa no encontrada' });

    const { numero_ganador, resultado_publicado } = result.rows[0];
    if (!resultado_publicado) {
      return res.json({ estado: 'pendiente', mensaje: 'El resultado aún no ha sido publicado' });
    }

    if (!numero_ganador) {
      return res.json({ estado: 'sin_resultado', mensaje: 'No hay número ganador registrado' });
    }

    const esGanador = String(numero_ganador).trim() === String(numero).trim();
    return res.json({ estado: esGanador ? 'ganador' : 'no_ganador', numero_ganador });
  } catch (error) {
    console.error('Error verificando número:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/rifas - Crear nueva rifa
router.post('/', authenticateToken, requireAdmin, sanitizeInput, validateRifa, async (req, res) => {
  try {
    console.log('🔍 Debug - Usuario autenticado:', req.user);
    console.log('🔍 Debug - Datos recibidos:', req.body);
    
    const {
      nombre,
      descripcion,
      precio,
      fechaFin,
      tipo,
      cantidadElementos,
      elementosPersonalizados,
      reglas,
      esPrivada,
      fechaSorteo,
      plataformaTransmision,
      otraPlataforma,
      enlaceTransmision,
      metodoSorteo,
      testigos,
      premios,
      fotosPremios,
      formasPago,
      // Campos de ubicación
      pais,
      estado,
      ciudad,
      manejaEnvio,
      alcance,
      categoria
    } = req.body;

    // Generar ID único
    const rifaId = Date.now().toString();

    // Crear rifa
    const rifaResult = await query(`
      INSERT INTO rifas (
        id, usuario_id, nombre, descripcion, precio, fecha_fin, tipo, 
        cantidad_elementos, elementos_personalizados, reglas, es_privada,
        fecha_sorteo, plataforma_transmision, otra_plataforma, enlace_transmision,
        metodo_sorteo, testigos, pais, estado, ciudad, maneja_envio, alcance, categoria,
        numero_ganador, resultado_publicado
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
        NULL, false
      ) RETURNING *
    `, [
      rifaId, req.user.id, nombre, descripcion, precio, fechaFin, tipo,
      cantidadElementos, JSON.stringify(elementosPersonalizados || []), reglas, esPrivada || false,
      fechaSorteo, plataformaTransmision, otraPlataforma, enlaceTransmision,
      metodoSorteo, testigos, pais, estado, ciudad, manejaEnvio || false, alcance || 'local', categoria || null
    ]);

    const rifa = rifaResult.rows[0];
    console.log('🔍 Debug - Rifa creada:', rifa);

    // Insertar premios si existen y guardar sus IDs
    const premioIds = [];
    if (premios && premios.length > 0) {
      console.log('🔍 Debug - Insertando premios:', premios.length);
      for (const premio of premios) {
        console.log('🔍 Debug - Premio:', { nombre: premio.nombre, fotos: premio.fotos?.length || 0 });
        const premioResult = await query(
          'INSERT INTO premios (rifa_id, nombre, descripcion, posicion) VALUES ($1, $2, $3, $4) RETURNING id',
          [rifaId, premio.nombre, premio.descripcion, premio.posicion]
        );
        premioIds.push(premioResult.rows[0].id);
      }
    }

    // Insertar fotos de premios si existen, asociándolas a sus premios
    console.log('🔍 Debug - fotosPremios recibido:', fotosPremios);
    console.log('🔍 Debug - Tipo de fotosPremios:', typeof fotosPremios);
    console.log('🔍 Debug - Es array?:', Array.isArray(fotosPremios));
    console.log('🔍 Debug - Longitud:', fotosPremios?.length || 0);
    
    if (fotosPremios && fotosPremios.length > 0) {
      console.log('🔍 Debug - Insertando fotos de premios:', fotosPremios.length);
      for (const foto of fotosPremios) {
        const urlFoto = foto.url || foto.url_foto || '';
        const premioId = foto.premioIndex !== undefined && premioIds[foto.premioIndex] 
          ? premioIds[foto.premioIndex] 
          : null;
        
        console.log('🔍 Debug - Insertando foto:', { 
          url: urlFoto, 
          descripcion: foto.descripcion, 
          orden: foto.orden,
          premioId: premioId,
          premioNombre: foto.premioNombre
        });
        
        if (urlFoto) {
          // Intentar insertar con premio_id si existe la columna, sino sin ella
          try {
            await query(
              'INSERT INTO fotos_premios (rifa_id, premio_id, url_foto, descripcion, orden) VALUES ($1, $2, $3, $4, $5)',
              [rifaId, premioId, urlFoto, foto.descripcion || '', foto.orden || 0]
            );
          } catch (err) {
            // Si la columna premio_id no existe, insertar sin ella
            if (err.message.includes('premio_id') || err.message.includes('does not exist')) {
              await query(
                'INSERT INTO fotos_premios (rifa_id, url_foto, descripcion, orden) VALUES ($1, $2, $3, $4)',
                [rifaId, urlFoto, foto.descripcion || '', foto.orden || 0]
              );
            } else {
              throw err;
            }
          }
        } else {
          console.warn('⚠️ Foto sin URL, omitiendo:', foto);
        }
      }
    } else {
      console.log('⚠️ No hay fotos de premios para insertar');
    }

    // Insertar formas de pago si existen
    if (formasPago) {
      // Normalizar claves recibidas (aceptar snake_case y camelCase)
      const fp = formasPago || {};
      const normalizado = {
        tipo_pago: fp.tipo_pago || fp.tipoPago || 'transferencia',
        banco: fp.banco || null,
        clabe: fp.clabe || null,
        numero_cuenta: fp.numero_cuenta ?? fp.numeroCuenta ?? null,
        nombre_titular: fp.nombre_titular ?? fp.nombreTitular ?? null,
        telefono: fp.telefono || null,
        whatsapp: fp.whatsapp || null,
        otros_detalles: fp.otros_detalles ?? fp.otrosDetalles ?? null
      };

      await query(`
        INSERT INTO formas_pago (
          rifa_id, tipo_pago, banco, clabe, numero_cuenta, nombre_titular,
          telefono, whatsapp, otros_detalles
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        rifaId,
        normalizado.tipo_pago,
        normalizado.banco,
        normalizado.clabe,
        normalizado.numero_cuenta,
        normalizado.nombre_titular,
        normalizado.telefono,
        normalizado.whatsapp,
        normalizado.otros_detalles
      ]);
    }

    res.status(201).json({
      message: 'Rifa creada exitosamente',
      rifa: {
        id: rifa.id,
        nombre: rifa.nombre,
        descripcion: rifa.descripcion,
        precio: rifa.precio,
        fechaFin: rifa.fecha_fin,
        tipo: rifa.tipo,
        cantidadElementos: rifa.cantidad_elementos,
        esPrivada: rifa.es_privada
      }
    });

  } catch (error) {
    console.error('Error creando rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/rifas/:id - Actualizar rifa
router.put('/:id', authenticateToken, requireAdmin, validateRifaId, sanitizeInput, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que la rifa pertenece al usuario
    const rifaResult = await query(
      'SELECT usuario_id FROM rifas WHERE id = $1',
      [id]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    if (rifaResult.rows[0].usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permisos para modificar esta rifa',
        code: 'RIFA_ACCESS_DENIED'
      });
    }

    // Construir query de actualización dinámicamente
    const allowedFields = [
      'nombre', 'descripcion', 'precio', 'fecha_fin', 'reglas', 'es_privada',
      'fecha_sorteo', 'plataforma_transmision', 'otra_plataforma', 
      'enlace_transmision', 'metodo_sorteo', 'testigos',
      'pais', 'estado', 'ciudad', 'maneja_envio', 'alcance',
      'numero_ganador', 'resultado_publicado'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No hay campos válidos para actualizar',
        code: 'NO_VALID_FIELDS'
      });
    }

    updateValues.push(id);
    paramCount++;

    const result = await query(`
      UPDATE rifas 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);

    res.json({
      message: 'Rifa actualizada exitosamente',
      rifa: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/rifas/:id - Eliminar rifa
router.delete('/:id', authenticateToken, requireAdmin, validateRifaId, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la rifa pertenece al usuario
    const rifaResult = await query(
      'SELECT usuario_id, deleted_at FROM rifas WHERE id = $1',
      [id]
    );

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada',
        code: 'RIFA_NOT_FOUND'
      });
    }

    if (rifaResult.rows[0].usuario_id !== req.user.id) {
      return res.status(403).json({
        error: 'No tienes permisos para eliminar esta rifa',
        code: 'RIFA_ACCESS_DENIED'
      });
    }

    // Verificar si ya está eliminada
    if (rifaResult.rows[0].deleted_at) {
      return res.status(400).json({
        error: 'La rifa ya está eliminada',
        code: 'RIFA_ALREADY_DELETED'
      });
    }

    // Baja lógica: marcar como eliminada en lugar de borrar físicamente
    await query(
      'UPDATE rifas SET deleted_at = CURRENT_TIMESTAMP, activa = false WHERE id = $1',
      [id]
    );

    res.json({
      message: 'Rifa eliminada exitosamente',
      deleted_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error eliminando rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/rifas/preview/:id - Vista previa de rifa (sin autenticación)
router.get('/preview/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos de la rifa
    const rifaResult = await query(`
      SELECT 
        r.*,
        u.nombre as creador_nombre,
        u.email as creador_email
      FROM rifas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = $1 AND r.activa = true
    `, [id]);

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Rifa no encontrada o no está disponible',
        code: 'RIFA_NOT_FOUND'
      });
    }

    const rifa = rifaResult.rows[0];

    // Obtener números vendidos y reservados
    const [vendidosResult, reservadosResult] = await Promise.all([
      query('SELECT elemento FROM elementos_vendidos WHERE rifa_id = $1', [id]),
      query('SELECT elemento FROM elementos_reservados WHERE rifa_id = $1 AND activo = true', [id])
    ]);

    // Obtener estadísticas básicas
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_participantes,
        COUNT(ev.elemento) as elementos_vendidos,
        COALESCE(SUM(CASE WHEN p.estado = 'confirmado' THEN p.total_pagado ELSE 0 END), 0) as total_recaudado
      FROM participantes p
      LEFT JOIN elementos_vendidos ev ON p.id = ev.participante_id
      WHERE p.rifa_id = $1
    `, [id]);

    const stats = statsResult.rows[0];
    const elementosDisponibles = rifa.cantidad_elementos - parseInt(stats.elementos_vendidos);

    res.json({
      rifa: {
        id: rifa.id,
        nombre: rifa.nombre,
        descripcion: rifa.descripcion,
        precio: rifa.precio,
        fecha_fin: rifa.fecha_fin,
        tipo: rifa.tipo,
        cantidad_elementos: rifa.cantidad_elementos,
        elementos_personalizados: rifa.elementos_personalizados,
        reglas: rifa.reglas,
        fecha_sorteo: rifa.fecha_sorteo,
        plataforma_transmision: rifa.plataforma_transmision,
        enlace_transmision: rifa.enlace_transmision,
        metodo_sorteo: rifa.metodo_sorteo,
        creador_nombre: rifa.creador_nombre,
        numerosVendidos: vendidosResult.rows.map(row => String(row.elemento)),
        numerosReservados: reservadosResult.rows.map(row => String(row.elemento))
      },
      estadisticas: {
        total_participantes: parseInt(stats.total_participantes),
        elementos_vendidos: parseInt(stats.elementos_vendidos),
        elementos_disponibles: elementosDisponibles,
        total_recaudado: parseFloat(stats.total_recaudado || 0)
      },
      esVistaPrevia: true
    });

  } catch (error) {
    console.error('Error obteniendo vista previa de rifa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
