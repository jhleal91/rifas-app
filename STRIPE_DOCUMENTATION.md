# 💳 Documentación de Stripe - SorteoHub

> **Nota:** Esta documentación describe la implementación actual de Stripe en SorteoHub.
> El sistema procesa todos los pagos a través de Stripe y luego transfiere los fondos a los creadores.

## 📋 Índice
1. [Arquitectura de Pagos](#arquitectura-de-pagos)
2. [Comisiones y Costos](#comisiones-y-costos)
3. [Implementación Técnica](#implementación-técnica)
4. [Webhooks](#webhooks)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Arquitectura de Pagos

### Flujo Actual
SorteoHub procesa todos los pagos directamente y luego transfiere los fondos a los creadores:

```
Participante paga $100
    ↓
Stripe procesa en cuenta de SorteoHub
    ↓
SorteoHub recibe $100 (menos fee de Stripe ~3.6% + $3 MXN)
    ↓
SorteoHub retiene comisión según plan:
  - Free: 6.5% = $6.50
  - Pro: 5.5% = $5.50  
  - Business: 4.5% = $4.50
    ↓
SorteoHub transfiere al creador:
  - Free: $93.50
  - Pro: $94.50
  - Business: $95.50
```

### ¿Por qué este modelo?

**Stripe Connect** es la solución ideal para marketplaces como SorteoHub porque:

1. ✅ **El dinero pasa por tu plataforma** - Tú recibes el pago completo
2. ✅ **Comisiones automáticas** - Stripe retiene el % según el plan del creador
3. ✅ **Pagos automáticos** - El dinero se transfiere al creador automáticamente
4. ✅ **Múltiples métodos de pago** - Cards, OXXO (México), Meses sin intereses
5. ✅ **Cumplimiento legal** - Stripe maneja KYC, impuestos, reportes
6. ✅ **Escalable** - Funciona desde 1 hasta millones de transacciones

## 📊 Flujo de Pago con Comisiones

```
Participante paga $100
    ↓
Stripe recibe $100
    ↓
SorteoHub recibe $100 (menos fee de Stripe ~2.9% + $0.30)
    ↓
SorteoHub retiene comisión según plan:
  - Free: 5% = $5.00
  - Pro: 4% = $4.00  
  - Business: 2.5% = $2.50
    ↓
SorteoHub transfiere al creador:
  - Free: $95.00
  - Pro: $96.00
  - Business: $97.50
```

## 🏗️ Arquitectura Recomendada: Stripe Connect Express

**Express Accounts** (Recomendado para empezar):
- ✅ Setup rápido (5 minutos por creador)
- ✅ Stripe maneja KYC/verificación
- ✅ Pagos automáticos al creador
- ✅ Dashboard para creadores

**Flujo:**
1. Creador se registra → Conecta cuenta Stripe Express
2. Participante paga → Stripe procesa
3. Stripe retiene comisión automáticamente
4. Stripe transfiere al creador (según tu configuración)

## 💰 Métodos de Pago para México

Según [Stripe Payment Methods](https://docs.stripe.com/payments/payment-methods/overview#cards):

### Recomendados para SorteoHub:

1. **Cards** (Visa, Mastercard, Amex) - ✅ Esencial
   - Aceptado globalmente
   - Conversión alta
   - Procesamiento inmediato

2. **OXXO** (Vouchers) - ✅ Muy importante en México
   - Pago en efectivo en tiendas OXXO
   - Popular para usuarios sin tarjeta
   - Vence en 3 días

3. **Meses sin intereses** (Buy now, pay later) - ✅ Opcional
   - Aumenta conversión
   - Solo para montos mayores ($500+)

4. **Bank Transfer** (México) - ✅ Para montos grandes
   - Transferencia bancaria directa
   - Sin comisiones adicionales

## 📋 Plan de Implementación

### Fase 1: Setup Básico (Día 1-2)

#### 1.1 Instalar Dependencias

```bash
cd backend
npm install stripe
```

```bash
cd src
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### 1.2 Configurar Variables de Entorno

Agregar a `backend/config.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Connect
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_APPLICATION_FEE_PERCENT=0  # Se calcula dinámicamente según plan
```

#### 1.3 Crear Tabla para Stripe Connect

```sql
-- backend/migrations/add_stripe_connect.sql
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) NOT NULL UNIQUE,
  account_type VARCHAR(50) DEFAULT 'express', -- express, standard, custom
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  email VARCHAR(255),
  country VARCHAR(2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_accounts_user ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_id ON stripe_connect_accounts(stripe_account_id);
```

### Fase 2: Backend - Stripe Connect (Día 3-4)

#### 2.1 Crear Servicio de Stripe

```javascript
// backend/services/stripe.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Crear cuenta Express para creador
async function createConnectAccount(userId, email) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'MX', // México
    email: email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      user_id: userId.toString(),
    },
  });
  
  return account;
}

// Crear link de onboarding
async function createAccountLink(accountId, returnUrl, refreshUrl) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  
  return accountLink;
}

