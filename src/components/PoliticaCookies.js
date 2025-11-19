import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from './SEO';
import './TerminosCondiciones.css';

const PoliticaCookies = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'es-MX';
  
  return (
    <div className="legal-page">
      <SEO
        title={t('legalPages.cookiePolicy.seo.title')}
        description={t('legalPages.cookiePolicy.seo.description')}
        keywords={t('legalPages.cookiePolicy.seo.keywords')}
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>{t('legalPages.cookiePolicy.title')}</h1>
          <p className="legal-updated">{t('legalPages.lastUpdated')} {new Date().toLocaleDateString(locale)}</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>{t('legalPages.cookiePolicy.sections.whatAre.title')}</h2>
            <p>{t('legalPages.cookiePolicy.sections.whatAre.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.cookiePolicy.sections.types.title')}</h2>
            
            <h3>{t('legalPages.cookiePolicy.sections.types.essential.title')}</h3>
            <p>{t('legalPages.cookiePolicy.sections.types.essential.text')}</p>
            <ul>
              <li><strong>{t('legalPages.cookiePolicy.sections.types.essential.session')}</strong></li>
              <li><strong>{t('legalPages.cookiePolicy.sections.types.essential.auth')}</strong></li>
              <li><strong>{t('legalPages.cookiePolicy.sections.types.essential.security')}</strong></li>
            </ul>

            <h3>{t('legalPages.cookiePolicy.sections.types.functionality.title')}</h3>
            <p>{t('legalPages.cookiePolicy.sections.types.functionality.text')}</p>

            <h3>{t('legalPages.cookiePolicy.sections.types.analytics.title')}</h3>
            <p>{t('legalPages.cookiePolicy.sections.types.analytics.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.cookiePolicy.sections.thirdParty.title')}</h2>
            <p>{t('legalPages.cookiePolicy.sections.thirdParty.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.cookiePolicy.sections.management.title')}</h2>
            <p>{t('legalPages.cookiePolicy.sections.management.p1')}</p>
            <p>{t('legalPages.cookiePolicy.sections.management.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.cookiePolicy.sections.moreInfo.title')}</h2>
            <p>{t('legalPages.cookiePolicy.sections.moreInfo.text')}</p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">{t('legalPages.cookiePolicy.sections.moreInfo.chrome')}</a></li>
              <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">{t('legalPages.cookiePolicy.sections.moreInfo.firefox')}</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">{t('legalPages.cookiePolicy.sections.moreInfo.safari')}</a></li>
              <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2d9469b54c50" target="_blank" rel="noopener noreferrer">{t('legalPages.cookiePolicy.sections.moreInfo.edge')}</a></li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.cookiePolicy.sections.contact.title')}</h2>
            <p>{t('legalPages.cookiePolicy.sections.contact.text')}</p>
            <p>
              <strong>{t('legalPages.cookiePolicy.sections.contact.email')}</strong> <a href="mailto:contacto@aurelasolutions.com">contacto@aurelasolutions.com</a>
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/" className="legal-back-link">{t('legalPages.backToHome')}</Link>
        </div>
      </div>
    </div>
  );
};

export default PoliticaCookies;
