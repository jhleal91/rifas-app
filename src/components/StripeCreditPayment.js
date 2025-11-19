import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { showSuccess, showError, showLoading, close } from '../utils/swal';
import { API_BASE, STRIPE_PUBLISHABLE_KEY } from '../config/api';
import './StripePayment.css';

if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === 'pk_test_...') {
  console.warn('⚠️ REACT_APP_STRIPE_PUBLISHABLE_KEY no configurado. Crea un archivo .env en la raíz del proyecto con: REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...');
}

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

function CreditCheckoutForm({ amount, onSuccess, onCancel, clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      showError('Error', 'Stripe no está listo. Por favor, espera un momento.');
      return;
    }
    
    // Verificar que el PaymentElement esté montado
    if (!paymentElementReady) {
      showError('Error', 'El formulario de pago aún no está listo. Por favor, espera un momento.');
      return;
    }
    
    setLoading(true);
    showLoading('Procesando pago...', 'Por favor, espera mientras procesamos tu pago');
    
    try {
      // IMPORTANTE: Llamar a elements.submit() primero para validar el formulario
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        close();
        showError('Error en el formulario', submitError.message);
        setLoading(false);
        return;
      }
      
      // Verificar que el elemento esté listo antes de confirmar
      const paymentElement = elements.getElement('payment');
      if (!paymentElement) {
        throw new Error('El elemento de pago no está disponible');
      }
      
      // Confirmar el pago
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/anunciantes?payment=success`
        },
        redirect: 'if_required'
      });
      
      close(); // Cerrar loading
      
      if (error) {
        showError('Error en el pago', error.message);
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        await showSuccess(
          '¡Pago exitoso!', 
          `Tu crédito de $${amount.toFixed(2)} ha sido cargado exitosamente. Los créditos ya están disponibles en tu cuenta.`
        );
        if (onSuccess) onSuccess(paymentIntent);
      } else {
        showError('Error', 'El pago no se completó. Por favor, intenta nuevamente.');
        setLoading(false);
      }
    } catch (error) {
      close();
      console.error('Error:', error);
      showError('Error', error.message || 'No se pudo procesar el pago. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };
  
  if (!stripe || !elements || !clientSecret) {
    return (
      <div className="stripe-payment-loading">
        <div className="spinner"></div>
        <p>Preparando pago...</p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="payment-summary">
        <div className="summary-item">
          <span>Total a pagar:</span>
          <span className="amount">${amount.toFixed(2)} MXN</span>
        </div>
        <div className="summary-item" style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
          <span>Los créditos se agregarán automáticamente a tu cuenta después del pago.</span>
        </div>
      </div>
      
      <div className="payment-element-container">
        {paymentElementReady ? (
          <p style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '1rem' }}>
            ✓ Formulario de pago listo
          </p>
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Cargando formulario de pago...</p>
          </div>
        )}
        <PaymentElement 
          onReady={() => {
            console.log('PaymentElement está listo');
            setPaymentElementReady(true);
          }}
          onLoadError={(error) => {
            console.error('Error cargando PaymentElement:', error);
            showError('Error', 'No se pudo cargar el formulario de pago. Por favor, recarga la página.');
          }}
          options={{
            layout: 'tabs',
            business: {
              name: 'SorteoHub'
            }
          }}
        />
      </div>
      
      <div className="payment-actions">
        {onCancel && (
          <button 
            type="button" 
            className="btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button 
          type="submit" 
          className="btn-pay"
          disabled={!stripe || !paymentElementReady || loading}
        >
          {loading ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
        </button>
      </div>
      
      <div className="payment-security">
        <p>🔒 Pago seguro procesado por Stripe</p>
      </div>
    </form>
  );
}

export default function StripeCreditPayment({ amount, onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const createPaymentIntent = async () => {
      // Validar monto mínimo de Stripe ($10 MXN)
      const MIN_AMOUNT = 10.00;
      
      if (amount < MIN_AMOUNT) {
        setError(`El monto mínimo para cargar créditos es $${MIN_AMOUNT.toFixed(2)} MXN`);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const token = localStorage.getItem('advertiserToken');
        
        if (!token) {
          setError('No estás autenticado. Por favor, inicia sesión.');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`${API_BASE}/stripe/credit-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount,
            currency: 'mxn'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Error al crear intención de pago');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setLoading(false);
      } catch (error) {
        console.error('Error creando Payment Intent:', error);
        setError(error.message);
        setLoading(false);
        showError('Error', error.message);
      }
    };
    
    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount]);
  
  if (loading) {
    return (
      <div className="stripe-payment-loading">
        <div className="spinner"></div>
        <p>Preparando pago...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="stripe-payment-error">
        <p>❌ {error}</p>
        {onCancel && (
          <button onClick={onCancel} className="btn-cancel">
            Cerrar
          </button>
        )}
      </div>
    );
  }
  
  if (!clientSecret) {
    return (
      <div className="stripe-payment-error">
        <p>No se pudo inicializar el pago. Por favor, intenta nuevamente.</p>
        {onCancel && (
          <button onClick={onCancel} className="btn-cancel">
            Cerrar
          </button>
        )}
      </div>
    );
  }
  
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CreditCheckoutForm 
        amount={amount} 
        onSuccess={onSuccess} 
        onCancel={onCancel}
        clientSecret={clientSecret}
      />
    </Elements>
  );
}