// Calcular comisión según plan
async function calculateCommission(amount, userId) {
  const { query } = require('../config/database');
  
  // Obtener plan del usuario
  const planResult = await query(`
    SELECT cp.commission_pct
    FROM user_plan_subscriptions ups
    JOIN creator_plans cp ON ups.plan_id = cp.id
    WHERE ups.user_id = $1 AND ups.status = 'active'
  `, [userId]);
  
  const commissionPct = planResult.rows[0]?.commission_pct || 5.00; // Default Free
  const commission = (amount * commissionPct) / 100;
  
  return {
    commission,
    commissionPct,
    amountToCreator: amount - commission
  };
}

// Crear Payment Intent con comisión
async function createPaymentIntent(amount, currency, userId, rifaId, metadata = {}) {
  // Obtener cuenta Stripe del creador
  const { query } = require('../config/database');
  const accountResult = await query(`
    SELECT stripe_account_id
    FROM stripe_connect_accounts
    WHERE user_id = $1 AND charges_enabled = true
  `, [userId]);
  
  if (accountResult.rows.length === 0) {
    throw new Error('Creador no tiene cuenta Stripe conectada');
  }
  
  const connectedAccountId = accountResult.rows[0].stripe_account_id;
  
  // Calcular comisión
  const { commission, commissionPct } = await calculateCommission(amount, userId);
  
  // Crear Payment Intent en cuenta conectada
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convertir a centavos
    currency: currency || 'mxn',
    application_fee_amount: Math.round(commission * 100),
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata: {
      user_id: userId.toString(),
      rifa_id: rifaId.toString(),
      commission_pct: commissionPct.toString(),
      ...metadata
    },
  }, {
    stripeAccount: connectedAccountId, // Crear en cuenta del creador
  });
  
  return paymentIntent;
}

module.exports = {
  createConnectAccount,
  createAccountLink,
  calculateCommission,
  createPaymentIntent,
  stripe
};
```

#### 2.2 Crear Rutas de Stripe Connect

```javascript
// backend/routes/stripe.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');
const {
  createConnectAccount,
  createAccountLink,
  createPaymentIntent,
  calculateCommission
} = require('../services/stripe');

