import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5001/api';

const BusinessProfile = () => {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const res = await fetch(`${API_BASE}/advertisers/${id}/public`);
        const data = await res.json();
        
        if (res.ok) {
          setBusiness(data.business);
        } else {
          setError(data.error || 'Negocio no encontrado');
        }
      } catch (err) {
        console.error('Error cargando negocio:', err);
        setError('Error cargando información del negocio');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBusiness();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="business-profile-container">
        <div className="container">
          <div className="loading">Cargando información del negocio...</div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="business-profile-container">
        <div className="container">
          <div className="error-message">
            <h2>Negocio no encontrado</h2>
            <p>{error || 'El negocio que buscas no existe o no está disponible'}</p>
            <Link to="/portal" className="btn-primary">Volver al Portal</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="business-profile-container">
      <div className="container">
        <div className="business-profile">
          {/* Header del negocio */}
          <div className="business-profile-header">
            {business.logo_url ? (
              <img 
                src={business.logo_url} 
                alt={business.nombre_comercial || business.nombre}
                className="business-profile-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="business-profile-logo-fallback" 
              style={{ display: business.logo_url ? 'none' : 'flex' }}
            >
              🏪
            </div>
            <div className="business-profile-info">
              <h1>{business.nombre_comercial || business.nombre}</h1>
              {business.categoria && (
                <span className="business-profile-category">{business.categoria}</span>
              )}
              {business.descripcion_negocio && (
                <p className="business-profile-description">{business.descripcion_negocio}</p>
              )}
            </div>
          </div>

          {/* Información de contacto */}
          {(business.telefono || business.email) && (
            <div className="business-profile-contact">
              <h3>📞 Información de Contacto</h3>
              <div className="contact-info">
                {business.telefono && (
                  <div className="contact-item">
                    <span className="contact-label">Teléfono:</span>
                    <a href={`tel:${business.telefono}`}>{business.telefono}</a>
                  </div>
                )}
                {business.email && (
                  <div className="contact-item">
                    <span className="contact-label">Email:</span>
                    <a href={`mailto:${business.email}`}>{business.email}</a>
                  </div>
                )}
                {business.pagina_url && (
                  <div className="contact-item">
                    <span className="contact-label">Sitio Web:</span>
                    <a 
                      href={business.pagina_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        // No registrar click aquí porque es solo información de contacto, no un anuncio
                        // El link se abre normalmente
                      }}
                    >
                      {business.pagina_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cupones del negocio */}
          {business.cupones && business.cupones.length > 0 && (
            <div className="business-profile-cupones">
              <h3>🎟️ Cupones y Descuentos</h3>
              <div className="business-cupones-grid">
                {business.cupones.map((cupon) => {
                  const handleCopyCode = async (e) => {
                    e.preventDefault();
                    try {
                      await navigator.clipboard.writeText(cupon.codigo);
                      setCopiedCode(cupon.id);
                      setTimeout(() => setCopiedCode(null), 2000);
                    } catch (err) {
                      console.error('Error copiando código:', err);
                    }
                  };

                  return (
                    <div key={cupon.id} className="business-cupon-card">
                      {cupon.imagen_url && (
                        <div className="business-cupon-image">
                          <img src={cupon.imagen_url} alt={cupon.titulo} />
                        </div>
                      )}
                      <div className="business-cupon-content">
                        <div className="business-cupon-header">
                          <h4>{cupon.titulo}</h4>
                          <div className="business-cupon-descuento">
                            {cupon.descuento_tipo === 'porcentaje' ? (
                              <span className="descuento-badge">{cupon.descuento_valor}% OFF</span>
                            ) : (
                              <span className="descuento-badge">${cupon.descuento_valor} OFF</span>
                            )}
                          </div>
                        </div>
                        {cupon.descripcion && (
                          <p className="business-cupon-descripcion">{cupon.descripcion}</p>
                        )}
                        <div className="business-cupon-info">
                          {cupon.monto_minimo > 0 && (
                            <div className="cupon-info-item">
                              <span>Mínimo de compra: ${cupon.monto_minimo}</span>
                            </div>
                          )}
                          <div className="cupon-info-item">
                            <span>Válido hasta: {new Date(cupon.fecha_fin).toLocaleDateString('es-MX')}</span>
                          </div>
                        </div>
                        <div className="business-cupon-code">
                          <div className="cupon-code-display">
                            <span className="cupon-code-text">{cupon.codigo}</span>
                            <button
                              className="cupon-copy-btn"
                              onClick={handleCopyCode}
                              title="Copiar código"
                            >
                              {copiedCode === cupon.id ? '✓ Copiado' : '📋 Copiar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Anuncios del negocio */}
          {business.ads && business.ads.length > 0 && (
            <div className="business-profile-ads">
              <h3>📢 Anuncios y Ofertas</h3>
              <div className="business-ads-grid">
                {business.ads.map((ad) => {
                  const handleAdClick = async (e) => {
                    e.preventDefault();
                    
                    // Registrar click en el backend
                    try {
                      await fetch(`${API_BASE}/ads/${ad.id}/click`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: window.location.pathname })
                      });
                    } catch (err) {
                      console.error('Error registrando click:', err);
                    }
                    
                    // Abrir URL en nueva pestaña
                    window.open(ad.url_destino, '_blank', 'noopener,noreferrer');
                  };

                  return (
                    <a
                      key={ad.id}
                      href={ad.url_destino}
                      onClick={handleAdClick}
                      className="business-ad-card"
                    >
                      {ad.imagen_url ? (
                        <div className="business-ad-image">
                          <img src={ad.imagen_url} alt={ad.titulo} />
                        </div>
                      ) : null}
                      <div className="business-ad-content">
                        <h4>{ad.titulo}</h4>
                        {ad.descripcion_corta && (
                          <p>{ad.descripcion_corta}</p>
                        )}
                        {ad.categoria && (
                          <span className="business-ad-category">{ad.categoria}</span>
                        )}
                      </div>
                      <div className="business-ad-arrow">→</div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botón de acción */}
          {business.pagina_url && (
            <div className="business-profile-cta">
              <a
                href={business.pagina_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-large"
              >
                🌐 Visitar Sitio Web
              </a>
            </div>
          )}

          {/* Volver */}
          <div className="business-profile-back">
            <Link to="/portal" className="btn-secondary">
              ← Volver al Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;

