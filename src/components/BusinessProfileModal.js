import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError, showWarning } from './NotificationToast';
import { API_BASE } from '../config/api';

const BusinessProfileModal = ({ isOpen, onClose, advertiserId }) => {
  const { t } = useTranslation();
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
      showWarning(t('businessProfile.alerts.sessionExpired.message'), t('businessProfile.alerts.sessionExpired.title'));
      onClose();
      return;
    }

    if (!businessProfile.nombre_comercial) {
      showWarning(t('businessProfile.alerts.requiredField.message'), t('businessProfile.alerts.requiredField.title'));
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
        showSuccess(t('businessProfile.alerts.success.message'), t('businessProfile.alerts.success.title'));
        onClose();
        // Recargar la página para actualizar el menú si es necesario
        window.location.reload();
      } else {
        showError(data.error || t('businessProfile.alerts.error.updating'), t('businessProfile.alerts.error.title'));
      }
    } catch (error) {
      console.error('Error guardando perfil:', error);
      showError(t('businessProfile.alerts.error.message'), t('businessProfile.alerts.error.title'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="business-profile-modal-overlay" onClick={onClose}>
      <div className="business-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="business-profile-modal-header">
          <h2>{t('businessProfile.title')}</h2>
          <button className="business-profile-modal-close" onClick={onClose}>{t('businessProfile.close')}</button>
        </div>

        <form onSubmit={handleSave} className="business-profile-form">
          <div className="form-group">
            <label>{t('businessProfile.fields.commercialName')}</label>
            <input
              type="text"
              value={businessProfile.nombre_comercial}
              onChange={(e) => setBusinessProfile({...businessProfile, nombre_comercial: e.target.value})}
              placeholder={t('businessProfile.fields.commercialNamePlaceholder')}
              maxLength={150}
              required
            />
            <small>{t('businessProfile.fields.commercialNameHelp')}</small>
          </div>

          <div className="form-group">
            <label>{t('businessProfile.fields.websiteUrl')}</label>
            <input
              type="url"
              value={businessProfile.pagina_url}
              onChange={(e) => setBusinessProfile({...businessProfile, pagina_url: e.target.value})}
              placeholder={t('businessProfile.fields.websiteUrlPlaceholder')}
            />
            <small>{t('businessProfile.fields.websiteUrlHelp')}</small>
          </div>

          <div className="form-group">
            <label>{t('businessProfile.fields.businessDescription')}</label>
            <textarea
              value={businessProfile.descripcion_negocio}
              onChange={(e) => setBusinessProfile({...businessProfile, descripcion_negocio: e.target.value})}
              placeholder={t('businessProfile.fields.businessDescriptionPlaceholder')}
              rows={4}
              maxLength={500}
            />
            <small>{t('businessProfile.fields.businessDescriptionHelp')}</small>
          </div>

          <div className="form-group">
            <label>{t('businessProfile.fields.logoUrl')}</label>
            <input
              type="url"
              value={businessProfile.logo_url}
              onChange={(e) => setBusinessProfile({...businessProfile, logo_url: e.target.value})}
              placeholder={t('businessProfile.fields.logoUrlPlaceholder')}
            />
            <small>{t('businessProfile.fields.logoUrlHelp')}</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={businessProfile.activo_sponsor}
                onChange={(e) => setBusinessProfile({...businessProfile, activo_sponsor: e.target.checked})}
              />
              <span>{t('businessProfile.fields.sponsorActive')}</span>
            </label>
            <small>{t('businessProfile.fields.sponsorActiveHelp')}</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('businessProfile.actions.saving') : t('businessProfile.actions.save')}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              {t('businessProfile.actions.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessProfileModal;

