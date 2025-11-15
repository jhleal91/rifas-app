import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5001/api';

const CuponesSection = ({ maxCupones = 6, showTitle = true }) => {
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const loadCupones = async () => {
      try {
        const res = await fetch(`${API_BASE}/cupones/public`);
        if (res.ok) {
          const data = await res.json();
          setCupones(data.cupones || []);
        }
      } catch (err) {
        console.error('Error cargando cupones:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCupones();
  }, []);

  const handleCopyCode = async (cuponId, codigo) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiedCode(cuponId);
      setTimeout(() => setCopiedCode(null), 2000);
      
      // Registrar uso del cupón (opcional, para analytics)
      try {
        await fetch(`${API_BASE}/cupones/${cuponId}/use`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            path: window.location.pathname,
            action: 'copy'
          })
        });
      } catch (e) {
        // Silently fail
      }
    } catch (err) {
      console.error('Error copiando código:', err);
    }
  };

  if (loading) {
    return null;
  }

  if (cupones.length === 0) {
    return null;
  }

  const cuponesToShow = cupones.slice(0, maxCupones);

  return (
    <div className="cupones-section-portal">
      {showTitle && (
        <div className="cupones-section-header">
          <h2>
            <span className="cupones-icon">🎟️</span>
            Cupones y Descuentos Disponibles
          </h2>
          <p className="cupones-section-subtitle">
            Aprovecha estos descuentos exclusivos de nuestros negocios patrocinadores
          </p>
        </div>
      )}
      
      <div className="cupones-portal-grid">
        {cuponesToShow.map((cupon) => {
          const businessLink = `/negocio/${cupon.anunciante_id}`;
          
          return (
            <div key={cupon.id} className="cupon-portal-card">
              {cupon.imagen_url ? (
                <div className="cupon-portal-image">
                  <img src={cupon.imagen_url} alt={cupon.titulo} />
                  <div className="cupon-portal-badge-overlay">
                    {cupon.descuento_tipo === 'porcentaje' ? (
                      <span>{parseFloat(cupon.descuento_valor).toFixed(0)}% OFF</span>
                    ) : (
                      <span>${parseFloat(cupon.descuento_valor).toFixed(0)} OFF</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="cupon-portal-image-placeholder">
                  <div className="cupon-portal-badge-overlay">
                    {cupon.descuento_tipo === 'porcentaje' ? (
                      <span>{parseFloat(cupon.descuento_valor).toFixed(0)}% OFF</span>
                    ) : (
                      <span>${parseFloat(cupon.descuento_valor).toFixed(0)} OFF</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="cupon-portal-content">
                <div className="cupon-portal-header">
                  <h3 className="cupon-portal-title">{cupon.titulo}</h3>
                  {cupon.anunciante_nombre && (
                    <Link 
                      to={businessLink} 
                      className="cupon-portal-business-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🏪 {cupon.anunciante_nombre}
                    </Link>
                  )}
                </div>

                {cupon.descripcion && (
                  <p className="cupon-portal-descripcion">{cupon.descripcion}</p>
                )}

                <div className="cupon-portal-info">
                  {cupon.monto_minimo > 0 && (
                    <div className="cupon-portal-info-item">
                      <span className="info-icon">💰</span>
                      <span>Mínimo: ${cupon.monto_minimo}</span>
                    </div>
                  )}
                  <div className="cupon-portal-info-item">
                    <span className="info-icon">📅</span>
                    <span>Válido hasta: {new Date(cupon.fecha_fin).toLocaleDateString('es-MX', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                </div>

                <div className="cupon-portal-code-section">
                  <div className="cupon-portal-code-display">
                    <span className="cupon-portal-code-text">{cupon.codigo}</span>
                    <button
                      className="cupon-portal-copy-btn"
                      onClick={() => handleCopyCode(cupon.id, cupon.codigo)}
                      title="Copiar código"
                    >
                      {copiedCode === cupon.id ? '✓ Copiado' : '📋 Copiar'}
                    </button>
                  </div>
                </div>

                {cupon.anunciante_id && (
                  <Link 
                    to={businessLink} 
                    className="cupon-portal-visit-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver Negocio →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(cupones.length > maxCupones || cupones.length > 0) && (
        <div className="cupones-section-footer">
          {cupones.length > maxCupones && (
            <p>Y {cupones.length - maxCupones} cupones más disponibles</p>
          )}
          <Link to="/cupones" className="btn-view-all-cupones">
            Ver todos los cupones →
          </Link>
        </div>
      )}
    </div>
  );
};

export default CuponesSection;

