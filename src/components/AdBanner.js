import React, { useEffect, useState } from 'react';

import { API_BASE } from '../config/api';

const AdBanner = ({ 
  type = 'banner', // 'banner', 'sidebar', 'inline'
  size = '728x90', // '728x90', '300x250', '320x50'
  className = '',
  style = {},
  placement // optional: 'portal_top' | 'landing_inline'
}) => {
  const [ad, setAd] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadAd = async () => {
      if (!placement) return;
      try {
        const res = await fetch(`${API_BASE}/ads/placements?placement=${placement}`);
        const data = await res.json();
        if (mounted && data.ads && data.ads.length > 0) {
          setAd(data.ads[0]);
          setImageError(false); // Reset image error when new ad loads
          // Track impression
          try {
            await fetch(`${API_BASE}/ads/${data.ads[0].id}/impression`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: window.location.pathname })
            });
          } catch (e) {}
        }
      } catch (e) {
        // silent fail to keep UX smooth
      }
    };
    loadAd();
    return () => { mounted = false; };
  }, [placement]);

  const onClick = async () => {
    if (!ad) return;
    try {
      await fetch(`${API_BASE}/ads/${ad.id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: window.location.pathname })
      });
    } catch (e) {}
    window.open(ad.url_destino, '_blank');
  };

  // Validar URL de imagen
  const isValidImageUrl = (url) => {
    if (!url) return false;
    // No permitir URLs de redirección de Google u otros servicios
    if (url.includes('google.com/url?') || url.includes('images.google.com') || url.includes('shutterstock.com/search')) {
      return false;
    }
    // Debe ser una URL directa (http/https)
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (ad) {
    const hasValidImage = ad.imagen_url && isValidImageUrl(ad.imagen_url) && !imageError;
    
    return (
      <div 
        className={`ad-banner ad-${type} ${className}`}
        style={{ width: size.split('x')[0] + 'px', height: size.split('x')[1] + 'px', ...style }}
        role="button"
        onClick={onClick}
        title={ad.titulo}
      >
        {hasValidImage ? (
          <img 
            src={ad.imagen_url} 
            alt={ad.titulo || 'Anuncio'} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={{
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f97316, #ff6b35)', 
            color: '#fff', 
            borderRadius: 8,
            padding: '10px',
            cursor: 'pointer'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{ad.titulo}</div>
              {ad.descripcion_corta && (
                <small style={{ opacity: 0.9, fontSize: '12px', display: 'block' }}>
                  {ad.descripcion_corta}
                </small>
              )}
              <small style={{ opacity: 0.8, fontSize: '11px', display: 'block', marginTop: '4px' }}>
                Haz clic para visitar
              </small>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Placeholder in development or when no ad
  return (
    <div 
      className={`ad-banner ad-${type} ${className}`}
      style={{
        width: size.split('x')[0] + 'px',
        height: size.split('x')[1] + 'px',
        backgroundColor: '#f0f0f0',
        border: '2px dashed #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '10px auto',
        ...style
      }}
    >
      <div style={{ textAlign: 'center', color: '#666' }}>
        <div>📢 Espacio Publicitario {size}</div>
        <small>Tu marca aquí</small>
      </div>
    </div>
  );
};

export default AdBanner;
