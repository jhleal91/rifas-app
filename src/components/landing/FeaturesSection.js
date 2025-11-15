import React from 'react';
import { useTranslation } from 'react-i18next';

const FeaturesSection = () => {
  const { t } = useTranslation();

  return (
    <section className="features-section">
      <div className="container">
        <h2 className="section-title">
          <span className="section-icon">✨</span>
          {t('features.title')}
        </h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>{t('features.items.customizable.title')}</h3>
            <p>{t('features.items.customizable.description')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>{t('features.items.multipleTypes.title')}</h3>
            <p>{t('features.items.multipleTypes.description')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>{t('features.items.securePayments.title')}</h3>
            <p>{t('features.items.securePayments.description')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎲</div>
            <h3>{t('features.items.transparency.title')}</h3>
            <p>{t('features.items.transparency.description')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>{t('features.items.management.title')}</h3>
            <p>{t('features.items.management.description')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>{t('features.items.unlimitedReach.title')}</h3>
            <p>{t('features.items.unlimitedReach.description')}</p>
          </div>
        </div>

        <div className="about-benefits">
          <h3 className="about-benefits-title">{t('features.benefits.title')}</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <span className="benefit-icon">✅</span>
              <div>
                <h4>{t('features.benefits.reduceCosts.title')}</h4>
                <p>{t('features.benefits.reduceCosts.description')}</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✅</span>
              <div>
                <h4>{t('features.benefits.credibility.title')}</h4>
                <p>{t('features.benefits.credibility.description')}</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✅</span>
              <div>
                <h4>{t('features.benefits.scalable.title')}</h4>
                <p>{t('features.benefits.scalable.description')}</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✅</span>
              <div>
                <h4>{t('features.benefits.totalControl.title')}</h4>
                <p>{t('features.benefits.totalControl.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

