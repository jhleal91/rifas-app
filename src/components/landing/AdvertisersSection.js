import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdCarousel from '../AdCarousel';

const AdvertisersSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="advertisers-invite-section">
      <div className="container">
        <div className="advertiser-section-header">
          <div className="advertiser-header-content">
            <h2 className="section-title">
              <span className="section-icon">📣</span>
              {t('advertisersSection.title')}
            </h2>
            <p className="section-subtitle">
              {t('advertisersSection.subtitle')}
            </p>
            <div className="advertiser-cta-wrapper">
              <button 
                className="btn-advertiser-primary"
                onClick={() => navigate('/anunciantes?mode=register')}
              >
                <span className="btn-icon">🚀</span>
                <span>{t('advertisersSection.primaryButton')}</span>
              </button>
              <Link 
                to="/anunciantes" 
                className="btn-advertiser-secondary"
              >
                <span>{t('advertisersSection.secondaryButton')}</span>
                <span className="btn-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
        {/* Carousel de Anuncios */}
        <AdCarousel 
          placement="landing_inline" 
          interval={35000}
          maxAds={3}
          className="landing-ads-carousel landing-ads-after-features"
        />
      </div>
    </section>
  );
};

export default AdvertisersSection;

