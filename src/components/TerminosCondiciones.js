import React from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO';
import './TerminosCondiciones.css';

const TerminosCondiciones = () => {
  return (
    <div className="legal-page">
      <SEO
        title="Términos y Condiciones - SorteoHub"
        description="Términos y condiciones de uso de la plataforma SorteoHub"
        keywords="términos y condiciones, legal, SorteoHub"
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>📋 Términos y Condiciones de Uso</h1>
          <p className="legal-updated">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar SorteoHub ("la Plataforma", "nosotros", "nuestro"), usted acepta 
              cumplir con estos Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte 
              de estos términos, no debe utilizar nuestros servicios.
            </p>
            <p>
              Estos términos constituyen un acuerdo legalmente vinculante entre usted y SorteoHub. 
              Nos reservamos el derecho de modificar estos términos en cualquier momento, y su uso 
              continuado de la Plataforma después de dichas modificaciones constituye su aceptación 
              de los términos modificados.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Descripción del Servicio</h2>
            <p>
              SorteoHub es una plataforma digital que permite a los usuarios crear, gestionar y 
              participar en rifas en línea. La Plataforma proporciona herramientas para:
            </p>
            <ul>
              <li>Crear y administrar rifas digitales</li>
              <li>Gestionar participantes y números</li>
              <li>Realizar sorteos y publicar resultados</li>
              <li>Gestionar pagos y transacciones</li>
              <li>Publicar anuncios y promociones</li>
            </ul>
            <p>
              SorteoHub actúa únicamente como intermediario tecnológico y no se hace responsable 
              de la legalidad de las rifas creadas por los usuarios, ni de los premios ofrecidos.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Registro y Cuentas de Usuario</h2>
            <h3>3.1. Requisitos de Registro</h3>
            <p>
              Para utilizar ciertas funcionalidades de la Plataforma, debe crear una cuenta. 
              Al registrarse, usted se compromete a:
            </p>
            <ul>
              <li>Proporcionar información precisa, actual y completa</li>
              <li>Mantener y actualizar su información de cuenta</li>
              <li>Mantener la confidencialidad de su contraseña</li>
              <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
              <li>Ser responsable de todas las actividades bajo su cuenta</li>
            </ul>

            <h3>3.2. Elegibilidad</h3>
            <p>
              Debe tener al menos 18 años de edad para crear una cuenta y utilizar nuestros servicios. 
              Al registrarse, declara y garantiza que cumple con este requisito de edad.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Uso de la Plataforma</h2>
            <h3>4.1. Uso Permitido</h3>
            <p>Usted puede utilizar la Plataforma para:</p>
            <ul>
              <li>Crear rifas legales y legítimas</li>
              <li>Participar en rifas creadas por otros usuarios</li>
              <li>Gestionar sus rifas y participantes</li>
              <li>Publicar contenido relacionado con rifas</li>
            </ul>

            <h3>4.2. Uso Prohibido</h3>
            <p>Está estrictamente prohibido:</p>
            <ul>
              <li>Utilizar la Plataforma para actividades ilegales o fraudulentas</li>
              <li>Crear rifas que violen leyes locales, estatales o federales</li>
              <li>Manipular resultados de rifas o sorteos</li>
              <li>Usar información falsa o engañosa</li>
              <li>Interferir con el funcionamiento de la Plataforma</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
              <li>Transmitir virus, malware o código malicioso</li>
              <li>Realizar ingeniería inversa o copiar el código</li>
              <li>Spam o comunicación no solicitada</li>
              <li>Violar derechos de propiedad intelectual</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Rifas y Responsabilidades</h2>
            <h3>5.1. Responsabilidad del Creador de Rifa</h3>
            <p>
              Como creador de una rifa, usted es completamente responsable de:
            </p>
            <ul>
              <li>Cumplir con todas las leyes y regulaciones aplicables</li>
              <li>Obtener los permisos necesarios para realizar la rifa</li>
              <li>Entregar los premios prometidos a los ganadores</li>
              <li>Gestionar los pagos y transacciones de manera transparente</li>
              <li>Realizar el sorteo de manera justa y aleatoria</li>
              <li>Publicar resultados de manera transparente</li>
              <li>Responder a consultas de participantes</li>
            </ul>

            <h3>5.2. SorteoHub como Intermediario</h3>
            <p>
              SorteoHub NO es responsable de:
            </p>
            <ul>
              <li>La legalidad de las rifas creadas por usuarios</li>
              <li>La entrega de premios por parte de los creadores</li>
              <li>Disputas entre creadores y participantes</li>
              <li>Pagos no realizados o reembolsos</li>
              <li>Fraudes o actividades ilegales de usuarios</li>
            </ul>

            <h3>5.3. Participantes</h3>
            <p>
              Al participar en una rifa, usted:
            </p>
            <ul>
              <li>Reconoce que la participación es voluntaria</li>
              <li>Acepta que los resultados son aleatorios y finales</li>
              <li>Comprende que no hay garantía de ganar</li>
              <li>Es responsable de proporcionar información de contacto válida</li>
              <li>Debe cumplir con los términos específicos de cada rifa</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Pagos y Transacciones</h2>
            <h3>6.1. Procesamiento de Pagos</h3>
            <p>
              Los pagos se procesan directamente entre el creador de la rifa y los participantes. 
              SorteoHub puede cobrar comisiones por el uso de la plataforma según los planes 
              contratados.
            </p>

            <h3>6.2. Reembolsos</h3>
            <p>
              Las políticas de reembolso son determinadas por cada creador de rifa. SorteoHub 
              no garantiza reembolsos y no es responsable de procesar reembolsos. Cualquier 
              solicitud de reembolso debe dirigirse directamente al creador de la rifa.
            </p>

            <h3>6.3. Comisiones</h3>
            <p>
              SorteoHub puede cobrar comisiones por el uso de la plataforma. Las comisiones 
              se detallan en los planes de suscripción y se deducen automáticamente según 
              corresponda.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de la Plataforma, incluyendo pero no limitado a texto, gráficos, 
              logos, iconos, imágenes, clips de audio, descargas digitales y compilaciones de datos, 
              es propiedad de SorteoHub o sus proveedores de contenido y está protegido por leyes 
              de derechos de autor.
            </p>
            <p>
              Usted no puede reproducir, distribuir, modificar, crear trabajos derivados, mostrar 
              públicamente, realizar públicamente, republicar, descargar, almacenar o transmitir 
              ningún material de la Plataforma sin nuestro permiso previo por escrito.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Privacidad</h2>
            <p>
              Su uso de la Plataforma también se rige por nuestra Política de Privacidad. 
              Por favor, revise nuestra Política de Privacidad para entender nuestras prácticas 
              de recopilación y uso de información.
            </p>
            <Link to="/politica-privacidad" className="legal-link">
              Ver Política de Privacidad →
            </Link>
          </section>

          <section className="legal-section">
            <h2>9. Limitación de Responsabilidad</h2>
            <p>
              EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, SORTEOHUB Y SUS AFILIADOS NO SERÁN 
              RESPONSABLES DE DAÑOS DIRECTOS, INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENCIALES 
              O PUNITIVOS RESULTANTES DE:
            </p>
            <ul>
              <li>El uso o la imposibilidad de usar la Plataforma</li>
              <li>Rifas creadas por otros usuarios</li>
              <li>No entrega de premios por parte de creadores</li>
              <li>Pérdida de datos o información</li>
              <li>Interrupciones del servicio</li>
              <li>Errores o omisiones en el contenido</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Indemnización</h2>
            <p>
              Usted acepta indemnizar, defender y eximir de responsabilidad a SorteoHub, sus 
              afiliados, directores, funcionarios, empleados y agentes de cualquier reclamo, 
              responsabilidad, daño, pérdida y gasto (incluyendo honorarios de abogados) que 
              surjan de o estén relacionados con:
            </p>
            <ul>
              <li>Su uso de la Plataforma</li>
              <li>Violación de estos Términos y Condiciones</li>
              <li>Violación de cualquier ley o derecho de terceros</li>
              <li>Rifas que usted cree o en las que participe</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>11. Terminación</h2>
            <p>
              Nos reservamos el derecho de terminar o suspender su cuenta y acceso a la Plataforma 
              inmediatamente, sin previo aviso, por cualquier motivo, incluyendo pero no limitado a:
            </p>
            <ul>
              <li>Violación de estos Términos y Condiciones</li>
              <li>Actividad fraudulenta o ilegal</li>
              <li>Uso no autorizado de la Plataforma</li>
              <li>Solicitud del usuario</li>
            </ul>
            <p>
              Tras la terminación, su derecho a usar la Plataforma cesará inmediatamente.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Ley Aplicable y Jurisdicción</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de México. Cualquier disputa 
              relacionada con estos términos o la Plataforma será sometida a la jurisdicción 
              exclusiva de los tribunales de México.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier 
              momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación 
              en la Plataforma. Su uso continuado de la Plataforma después de dichas modificaciones 
              constituye su aceptación de los términos modificados.
            </p>
            <p>
              Le recomendamos revisar periódicamente esta página para estar informado de cualquier 
              cambio.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Contacto</h2>
            <p>
              Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos a través de:
            </p>
            <ul>
              <li><strong>Email:</strong> legal@sorteohub.com</li>
              <li><strong>Teléfono:</strong> [Número de contacto]</li>
              <li><strong>Dirección:</strong> [Dirección de la empresa]</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>15. Aceptación</h2>
            <p>
              Al utilizar SorteoHub, usted reconoce que ha leído, entendido y acepta estar 
              legalmente vinculado por estos Términos y Condiciones.
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/" className="btn-legal-back">← Volver al Inicio</Link>
          <Link to="/politica-privacidad" className="btn-legal-next">Política de Privacidad →</Link>
        </div>
      </div>
    </div>
  );
};

export default TerminosCondiciones;

