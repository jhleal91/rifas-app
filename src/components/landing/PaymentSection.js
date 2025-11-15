import React from 'react';

const PaymentSection = () => {
  return (
    <section className="payment-section">
      <div className="container">
        <div className="payment-content">
          <div className="payment-header">
            <div className="payment-icon">🔒</div>
            <h2 className="section-title">
              <span className="section-icon">💳</span>
              Pagos Seguros con Stripe
            </h2>
            <p className="payment-subtitle">
              Integración completa con Stripe para procesar pagos de forma segura y automática
            </p>
          </div>

          <div className="payment-features-grid">
            <div className="payment-feature-card">
              <div className="payment-feature-icon">✅</div>
              <h3>Pago con Tarjeta</h3>
              <p>Los participantes pueden pagar directamente con tarjeta de crédito o débito. Proceso instantáneo y seguro.</p>
            </div>

            <div className="payment-feature-card">
              <div className="payment-feature-icon">🏦</div>
              <h3>Transferencia Automática</h3>
              <p>El dinero se transfiere automáticamente a la cuenta bancaria que registres al crear tu rifa. SorteoHub retiene solo la comisión de tu plan.</p>
            </div>

            <div className="payment-feature-card">
              <div className="payment-feature-icon">🛡️</div>
              <h3>Seguridad Garantizada</h3>
              <p>Procesado por Stripe, líder mundial en pagos online. Tus datos y los de tus participantes están completamente protegidos.</p>
            </div>

            <div className="payment-feature-card">
              <div className="payment-feature-icon">⚡</div>
              <h3>Proceso Automático</h3>
              <p>Sin intervención manual. Los pagos se procesan automáticamente y las participaciones se registran al instante.</p>
            </div>
          </div>

          <div className="payment-info-box">
            <div className="info-box-icon">ℹ️</div>
            <div className="info-box-content">
              <h4>¿Cómo funciona el pago?</h4>
              <ol>
                <li>Al crear tu rifa, registras los datos de tu cuenta bancaria (CLABE, banco, titular)</li>
                <li>Los participantes seleccionan números y pagan con tarjeta a través de Stripe</li>
                <li>SorteoHub procesa el pago y retiene la comisión de tu plan</li>
                <li>El dinero restante se transfiere automáticamente a tu cuenta bancaria</li>
              </ol>
            </div>
          </div>

          <div className="stripe-badge">
            <p>Pagos procesados de forma segura por</p>
            <div className="stripe-logo">
              <strong>Stripe</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentSection;

