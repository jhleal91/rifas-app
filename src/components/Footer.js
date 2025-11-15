import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Sección principal */}
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-icon">🎫</span>
              <div className="footer-logo-text">
                <h3>SorteoHub</h3>
                <p>{t('footer.tagline')}</p>
              </div>
            </div>
            <p className="footer-description">
              {t('footer.description')}
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-section">
              <h4>{t('footer.sections.product')}</h4>
              <ul>
                <li><a href="#features">{t('footer.links.features')}</a></li>
                <li><a href="#pricing">{t('footer.links.pricing')}</a></li>
                <li><a href="#demo">{t('footer.links.demo')}</a></li>
                <li><a href="#api">{t('footer.links.api')}</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>{t('footer.sections.resources')}</h4>
              <ul>
                <li><a href="#help">{t('footer.links.help')}</a></li>
                <li><a href="#docs">{t('footer.links.docs')}</a></li>
                <li><a href="#tutorials">{t('footer.links.tutorials')}</a></li>
                <li><a href="#blog">{t('footer.links.blog')}</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>{t('footer.sections.legal')}</h4>
              <ul>
                <li><Link to="/terminos-condiciones">{t('footer.links.terms')}</Link></li>
                <li><Link to="/politica-privacidad">{t('footer.links.privacy')}</Link></li>
                <li><Link to="/politica-cookies">{t('footer.links.cookies')}</Link></li>
                <li><Link to="/aviso-legal">{t('footer.links.legal')}</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>{t('footer.sections.contact')}</h4>
              <ul>
                <li><a href="mailto:contacto@aurelasolutions.com">contacto@aurelasolutions.com</a></li>
                <li><a href="tel:+1234567890">+1 (234) 567-890</a></li>
                <li><a href="#support">{t('footer.links.support')}</a></li>
                <li><a href="#sales">{t('footer.links.sales')}</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sección de AureLA Solutions */}
       {/* <div className="footer-company">
          <div className="company-info">
            <div className="company-logo">
              <span className="company-icon">🏢</span>
              <div className="company-text">
                <h4>AureLA Solutions</h4>
                <p>Consultoría de Sistemas</p>
              </div>
            </div>
            <p className="company-description">
              Especialistas en desarrollo de software, arquitectura de sistemas y 
              soluciones tecnológicas empresariales.
            </p>
          </div>

          <div className="company-services">
            <h5>Nuestros Servicios</h5>
            <ul>
              <li>Desarrollo de Software</li>
              <li>Arquitectura de Sistemas</li>
              <li>Consultoría IT</li>
              <li>Integración de APIs</li>
              <li>DevOps y Cloud</li>
            </ul>
          </div>

          <div className="company-contact">
            <h5>Contacto Empresarial</h5>
            <ul>
              <li><a href="mailto:info@aurelasolutions.com">info@aurelasolutions.com</a></li>
              <li><a href="tel:+1234567891">+1 (234) 567-891</a></li>
              <li><a href="https://aurelasolutions.com">aurelasolutions.com</a></li>
            </ul>
          </div>
        </div>*/}

        {/* Línea divisoria */}
        <div className="footer-divider"></div>

        {/* Footer inferior */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} AureLA Solutions. {t('footer.copyright')}.</p>
            <p>{t('footer.productOf')}</p>
            <p className="footer-payment-info">
              🔒 {t('footer.paymentInfo')} <strong>Stripe</strong>
            </p>
          </div>
          
          <div className="footer-social">
            <a href="https://linkedin.com/company/aurelasolutions" className="social-link" title="LinkedIn" target="_blank" rel="noopener noreferrer">
              <span>💼</span>
            </a>
            <a href="https://github.com/aurelasolutions" className="social-link" title="GitHub" target="_blank" rel="noopener noreferrer">
              <span>🐙</span>
            </a>
            <a href="https://twitter.com/aurelasolutions" className="social-link" title="Twitter" target="_blank" rel="noopener noreferrer">
              <span>🐦</span>
            </a>
            <a href="mailto:info@aurelasolutions.com" className="social-link" title="Email">
              <span>📧</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
