const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { query } = require('../config/database');
const {
  stripe,
  createConnectAccount,
  createAccountLink,
  createLoginLink,
  calculateCommission,
  createPaymentIntent,
  createOXXOPaymentIntent,
  createCreditPaymentIntent,
  getAccountStatus,
  saveTransaction
} = require('../services/stripe');
const logger = require('../config/logger');
const { notifyPaymentConfirmed } = require('../services/notifications');

// POST /api/stripe/connect/create-account
// Creador solicita conectar su cuenta Stripe
router.post('/connect/create-account', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    logger.info('Creando cuenta Stripe Connect', { userId, email: userEmail });
    
    // Verificar si ya tiene cuenta
    const existing = await query(
      'SELECT * FROM stripe_connect_accounts WHERE user_id = $1',
      [userId]
    );
    
    if (existing.rows.length > 0) {
      const account = existing.rows[0];
      
      // Verificar estado actual de la cuenta
      try {
        const accountStatus = await getAccountStatus(account.stripe_account_id);
        
        // Actualizar estado en BD
        await query(`
          UPDATE stripe_connect_accounts
          SET 
            charges_enabled = $1,
            payouts_enabled = $2,
            details_submitted = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_account_id = $4
        `, [
          accountStatus.chargesEnabled,
          accountStatus.payoutsEnabled,
          accountStatus.detailsSubmitted,
          account.stripe_account_id
        ]);
        
        if (accountStatus.chargesEnabled && accountStatus.payoutsEnabled) {
          return res.json({
            connected: true,
            accountId: account.stripe_account_id,
            message: 'Cuenta Stripe ya está conectada y lista para recibir pagos'
          });
        }
      } catch (error) {
        logger.warn('Error verificando cuenta existente, creando nuevo link', { error: error.message });
      }
      
      // Crear nuevo link de onboarding si no está completa
      const accountLink = await createAccountLink(
        account.stripe_account_id,
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe=success`,
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe=refresh`
      );
      
      return res.json({
        connected: false,
        onboardingUrl: accountLink.url,
        message: 'Completa la configuración de tu cuenta Stripe'
      });
    }
    
    // Crear nueva cuenta Express
    const account = await createConnectAccount(userId, userEmail, 'MX');
    
    logger.info('Cuenta Stripe creada', { userId, accountId: account.id });
    
    // Guardar en BD
    await query(`
      INSERT INTO stripe_connect_accounts 
      (user_id, stripe_account_id, account_type, email, country)
      VALUES ($1, $2, 'express', $3, 'MX')
    `, [userId, account.id, userEmail]);
    
    // Crear link de onboarding
    const accountLink = await createAccountLink(
      account.id,
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe=success`,
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?stripe=refresh`
    );
    
    res.json({
      connected: false,
      onboardingUrl: accountLink.url,
      accountId: account.id,
      message: 'Redirigiendo a Stripe para completar configuración'
    });
    
  } catch (error) {
    logger.error('Error creando cuenta Stripe', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Error al crear cuenta Stripe',
      message: error.message 
    });
  }
});

