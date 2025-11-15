import React from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO';
import './TerminosCondiciones.css';

const PoliticaPrivacidad = () => {
  return (
    <div className="legal-page">
      <SEO
        title="Política de Privacidad - SorteoHub"
        description="Política de privacidad y protección de datos de SorteoHub"
        keywords="política de privacidad, protección de datos, privacidad, SorteoHub"
      />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>🔒 Política de Privacidad</h1>
          <p className="legal-updated">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introducción</h2>
            <p>
              En SorteoHub ("nosotros", "nuestro", "la Plataforma"), nos comprometemos a proteger 
              su privacidad y la seguridad de su información personal. Esta Política de Privacidad 
              explica cómo recopilamos, usamos, divulgamos y protegemos su información cuando utiliza 
              nuestros servicios.
            </p>
            <p>
              Al utilizar SorteoHub, usted acepta las prácticas descritas en esta política. 
              Si no está de acuerdo con esta política, por favor no utilice nuestros servicios.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Información que Recopilamos</h2>
            
            <h3>2.1. Información que Usted Nos Proporciona</h3>
            <p>Recopilamos información que usted nos proporciona directamente, incluyendo:</p>
            <ul>
              <li><strong>Información de Cuenta:</strong> Nombre, dirección de correo electrónico, 
                número de teléfono, contraseña (encriptada)</li>
              <li><strong>Información de Perfil:</strong> Foto de perfil, biografía, preferencias</li>
              <li><strong>Información de Rifas:</strong> Detalles de rifas creadas, premios, 
                fechas, reglas</li>
              <li><strong>Información de Participación:</strong> Números seleccionados, información 
                de pago, datos de contacto</li>
              <li><strong>Información de Anunciantes:</strong> Datos comerciales, información de 
                negocio, métodos de pago</li>
              <li><strong>Comunicaciones:</strong> Mensajes, consultas, comentarios</li>
            </ul>

            <h3>2.2. Información Recopilada Automáticamente</h3>
            <p>Cuando utiliza nuestra Plataforma, recopilamos automáticamente:</p>
            <ul>
              <li><strong>Información de Dispositivo:</strong> Tipo de dispositivo, sistema operativo, 
                identificadores únicos</li>
              <li><strong>Información de Navegación:</strong> Páginas visitadas, tiempo en cada página, 
                enlaces clickeados</li>
              <li><strong>Información de Ubicación:</strong> Dirección IP, ubicación geográfica aproximada</li>
              <li><strong>Cookies y Tecnologías Similares:</strong> Para mejorar su experiencia y 
                analizar el uso</li>
              <li><strong>Registros:</strong> Fechas y horas de acceso, actividad en la plataforma</li>
            </ul>

            <h3>2.3. Información de Terceros</h3>
            <p>
              Podemos recibir información sobre usted de terceros, como servicios de autenticación 
              social (Google, Facebook) si decide conectarse a través de estos servicios.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Cómo Utilizamos Su Información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul>
              <li><strong>Proporcionar Servicios:</strong> Crear y gestionar su cuenta, procesar 
                rifas, facilitar participaciones</li>
              <li><strong>Comunicación:</strong> Enviar notificaciones, actualizaciones, respuestas 
                a consultas</li>
              <li><strong>Mejora del Servicio:</strong> Analizar el uso, identificar problemas, 
                desarrollar nuevas funcionalidades</li>
              <li><strong>Seguridad:</strong> Detectar y prevenir fraudes, abusos, actividades ilegales</li>
              <li><strong>Personalización:</strong> Personalizar su experiencia, mostrar contenido relevante</li>
              <li><strong>Marketing:</strong> Enviar promociones, ofertas (con su consentimiento)</li>
              <li><strong>Cumplimiento Legal:</strong> Cumplir con obligaciones legales, responder 
                a solicitudes gubernamentales</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Compartir Información</h2>
            <p>Podemos compartir su información en las siguientes circunstancias:</p>
            
            <h3>4.1. Información Pública</h3>
            <p>Algunas información es pública por defecto:</p>
            <ul>
              <li>Nombre de usuario y perfil público</li>
              <li>Rifas creadas (información pública de la rifa)</li>
              <li>Resultados de rifas finalizadas</li>
              <li>Calificaciones y reseñas públicas</li>
            </ul>

            <h3>4.2. Con Otros Usuarios</h3>
            <p>
              Cuando participa en una rifa, el creador de la rifa puede ver su nombre y 
              números seleccionados. Esta información es necesaria para gestionar la rifa.
            </p>

            <h3>4.3. Proveedores de Servicios</h3>
            <p>
              Compartimos información con proveedores de servicios que nos ayudan a operar 
              la Plataforma, como:
            </p>
            <ul>
              <li>Proveedores de hosting y almacenamiento</li>
              <li>Servicios de email y notificaciones</li>
              <li>Proveedores de análisis y monitoreo</li>
              <li>Proveedores de procesamiento de pagos</li>
            </ul>
            <p>
              Estos proveedores están contractualmente obligados a proteger su información 
              y solo pueden usarla para los fines especificados.
            </p>

            <h3>4.4. Requerimientos Legales</h3>
            <p>
              Podemos divulgar información si es requerido por ley, orden judicial, o proceso 
              legal, o para proteger nuestros derechos, propiedad o seguridad, o la de nuestros 
              usuarios.
            </p>

            <h3>4.5. Transferencias de Negocio</h3>
            <p>
              En caso de fusión, adquisición, o venta de activos, su información puede ser 
              transferida como parte de esa transacción.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Cookies y Tecnologías de Seguimiento</h2>
            <p>
              Utilizamos cookies y tecnologías similares para:
            </p>
            <ul>
              <li>Mantener su sesión activa</li>
              <li>Recordar sus preferencias</li>
              <li>Analizar el tráfico del sitio</li>
              <li>Personalizar contenido y anuncios</li>
            </ul>
            <p>
              Puede controlar las cookies a través de la configuración de su navegador. Sin embargo, 
              deshabilitar cookies puede afectar la funcionalidad de la Plataforma.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Seguridad de la Información</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
            </p>
            <ul>
              <li>Encriptación de datos en tránsito (HTTPS)</li>
              <li>Encriptación de contraseñas (hashing con bcrypt)</li>
              <li>Acceso restringido a información personal</li>
              <li>Monitoreo de seguridad continuo</li>
              <li>Backups regulares</li>
              <li>Actualizaciones de seguridad</li>
            </ul>
            <p>
              Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico 
              es 100% seguro. Aunque nos esforzamos por proteger su información, no podemos 
              garantizar seguridad absoluta.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Retención de Datos</h2>
            <p>
              Conservamos su información durante el tiempo necesario para:
            </p>
            <ul>
              <li>Proporcionar nuestros servicios</li>
              <li>Cumplir con obligaciones legales</li>
              <li>Resolver disputas</li>
              <li>Hacer cumplir nuestros acuerdos</li>
            </ul>
            <p>
              Cuando elimine su cuenta, eliminaremos o anonimizaremos su información personal, 
              excepto cuando la retención sea requerida por ley o para fines legítimos de negocio.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Sus Derechos</h2>
            <p>Usted tiene los siguientes derechos respecto a su información:</p>
            
            <h3>8.1. Acceso</h3>
            <p>
              Puede acceder y revisar su información personal a través de su cuenta o 
              solicitándonos una copia.
            </p>

            <h3>8.2. Corrección</h3>
            <p>
              Puede actualizar o corregir su información personal en cualquier momento 
              a través de su cuenta.
            </p>

            <h3>8.3. Eliminación</h3>
            <p>
              Puede solicitar la eliminación de su información personal. Sin embargo, 
              podemos retener cierta información según lo requerido por ley.
            </p>

            <h3>8.4. Portabilidad</h3>
            <p>
              Puede solicitar una copia de su información en un formato estructurado y 
              de uso común.
            </p>

            <h3>8.5. Oposición</h3>
            <p>
              Puede oponerse al procesamiento de su información para ciertos fines, 
              como marketing directo.
            </p>

            <h3>8.6. Retiro de Consentimiento</h3>
            <p>
              Puede retirar su consentimiento para el procesamiento de información en 
              cualquier momento, sujeto a limitaciones legales.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Privacidad de Menores</h2>
            <p>
              Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos 
              intencionalmente información personal de menores de edad. Si descubrimos que hemos 
              recopilado información de un menor, tomaremos medidas para eliminar esa información 
              inmediatamente.
            </p>
            <p>
              Si es padre o tutor y cree que su hijo menor de edad nos ha proporcionado información 
              personal, por favor contáctenos.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Transferencias Internacionales</h2>
            <p>
              Su información puede ser transferida y procesada en países distintos al suyo. 
              Al utilizar nuestros servicios, usted consiente la transferencia de su información 
              a estos países. Nos aseguramos de que se implementen salvaguardas apropiadas 
              para proteger su información.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Enlaces a Sitios de Terceros</h2>
            <p>
              Nuestra Plataforma puede contener enlaces a sitios web de terceros. No somos 
              responsables de las prácticas de privacidad de estos sitios. Le recomendamos 
              revisar las políticas de privacidad de cualquier sitio que visite.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Cambios a Esta Política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos 
              de cambios significativos publicando la nueva política en esta página y actualizando 
              la fecha de "Última actualización".
            </p>
            <p>
              Le recomendamos revisar esta política periódicamente para estar informado de cómo 
              protegemos su información.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Consentimiento de Cookies</h2>
            <p>
              Al utilizar nuestra Plataforma, usted consiente el uso de cookies según se describe 
              en esta política. Puede retirar su consentimiento en cualquier momento ajustando 
              la configuración de su navegador.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Contacto</h2>
            <p>
              Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de 
              Privacidad o el manejo de su información personal, puede contactarnos:
            </p>
            <ul>
              <li><strong>Email:</strong> privacidad@sorteohub.com</li>
              <li><strong>Teléfono:</strong> [Número de contacto]</li>
              <li><strong>Dirección:</strong> [Dirección de la empresa]</li>
            </ul>
            <p>
              Nos comprometemos a responder a sus consultas en un plazo razonable.
            </p>
          </section>

          <section className="legal-section">
            <h2>15. Aceptación</h2>
            <p>
              Al utilizar SorteoHub, usted reconoce que ha leído y entendido esta Política de 
              Privacidad y consiente el procesamiento de su información según se describe aquí.
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/terminos-condiciones" className="btn-legal-back">← Términos y Condiciones</Link>
          <Link to="/" className="btn-legal-next">Volver al Inicio →</Link>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidad;

