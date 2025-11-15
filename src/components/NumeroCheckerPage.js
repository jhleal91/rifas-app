import React from 'react';
import { useTranslation } from 'react-i18next';
import NumeroChecker from './NumeroChecker';
import AdBanner from './AdBanner';
import SEO from './SEO';
import './NumeroCheckerPage.css';

const NumeroCheckerPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className="consulta-ganadores-page">
      <SEO 
        title={`${t('winnerCheck.title')} - SorteoHub`}
        description={t('winnerCheck.subtitle')}
        keywords="consulta ganadores, verificar número, rifas ganadores, sorteos resultados, verificar boleto"
      />
      
      {/* Hero Section */}
      <section className="consulta-hero">
        <div className="consulta-hero-content">
          <div className="consulta-hero-icon">🏆</div>
          <h1 className="consulta-hero-title">
            {t('winnerCheck.title').split(' ')[0]} <span className="highlight-orange">{t('winnerCheck.title').split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="consulta-hero-description">
            {t('winnerCheck.subtitle')}
            <br />
            {t('winnerCheck.description')}
          </p>
          {/* <div className="consulta-hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">100+</div>
              <div className="hero-stat-label">Rifas Verificadas</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">50+</div>
              <div className="hero-stat-label">Ganadores Felices</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-number">24/7</div>
              <div className="hero-stat-label">Disponible</div>
            </div>
          </div> */}
        </div>
      </section>

      {/* Main Content - Wizard */}
      <section className="consulta-main">
        <div className="consulta-container">
          <NumeroChecker />
        </div>
      </section>

      {/* Banner publicitario inferior */}
      <section className="consulta-ads-bottom">
        <div className="consulta-container">
          <AdBanner 
            placement="portal_top"
            size="728x90"
            className="consulta-bottom-banner"
          />
        </div>
      </section>
    </div>
  );
};

export default NumeroCheckerPage;