// GET /api/stripe/connect/status/:userId
// Verificar estado de cuenta Stripe de un creador (público para verificar disponibilidad)
router.get('/connect/status/:userId', optionalAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'userId inválido' });
    }
    
    const result = await query(`
      SELECT 
        stripe_account_id,
        charges_enabled,
        payouts_enabled,
        details_submitted
      FROM stripe_connect_accounts
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ 
        connected: false,
        available: false
      });
    }
    
    const account = result.rows[0];
    
    // Verificar estado actual en Stripe
    try {
      const accountStatus = await getAccountStatus(account.stripe_account_id);
      
      // Actualizar en BD
      await query(`
        UPDATE stripe_connect_accounts
        SET 
          charges_enabled = $1,
          payouts_enabled = $2,
          details_submitted = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_account_id = $4
      `, [
        accountStatus.chargesEnabled,
        accountStatus.payoutsEnabled,
        accountStatus.detailsSubmitted,
        account.stripe_account_id
      ]);
      
      res.json({
        connected: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
        available: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
        chargesEnabled: accountStatus.chargesEnabled,
        payoutsEnabled: accountStatus.payoutsEnabled
      });
    } catch (error) {
      logger.error('Error verificando estado de cuenta Stripe', { error: error.message });
      // Retornar datos de BD si falla la verificación
      res.json({
        connected: account.charges_enabled && account.payouts_enabled,
        available: account.charges_enabled && account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled
      });
    }
    
  } catch (error) {
    logger.error('Error verificando cuenta Stripe', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stripe/connect/status
// Verificar estado de cuenta Stripe (para el usuario autenticado)
router.get('/connect/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(`
      SELECT 
        stripe_account_id,
        charges_enabled,
        payouts_enabled,
        details_submitted,
        email,
        country
      FROM stripe_connect_accounts
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ 
        connected: false,
        message: 'No tienes cuenta Stripe conectada'
      });
    }
    
    const account = result.rows[0];
    
    // Verificar estado actual en Stripe
    try {
      const accountStatus = await getAccountStatus(account.stripe_account_id);
      
      // Actualizar en BD
      await query(`
        UPDATE stripe_connect_accounts
        SET 
          charges_enabled = $1,
          payouts_enabled = $2,
          details_submitted = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_account_id = $4
      `, [
        accountStatus.chargesEnabled,
        accountStatus.payoutsEnabled,
        accountStatus.detailsSubmitted,
        account.stripe_account_id
      ]);
      
      res.json({
        connected: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
        chargesEnabled: accountStatus.chargesEnabled,
        payoutsEnabled: accountStatus.payoutsEnabled,
        detailsSubmitted: accountStatus.detailsSubmitted,
        accountId: account.stripe_account_id,
        email: accountStatus.email,
        country: accountStatus.country
      });
    } catch (error) {
      logger.error('Error verificando estado de cuenta Stripe', { error: error.message });
      // Retornar datos de BD si falla la verificación
      res.json({
        connected: account.charges_enabled && account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        accountId: account.stripe_account_id,
        email: account.email,
        country: account.country
      });
    }
    
  } catch (error) {
    logger.error('Error verificando cuenta Stripe', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stripe/connect/login-link
// Obtener link para acceder al dashboard de Stripe del creador
router.get('/connect/login-link', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(`
      SELECT stripe_account_id
      FROM stripe_connect_accounts
      WHERE user_id = $1 AND charges_enabled = true
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'No tienes cuenta Stripe conectada o no está habilitada'
      });
    }
    
    const loginLink = await createLoginLink(result.rows[0].stripe_account_id);
    
    res.json({
      url: loginLink.url
    });
    
  } catch (error) {
    logger.error('Error creando login link', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stripe/payment-intent
// Crear Payment Intent para participar en rifa
router.post('/payment-intent', optionalAuth, async (req, res) => {
  try {
    const { rifaId, amount, currency = 'mxn', numerosSeleccionados, paymentMethod = 'card', participanteId: participanteIdFromBody } = req.body;
    // Priorizar participanteId del body (si viene del frontend) sobre el del usuario autenticado
    const participanteId = participanteIdFromBody || req.user?.id || null;
    
    if (!rifaId || !amount) {
      return res.status(400).json({ error: 'rifaId y amount son requeridos' });
    }
    
    logger.info('Creando Payment Intent', { rifaId, amount, currency, participanteId });
    
    // Obtener creador de la rifa
    const rifaResult = await query(`
      SELECT usuario_id, precio, nombre
      FROM rifas
      WHERE id = $1
    `, [rifaId]);
    
    if (rifaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rifa no encontrada' });
    }
    
    const creadorId = rifaResult.rows[0].usuario_id;
    const precioRifa = parseFloat(rifaResult.rows[0].precio);
    const rifaNombre = rifaResult.rows[0].nombre;
    
    // Calcular monto total
    const cantidadNumeros = numerosSeleccionados?.length || 1;
    const totalAmount = precioRifa * cantidadNumeros;
    
    // Verificar que el creador tenga cuenta de Stripe Connect configurada
    const stripeAccountResult = await query(`
      SELECT stripe_account_id, charges_enabled, payouts_enabled
      FROM stripe_connect_accounts
      WHERE user_id = $1
    `, [creadorId]);
    
    // Si no tiene cuenta Stripe Connect, usar la cuenta principal de SorteoHub
    // (esto permite que rifas funcionen incluso si el creador no tiene Stripe configurado)
    const hasStripeConnect = stripeAccountResult.rows.length > 0 && 
                            stripeAccountResult.rows[0].charges_enabled && 
                            stripeAccountResult.rows[0].payouts_enabled;
    
    if (!hasStripeConnect) {
      logger.info('Creador sin Stripe Connect, usando cuenta principal de SorteoHub', { creadorId });
    }
    
    // Crear Payment Intent según método de pago
    let paymentIntentResult;
    if (paymentMethod === 'oxxo') {
      paymentIntentResult = await createOXXOPaymentIntent(
        totalAmount,
        currency,
        creadorId,
        rifaId,
        {
          participante_id: participanteId?.toString() || 'guest',
          numeros: numerosSeleccionados?.join(',') || '',
          rifa_nombre: rifaNombre
        }
      );
    } else {
      paymentIntentResult = await createPaymentIntent(
        totalAmount,
        currency,
        creadorId,
        rifaId,
        {
          participante_id: participanteId?.toString() || 'guest',
          numeros: numerosSeleccionados?.join(',') || '',
          rifa_nombre: rifaNombre
        }
      );
    }
    
    const { paymentIntent, commission, commissionPct, amountToCreator } = paymentIntentResult;
    
    // Guardar transacción en BD
    try {
      // Guardar transacción (sin accountId ya que no usamos Connect)
      try {
        await saveTransaction({
          rifaId,
          participanteId,
          creadorId,
          paymentIntentId: paymentIntent.id,
          accountId: 'sorteohub_main', // Cuenta principal de SorteoHub
          amount: totalAmount,
          currency: currency.toUpperCase(),
          commissionAmount: commission,
          commissionPct,
          amountToCreator,
          status: 'pending',
          metadata: {
            numeros: numerosSeleccionados,
            rifa_nombre: rifaNombre
          }
        });
      } catch (error) {
        logger.warn('Error guardando transacción en BD', { error: error.message });
      }
    } catch (error) {
      logger.warn('Error guardando transacción en BD', { error: error.message });
      // Continuar aunque falle guardar en BD
    }
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      commission: commission,
      commissionPct: commissionPct,
      amountToCreator: amountToCreator,
      currency: currency.toUpperCase(),
      paymentMethod: paymentMethod
    });
    
  } catch (error) {
    logger.error('Error creando Payment Intent', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Error al crear intención de pago',
      message: error.message 
    });
  }
});

// POST /api/stripe/credit-payment-intent
// Crear Payment Intent para cargar créditos de anunciantes
router.post('/credit-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'mxn' } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Monto inválido. Debe ser mayor a $0' });
    }
    
    // Validar monto mínimo de Stripe ($10 MXN)
    const MIN_AMOUNT = 10.00;
    const amountNum = parseFloat(amount);
    if (amountNum < MIN_AMOUNT) {
      return res.status(400).json({ 
        error: `El monto mínimo para cargar créditos es $${MIN_AMOUNT.toFixed(2)} MXN (requerido por Stripe)`,
        minAmount: MIN_AMOUNT
      });
    }
    
    // Usar middleware de autenticación de anunciantes
    const { authenticateAdvertiser } = require('../middleware/advertiserAuth');
    
    // Middleware temporal para obtener advertiserId
    let advertiserId;
    try {
      const authHeader = req.headers.authorization;
      const authToken = authHeader && authHeader.split(' ')[1];
      if (!authToken) {
        return res.status(401).json({ error: 'Token requerido' });
      }
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      if (!decoded.advertiserId) {
        return res.status(403).json({ error: 'Este endpoint es solo para anunciantes' });
      }
      advertiserId = decoded.advertiserId;
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    logger.info('Creando Payment Intent para créditos', { advertiserId, amount: amountNum, currency });
    
    // Crear Payment Intent
    const result = await createCreditPaymentIntent(amountNum, currency, advertiserId, {
      descripcion: `Carga de crédito desde dashboard`
    });
    
    res.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amount: result.amount,
      currency: result.currency.toUpperCase()
    });
    
  } catch (error) {
    logger.error('Error creando Payment Intent para créditos', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Error al crear intención de pago',
      message: error.message 
    });
  }
});

// POST /api/stripe/confirm-payment
// Confirmar pago y procesar inmediatamente (llamado desde frontend)
router.post('/confirm-payment', optionalAuth, async (req, res) => {
  try {
    const { paymentIntentId, participanteId, rifaId } = req.body;
    
    if (!paymentIntentId || !participanteId || !rifaId) {
      return res.status(400).json({ 
        error: 'paymentIntentId, participanteId y rifaId son requeridos' 
      });
    }
    
    logger.info('Confirmando pago desde frontend', { 
      paymentIntentId, 
      participanteId, 
      rifaId 
    });
    
    // Verificar que el Payment Intent existe y está succeeded
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError) {
      logger.error('Error recuperando Payment Intent', { error: stripeError.message });
      return res.status(400).json({ error: 'Payment Intent no encontrado' });
    }
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: `El pago no está completado. Estado: ${paymentIntent.status}` 
      });
    }
    
    // Verificar que el participante existe y está pendiente
    const participanteResult = await query(
      'SELECT * FROM participantes WHERE id = $1 AND rifa_id = $2 AND estado = $3',
      [participanteId, rifaId, 'pendiente']
    );
    
    if (participanteResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Participante no encontrado o ya procesado' 
      });
    }
    
    const participante = participanteResult.rows[0];
    const numerosArray = participante.numeros_seleccionados || [];
    
    // Obtener información de la rifa
    const rifaResult = await query(
      'SELECT usuario_id, precio, nombre FROM rifas WHERE id = $1',
      [rifaId]
    );
    
    if (rifaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rifa no encontrada' });
    }
    
    const rifa = rifaResult.rows[0];
    const total = (parseFloat(rifa.precio) * numerosArray.length).toFixed(2);
    
    // Iniciar transacción para actualizar estado
    const { getClient } = require('../config/database');
    const client = await getClient();
    await client.query('BEGIN');
    
    try {
      // 1. Actualizar participante a confirmado
      await client.query(`
        UPDATE participantes 
        SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [participanteId]);
      
      // 2. Obtener elementos reservados
      const elementosReservados = await client.query(`
        SELECT elemento FROM elementos_reservados 
        WHERE participante_id = $1 AND rifa_id = $2 AND activo = true
      `, [participanteId, rifaId]);
      
      // 3. Mover elementos de reservados a vendidos
      for (const row of elementosReservados.rows) {
        await client.query(`
          INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento, fecha_venta)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (rifa_id, elemento) DO NOTHING
        `, [rifaId, participanteId, row.elemento]);
      }
      
      // 4. Marcar elementos reservados como inactivos
      await client.query(`
        UPDATE elementos_reservados 
        SET activo = false 
        WHERE participante_id = $1 AND rifa_id = $2
      `, [participanteId, rifaId]);
      
      await client.query('COMMIT');
      
      logger.info('Pago confirmado y procesado exitosamente desde frontend', {
        participanteId,
        rifaId,
        numeros: numerosArray
      });
      
      // 5. Enviar email de confirmación de pago
      try {
        const emailService = require('../config/email');
        await emailService.sendPaymentValidated(
          {
            nombre: participante.nombre,
            email: participante.email,
            numerosSeleccionados: numerosArray,
            totalPagado: total
          },
          {
            id: rifaId,
            nombre: rifa.nombre
          }
        );
        logger.info('Email de pago validado enviado al participante');
      } catch (emailError) {
        logger.error('Error enviando email de pago validado', {
          error: emailError.message,
          participanteId,
          rifaId
        });
      }
      
      // 6. Notificar al creador sobre el pago confirmado
      const io = req.app.get('io');
      logger.info('Intentando enviar notificación', {
        creadorId: rifa.usuario_id,
        participanteId,
        rifaId,
        ioAvailable: !!io
      });
      
      try {
        await notifyPaymentConfirmed(
          participanteId,
          rifaId,
          {
            usuario_id: null,
            total: total
          },
          rifa.usuario_id,
          io
        );
        logger.info('✅ Notificación de pago enviada al creador', {
          creadorId: rifa.usuario_id
        });
      } catch (notifError) {
        logger.error('❌ Error enviando notificación de pago', {
          error: notifError.message,
          stack: notifError.stack,
          participanteId,
          rifaId,
          creadorId: rifa.usuario_id
        });
      }
      
      res.json({
        success: true,
        message: 'Pago confirmado y procesado exitosamente',
        data: {
          participanteId,
          rifaId,
          total,
          numeros: numerosArray
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error procesando pago desde frontend', {
        error: error.message,
        participanteId,
        rifaId
      });
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    logger.error('Error confirmando pago', { error: error.message });
    res.status(500).json({ 
      error: 'Error procesando confirmación de pago',
      message: error.message 
    });
  }
});

// POST /api/stripe/webhook
// Webhook para eventos de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    logger.warn('STRIPE_WEBHOOK_SECRET no configurado, ignorando webhook');
    return res.status(400).send('Webhook secret no configurado');
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  logger.info('Webhook recibido', { type: event.type, id: event.id });
  
  // Manejar eventos
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Pasar instancia de Socket.io al handler
        const io = req.app.get('io');
        await handlePaymentSuccess(event.data.object, io);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'account.updated':
        await handleAccountUpdate(event.data.object);
        break;
        
      default:
        logger.info(`Evento no manejado: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Error procesando webhook', { error: error.message, type: event.type });
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// Funciones helper para webhooks
async function handlePaymentSuccess(paymentIntent, io = null) {
  try {
    const { rifa_id, participante_id, numeros, creador_id, tipo, advertiser_id } = paymentIntent.metadata;
    
    logger.info('Pago exitoso', { 
      paymentIntentId: paymentIntent.id,
      rifaId: rifa_id,
      participanteId: participante_id,
      tipo: tipo,
      advertiserId: advertiser_id
    });
    
    // Si es una carga de crédito de anunciante
    if (tipo === 'credit_load' && advertiser_id) {
      const amount = paymentIntent.amount / 100; // Convertir de centavos a dólares
      const advertiserId = parseInt(advertiser_id);
      
      logger.info('Procesando carga de crédito', { advertiserId, amount });
      
      // Actualizar crédito del anunciante
      const result = await query(
        `UPDATE anunciantes 
         SET credito_actual = credito_actual + $1,
             credito_total_acumulado = credito_total_acumulado + $1
         WHERE id = $2
         RETURNING credito_actual, credito_total_acumulado`,
        [amount, advertiserId]
      );
      
      if (result.rows.length === 0) {
        logger.error('Anunciante no encontrado para carga de crédito', { advertiserId });
        return;
      }
      
      // Registrar transacción de carga
      await query(
        `INSERT INTO advertiser_credit_transactions (anunciante_id, monto, tipo, descripcion, referencia_pago)
         VALUES ($1, $2, 'carga', $3, $4)`,
        [
          advertiserId,
          amount,
          `Carga de crédito de $${amount.toFixed(2)} vía Stripe`,
          paymentIntent.id
        ]
      );
      
      // Reactivar anuncios que estuvieron pausados por falta de crédito
      await query(
        `UPDATE anuncios 
         SET activo = true 
         WHERE anunciante_id = $1 
           AND activo = false 
           AND presupuesto_mensual > 0`,
        [advertiserId]
      );
      
      logger.info('Crédito cargado exitosamente', { advertiserId, amount });
      return; // Salir temprano, no procesar como pago de rifa
    }
    
    // Procesamiento normal de pago de rifa
    const rifaId = rifa_id;
    const participanteId = participante_id;
    
    // Actualizar transacción en BD
    await query(`
      UPDATE stripe_transactions
      SET 
        status = 'succeeded',
        stripe_fee = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE stripe_payment_intent_id = $2
    `, [
      paymentIntent.charges?.data[0]?.balance_transaction?.fee 
        ? paymentIntent.charges.data[0].balance_transaction.fee / 100 
        : null,
      paymentIntent.id
    ]);
    
    // Si hay participante_id, auto-registrar participación (mover de reservado a vendido)
    if (participanteId && participanteId !== 'guest' && rifaId) {
      const numerosArray = numeros ? numeros.split(',').map(n => n.trim()) : [];
      
      logger.info('Auto-registrando participación desde webhook Stripe', {
        participanteId: participante_id,
        rifaId: rifa_id,
        numeros: numerosArray
      });
      
      // Obtener información del participante y rifa
      // Buscar primero por ID y estado pendiente
      let participanteResult = await query(
        'SELECT * FROM participantes WHERE id = $1 AND rifa_id = $2 AND estado = $3',
        [participanteId, rifaId, 'pendiente']
      );
      
      // Si no se encuentra pendiente, verificar si ya fue procesado (confirmado)
      if (participanteResult.rows.length === 0) {
        const yaProcesado = await query(
          'SELECT * FROM participantes WHERE id = $1 AND rifa_id = $2 AND estado = $3',
          [participanteId, rifaId, 'confirmado']
        );
        
        if (yaProcesado.rows.length > 0) {
          logger.info('Participante ya procesado desde frontend, webhook ignorado', {
            participanteId,
            rifaId,
            paymentIntentId: paymentIntent.id
          });
          return; // Ya fue procesado, no hacer nada
        }
      }
      
      const rifaResult = await query(
        'SELECT usuario_id, precio, nombre FROM rifas WHERE id = $1',
        [rifaId]
      );
      
      if (participanteResult.rows.length > 0 && rifaResult.rows.length > 0) {
        const participante = participanteResult.rows[0];
        const rifa = rifaResult.rows[0];
        const total = (parseFloat(rifa.precio) * numerosArray.length).toFixed(2);
        
        // Iniciar transacción para actualizar estado
        const { getClient } = require('../config/database');
        const client = await getClient();
        await client.query('BEGIN');
        
        try {
          // 1. Actualizar participante a confirmado
          await client.query(`
            UPDATE participantes 
            SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [participanteId]);
          
          // 2. Obtener elementos reservados
          const elementosReservados = await client.query(`
            SELECT elemento FROM elementos_reservados 
            WHERE participante_id = $1 AND rifa_id = $2 AND activo = true
          `, [participanteId, rifaId]);
          
          // 3. Mover elementos de reservados a vendidos
          for (const row of elementosReservados.rows) {
            await client.query(`
              INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento, fecha_venta)
              VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
              ON CONFLICT (rifa_id, elemento) DO NOTHING
            `, [rifaId, participanteId, row.elemento]);
          }
          
          // 4. Marcar elementos reservados como inactivos
          await client.query(`
            UPDATE elementos_reservados 
            SET activo = false 
            WHERE participante_id = $1 AND rifa_id = $2
          `, [participanteId, rifaId]);
          
          await client.query('COMMIT');
          
          logger.info('Participación auto-registrada exitosamente desde webhook', {
            participanteId,
            rifaId,
            numeros: numerosArray
          });
          
          // 5. Enviar email de confirmación de pago
          try {
            const emailService = require('../config/email');
            await emailService.sendPaymentValidated(
              {
                nombre: participante.nombre,
                email: participante.email,
                numerosSeleccionados: numerosArray,
                totalPagado: total
              },
              {
                id: rifaId,
                nombre: rifa.nombre
              }
            );
            logger.info('Email de pago validado enviado al participante');
          } catch (emailError) {
            logger.error('Error enviando email de pago validado', {
              error: emailError.message,
              participanteId,
              rifaId
            });
            // No fallar el webhook por error de email
          }
          
          // 6. Notificar al creador sobre el pago confirmado
          try {
            await notifyPaymentConfirmed(
              participanteId,
              rifaId,
              {
                usuario_id: null,
                total: total
              },
              rifa.usuario_id,
              io
            );
          } catch (notifError) {
            logger.error('Error enviando notificación de pago desde webhook', {
              error: notifError.message,
              participanteId,
              rifaId
            });
            // No fallar el webhook por error de notificación
          }
          
        } catch (error) {
          await client.query('ROLLBACK');
          logger.error('Error auto-registrando participación desde webhook', {
            error: error.message,
            participanteId,
            rifaId
          });
          throw error;
        } finally {
          client.release();
        }
      } else {
        logger.warn('Participante no encontrado o ya procesado en webhook', {
          participanteId,
          rifaId,
          estado: participanteResult.rows.length > 0 ? participanteResult.rows[0].estado : 'no encontrado'
        });
      }
    }
    
  } catch (error) {
    logger.error('Error en handlePaymentSuccess', { error: error.message });
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    logger.warn('Pago fallido', { paymentIntentId: paymentIntent.id });
    
    await query(`
      UPDATE stripe_transactions
      SET 
        status = 'failed',
        updated_at = CURRENT_TIMESTAMP
      WHERE stripe_payment_intent_id = $1
    `, [paymentIntent.id]);
    
  } catch (error) {
    logger.error('Error en handlePaymentFailed', { error: error.message });
  }
}

