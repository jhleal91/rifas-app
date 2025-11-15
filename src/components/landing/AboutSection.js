import React from 'react';
import { useTranslation } from 'react-i18next';

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <section className="about-section">
      <div className="container">
        <h2 className="section-title">
          <span className="section-icon">ℹ️</span>
          {t('about.title')}
        </h2>
        <div className="about-content">
          <p className="about-description">
            <strong>SorteoHub</strong> {t('about.description1')}
          </p>
          <p className="about-description">
            {t('about.description2')}
          </p>
        </div>

        <div className="about-audience">
          <h3 className="about-audience-title">{t('about.forWhoTitle')}</h3>
          <div className="audience-grid">
            <div className="audience-card">
              <div className="audience-icon">👨‍💼</div>
              <h4>{t('about.audience.entrepreneurs.title')}</h4>
              <p>{t('about.audience.entrepreneurs.description')}</p>
            </div>
            <div className="audience-card">
              <div className="audience-icon">🤝</div>
              <h4>{t('about.audience.nonprofit.title')}</h4>
              <p>{t('about.audience.nonprofit.description')}</p>
            </div>
            <div className="audience-card">
              <div className="audience-icon">🏢</div>
              <h4>{t('about.audience.businesses.title')}</h4>
              <p>{t('about.audience.businesses.description')}</p>
            </div>
            <div className="audience-card">
              <div className="audience-icon">🎯</div>
              <h4>{t('about.audience.professionals.title')}</h4>
              <p>{t('about.audience.professionals.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

