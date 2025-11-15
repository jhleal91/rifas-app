import React from 'react';
import { useTranslation } from 'react-i18next';

const HowItWorksSection = () => {
  const { t } = useTranslation();

  return (
    <section className="how-it-works-section">
      <div className="container">
        <h2 className="section-title">
          <span className="section-icon">🚀</span>
          {t('howItWorks.title')}
        </h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>{t('howItWorks.steps.register.title')}</h3>
              <p>{t('howItWorks.steps.register.description')}</p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>{t('howItWorks.steps.create.title')}</h3>
              <p>{t('howItWorks.steps.create.description')}</p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>{t('howItWorks.steps.share.title')}</h3>
              <p>{t('howItWorks.steps.share.description')}</p>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>{t('howItWorks.steps.draw.title')}</h3>
              <p>{t('howItWorks.steps.draw.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

