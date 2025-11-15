import React from 'react';
import { useTranslation } from 'react-i18next';

const CTASection = ({ onShowRegister }) => {
  const { t } = useTranslation();

  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <h2>{t('cta.title')}</h2>
          <p>{t('cta.subtitle')}</p>
          <button 
            className="btn-cta"
            onClick={onShowRegister}
          >
            <span className="btn-icon">🎯</span>
            <span>{t('cta.button')}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

