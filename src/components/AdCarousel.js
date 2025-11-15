import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:5001/api';

// Banner promocional por defecto - se traduce dinámicamente
const getPromotionalBanner = (t) => ({
  id: 'promotional-default',
  titulo: t('adCarousel.promotionalTitle'),
  descripcion_corta: t('adCarousel.promotionalDescription'),
  categoria: t('adCarousel.advertising'),
  isPromotional: true
});

const AdCarousel = ({ 
  placement = 'portal_top',
  interval = 35000, // 35 segundos por defecto
  className = '',
  maxAds = 5 // Máximo de anuncios a mostrar
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [displayItems, setDisplayItems] = useState([]); // Anuncios + banners promocionales
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Validar URL de imagen
  const isValidImageUrl = (url) => {
    if (!url) return false;
    if (url.includes('google.com/url?') || url.includes('images.google.com') || 
        url.includes('shutterstock.com/search') || url.includes('redirect')) {
      return false;
    }
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Cargar anuncios
  useEffect(() => {
    let mounted = true;
    const loadAds = async () => {
      try {
        const res = await fetch(`${API_BASE}/ads/placements?placement=${placement}`);
        const data = await res.json();
        if (mounted && data.ads && data.ads.length > 0) {
          const validAds = data.ads.slice(0, maxAds);
          setAds(validAds);
          
          // Intercalar banner promocional cada 3 anuncios
          const itemsWithPromo = [];
          const promotionalBanner = getPromotionalBanner(t);
          validAds.forEach((ad, index) => {
            itemsWithPromo.push(ad);
            // Insertar banner promocional cada 3 anuncios (después del 2do, 5to, 8vo, etc.)
            if ((index + 1) % 3 === 0 && index < validAds.length - 1) {
              itemsWithPromo.push(promotionalBanner);
            }
          });
          
          // Si hay menos de 3 anuncios, agregar el banner promocional al final
          if (validAds.length > 0 && validAds.length < 3) {
            itemsWithPromo.push(promotionalBanner);
          }
          
          setDisplayItems(itemsWithPromo);
          
          // Track impressions solo de anuncios reales
          validAds.forEach(ad => {
            fetch(`${API_BASE}/ads/${ad.id}/impression`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: window.location.pathname })
            }).catch(() => {});
          });
        } else {
          // Si no hay anuncios, mostrar solo el banner promocional
          setDisplayItems([getPromotionalBanner(t)]);
        }
      } catch (e) {
        console.error('Error cargando anuncios:', e);
      } finally {
        setLoading(false);
      }
    };
    loadAds();
    return () => { mounted = false; };
  }, [placement, maxAds, t]);

  // Rotación automática
  useEffect(() => {
    if (displayItems.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, interval);

    return () => clearInterval(timer);
  }, [displayItems.length, interval]);

  const handleAdClick = async (ad) => {
    // Si es banner promocional, redirigir al portal de anunciantes
    if (ad.isPromotional) {
      navigate('/anunciantes?mode=register');
      return;
    }

    try {
      await fetch(`${API_BASE}/ads/${ad.id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: window.location.pathname })
      });
    } catch (e) {}
    window.open(ad.url_destino, '_blank');
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  const handleImageError = (adId) => {
    setImageErrors(prev => ({ ...prev, [adId]: true }));
  };

  if (loading) {
    return null; // O un placeholder de carga
  }

  if (displayItems.length === 0) {
    return (
      <div className={`ad-carousel-placeholder ${className}`}>
        <div className="ad-carousel-banner ad-banner-placeholder">
          <div className="ad-banner-placeholder-content">
            <div className="ad-banner-placeholder-icon">📢</div>
            <div className="ad-banner-placeholder-text">
              <div>Espacio Publicitario</div>
              <small>Tu marca aquí</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = displayItems[currentIndex];
  const isPromotional = currentItem.isPromotional;
  const hasValidImage = !isPromotional && currentItem.imagen_url && 
                        isValidImageUrl(currentItem.imagen_url) && 
                        !imageErrors[currentItem.id];

  return (
    <div className={`ad-carousel ${className}`}>
      <div className="ad-carousel-wrapper">
        <div 
          className={`ad-carousel-banner ${isPromotional ? 'ad-banner-promotional' : ''}`}
          key={`${currentItem.id}-${currentIndex}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleAdClick(currentItem)}
          title={currentItem.titulo}
          onClick={() => handleAdClick(currentItem)}
        >
          {/* Contenedor horizontal del banner */}
          <div className="ad-banner-content">
            {/* Columna izquierda: Imagen o Icono promocional */}
            {isPromotional ? (
              <div className="ad-banner-image-container ad-banner-promo-image">
                <div className="ad-banner-promo-icon">🚀</div>
                <div className="ad-banner-promo-stars">
                  <span>⭐</span>
                  <span>✨</span>
                  <span>💫</span>
                </div>
                <div className="ad-banner-promo-gradient"></div>
              </div>
            ) : hasValidImage ? (
              <div className="ad-banner-image-container">
                <img 
                  src={currentItem.imagen_url} 
                  alt={currentItem.titulo || 'Anuncio'} 
                  className="ad-banner-image"
                  onError={() => handleImageError(currentItem.id)}
                />
                <div className="ad-banner-image-overlay"></div>
              </div>
            ) : null}

            {/* Columna derecha: Contenido */}
            <div className="ad-banner-text-container">
              <div className="ad-banner-header">
                {currentItem.categoria && (
                  <span className={`ad-banner-category ${isPromotional ? 'ad-banner-category-promo' : ''}`}>
                    {currentItem.categoria}
                  </span>
                )}
                <div className="ad-banner-sponsor">{isPromotional ? t('adCarousel.opportunity') : t('adCarousel.advertising')}</div>
              </div>
              
              <h3 className="ad-banner-title">{currentItem.titulo}</h3>
              
              {currentItem.descripcion_corta && (
                <p className="ad-banner-description">{currentItem.descripcion_corta}</p>
              )}

              {/* Elementos adicionales solo para banner promocional */}
              {isPromotional && (
                <div className="ad-banner-promo-features">
                  <div className="ad-promo-feature-item">
                    <span className="ad-promo-feature-icon">👥</span>
                    <span className="ad-promo-feature-text">{t('adCarousel.thousandsOfUsers')}</span>
                  </div>
                  <div className="ad-promo-feature-item">
                    <span className="ad-promo-feature-icon">📊</span>
                    <span className="ad-promo-feature-text">{t('adCarousel.completeDashboard')}</span>
                  </div>
                  <div className="ad-promo-feature-item">
                    <span className="ad-promo-feature-icon">💰</span>
                    <span className="ad-promo-feature-text">{t('adCarousel.plansFrom')}</span>
                  </div>
                </div>
              )}

              {/* Botón CTA - Siempre al final */}
              {isPromotional ? (
                <button
                  className="ad-banner-cta-promo"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/anunciantes?mode=register');
                  }}
                  type="button"
                >
                  <span className="ad-banner-cta-text">{t('adCarousel.registerAsAdvertiser')}</span>
                  <span className="ad-banner-arrow">→</span>
                </button>
              ) : (
                <div className="ad-banner-cta">
                  <span className="ad-banner-cta-text">{t('adCarousel.viewMoreInfo')}</span>
                  <span className="ad-banner-arrow">→</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores de puntos */}
      {displayItems.length > 1 && (
        <div className="ad-carousel-dots">
          {displayItems.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              className={`ad-carousel-dot ${index === currentIndex ? 'active' : ''} ${item.isPromotional ? 'ad-dot-promo' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Ir al anuncio ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdCarousel;

