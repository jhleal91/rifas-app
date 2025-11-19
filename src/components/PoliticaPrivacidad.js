import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from './SEO';
import './TerminosCondiciones.css';

const PoliticaPrivacidad = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'es-MX';
  
  return (
    <div className="legal-page">
      <SEO
        title={t('legalPages.privacyPolicy.seo.title')}
        description={t('legalPages.privacyPolicy.seo.description')}
        keywords={t('legalPages.privacyPolicy.seo.keywords')}
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>{t('legalPages.privacyPolicy.title')}</h1>
          <p className="legal-updated">{t('legalPages.lastUpdated')} {new Date().toLocaleDateString(locale)}</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.introduction.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.introduction.p1')}</p>
            <p>{t('legalPages.privacyPolicy.sections.introduction.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.informationCollected.title')}</h2>
            
            <h3>{t('legalPages.privacyPolicy.sections.informationCollected.provided.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.informationCollected.provided.text')}</p>
            <ul>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.provided.account')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.provided.profile')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.provided.raffles')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.provided.participation')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.provided.advertisers')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.provided.communications')}</strong></li>
            </ul>

            <h3>{t('legalPages.privacyPolicy.sections.informationCollected.automatic.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.informationCollected.automatic.text')}</p>
            <ul>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.automatic.device')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.automatic.navigation')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.automatic.location')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.automatic.cookies')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.informationCollected.automatic.logs')}</strong></li>
            </ul>

            <h3>{t('legalPages.privacyPolicy.sections.informationCollected.thirdParty.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.informationCollected.thirdParty.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.howWeUse.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.howWeUse.text')}</p>
            <ul>
              <li><strong>{t('legalPages.privacyPolicy.sections.howWeUse.services')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.howWeUse.communication')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.howWeUse.improvement')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.howWeUse.security')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.howWeUse.personalization')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.howWeUse.marketing')}</strong></li>
              <li><strong>{t('legalPages.privacyPolicy.sections.howWeUse.legal')}</strong></li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.sharing.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.sharing.text')}</p>
            
            <h3>{t('legalPages.privacyPolicy.sections.sharing.public.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.sharing.public.text')}</p>
            <ul>
              <li>{t('legalPages.privacyPolicy.sections.sharing.public.username')}</li>
              <li>{t('legalPages.privacyPolicy.sections.sharing.public.raffles')}</li>
              <li>{t('legalPages.privacyPolicy.sections.sharing.public.results')}</li>
              <li>{t('legalPages.privacyPolicy.sections.sharing.public.reviews')}</li>
            </ul>

            <h3>{t('legalPages.privacyPolicy.sections.sharing.users.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.sharing.users.text')}</p>

            <h3>{t('legalPages.privacyPolicy.sections.sharing.providers.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.sharing.providers.text')}</p>
            <ul>
              <li>{t('legalPages.privacyPolicy.sections.sharing.providers.hosting')}</li>
              <li>{t('legalPages.privacyPolicy.sections.sharing.providers.email')}</li>
              <li>{t('legalPages.privacyPolicy.sections.sharing.providers.analytics')}</li>
              <li>{t('legalPages.privacyPolicy.sections.sharing.providers.payments')}</li>
            </ul>
            <p>{t('legalPages.privacyPolicy.sections.sharing.providers.note')}</p>

            <h3>{t('legalPages.privacyPolicy.sections.sharing.legal.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.sharing.legal.text')}</p>

            <h3>{t('legalPages.privacyPolicy.sections.sharing.business.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.sharing.business.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.cookies.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.cookies.text')}</p>
            <ul>
              <li>{t('legalPages.privacyPolicy.sections.cookies.session')}</li>
              <li>{t('legalPages.privacyPolicy.sections.cookies.preferences')}</li>
              <li>{t('legalPages.privacyPolicy.sections.cookies.analytics')}</li>
              <li>{t('legalPages.privacyPolicy.sections.cookies.personalization')}</li>
            </ul>
            <p>{t('legalPages.privacyPolicy.sections.cookies.note')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.security.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.security.text')}</p>
            <ul>
              <li>{t('legalPages.privacyPolicy.sections.security.https')}</li>
              <li>{t('legalPages.privacyPolicy.sections.security.passwords')}</li>
              <li>{t('legalPages.privacyPolicy.sections.security.access')}</li>
              <li>{t('legalPages.privacyPolicy.sections.security.monitoring')}</li>
              <li>{t('legalPages.privacyPolicy.sections.security.backups')}</li>
              <li>{t('legalPages.privacyPolicy.sections.security.updates')}</li>
            </ul>
            <p>{t('legalPages.privacyPolicy.sections.security.note')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.retention.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.retention.text')}</p>
            <ul>
              <li>{t('legalPages.privacyPolicy.sections.retention.services')}</li>
              <li>{t('legalPages.privacyPolicy.sections.retention.legal')}</li>
              <li>{t('legalPages.privacyPolicy.sections.retention.disputes')}</li>
              <li>{t('legalPages.privacyPolicy.sections.retention.agreements')}</li>
            </ul>
            <p>{t('legalPages.privacyPolicy.sections.retention.note')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.rights.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.rights.text')}</p>
            
            <h3>{t('legalPages.privacyPolicy.sections.rights.access.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.rights.access.text')}</p>

            <h3>{t('legalPages.privacyPolicy.sections.rights.correction.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.rights.correction.text')}</p>

            <h3>{t('legalPages.privacyPolicy.sections.rights.deletion.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.rights.deletion.text')}</p>

            <h3>{t('legalPages.privacyPolicy.sections.rights.portability.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.rights.portability.text')}</p>

            <h3>{t('legalPages.privacyPolicy.sections.rights.opposition.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.rights.opposition.text')}</p>

            <h3>{t('legalPages.privacyPolicy.sections.rights.withdrawal.title')}</h3>
            <p>{t('legalPages.privacyPolicy.sections.rights.withdrawal.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.minors.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.minors.p1')}</p>
            <p>{t('legalPages.privacyPolicy.sections.minors.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.transfers.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.transfers.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.thirdPartyLinks.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.thirdPartyLinks.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.changes.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.changes.p1')}</p>
            <p>{t('legalPages.privacyPolicy.sections.changes.p2')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.cookieConsent.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.cookieConsent.text')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.contact.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.contact.text')}</p>
            <ul>
              <li><strong>{t('legalPages.privacyPolicy.sections.contact.email')}</strong> privacidad@sorteohub.com</li>
              <li><strong>{t('legalPages.privacyPolicy.sections.contact.phone')}</strong> [Número de contacto]</li>
              <li><strong>{t('legalPages.privacyPolicy.sections.contact.address')}</strong> [Dirección de la empresa]</li>
            </ul>
            <p>{t('legalPages.privacyPolicy.sections.contact.note')}</p>
          </section>

          <section className="legal-section">
            <h2>{t('legalPages.privacyPolicy.sections.acceptance.title')}</h2>
            <p>{t('legalPages.privacyPolicy.sections.acceptance.text')}</p>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/terminos-condiciones" className="btn-legal-back">{t('legalPages.privacyPolicy.footer.terms')}</Link>
          <Link to="/" className="btn-legal-next">{t('legalPages.privacyPolicy.footer.home')}</Link>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidad;

