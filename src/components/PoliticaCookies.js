import React from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO';
import './TerminosCondiciones.css';

const PoliticaCookies = () => {
  return (
    <div className="legal-page">
      <SEO
        title="Política de Cookies - SorteoHub"
        description="Política de cookies de la plataforma SorteoHub"
        keywords="cookies, política de cookies, privacidad, SorteoHub"
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>🍪 Política de Cookies</h1>
          <p className="legal-updated">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. ¿Qué son las Cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (computadora, 
              tablet o móvil) cuando visita nuestro sitio web. Estas cookies nos permiten reconocer su 
              dispositivo y recordar información sobre su visita, como sus preferencias y acciones.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Tipos de Cookies que Utilizamos</h2>
            
            <h3>2.1. Cookies Esenciales</h3>
            <p>
              Estas cookies son necesarias para el funcionamiento del sitio web y no se pueden desactivar. 
              Incluyen cookies de sesión, autenticación y seguridad.
            </p>
            <ul>
              <li><strong>Cookies de Sesión:</strong> Mantienen su sesión activa mientras navega</li>
              <li><strong>Cookies de Autenticación:</strong> Recuerdan que ha iniciado sesión</li>
              <li><strong>Cookies de Seguridad:</strong> Protegen contra ataques CSRF</li>
            </ul>

            <h3>2.2. Cookies de Funcionalidad</h3>
            <p>
              Estas cookies permiten que el sitio web recuerde las elecciones que hace (como su idioma 
              preferido o región) y proporcionan características mejoradas y más personales.
            </p>

            <h3>2.3. Cookies Analíticas</h3>
            <p>
              Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web 
              recopilando y reportando información de forma anónima.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Cookies de Terceros</h2>
            <p>
              Algunas cookies son colocadas por servicios de terceros que aparecen en nuestras páginas. 
              No controlamos el uso de estas cookies y le recomendamos que consulte las políticas de 
              cookies de estos terceros.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Gestión de Cookies</h2>
            <p>
              Puede controlar y/o eliminar las cookies como desee. Puede eliminar todas las cookies 
              que ya están en su dispositivo y puede configurar la mayoría de los navegadores para 
              evitar que se coloquen.
            </p>
            <p>
              Sin embargo, si hace esto, es posible que tenga que ajustar manualmente algunas preferencias 
              cada vez que visite un sitio y que algunos servicios y funcionalidades no funcionen.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Más Información</h2>
            <p>
              Para obtener más información sobre cómo gestionar las cookies en diferentes navegadores, 
              puede visitar:
            </p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2d9469b54c50" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Contacto</h2>
            <p>
              Si tiene preguntas sobre nuestra política de cookies, puede contactarnos en:
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:contacto@aurelasolutions.com">contacto@aurelasolutions.com</a>
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/" className="legal-back-link">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
};

export default PoliticaCookies;

