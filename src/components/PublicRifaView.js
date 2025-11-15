import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRifas } from '../contexts/RifasContext';

const PublicRifaView = ({ rifas }) => {
  const { id } = useParams();
  const [rifa, setRifa] = useState(null);
  const [filtro, setFiltro] = useState('disponibles'); // Por defecto mostrar disponibles
  const [numerosSeleccionados, setNumerosSeleccionados] = useState([]);
  const [indiceImagenActual, setIndiceImagenActual] = useState(0);
  const { getRifaById } = useRifas();

  // Función para obtener el nombre del tipo de rifa
  const obtenerNombreTipo = (tipo) => {
    const tipos = {
      'numeros': 'Números',
      'lotería': 'Lotería',
      'baraja': 'Baraja',
      'animales': 'Animales del Zodiaco',
      'colores': 'Colores',
      'equipos': 'Equipos Deportivos',
      'abecedario': 'Abecedario',
      'emojis': 'Emojis',
      'paises': 'Países del Mundo'
    };
    return tipos[tipo] || 'Números';
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!id) return;

      // 1) Buscar en la lista ya cargada (si existe)
      const rifaEncontrada = Array.isArray(rifas) ? rifas.find(r => r.id === id) : null;
      if (rifaEncontrada) {
        const rifaCompleta = {
          ...rifaEncontrada,
          numerosReservados: rifaEncontrada.numerosReservados || [],
          numerosVendidos: rifaEncontrada.numerosVendidos || [],
          participantes: rifaEncontrada.participantes || []
        };
        if (isMounted) setRifa(rifaCompleta);
        return;
      }

      // 2) Si no está en memoria (por ejemplo tras limpieza o acceso directo), pedirla al backend
      try {
        const rifaApi = await getRifaById(id);
        if (isMounted && rifaApi) {
          const rifaCompleta = {
            ...rifaApi,
            numerosReservados: rifaApi.numerosReservados || [],
            numerosVendidos: rifaApi.numerosVendidos || [],
            participantes: rifaApi.participantes || []
          };
          setRifa(rifaCompleta);
        }
      } catch (e) {
        // silencio: componente ya maneja estado no encontrado
      }
    }
    load();
    return () => { isMounted = false; };
  }, [id, rifas, getRifaById]);

  // Obtener las fotos del premio (antes del return condicional)
  const fotosPremios = rifa?.fotosPremios || [];
  
  // Navegación con teclado
  useEffect(() => {
    if (fotosPremios.length <= 1) return;
    
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        setIndiceImagenActual((prev) => (prev - 1 + fotosPremios.length) % fotosPremios.length);
      } else if (e.key === 'ArrowRight') {
        setIndiceImagenActual((prev) => (prev + 1) % fotosPremios.length);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fotosPremios.length]);
  
  // Resetear índice cuando cambia la rifa
  useEffect(() => {
    if (rifa?.id) {
      setIndiceImagenActual(0);
    }
  }, [rifa?.id]);

  if (!rifa) {
    return (
      <div className="public-container">
        <div className="header-top">
          <Link to="/portal" className="btn-back-to-rifas">
            ← Regresar a las Rifas
          </Link>
        </div>
        <div className="error-message">
          <h2>Rifa no encontrada</h2>
          <p>La rifa que buscas no existe o ha sido eliminada.</p>
          <Link to="/" className="btn-primary">Ver Todas las Rifas</Link>
        </div>
      </div>
    );
  }

  const numerosFiltrados = () => {
    // numerosDisponibles contiene TODOS los números de la rifa
    const todosNumeros = rifa.numerosDisponibles.sort((a, b) => a - b);
    
    switch (filtro) {
      case 'disponibles':
        // Normalizar todos a strings para comparación
        const vendidosStr = (rifa.numerosVendidos || []).map(n => String(n));
        const reservadosStr = (rifa.numerosReservados || []).map(n => String(n));
        return rifa.numerosDisponibles.filter(n => {
          const nStr = String(n);
          return !vendidosStr.includes(nStr) && !reservadosStr.includes(nStr);
        }).sort((a, b) => a - b);
      case 'vendidos':
        return (rifa.numerosVendidos || []).map(n => String(n)).sort((a, b) => Number(a) - Number(b));
      case 'reservados':
        return (rifa.numerosReservados || []).map(n => String(n)).sort((a, b) => Number(a) - Number(b));
      default:
        return todosNumeros;
    }
  };

  const esNumeroVendido = (numero) => {
    // Normalizar a string para comparación
    const numeroStr = String(numero);
    return rifa.numerosVendidos && rifa.numerosVendidos.map(n => String(n)).includes(numeroStr);
  };

  const esNumeroReservado = (numero) => {
    // Normalizar a string para comparación
    const numeroStr = String(numero);
    const reservados = (rifa.numerosReservados || []).map(n => String(n));
    return reservados.includes(numeroStr);
  };

  const obtenerParticipantePorNumero = (numero) => {
    if (!rifa.participantes || !Array.isArray(rifa.participantes)) {
      return null;
    }
    return rifa.participantes.find(p => p.numeros && p.numeros.includes(numero));
  };

  // numerosDisponibles contiene TODOS los números de la rifa
  const totalNumeros = rifa.numerosDisponibles.length;
  const porcentajeVendido = Math.round((rifa.numerosVendidos.length / totalNumeros) * 100);
  
  // Obtener la foto actual del carrusel
  const fotoActual = fotosPremios.length > 0 ? fotosPremios[indiceImagenActual] : null;
  
  // Funciones de navegación del carrusel
  const siguienteImagen = () => {
    setIndiceImagenActual((prev) => (prev + 1) % fotosPremios.length);
  };
  
  const anteriorImagen = () => {
    setIndiceImagenActual((prev) => (prev - 1 + fotosPremios.length) % fotosPremios.length);
  };
  
  const irAImagen = (index) => {
    setIndiceImagenActual(index);
  };

  return (
    <div className="public-container">
      <div className="header-top">
        <Link to="/portal" className="btn-back-to-rifas">
          ← Regresar a las Rifas
        </Link>
      </div>

      {/* Layout principal: Imagen izquierda, Contenido derecha */}
      <div className="rifa-main-layout">
        {/* Columna Izquierda: Card completa con información */}
        <div className="rifa-image-column">
          {/* Información de la rifa */}
          <div className="rifa-info-public-card">
            {/* Nombre de la rifa */}
            <h2 className="rifa-title-public">{rifa.nombre}</h2>
            
            {/* Descripción */}
            {rifa.descripcion && (
              <p className="rifa-description-public">{rifa.descripcion}</p>
            )}

            {/* Imagen del Premio con Carrusel */}
            {fotoActual ? (
              <div className="rifa-main-image-carousel">
                <div className="carousel-container">
                  <img 
                    src={fotoActual.url || fotoActual.url_foto} 
                    alt={rifa.nombre} 
                    className="carousel-image"
                  />
                  
                  {/* Información del premio */}
                  {fotoActual.premio_posicion && (
                    <div className="carousel-premio-info">
                      <span className="premio-badge">
                        {fotoActual.premio_posicion === 1 && '🥇'}
                        {fotoActual.premio_posicion === 2 && '🥈'}
                        {fotoActual.premio_posicion === 3 && '🥉'}
                        {fotoActual.premio_posicion > 3 && `#${fotoActual.premio_posicion}`}
                      </span>
                      <span className="premio-text">
                        Premio {fotoActual.premio_posicion}
                        {fotoActual.premio_nombre && `: ${fotoActual.premio_nombre}`}
                      </span>
                    </div>
                  )}
                  
                  {/* Controles de navegación - Solo si hay más de 1 imagen */}
                  {fotosPremios.length > 1 && (
                    <>
                      <button 
                        className="carousel-btn carousel-btn-prev"
                        onClick={anteriorImagen}
                        aria-label="Imagen anterior"
                      >
                        <span>‹</span>
                      </button>
                      <button 
                        className="carousel-btn carousel-btn-next"
                        onClick={siguienteImagen}
                        aria-label="Siguiente imagen"
                      >
                        <span>›</span>
                      </button>
                      
                      {/* Indicadores de posición */}
                      <div className="carousel-indicators">
                        {fotosPremios.map((foto, index) => (
                          <button
                            key={index}
                            className={`carousel-indicator ${index === indiceImagenActual ? 'active' : ''}`}
                            onClick={() => irAImagen(index)}
                            aria-label={`Ir a imagen ${index + 1}${foto.premio_posicion ? ` - Premio ${foto.premio_posicion}` : ''}`}
                            title={foto.premio_posicion ? `Premio ${foto.premio_posicion}${foto.premio_nombre ? `: ${foto.premio_nombre}` : ''} - Imagen ${index + 1}` : `Imagen ${index + 1}`}
                          />
                        ))}
                      </div>
                      
                      {/* Contador de imágenes con información del premio */}
                      <div className="carousel-counter">
                        {fotoActual.premio_posicion ? (
                          <span className="counter-with-premio">
                            <span className="counter-premio">Premio {fotoActual.premio_posicion}</span>
                            <span className="counter-separator">•</span>
                            <span className="counter-numbers">{indiceImagenActual + 1} / {fotosPremios.length}</span>
                          </span>
                        ) : (
                          <span>{indiceImagenActual + 1} / {fotosPremios.length}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="rifa-main-image-placeholder">
                <span className="placeholder-icon-large">🏆</span>
                <span className="placeholder-text-large">Sin imagen</span>
              </div>
            )}
            
            {/* Información detallada */}
            <div className="rifa-info-public">
              <div className="info-item">
                <span className="icon">💰</span>
                <div className="info-content">
                  <span className="info-label">Precio:</span>
                  <span className="info-value">${rifa.precio}</span>
                </div>
              </div>
              <div className="info-item">
                <span className="icon">📊</span>
                <div className="info-content">
                  <span className="info-label">Progreso:</span>
                  <span className="info-value">{porcentajeVendido}%</span>
                </div>
              </div>
              <div className="info-item">
                <span className="icon">🎯</span>
                <div className="info-content">
                  <span className="info-label">Tipo:</span>
                  <span className="info-value">{obtenerNombreTipo(rifa.tipo)}</span>
                </div>
              </div>
              {rifa.fecha_fin && (
                <div className="info-item">
                  <span className="icon">📅</span>
                  <div className="info-content">
                    <span className="info-label">Finaliza:</span>
                    <span className="info-value">{new Date(rifa.fecha_fin).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de progreso */}
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${porcentajeVendido}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Contenido */}
        <div className="rifa-content-column">

          {/* Resumen de selección flotante */}
          {numerosSeleccionados.length > 0 && (
            <div className="seleccion-resumen-flotante">
              <div className="seleccion-resumen-content">
                <div className="seleccion-info">
                  <span className="seleccion-count">{numerosSeleccionados.length} número{numerosSeleccionados.length !== 1 ? 's' : ''} seleccionado{numerosSeleccionados.length !== 1 ? 's' : ''}</span>
                  <span className="seleccion-total">Total: ${(rifa.precio * numerosSeleccionados.length).toFixed(2)}</span>
                </div>
                <div className="seleccion-actions">
                  <button 
                    className="btn-limpiar-seleccion"
                    onClick={() => setNumerosSeleccionados([])}
                    type="button"
                  >
                    Limpiar
                  </button>
                  <Link 
                    to={`/participar/${rifa.id}`} 
                    state={{ numerosSeleccionados }}
                    className="btn-participar-ahora"
                  >
                    Participar Ahora →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Sección de Selección de Números */}
          <div className="seleccion-numeros-section">
            <div className="seleccion-header">
              <h2>🎯 Selecciona tus Números</h2>
              {numerosSeleccionados.length > 0 && (
                <div className="seleccion-resumen-inline">
                  <span>{numerosSeleccionados.length} seleccionado{numerosSeleccionados.length !== 1 ? 's' : ''}</span>
                  <span className="total-preview">Total: ${(rifa.precio * numerosSeleccionados.length).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="filtros">
              <button 
                className={`filtro-btn ${filtro === 'disponibles' ? 'activo' : ''}`}
                onClick={() => setFiltro('disponibles')}
              >
                Disponibles ({(() => {
                  const vendidosStr = (rifa.numerosVendidos || []).map(n => String(n));
                  const reservadosStr = (rifa.numerosReservados || []).map(n => String(n));
                  return rifa.numerosDisponibles.filter(n => {
                    const nStr = String(n);
                    return !vendidosStr.includes(nStr) && !reservadosStr.includes(nStr);
                  }).length;
                })()})
              </button>
              <button 
                className={`filtro-btn ${filtro === 'todos' ? 'activo' : ''}`}
                onClick={() => setFiltro('todos')}
              >
                Todos ({totalNumeros})
              </button>
              <button 
                className={`filtro-btn ${filtro === 'vendidos' ? 'activo' : ''}`}
                onClick={() => setFiltro('vendidos')}
              >
                Vendidos ({rifa.numerosVendidos.length})
              </button>
              <button 
                className={`filtro-btn ${filtro === 'reservados' ? 'activo' : ''}`}
                onClick={() => setFiltro('reservados')}
              >
                Reservados ({(rifa.numerosReservados || []).length})
              </button>
            </div>

            <div className="numeros-container">
              <div className="numeros-grid-public">
                {numerosFiltrados().map(numero => {
                  const vendido = esNumeroVendido(numero);
                  const reservado = esNumeroReservado(numero);
                  const disponible = !vendido && !reservado;
                  const seleccionado = numerosSeleccionados.includes(numero);
                  const participante = vendido ? obtenerParticipantePorNumero(numero) : null;
                  
                  let estado = 'disponible';
                  let titulo = 'Disponible - Click para seleccionar';
                  
                  if (vendido) {
                    estado = 'vendido';
                    titulo = `Vendido a: ${participante?.nombre}`;
                  } else if (reservado) {
                    estado = 'reservado';
                    titulo = 'Reservado temporalmente';
                  } else if (seleccionado) {
                    estado = 'seleccionado';
                    titulo = 'Seleccionado - Click para deseleccionar';
                  }
                  
                  return (
                    <button
                      key={numero} 
                      className={`numero-public ${estado}`}
                      title={titulo}
                      onClick={() => {
                        if (disponible) {
                          if (seleccionado) {
                            setNumerosSeleccionados(numerosSeleccionados.filter(n => n !== numero));
                          } else {
                            setNumerosSeleccionados([...numerosSeleccionados, numero]);
                          }
                        }
                      }}
                      disabled={!disponible}
                      type="button"
                    >
                      <span className="numero">{numero}</span>
                      {vendido && <span className="vendido-indicator">✓</span>}
                      {reservado && <span className="reservado-indicator">⏳</span>}
                      {seleccionado && <span className="seleccionado-indicator">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón de Participar - Visible siempre */}
            {rifa.activa && (
              <div className="participar-section-public">
                {numerosSeleccionados.length > 0 ? (
                  <div className="participar-con-seleccion">
                    <div className="seleccion-summary">
                      <h3>Tu Selección</h3>
                      <div className="numeros-seleccionados-preview">
                        {numerosSeleccionados.sort((a, b) => a - b).map(num => (
                          <span key={num} className="numero-preview">{num}</span>
                        ))}
                      </div>
                      <div className="total-participacion">
                        <span className="total-label">Total a pagar:</span>
                        <span className="total-amount">${(rifa.precio * numerosSeleccionados.length).toFixed(2)}</span>
                      </div>
                    </div>
                    <Link 
                      to={`/participar/${rifa.id}`} 
                      state={{ numerosSeleccionados }}
                      className="btn-primary btn-participar-grande"
                    >
                      🎫 Participar con {numerosSeleccionados.length} número{numerosSeleccionados.length !== 1 ? 's' : ''}
                    </Link>
                  </div>
                ) : (
                  <div className="participar-sin-seleccion">
                    <p>Selecciona tus números arriba o continúa para elegirlos en el siguiente paso</p>
                    <Link 
                      to={`/participar/${rifa.id}`} 
                      className="btn-primary btn-participar-grande"
                    >
                      🎫 Participar en esta Rifa
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección de Premios - Debajo del layout principal */}
      {rifa.premios && Array.isArray(rifa.premios) && rifa.premios.length > 0 && (
        <div className="premios-public">
          <h3>🏆 Premios</h3>
          <div className="premios-grid">
            {rifa.premios.map((premio, index) => (
              <div key={premio.id || index} className="premio-public">
                <div className="premio-posicion">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </div>
                <h4>{premio.nombre || `Premio ${index + 1}`}</h4>
                {premio.descripcion && <p>{premio.descripcion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección de Fotos de Premios - Organizadas por Premio */}
      {rifa.fotosPremios && rifa.fotosPremios.length > 0 && (
        <div className="fotos-premios-public">
          
          {/* Agrupar fotos por premio */}
          {(() => {
            // Agrupar fotos por premio_posicion
            const fotosPorPremio = {};
            rifa.fotosPremios.forEach(foto => {
              const posicion = foto.premio_posicion || 0;
              if (!fotosPorPremio[posicion]) {
                fotosPorPremio[posicion] = {
                  posicion: posicion,
                  nombre: foto.premio_nombre || `Premio ${posicion}`,
                  fotos: []
                };
              }
              fotosPorPremio[posicion].fotos.push(foto);
            });

            // Ordenar por posición del premio
            const premiosOrdenados = Object.values(fotosPorPremio).sort((a, b) => {
              if (a.posicion === 0) return 1; // Sin premio al final
              if (b.posicion === 0) return -1;
              return a.posicion - b.posicion;
            });

            return premiosOrdenados.map(premio => (
              <div key={premio.posicion} className="premio-fotos-section">
                <div className="premio-fotos-header">
                  <h4 className="premio-fotos-title">
                    {premio.posicion === 1 && '🥇'}
                    {premio.posicion === 2 && '🥈'}
                    {premio.posicion === 3 && '🥉'}
                    {premio.posicion > 3 && `#${premio.posicion}`}
                    {premio.posicion === 0 && '🏆'}
                    <span className="premio-fotos-nombre">
                      Premio {premio.posicion || 'General'}
                      {premio.nombre && premio.posicion !== 0 && `: ${premio.nombre}`}
                    </span>
                  </h4>
                  <span className="premio-fotos-count">{premio.fotos.length} foto{premio.fotos.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="fotos-grid">
                  {premio.fotos.map((foto, index) => (
                    <div key={foto.id || index} className="foto-premio-item">
                      <img 
                        src={foto.url || foto.url_foto} 
                        alt={`${premio.nombre} - Foto ${index + 1}`}
                        className="foto-premio-img"
                      />
                      {premio.fotos.length > 1 && (
                        <div className="foto-premio-number">{index + 1}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Sección de Reglas */}
      {rifa.reglas && (
        <div className="reglas-public">
          <h3>📋 Reglas de la Rifa</h3>
          <div className="reglas-content">
            <p>{rifa.reglas}</p>
          </div>
        </div>
      )}

      <div className="participantes-public">
        <h3>👥 Participantes ({rifa.participantes ? rifa.participantes.length : 0})</h3>
        {(!rifa.participantes || rifa.participantes.length === 0) ? (
          <p>No hay participantes aún</p>
        ) : (
            <div className="participantes-grid">
              {rifa.participantes.map(participante => (
                <div key={participante.id} className="participante-public">
                  <h4>{participante.nombre}</h4>
                  <p>🎫 Números: {participante.numeros ? participante.numeros.join(', ') : 'No especificados'}</p>
                  <p>💰 Total: ${rifa.precio * (participante.numeros ? participante.numeros.length : 0)}</p>
                </div>
              ))}
            </div>
        )}
      </div>

      {/* Sección de Formas de Pago */}
      {rifa.formasPago && rifa.formasPago.transferencia && (
        <div className="pagos-public">
          <h3>💳 Formas de Pago</h3>
          <div className="pagos-info">
            <h4>💸 Transferencia Bancaria</h4>
            <div className="pago-details-public">
              <p><strong>Banco:</strong> {rifa.formasPago.banco}</p>
              <p><strong>CLABE:</strong> {rifa.formasPago.clabe}</p>
              <p><strong>Número de cuenta:</strong> {rifa.formasPago.numeroCuenta}</p>
              <p><strong>Titular:</strong> {rifa.formasPago.nombreTitular}</p>
              {rifa.formasPago.telefono && (
                <p><strong>Teléfono:</strong> {rifa.formasPago.telefono}</p>
              )}
              {rifa.formasPago.whatsapp && (
                <p><strong>WhatsApp:</strong> {rifa.formasPago.whatsapp}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicRifaView;