// POST /api/stripe/connect/create-account
// Creador solicita conectar su cuenta Stripe
router.post('/connect/create-account', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Verificar si ya tiene cuenta
    const existing = await query(
      'SELECT * FROM stripe_connect_accounts WHERE user_id = $1',
      [userId]
    );
    
    if (existing.rows.length > 0) {
      const account = existing.rows[0];
      if (account.charges_enabled) {
        return res.json({
          connected: true,
          accountId: account.stripe_account_id
        });
      }
      
      // Crear nuevo link de onboarding
      const accountLink = await createAccountLink(
        account.stripe_account_id,
        `${process.env.FRONTEND_URL}/dashboard?stripe=success`,
        `${process.env.FRONTEND_URL}/dashboard?stripe=refresh`
      );
      
      return res.json({
        connected: false,
        onboardingUrl: accountLink.url
      });
    }
    
    // Crear nueva cuenta Express
    const account = await createConnectAccount(userId, userEmail);
    
    // Guardar en BD
    await query(`
      INSERT INTO stripe_connect_accounts 
      (user_id, stripe_account_id, account_type, email)
      VALUES ($1, $2, 'express', $3)
    `, [userId, account.id, userEmail]);
    
    // Crear link de onboarding
    const accountLink = await createAccountLink(
      account.id,
      `${process.env.FRONTEND_URL}/dashboard?stripe=success`,
      `${process.env.FRONTEND_URL}/dashboard?stripe=refresh`
    );
    
    res.json({
      connected: false,
      onboardingUrl: accountLink.url
    });
    
  } catch (error) {
    console.error('Error creando cuenta Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stripe/connect/status
// Verificar estado de cuenta Stripe
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
      return res.json({ connected: false });
    }
    
    const account = result.rows[0];
    
    res.json({
      connected: account.charges_enabled && account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      accountId: account.stripe_account_id
    });
    
  } catch (error) {
    console.error('Error verificando cuenta Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stripe/payment-intent
// Crear Payment Intent para participar en rifa
router.post('/payment-intent', authenticateToken, async (req, res) => {
  try {
    const { rifaId, amount, currency = 'mxn', numerosSeleccionados } = req.body;
    
    if (!rifaId || !amount) {
      return res.status(400).json({ error: 'rifaId y amount son requeridos' });
    }
    
    // Obtener creador de la rifa
    const rifaResult = await query(`
      SELECT usuario_id, precio
      FROM rifas
      WHERE id = $1
    `, [rifaId]);
    
    if (rifaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rifa no encontrada' });
    }
    
    const creadorId = rifaResult.rows[0].usuario_id;
    const precioRifa = parseFloat(rifaResult.rows[0].precio);
    const totalAmount = precioRifa * (numerosSeleccionados?.length || 1);
    
    // Verificar que el creador tenga cuenta Stripe
    const accountResult = await query(`
      SELECT stripe_account_id, charges_enabled
      FROM stripe_connect_accounts
      WHERE user_id = $1 AND charges_enabled = true
    `, [creadorId]);
    
    if (accountResult.rows.length === 0) {
      return res.status(400).json({
        error: 'El creador de esta rifa no tiene cuenta de pago configurada'
      });
    }
    
    // Crear Payment Intent
    const paymentIntent = await createPaymentIntent(
      totalAmount,
      currency,
      creadorId,
      rifaId,
      {
        participante_id: req.user.id.toString(),
        numeros: numerosSeleccionados?.join(',') || ''
      }
    );
    
    // Calcular comisión para mostrar al participante
    const commission = await calculateCommission(totalAmount, creadorId);
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      commission: commission.commission,
      commissionPct: commission.commissionPct,
      amountToCreator: commission.amountToCreator,
      currency: currency
    });
    
  } catch (error) {
    console.error('Error creando Payment Intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stripe/webhook
// Webhook para eventos de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Manejar eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
      
    case 'account.updated':
      const account = event.data.object;
      await handleAccountUpdate(account);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});

async function handlePaymentSuccess(paymentIntent) {
  const { rifa_id, participante_id, numeros } = paymentIntent.metadata;
  
  // Registrar participación en BD
  // Actualizar estado de números
  // Notificar al creador
}

async function handleAccountUpdate(account) {
  // Actualizar estado de cuenta en BD
  await query(`
    UPDATE stripe_connect_accounts
    SET 
      charges_enabled = $1,
      payouts_enabled = $2,
      details_submitted = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE stripe_account_id = $4
  `, [
    account.charges_enabled,
    account.payouts_enabled,
    account.details_submitted,
    account.id
  ]);
}

module.exports = router;
```

### Fase 3: Frontend - Integración (Día 5-6)

#### 3.1 Componente de Conexión Stripe

```javascript
// src/components/StripeConnectButton.js
import React, { useState, useEffect } from 'react';
import { showSuccess, showError, showInfo } from '../utils/swal';

const StripeConnectButton = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkStatus();
  }, []);
  
  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/stripe/connect/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnect = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/stripe/connect/create-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.connected) {
        await showSuccess('Cuenta conectada', 'Tu cuenta Stripe ya está conectada y lista para recibir pagos.');
      } else {
        // Redirigir a onboarding
        window.location.href = data.onboardingUrl;
      }
    } catch (error) {
      showError('Error', 'No se pudo conectar tu cuenta Stripe. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (status?.connected) {
    return (
      <div className="stripe-connected">
        <p>✅ Cuenta Stripe conectada</p>
        <p>Puedes recibir pagos automáticamente</p>
      </div>
    );
  }
  
  return (
    <div className="stripe-connect">
      <h3>Conecta tu cuenta para recibir pagos</h3>
      <p>Necesitas conectar una cuenta Stripe para recibir pagos de tus rifas.</p>
      <button onClick={handleConnect} disabled={loading}>
        Conectar con Stripe
      </button>
    </div>
  );
};

