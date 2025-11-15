import React, { useState, useEffect } from 'react';
import { showSuccess, showError, showWarning } from './NotificationToast';

const API_BASE = 'http://localhost:5001/api';

const BusinessProfileModal = ({ isOpen, onClose, advertiserId }) => {
  const [businessProfile, setBusinessProfile] = useState({
    nombre_comercial: '',
    pagina_url: '',
    descripcion_negocio: '',
    logo_url: '',
    activo_sponsor: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && advertiserId) {
      loadBusinessProfile();
    }
  }, [isOpen, advertiserId]);

  const loadBusinessProfile = async () => {
    const token = localStorage.getItem('advertiserToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/advertisers/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.advertiser) {
          // Si no hay nombre_comercial, usar el nombre del registro
          const nombreComercial = data.advertiser.nombre_comercial || data.advertiser.nombre || '';
          setBusinessProfile({
            nombre_comercial: nombreComercial,
            pagina_url: data.advertiser.pagina_url || '',
            descripcion_negocio: data.advertiser.descripcion_negocio || '',
            logo_url: data.advertiser.logo_url || '',
            activo_sponsor: data.advertiser.activo_sponsor || false
          });
        }
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('advertiserToken');
    
    if (!token) {
      showWarning('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
      onClose();
      return;
    }

    if (!businessProfile.nombre_comercial) {
      showWarning('El nombre comercial es requerido', 'Campo requerido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/advertisers/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessProfile)
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess('Perfil de negocio actualizado exitosamente', '¡Éxito!');
        onClose();
        // Recargar la página para actualizar el menú si es necesario
        window.location.reload();
      } else {
        showError(data.error || 'Error actualizando perfil', 'Error');
      }
    } catch (error) {
      console.error('Error guardando perfil:', error);
      showError('Error guardando perfil. Por favor, intenta nuevamente.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="business-profile-modal-overlay" onClick={onClose}>
      <div className="business-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="business-profile-modal-header">
          <h2>🏪 Perfil de Mi Negocio</h2>
          <button className="business-profile-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSave} className="business-profile-form">
          <div className="form-group">
            <label>Nombre Comercial * (ej: AlvarezLA, LealStore)</label>
            <input
              type="text"
              value={businessProfile.nombre_comercial}
              onChange={(e) => setBusinessProfile({...businessProfile, nombre_comercial: e.target.value})}
              placeholder="Nombre de tu negocio"
              maxLength={150}
              required
            />
            <small>Este nombre aparecerá en "Negocios Patrocinadores"</small>
          </div>

          <div className="form-group">
            <label>URL de tu Sitio Web</label>
            <input
              type="url"
              value={businessProfile.pagina_url}
              onChange={(e) => setBusinessProfile({...businessProfile, pagina_url: e.target.value})}
              placeholder="https://tu-negocio.com"
            />
            <small>Los usuarios serán redirigidos aquí desde tu perfil</small>
          </div>

          <div className="form-group">
            <label>Descripción del Negocio</label>
            <textarea
              value={businessProfile.descripcion_negocio}
              onChange={(e) => setBusinessProfile({...businessProfile, descripcion_negocio: e.target.value})}
              placeholder="Describe tu negocio..."
              rows={4}
              maxLength={500}
            />
            <small>Aparecerá en la sección "Negocios Patrocinadores"</small>
          </div>

          <div className="form-group">
            <label>URL del Logo del Negocio</label>
            <input
              type="url"
              value={businessProfile.logo_url}
              onChange={(e) => setBusinessProfile({...businessProfile, logo_url: e.target.value})}
              placeholder="https://ejemplo.com/logo.jpg"
            />
            <small>Usa una URL directa de imagen (no URLs de redirección)</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={businessProfile.activo_sponsor}
                onChange={(e) => setBusinessProfile({...businessProfile, activo_sponsor: e.target.checked})}
              />
              <span>Aparecer en "Negocios Patrocinadores"</span>
            </label>
            <small>Tu negocio aparecerá en la sección destacada del portal (requiere tener al menos un anuncio activo)</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Perfil'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessProfileModal;

