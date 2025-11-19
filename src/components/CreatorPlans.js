import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '../utils/swal';

import { API_BASE } from '../config/api';

const CreatorPlans = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [my, setMy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Cargar planes públicos (siempre)
        const pRes = await fetch(`${API_BASE}/creator-plans`);
        const pData = await pRes.json();
        setPlans(pData.plans || []);
        
        // Solo cargar plan del usuario si hay token (usuario autenticado)
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const mRes = await fetch(`${API_BASE}/creator-plans/my`, { 
              headers: authH() 
            });
            if (mRes.ok) {
              const mData = await mRes.json();
              setMy(mData.subscription || null);
            }
            // Si falla (401, etc.), simplemente no establecer my
          } catch (e) {
            // Silenciar errores de autenticación - el usuario simplemente no está autenticado
            console.debug('Usuario no autenticado, mostrando solo planes públicos');
          }
        }
      } catch (e) {
        console.error('Error cargando planes:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const authH = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` });

  const subscribe = async (planId) => {
    try {
      const res = await fetch(`${API_BASE}/creator-plans/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({ plan_id: planId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      await showSuccess('Plan activado', 'Tu plan se ha activado correctamente.');
      setMy(data.subscription);
    } catch (e) {
      showError('Error', 'Error activando plan. Por favor, intenta nuevamente.');
    }
  };

  if (loading) return <div className="portal-container"><div className="loading-state">{t('common.loading')}</div></div>;

  const badge = (name) => name === 'Free' ? '🟦' : name === 'Pro' ? '🟧' : '🟩';

  // Función para traducir features que vienen de la BD
  const translateFeature = (feature) => {
    if (!feature) return feature;
    
    // Mapeo de features en español a claves de traducción
    const featureMap = {
      '1 rifa activa': t('plans.features.1RifaActiva'),
      '10 rifas activas': t('plans.features.10RifasActivas'),
      'Rifas ilimitadas': t('plans.features.rifasIlimitadas'),
      'Comisión 6.5%': t('plans.features.comision65'),
      'Comisión 5.5%': t('plans.features.comision55'),
      'Comisión 4.5%': t('plans.features.comision45'),
      'Pago seguro con Stripe': t('plans.features.pagoSeguroStripe'),
      'WhatsApp para participantes': t('plans.features.whatsappParticipantes'),
      'Soporte por email': t('plans.features.soporteEmail'),
      'Soporte prioritario': t('plans.features.soportePrioritario'),
      'Soporte dedicado': t('plans.features.soporteDedicado'),
      'Estadísticas detalladas': t('plans.features.estadisticasDetalladas'),
      'Estadísticas avanzadas': t('plans.features.estadisticasAvanzadas'),
      'Gestión de participantes': t('plans.features.gestionParticipantes')
    };
    
    return featureMap[feature] || feature;
  };

  return (
    <div className="portal-container">
      <div className="portal-header">
        <div className="portal-header-content">
          <div className="portal-title-section">
            <h1>💼 {t('plans.title')}</h1>
            <p>{t('plans.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className={`plan-card ${my?.plan_id === plan.id ? 'active' : ''}`}>
            <div className="plan-header">
              <span className="plan-badge">{badge(plan.name)} {plan.name}</span>
              <div className="plan-price">${plan.price_usd}<span>{t('plans.perMonth')}</span></div>
            </div>
            <ul className="plan-features">
              <li>{t('plans.elementsPerRaffle')}: {plan.max_elements_per_rifa ?? '50,000+'}</li>
              {(plan.features || []).map((f, idx) => (
                <li key={idx}>{translateFeature(f)}</li>
              ))}
            </ul>
            {my?.plan_id === plan.id ? (
              <button className="btn-apply-filters" disabled>{t('plans.currentPlan')}</button>
            ) : (
              <button className="btn-apply-filters" onClick={() => subscribe(plan.id)}>{t('plans.choosePlan')}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorPlans;


