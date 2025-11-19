import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from './SEO';
import './TerminosCondiciones.css';

const AvisoLegal = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'es-MX';
  
  return (
    <div className="legal-page">
      <SEO
        title={t('legalPages.legalNotice.seo.title')}
        description={t('legalPages.legalNotice.seo.description')}
        keywords={t('legalPages.legalNotice.seo.keywords')}
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>{t('legalPages.legalNotice.title')}</h1>
          <p className="legal-updated">{t('legalPages.lastUpdated')} {new Date().toLocaleDateString(locale)}</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>{t('legalPages.legalNotice.sections.identifying.title')}</h2>
            <p>{t('legalPages.legalNotice.sections.identifying.text')}</p>
            <ul>
              <li><strong>{t('legalPages.legalNotice.sections.identifying.company')}</strong> AureLA Solutions</li>
              <li><strong>{t('legalPages.legalNotice.sections.identifying.product')}</strong> SorteoHub</li>
              <li><strong>{t('legalPages.legalNotice.sections.identifying.email')}</strong> contacto@aurelasolutions.com</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.legalNotice.sections.object.title')}</h2>
            <p>{t('legalPages.legalNotice.sections.object.p1')}</p>
            <p>{t('legalPages.legalNotice.sections.object.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.legalNotice.sections.conditions.title')}</h2>
            <p>{t('legalPages.legalNotice.sections.conditions.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.legalNotice.sections.intellectual.title')}</h2>
            <p>{t('legalPages.legalNotice.sections.intellectual.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.legalNotice.sections.liability.title')}</h2>
            <p>{t('legalPages.legalNotice.sections.liability.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.legalNotice.sections.modifications.title')}</h2>
            <p>{t('legalPages.legalNotice.sections.modifications.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.legalNotice.sections.links.title')}</h2>
            <p>{t('legalPages.legalNotice.sections.links.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.legalNotice.sections.contact.title')}</h2>
            <p>{t('legalPages.legalNotice.sections.contact.text')}</p>
            <p>
              <strong>{t('legalPages.legalNotice.sections.contact.email')}</strong> <a href="mailto:contacto@aurelasolutions.com">contacto@aurelasolutions.com</a>
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

export default AvisoLegal;
