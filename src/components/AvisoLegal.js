import React from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO';
import './TerminosCondiciones.css';

const AvisoLegal = () => {
  return (
    <div className="legal-page">
      <SEO
        title="Aviso Legal - SorteoHub"
        description="Aviso legal de la plataforma SorteoHub"
        keywords="aviso legal, legal, SorteoHub"
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>⚖️ Aviso Legal</h1>
          <p className="legal-updated">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Datos Identificativos</h2>
            <p>
              En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, 
              de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, 
              a continuación se reflejan los siguientes datos:
            </p>
            <ul>
              <li><strong>Denominación social:</strong> AureLA Solutions</li>
              <li><strong>Producto:</strong> SorteoHub</li>
              <li><strong>Email:</strong> contacto@aurelasolutions.com</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>2. Objeto</h2>
            <p>
              El presente aviso legal regula el uso del sitio web SorteoHub (en adelante, "el Sitio Web"), 
              propiedad de AureLA Solutions.
            </p>
            <p>
              La navegación por el sitio web de SorteoHub atribuye la condición de usuario del mismo e 
              implica la aceptación plena de todas las cláusulas incluidas en este Aviso Legal.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Condiciones de Uso</h2>
            <p>
              El acceso y uso del sitio web está sujeto a las condiciones de uso establecidas. El usuario 
              se compromete a hacer un uso adecuado de los contenidos y servicios que SorteoHub ofrece a 
              través de su sitio web.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Propiedad Intelectual</h2>
            <p>
              Todos los contenidos del sitio web, incluyendo textos, gráficos, logotipos, iconos, imágenes, 
              así como el software, son propiedad de AureLA Solutions o de sus proveedores de contenido, 
              y están protegidos por las leyes de propiedad intelectual e industrial.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Limitación de Responsabilidad</h2>
            <p>
              AureLA Solutions no se hace responsable de los daños y perjuicios de toda naturaleza que 
              puedan deberse a la falta de disponibilidad, continuidad, calidad o utilidad de los 
              contenidos y servicios ofrecidos en el sitio web.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Modificaciones</h2>
            <p>
              AureLA Solutions se reserva el derecho de efectuar sin previo aviso las modificaciones 
              que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los 
              contenidos y servicios que se presten a través de la misma como la forma en la que 
              éstos aparezcan presentados o localizados en su portal.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Enlaces</h2>
            <p>
              En el caso de que en el sitio web se dispusiesen enlaces o hipervínculos hacía otros 
              sitios de Internet, AureLA Solutions no ejercerá ningún tipo de control sobre dichos 
              sitios y contenidos.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Contacto</h2>
            <p>
              Para cualquier consulta o comunicación relacionada con este aviso legal, puede contactarnos en:
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

export default AvisoLegal;

