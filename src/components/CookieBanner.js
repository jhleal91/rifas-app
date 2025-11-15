import React, { useState, useEffect } from 'react';
import './CookieBanner.css';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (!cookiesAccepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiesAcceptedDate', new Date().toISOString());
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookiesAccepted', 'false');
    localStorage.setItem('cookiesAcceptedDate', new Date().toISOString());
    setShowBanner(false);
    // Aquí puedes desactivar cookies no esenciales si es necesario
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-content">
        <div className="cookie-banner-text">
          <h4>🍪 Uso de Cookies</h4>
          <p>
            Utilizamos cookies para mejorar tu experiencia, analizar el tráfico del sitio y personalizar el contenido.
            Al continuar navegando, aceptas nuestro uso de cookies.
          </p>
        </div>
        <div className="cookie-banner-actions">
          <a href="/politica-cookies" className="cookie-link">
            Más información
          </a>
          <button onClick={handleReject} className="cookie-btn cookie-btn-reject">
            Rechazar
          </button>
          <button onClick={handleAccept} className="cookie-btn cookie-btn-accept">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;