async function handleAccountUpdate(account) {
  try {
    logger.info('Cuenta Stripe actualizada', { accountId: account.id });
    
    await query(`
      UPDATE stripe_connect_accounts
      SET 
        charges_enabled = $1,
        payouts_enabled = $2,
        details_submitted = $3,
        email = $4,
        country = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE stripe_account_id = $6
    `, [
      account.charges_enabled,
      account.payouts_enabled,
      account.details_submitted,
      account.email,
      account.country,
      account.id
    ]);
    
  } catch (error) {
    logger.error('Error en handleAccountUpdate', { error: error.message });
  }
}

// GET /api/stripe/transactions
// Obtener historial de transacciones (solo para creadores)
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await query(`
      SELECT 
        st.*,
        r.nombre as rifa_nombre,
        u.nombre as participante_nombre
      FROM stripe_transactions st
      LEFT JOIN rifas r ON st.rifa_id = r.id
      LEFT JOIN usuarios u ON st.participante_id = u.id
      WHERE st.creador_id = $1
      ORDER BY st.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), parseInt(offset)]);
    
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM stripe_transactions
      WHERE creador_id = $1
    `, [userId]);
    
    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    logger.error('Error obteniendo transacciones', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/stripe/simulate-payment
 * Endpoint de prueba para simular un pago confirmado (solo desarrollo/testing)
 * Simula el webhook de Stripe sin necesidad de hacer un pago real
 */
router.post('/simulate-payment', authenticateToken, async (req, res) => {
  try {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Este endpoint solo está disponible en desarrollo'
      });
    }

    const { rifa_id, participante_id, numeros, monto } = req.body;

    // Validar parámetros requeridos
    if (!rifa_id || !participante_id) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos: rifa_id y participante_id son obligatorios'
      });
    }

    const io = req.app.get('io');

    // Obtener información del participante y rifa
    const participanteResult = await query(
      'SELECT * FROM participantes WHERE id = $1',
      [participante_id]
    );

    const rifaResult = await query(
      'SELECT usuario_id, precio, nombre FROM rifas WHERE id = $1',
      [rifa_id]
    );

    if (participanteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Participante no encontrado'
      });
    }

    if (rifaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rifa no encontrada'
      });
    }

    const participante = participanteResult.rows[0];
    const rifa = rifaResult.rows[0];
    
    // Calcular monto si no se proporciona
    const numerosArray = numeros ? (Array.isArray(numeros) ? numeros : numeros.split(',').map(n => n.trim())) : participante.numeros_seleccionados || [];
    const total = monto || (parseFloat(rifa.precio) * numerosArray.length).toFixed(2);

    logger.info('Simulando pago confirmado', {
      rifa_id,
      participante_id,
      total,
      usuario_id: req.user.id
    });

    // Simular el flujo de pago confirmado
    // 1. Actualizar estado del participante a confirmado
    await query(`
      UPDATE participantes 
      SET estado = 'confirmado', fecha_confirmacion = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [participante_id]);

    // 2. Mover elementos de reservados a vendidos
    await query(`
      DELETE FROM elementos_reservados 
      WHERE rifa_id = $1 AND participante_id = $2
    `, [rifa_id, participante_id]);

    for (const elemento of numerosArray) {
      await query(`
        INSERT INTO elementos_vendidos (rifa_id, participante_id, elemento, fecha_venta)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (rifa_id, elemento) DO NOTHING
      `, [rifa_id, participante_id, elemento]);
    }

    // 3. Registrar transacción simulada (opcional)
    await query(`
      INSERT INTO stripe_transactions (
        rifa_id, participante_id, stripe_payment_intent_id, 
        monto, status, tipo, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `, [
      rifa_id,
      participante_id,
      `simulated_${Date.now()}`,
      total,
      'succeeded',
      'raffle_payment'
    ]);

    // 4. Enviar notificación de pago confirmado
    await notifyPaymentConfirmed(
      participante_id,
      rifa_id,
      {
        usuario_id: null, // El participante puede no tener cuenta de usuario
        total: total
      },
      rifa.usuario_id,
      io
    );

    res.json({
      success: true,
      message: 'Pago simulado exitosamente',
      data: {
        rifa_id,
        participante_id,
        total,
        numeros: numerosArray,
        rifa_nombre: rifa.nombre,
        participante_nombre: participante.nombre
      }
    });

  } catch (error) {
    logger.error('Error simulando pago', {
      error: error.message,
      userId: req.user.id,
      body: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Error simulando pago',
      message: error.message
    });
  }
});

module.exports = router;

