import React, { useState, useEffect } from 'react';
import { showSuccess, showError, showInfo } from '../utils/swal';
import './StripeConnectButton.css';

import { API_BASE } from '../config/api';

const StripeConnectButton = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkStatus();
  }, []);
  
  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/stripe/connect/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error verificando estado Stripe:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnect = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showError('Error', 'Debes iniciar sesión para conectar tu cuenta Stripe');
        return;
      }
      
      const response = await fetch(`${API_BASE}/stripe/connect/create-account`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar cuenta');
      }
      
      if (data.connected) {
        await showSuccess('Cuenta conectada', 'Tu cuenta Stripe ya está conectada y lista para recibir pagos.');
        await checkStatus();
      } else {
        // Redirigir a onboarding de Stripe
        window.location.href = data.onboardingUrl;
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error', error.message || 'No se pudo conectar tu cuenta Stripe. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/stripe/connect/login-link`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
      } else {
        showError('Error', 'No se pudo abrir el dashboard de Stripe');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error', 'Error al abrir dashboard de Stripe');
    }
  };
  
  if (loading) {
    return (
      <div className="stripe-connect-loading">
        <div className="spinner"></div>
        <p>Verificando estado de cuenta...</p>
      </div>
    );
  }
  
  if (status?.connected) {
    return (
      <div className="stripe-connected">
        <div className="stripe-status-header">
          <div className="stripe-status-icon success">✓</div>
          <div>
            <h3>Cuenta Stripe Conectada</h3>
            <p>Tu cuenta está lista para recibir pagos automáticamente</p>
          </div>
        </div>
        <div className="stripe-status-details">
          <div className="status-item">
            <span className="label">Estado:</span>
            <span className="value success">Activa</span>
          </div>
          <div className="status-item">
            <span className="label">Pagos:</span>
            <span className="value">{status.chargesEnabled ? '✓ Habilitados' : '✗ Deshabilitados'}</span>
          </div>
          <div className="status-item">
            <span className="label">Transferencias:</span>
            <span className="value">{status.payoutsEnabled ? '✓ Habilitadas' : '✗ Deshabilitadas'}</span>
          </div>
        </div>
        <button 
          className="btn-stripe-dashboard"
          onClick={handleOpenDashboard}
        >
          Abrir Dashboard de Stripe
        </button>
      </div>
    );
  }
  
  return (
    <div className="stripe-connect">
      <div className="stripe-connect-header">
        <div className="stripe-logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.467-5.851-6.591-7.305h.001z" fill="#635BFF"/>
          </svg>
        </div>
        <div>
          <h3>Conecta tu cuenta Stripe</h3>
          <p>Necesitas conectar una cuenta Stripe para recibir pagos de tus rifas automáticamente</p>
        </div>
      </div>
      
      <div className="stripe-benefits">
        <div className="benefit-item">
          <span className="benefit-icon">💳</span>
          <span>Recibe pagos automáticamente</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">⚡</span>
          <span>Transferencias en 2-7 días</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">🔒</span>
          <span>Seguro y confiable</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">📊</span>
          <span>Dashboard completo de pagos</span>
        </div>
      </div>
      
      <button 
        className="btn-stripe-connect"
        onClick={handleConnect}
        disabled={loading}
      >
        {loading ? 'Conectando...' : 'Conectar con Stripe'}
      </button>
      
      <p className="stripe-info">
        Al hacer clic, serás redirigido a Stripe para completar la configuración de tu cuenta.
        El proceso toma aproximadamente 5 minutos.
      </p>
    </div>
  );
};

export default StripeConnectButton;

