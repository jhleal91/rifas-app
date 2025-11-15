import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5001/api';

const SponsoredBusinessesSection = () => {
  const [sponsoredBusinesses, setSponsoredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSponsoredBusinesses = async () => {
      try {
        // Obtener negocios patrocinadores activos
        const res = await fetch(`${API_BASE}/advertisers/sponsors`);
        const data = await res.json();
        
        if (data.businesses && data.businesses.length > 0) {
          // Limitar a 6 negocios para la sección
          setSponsoredBusinesses(data.businesses.slice(0, 6));
        }
      } catch (error) {
        console.error('Error cargando negocios patrocinadores:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSponsoredBusinesses();
  }, []);

  if (loading) {
    return (
      <div className="sponsored-businesses">
        <h3>🏪 Negocios Patrocinadores</h3>
        <div className="business-cards">
          <div className="business-card-skeleton">
            <div className="skeleton-logo"></div>
            <div className="skeleton-info">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sponsoredBusinesses.length === 0) {
    // Si no hay negocios, mostrar mensaje
    return (
      <div className="sponsored-businesses">
        <h3>🏪 Negocios Patrocinadores</h3>
        <div className="business-cards">
          <div className="business-card-empty">
            <p>💡 ¿Tienes un negocio? <Link to="/anunciantes" style={{ color: '#1e22aa', fontWeight: 600 }}>Anúnciate aquí</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sponsored-businesses">
      <h3>🏪 Negocios Patrocinadores</h3>
      <div className="business-cards">
        {sponsoredBusinesses.map((business) => (
          <Link 
            key={business.id} 
            to={`/negocio/${business.id}`}
            className="business-card-link"
          >
            <div className="business-card">
              {business.logo_url ? (
                <div className="business-logo-img">
                  <img 
                    src={business.logo_url} 
                    alt={business.nombre_comercial || business.nombre}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="business-logo-fallback" style={{ display: 'none' }}>
                    {business.categoria ? getCategoryIcon(business.categoria) : '🏪'}
                  </div>
                </div>
              ) : (
                <div className="business-logo">
                  {business.categoria ? getCategoryIcon(business.categoria) : '🏪'}
                </div>
              )}
              <div className="business-info">
                <h4>{business.nombre_comercial || business.nombre}</h4>
                <p>{business.descripcion_negocio || 'Negocio patrocinador'}</p>
                {business.categoria && (
                  <span className="business-category">{business.categoria}</span>
                )}
                {business.total_anuncios > 0 && (
                  <span className="business-stats">
                    {business.total_anuncios} {business.total_anuncios === 1 ? 'anuncio activo' : 'anuncios activos'}
                  </span>
                )}
              </div>
              <div className="business-btn">
                Ver Negocio →
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="sponsored-businesses-footer">
        <p>
          💡 ¿Tienes un negocio? <Link to="/anunciantes" style={{ color: '#1e22aa', fontWeight: 600 }}>Anúnciate aquí</Link>
        </p>
      </div>
    </div>
  );
};

// Función helper para obtener icono según categoría
const getCategoryIcon = (categoria) => {
  const categoryIcons = {
    'tecnologia': '📱',
    'electronica': '💻',
    'restaurantes': '🍕',
    'comida': '🍔',
    'moda': '🛍️',
    'ropa': '👔',
    'servicios': '🔧',
    'salud': '💊',
    'belleza': '💄',
    'deportes': '⚽',
    'libros': '📚',
    'hogar': '🏠',
    'automotriz': '🚗',
    'viajes': '✈️',
    'educacion': '🎓'
  };
  
  const categoriaLower = categoria.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (categoriaLower.includes(key)) {
      return icon;
    }
  }
  
  return '🏪';
};

export default SponsoredBusinessesSection;

