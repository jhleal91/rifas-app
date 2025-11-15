/**
 * Servicio de Stripe Connect
 * Maneja la integración con Stripe para pagos y comisiones
 */
const Stripe = require('stripe');
const { query } = require('../config/database');

// Inicializar Stripe solo si hay una clave configurada
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_...') {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY no configurado. Funcionalidad de pagos deshabilitada.');
}

/**
 * Crear cuenta Express para creador
 */
async function createConnectAccount(userId, email, country = 'MX') {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en config.env');
  }
  const account = await stripe.accounts.create({
    type: 'express',
    country: country,
    email: email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      user_id: userId.toString(),
      platform: 'SorteoHub'
    },
  });
  
  return account;
}

/**
 * Crear link de onboarding para cuenta Express
 */
async function createAccountLink(accountId, returnUrl, refreshUrl) {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en config.env');
  }
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  
  return accountLink;
}

/**
 * Obtener link de login para cuenta Express (dashboard del creador)
 */
async function createLoginLink(accountId) {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en config.env');
  }
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink;
}

/**
 * Calcular comisión según plan del creador
 */
async function calculateCommission(amount, userId) {
  try {
    // Obtener plan activo del usuario
    const planResult = await query(`
      SELECT cp.commission_pct, cp.name as plan_name
      FROM user_plan_subscriptions ups
      JOIN creator_plans cp ON ups.plan_id = cp.id
      WHERE ups.user_id = $1 AND ups.status = 'active'
      ORDER BY ups.created_at DESC
      LIMIT 1
    `, [userId]);
    
    // Si no tiene plan activo, usar comisión por defecto (Free: 5%)
    const commissionPct = planResult.rows.length > 0 
      ? parseFloat(planResult.rows[0].commission_pct) 
      : 5.00;
    
    const commission = (amount * commissionPct) / 100;
    const amountToCreator = amount - commission;
    
    return {
      commission: Math.round(commission * 100) / 100, // Redondear a 2 decimales
      commissionPct,
      amountToCreator: Math.round(amountToCreator * 100) / 100,
      planName: planResult.rows[0]?.plan_name || 'Free'
    };
  } catch (error) {
    console.error('Error calculando comisión:', error);
    // En caso de error, usar comisión por defecto
    return {
      commission: (amount * 5) / 100,
      commissionPct: 5.00,
      amountToCreator: amount - (amount * 5) / 100,
      planName: 'Free'
    };
  }
}

/**
 * Crear Payment Intent en cuenta de SorteoHub (NO Connect)
 * Todos los pagos van a la cuenta de SorteoHub
 * SorteoHub retiene la comisión y transfiere el resto al creador
 */
async function createPaymentIntent(amount, currency, userId, rifaId, metadata = {}) {
  try {
    if (!stripe) {
      throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en config.env');
    }
    
    // Calcular comisión
    const commission = await calculateCommission(amount, userId);
    
    // Convertir a centavos (Stripe usa la menor unidad de moneda)
    const amountInCents = Math.round(amount * 100);
    
    // Crear Payment Intent en la cuenta de SorteoHub (NO en cuenta conectada)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        user_id: userId.toString(),
        creador_id: userId.toString(),
        rifa_id: rifaId.toString(),
        commission_pct: commission.commissionPct.toString(),
        commission_amount: commission.commission.toString(),
        amount_to_creator: commission.amountToCreator.toString(),
        plan_name: commission.planName,
        platform: 'SorteoHub',
        ...metadata
      },
    });
    
    return {
      paymentIntent,
      commission: commission.commission,
      commissionPct: commission.commissionPct,
      amountToCreator: commission.amountToCreator
    };
    
  } catch (error) {
    console.error('Error creando Payment Intent:', error);
    throw error;
  }
}

/**
 * Crear Payment Intent para OXXO (voucher) en cuenta de SorteoHub
 */
async function createOXXOPaymentIntent(amount, currency, userId, rifaId, metadata = {}) {
  try {
    if (!stripe) {
      throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en config.env');
    }
    
    const commission = await calculateCommission(amount, userId);
    const amountInCents = Math.round(amount * 100);
    
    // Crear Payment Intent con método OXXO en cuenta de SorteoHub
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      payment_method_types: ['oxxo'],
      metadata: {
        user_id: userId.toString(),
        creador_id: userId.toString(),
        rifa_id: rifaId.toString(),
        commission_pct: commission.commissionPct.toString(),
        commission_amount: commission.commission.toString(),
        amount_to_creator: commission.amountToCreator.toString(),
        platform: 'SorteoHub',
        ...metadata
      },
    });
    
    return {
      paymentIntent,
      commission: commission.commission,
      commissionPct: commission.commissionPct,
      amountToCreator: commission.amountToCreator
    };
    
  } catch (error) {
    console.error('Error creando Payment Intent OXXO:', error);
    throw error;
  }
}

/**
 * Crear Payment Intent para cargar créditos de anunciantes
 * El dinero va directamente a SorteoHub (no hay comisión ni transferencia a terceros)
 */
async function createCreditPaymentIntent(amount, currency, advertiserId, metadata = {}) {
  try {
    if (!stripe) {
      throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en config.env');
    }
    
    // Convertir a centavos (Stripe usa la menor unidad de moneda)
    const amountInCents = Math.round(amount * 100);
    
    // Crear Payment Intent en la cuenta de SorteoHub
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        advertiser_id: advertiserId.toString(),
        tipo: 'credit_load',
        ...metadata
      },
      description: `Carga de crédito de $${amount.toFixed(2)} para anunciante ${advertiserId}`
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency
    };
  } catch (error) {
    console.error('Error creando Payment Intent para créditos:', error);
    throw error;
  }
}

/**
 * Verificar estado de cuenta Stripe
 */
async function getAccountStatus(accountId) {
  try {
    if (!stripe) {
      throw new Error('Stripe no está configurado. Por favor, configura STRIPE_SECRET_KEY en config.env');
    }
    const account = await stripe.accounts.retrieve(accountId);
    return {
      id: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      email: account.email,
      country: account.country
    };
  } catch (error) {
    console.error('Error obteniendo estado de cuenta:', error);
    throw error;
  }
}

/**
 * Registrar transacción en BD
 */
async function saveTransaction(transactionData) {
  try {
    const result = await query(`
      INSERT INTO stripe_transactions (
        rifa_id, participante_id, creador_id,
        stripe_payment_intent_id, stripe_account_id,
        amount, currency, commission_amount, commission_pct,
        amount_to_creator, stripe_fee, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      transactionData.rifaId,
      transactionData.participanteId,
      transactionData.creadorId,
      transactionData.paymentIntentId,
      transactionData.accountId,
      transactionData.amount,
      transactionData.currency,
      transactionData.commissionAmount,
      transactionData.commissionPct,
      transactionData.amountToCreator,
      transactionData.stripeFee || null,
      transactionData.status || 'pending',
      JSON.stringify(transactionData.metadata || {})
    ]);
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error guardando transacción:', error);
    throw error;
  }
}

module.exports = {
  stripe: stripe || null, // Exportar null si no está configurado
  createConnectAccount,
  createAccountLink,
  createLoginLink,
  calculateCommission,
  createPaymentIntent,
  createOXXOPaymentIntent,
  createCreditPaymentIntent,
  getAccountStatus,
  saveTransaction
};