export default StripeConnectButton;
```

#### 3.2 Componente de Pago con Stripe

```javascript
// src/components/StripePayment.js
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { showSuccess, showError, showLoading } from '../utils/swal';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ rifaId, amount, numerosSeleccionados, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setLoading(true);
    showLoading('Procesando pago...', 'Por favor, espera mientras procesamos tu pago');
    
    try {
      // Crear Payment Intent
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rifaId,
          amount,
          numerosSeleccionados
        })
      });
      
      const { clientSecret } = await response.json();
      
      // Confirmar pago
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/participar/${rifaId}?success=true`
        },
        redirect: 'if_required'
      });
      
      if (error) {
        showError('Error en el pago', error.message);
      } else if (paymentIntent.status === 'succeeded') {
        await showSuccess('¡Pago exitoso!', 'Tu participación ha sido registrada.');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      showError('Error', 'No se pudo procesar el pago. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function StripePayment({ rifaId, amount, numerosSeleccionados, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        rifaId={rifaId}
        amount={amount}
        numerosSeleccionados={numerosSeleccionados}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
```

## 🚀 Pasos para Activar

### 1. Crear Cuenta Stripe
- Ir a https://stripe.com
- Crear cuenta (modo test primero)
- Activar Stripe Connect en Dashboard

### 2. Obtener API Keys
- Dashboard → Developers → API keys
- Copiar `Secret key` y `Publishable key`

### 3. Configurar Webhook
- Dashboard → Developers → Webhooks
- Agregar endpoint: `https://tu-dominio.com/api/stripe/webhook`
- Seleccionar eventos: `payment_intent.succeeded`, `account.updated`

### 4. Ejecutar Migración
```bash
psql -U postgres -d rifas_digital -f backend/migrations/add_stripe_connect.sql
```

### 5. Agregar Rutas al Server
```javascript
// backend/server.js
const stripeRoutes = require('./routes/stripe');
app.use('/api/stripe', stripeRoutes);
```

## 💡 Ventajas de este Enfoque

1. **Comisiones Automáticas** - Stripe calcula y retiene el % según plan
2. **Pagos Automáticos** - El dinero llega al creador sin intervención manual
3. **Cumplimiento Legal** - Stripe maneja KYC, impuestos, reportes fiscales
4. **Múltiples Métodos** - Cards, OXXO, Meses sin intereses
5. **Escalable** - Funciona desde 1 hasta millones de transacciones
6. **Seguro** - PCI compliant, manejo de fraudes

## 📊 Costos Estimados

- **Stripe Fee**: 2.9% + $0.30 MXN por transacción
- **Tu Comisión**: Según plan (2.5% - 5%)
- **Total para participante**: Sin cambios (paga el precio de la rifa)
- **Creador recibe**: Precio - Stripe Fee - Tu Comisión

**Ejemplo:**
- Participante paga: $100 MXN
- Stripe retiene: $3.20 MXN (2.9% + $0.30)
- Tu retienes (Free plan): $5.00 MXN (5%)
- Creador recibe: $91.80 MXN

## ⚠️ Consideraciones

1. **Onboarding de Creadores** - Necesitan completar KYC en Stripe
2. **Tiempo de Pago** - Stripe transfiere en 2-7 días (configurable)
3. **Reembolsos** - Debes manejar reembolsos manualmente
4. **Disputas** - Stripe maneja disputas, pero afecta tu cuenta

## 🎯 Próximos Pasos

1. ✅ Crear cuenta Stripe
2. ✅ Ejecutar migración de BD
3. ✅ Implementar backend (rutas)
4. ✅ Implementar frontend (componentes)
5. ✅ Testing en modo test
6. ✅ Activar en producción

¿Quieres que implemente el código completo ahora?

