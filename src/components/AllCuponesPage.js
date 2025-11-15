import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const API_BASE = 'http://localhost:5001/api';

const AllCuponesPage = () => {
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const loadAllCupones = async () => {
      try {
        const res = await fetch(`${API_BASE}/cupones/public`);
        if (res.ok) {
          const data = await res.json();
          setCupones(data.cupones || []);
        }
      } catch (err) {
        console.error('Error cargando todos los cupones:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllCupones();
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
    return (
      <div className="all-cupones-page">
        <div className="all-cupones-container">
          <p className="loading-message">Cargando cupones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="all-cupones-page">
      <Helmet>
        <title>Cupones y Descuentos - SorteoHub</title>
        <meta name="description" content="Explora todos los cupones y descuentos disponibles en SorteoHub." />
      </Helmet>
      
      <div className="all-cupones-container">
        <div className="all-cupones-header">
          <h1 className="all-cupones-title">
            <span className="cupones-icon">🎟️</span>
            Canjea tu Cupón
          </h1>
          <p className="all-cupones-subtitle">
            Muestra tu código en el establecimiento para hacer válida tu promoción.
          </p>
        </div>
        
        {cupones.length === 0 ? (
          <div className="no-cupones-message">
            <p>No hay cupones disponibles en este momento.</p>
          </div>
        ) : (
          <div className="cupones-portal-grid all-cupones-grid">
            {cupones.map((cupon) => {
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
                      {cupon.usos_maximos && (
                        <div className="cupon-portal-info-item">
                          <span className="info-icon">👥</span>
                          <span>{cupon.usos_actuales || 0} de {cupon.usos_maximos} usos</span>
                        </div>
                      )}
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
        )}
      </div>
    </div>
  );
};

export default AllCuponesPage;

