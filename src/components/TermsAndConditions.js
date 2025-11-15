import React, { useState } from 'react';

const TermsAndConditions = ({ onAccept, onDecline }) => {
  const [hasRead, setHasRead] = useState(false);

  return (
    <div className="terms-modal">
      <div className="terms-content">
        <h2>📋 Términos y Condiciones</h2>
        
        <div className="terms-text">
          <h3>🎯 Propósito de la Plataforma</h3>
          <p>
            <strong>SorteoHub</strong> es una plataforma tecnológica que facilita la creación y gestión de rifas 
            <strong> SIN FINES DE LUCRO</strong>. Nuestro objetivo es conectar organizadores con participantes 
            de manera transparente y segura.
          </p>

          <h3>💰 Modelo de Negocio</h3>
          <p>
            • <strong>Las rifas son SIN FINES DE LUCRO</strong> - Los organizadores no pueden obtener ganancias<br/>
            • <strong>Comisión de plataforma:</strong> 5% del total recaudado (cubre costos operativos)<br/>
            • <strong>Transparencia total:</strong> Todos los montos son visibles públicamente
          </p>

          <h3>🎲 Sorteos en Vivo</h3>
          <p>
            <strong>OBLIGATORIO:</strong> Todos los sorteos deben realizarse en vivo para garantizar transparencia:
          </p>
          <ul>
            <li>📱 <strong>Transmisión en vivo:</strong> Facebook Live, Instagram Live, YouTube Live o Zoom</li>
            <li>📅 <strong>Fecha y hora:</strong> Deben especificarse al crear la rifa</li>
            <li>🎯 <strong>Método de sorteo:</strong> Ruleta digital, bolas numeradas, o aplicación de sorteo</li>
            <li>📹 <strong>Grabación:</strong> El sorteo debe quedar grabado como evidencia</li>
            <li>👥 <strong>Testigos:</strong> Mínimo 2 testigos independientes presentes</li>
          </ul>

          <h3>⚖️ Responsabilidades del Organizador</h3>
          <ul>
            <li>✅ Garantizar que la rifa es sin fines de lucro</li>
            <li>✅ Realizar el sorteo en vivo según lo programado</li>
            <li>✅ Entregar premios a los ganadores en tiempo y forma</li>
            <li>✅ Mantener transparencia en todo el proceso</li>
            <li>✅ Cumplir con las leyes locales aplicables</li>
          </ul>

          <h3>🛡️ Protección de Participantes</h3>
          <ul>
            <li>🔒 <strong>Datos seguros:</strong> Información personal protegida</li>
            <li>💳 <strong>Pagos seguros:</strong> Transferencias bancarias verificables</li>
            <li>📞 <strong>Soporte:</strong> Atención al cliente disponible</li>
            <li>⚖️ <strong>Resolución de disputas:</strong> Proceso claro de reclamos</li>
          </ul>

          <h3>🚫 Prohibiciones</h3>
          <ul>
            <li>❌ Rifas con fines de lucro</li>
            <li>❌ Sorteos no transmitidos en vivo</li>
            <li>❌ Manipulación de resultados</li>
            <li>❌ Uso de datos personales para otros fines</li>
            <li>❌ Rifas que violen leyes locales</li>
          </ul>

          <h3>📞 Contacto y Soporte</h3>
          <p>
            Para dudas, reclamos o soporte técnico:<br/>
            📧 Email: soporte@rifasdigital.com<br/>
            📱 WhatsApp: +52 55 1234 5678<br/>
            🌐 Web: www.rifasdigital.com
          </p>
        </div>

        <div className="terms-checkbox">
          <label>
            <input 
              type="checkbox" 
              checked={hasRead}
              onChange={(e) => setHasRead(e.target.checked)}
            />
            He leído y acepto los términos y condiciones
          </label>
        </div>

        <div className="terms-actions">
          <button 
            className="btn-secondary"
            onClick={onDecline}
          >
            Cancelar
          </button>
          <button 
            className="btn-primary"
            onClick={onAccept}
            disabled={!hasRead}
          >
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
