import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from './SEO';
import './TerminosCondiciones.css';

const TerminosCondiciones = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'es-MX';
  
  return (
    <div className="legal-page">
      <SEO
        title={t('legalPages.termsAndConditions.seo.title')}
        description={t('legalPages.termsAndConditions.seo.description')}
        keywords={t('legalPages.termsAndConditions.seo.keywords')}
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>{t('legalPages.termsAndConditions.title')}</h1>
          <p className="legal-updated">{t('legalPages.lastUpdated')} {new Date().toLocaleDateString(locale)}</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.acceptance.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.acceptance.p1')}</p>
            <p>{t('legalPages.termsAndConditions.sections.acceptance.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.description.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.description.p1')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.description.create')}</li>
              <li>{t('legalPages.termsAndConditions.sections.description.manage')}</li>
              <li>{t('legalPages.termsAndConditions.sections.description.draws')}</li>
              <li>{t('legalPages.termsAndConditions.sections.description.payments')}</li>
              <li>{t('legalPages.termsAndConditions.sections.description.ads')}</li>
            </ul>
            <p>{t('legalPages.termsAndConditions.sections.description.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.registration.title')}</h2>
            <h3>{t('legalPages.termsAndConditions.sections.registration.requirements.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.registration.requirements.text')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.registration.requirements.accurate')}</li>
              <li>{t('legalPages.termsAndConditions.sections.registration.requirements.maintain')}</li>
              <li>{t('legalPages.termsAndConditions.sections.registration.requirements.confidentiality')}</li>
              <li>{t('legalPages.termsAndConditions.sections.registration.requirements.notify')}</li>
              <li>{t('legalPages.termsAndConditions.sections.registration.requirements.responsible')}</li>
            </ul>

            <h3>{t('legalPages.termsAndConditions.sections.registration.eligibility.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.registration.eligibility.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.usage.title')}</h2>
            <h3>{t('legalPages.termsAndConditions.sections.usage.allowed.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.usage.allowed.text')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.usage.allowed.legal')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.allowed.participate')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.allowed.manage')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.allowed.content')}</li>
            </ul>

            <h3>{t('legalPages.termsAndConditions.sections.usage.prohibited.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.usage.prohibited.text')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.illegal')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.violate')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.manipulate')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.false')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.interfere')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.access')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.viruses')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.reverse')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.spam')}</li>
              <li>{t('legalPages.termsAndConditions.sections.usage.prohibited.intellectual')}</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.raffles.title')}</h2>
            <h3>{t('legalPages.termsAndConditions.sections.raffles.creator.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.raffles.creator.text')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.raffles.creator.laws')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.creator.permits')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.creator.deliver')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.creator.transparent')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.creator.fair')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.creator.publish')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.creator.respond')}</li>
            </ul>

            <h3>{t('legalPages.termsAndConditions.sections.raffles.intermediary.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.raffles.intermediary.text')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.raffles.intermediary.legality')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.intermediary.delivery')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.intermediary.disputes')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.intermediary.payments')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.intermediary.fraud')}</li>
            </ul>

            <h3>{t('legalPages.termsAndConditions.sections.raffles.participants.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.raffles.participants.text')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.raffles.participants.voluntary')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.participants.random')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.participants.guarantee')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.participants.contact')}</li>
              <li>{t('legalPages.termsAndConditions.sections.raffles.participants.terms')}</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.payments.title')}</h2>
            <h3>{t('legalPages.termsAndConditions.sections.payments.processing.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.payments.processing.text')}</p>

            <h3>{t('legalPages.termsAndConditions.sections.payments.refunds.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.payments.refunds.text')}</p>

            <h3>{t('legalPages.termsAndConditions.sections.payments.commissions.title')}</h3>
            <p>{t('legalPages.termsAndConditions.sections.payments.commissions.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.intellectual.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.intellectual.p1')}</p>
            <p>{t('legalPages.termsAndConditions.sections.intellectual.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.privacy.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.privacy.text')}</p>
            <Link to="/politica-privacidad" className="legal-link">
              {t('legalPages.termsAndConditions.sections.privacy.link')}
            </Link>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.liability.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.liability.text')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.liability.use')}</li>
              <li>{t('legalPages.termsAndConditions.sections.liability.raffles')}</li>
              <li>{t('legalPages.termsAndConditions.sections.liability.delivery')}</li>
              <li>{t('legalPages.termsAndConditions.sections.liability.data')}</li>
              <li>{t('legalPages.termsAndConditions.sections.liability.interruptions')}</li>
              <li>{t('legalPages.termsAndConditions.sections.liability.errors')}</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.indemnification.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.indemnification.text')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.indemnification.use')}</li>
              <li>{t('legalPages.termsAndConditions.sections.indemnification.violation')}</li>
              <li>{t('legalPages.termsAndConditions.sections.indemnification.law')}</li>
              <li>{t('legalPages.termsAndConditions.sections.indemnification.raffles')}</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.termination.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.termination.p1')}</p>
            <ul>
              <li>{t('legalPages.termsAndConditions.sections.termination.violation')}</li>
              <li>{t('legalPages.termsAndConditions.sections.termination.fraud')}</li>
              <li>{t('legalPages.termsAndConditions.sections.termination.unauthorized')}</li>
              <li>{t('legalPages.termsAndConditions.sections.termination.request')}</li>
            </ul>
            <p>{t('legalPages.termsAndConditions.sections.termination.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.law.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.law.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.modifications.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.modifications.p1')}</p>
            <p>{t('legalPages.termsAndConditions.sections.modifications.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.contact.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.contact.text')}</p>
            <ul>
              <li><strong>{t('legalPages.termsAndConditions.sections.contact.email')}</strong> legal@sorteohub.com</li>
              <li><strong>{t('legalPages.termsAndConditions.sections.contact.phone')}</strong> [Número de contacto]</li>
              <li><strong>{t('legalPages.termsAndConditions.sections.contact.address')}</strong> [Dirección de la empresa]</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.termsAndConditions.sections.acceptance.title')}</h2>
            <p>{t('legalPages.termsAndConditions.sections.acceptance.text')}</p>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/" className="btn-legal-back">{t('legalPages.termsAndConditions.footer.home')}</Link>
          <Link to="/politica-privacidad" className="btn-legal-next">{t('legalPages.termsAndConditions.footer.privacy')}</Link>
        </div>
      </div>
    </div>
  );
};

export default TerminosCondiciones;

