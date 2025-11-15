import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { validateEmail, validateNombre, validateTelefono } from '../utils/validation';
import Swal from 'sweetalert2';
import StripePayment from './StripePayment';

const API_BASE = 'http://localhost:5001/api';

// Función para calcular tiempo restante
const calcularTiempoRestante = (fechaFin) => {
  if (!fechaFin) return null;
  const ahora = new Date();
  const fin = new Date(fechaFin);
  const diferencia = fin - ahora;
  
  if (diferencia <= 0) return { terminado: true };
  
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  
  return { dias, horas, minutos, terminado: false };
};

// Función para sugerir números "de la suerte" (números más vendidos o aleatorios)
const sugerirNumerosSuerte = (numerosDisponibles, numerosVendidos, cantidad = 5) => {
  // Si hay números vendidos, sugerir números cercanos a los más vendidos
  if (numerosVendidos && numerosVendidos.length > 0) {
    const numerosVendidosNum = numerosVendidos.map(n => parseInt(n)).filter(n => !isNaN(n));
    if (numerosVendidosNum.length > 0) {
      const promedio = Math.round(numerosVendidosNum.reduce((a, b) => a + b, 0) / numerosVendidosNum.length);
      const sugeridos = numerosDisponibles
        .map(n => parseInt(n))
        .filter(n => !isNaN(n))
        .filter(n => !numerosVendidos.includes(String(n)))
        .sort((a, b) => Math.abs(a - promedio) - Math.abs(b - promedio))
        .slice(0, cantidad)
        .map(n => String(n));
      
      if (sugeridos.length > 0) return sugeridos;
    }
  }
  
  // Si no hay números vendidos, sugerir números aleatorios "de la suerte"
  const numerosDisponiblesNum = numerosDisponibles
    .map(n => parseInt(n))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
  
  const sugeridos = [];
  const numerosSuerte = [7, 13, 21, 33, 77, 88, 99, 100, 111, 222, 333, 444, 555, 666, 777, 888, 999];
  
  // Buscar números "de la suerte" disponibles
  for (const suerte of numerosSuerte) {
    if (numerosDisponiblesNum.includes(suerte) && sugeridos.length < cantidad) {
      sugeridos.push(String(suerte));
    }
  }
  
  // Si no hay suficientes, agregar aleatorios
  while (sugeridos.length < cantidad && numerosDisponiblesNum.length > 0) {
    const random = numerosDisponiblesNum[Math.floor(Math.random() * numerosDisponiblesNum.length)];
    if (!sugeridos.includes(String(random))) {
      sugeridos.push(String(random));
    }
  }
  
  return sugeridos.slice(0, cantidad);
};

const ParticipateRaffle = ({ rifas, setRifas }) => {
  const { id } = useParams();
  const location = useLocation();
  const [rifa, setRifa] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Obtener números pre-seleccionados desde location.state
  const numerosPreSeleccionados = location.state?.numerosSeleccionados || [];
  
  // Estados del flujo
  const [paso, setPaso] = useState(numerosPreSeleccionados.length > 0 ? 2 : 1); // 1: Selección, 2: Datos, 3: Pago
  const [participante, setParticipante] = useState({
    nombre: '',
    telefono: '',
    email: '',
    numerosSeleccionados: numerosPreSeleccionados
  });
  const [participanteErrors, setParticipanteErrors] = useState({
    nombre: '',
    telefono: '',
    email: ''
  });
  const [numerosDisponibles, setNumerosDisponibles] = useState([]);
  const [filtro, setFiltro] = useState('disponibles');
  const [stripeDisponible, setStripeDisponible] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [numerosSugeridos, setNumerosSugeridos] = useState([]);

  useEffect(() => {
    cargarRifaCompleta();
  }, [id, rifas]);

  // Actualizar tiempo restante cada minuto
  useEffect(() => {
    if (!rifa || !rifa.fecha_fin) return;
    
    const actualizarTiempo = () => {
      const tiempo = calcularTiempoRestante(rifa.fecha_fin);
      setTiempoRestante(tiempo);
    };
    
    actualizarTiempo();
    const interval = setInterval(actualizarTiempo, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, [rifa]);

  // Calcular números sugeridos cuando cambia la rifa
  useEffect(() => {
    if (rifa && numerosDisponibles.length > 0) {
      const sugeridos = sugerirNumerosSuerte(
        numerosDisponibles,
        rifa.numerosVendidos || [],
        5
      );
      setNumerosSugeridos(sugeridos);
    }
  }, [rifa, numerosDisponibles]);

  const cargarRifaCompleta = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/rifas/${id}`);
      
      if (response.ok) {
        const result = await response.json();
        const rifaActualizada = result.rifa;
        
        const rifaCompleta = {
          ...rifaActualizada,
          numerosVendidos: (rifaActualizada.numerosVendidos || []).map(n => String(n)),
          numerosReservados: (rifaActualizada.numerosReservados || []).map(n => String(n)),
          elementos_personalizados: rifaActualizada.elementos_personalizados || [],
          numerosDisponibles: rifaActualizada.elementos_personalizados || [],
        };
        
        setRifa(rifaCompleta);
        setNumerosDisponibles(rifaCompleta.elementos_personalizados || []);
        
        // Verificar si Stripe está disponible
        if (rifaCompleta.id) {
          const tieneStripe = await verificarStripeDisponible(rifaCompleta.id);
          setStripeDisponible(tieneStripe);
        }
        
        if (setRifas && Array.isArray(rifas)) {
          const rifasActualizadas = rifas.map(r =>
            r.id === rifaCompleta.id ? rifaCompleta : r
          );
          setRifas(rifasActualizadas);
        }
      }
    } catch (error) {
      console.error('Error recargando rifa:', error);
    } finally {
      setLoading(false);
    }
  };

  const verificarStripeDisponible = async (rifaId) => {
    try {
      const response = await fetch(`${API_BASE}/rifas/${rifaId}`);
      if (response.ok) {
        const data = await response.json();
        const rifa = data.rifa;
        const formasPago = Array.isArray(rifa.formasPago) ? rifa.formasPago : (rifa.formasPago ? [rifa.formasPago] : []);
        return formasPago.length > 0 && formasPago[0]?.clabe;
      }
      return false;
    } catch (error) {
      console.error('Error verificando Stripe:', error);
      return false;
    }
  };

  const seleccionarNumero = (numero) => {
    const esDisponible = !(rifa.numerosVendidos || []).includes(numero) && 
                        !(rifa.numerosReservados || []).includes(numero);
    
    if (!esDisponible) return;
    
    if (participante.numerosSeleccionados.includes(numero)) {
      setParticipante({
        ...participante,
        numerosSeleccionados: participante.numerosSeleccionados.filter(n => n !== numero)
      });
    } else {
      setParticipante({
        ...participante,
        numerosSeleccionados: [...participante.numerosSeleccionados, numero]
      });
    }
  };

  const continuarADatos = () => {
    if (participante.numerosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona números',
        text: 'Por favor, selecciona al menos un número para continuar',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#635BFF'
      });
      return;
    }
    setPaso(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const continuarAPago = () => {
    const nombreValidation = validateNombre(participante.nombre, 2);
    const emailValidation = validateEmail(participante.email);
    const telefonoValidation = validateTelefono(participante.telefono, true);
    
    setParticipanteErrors({
      nombre: nombreValidation.error,
      email: emailValidation.error,
      telefono: telefonoValidation.error
    });
    
    if (!nombreValidation.valid || !emailValidation.valid || !telefonoValidation.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Completa todos los campos',
        text: 'Por favor, completa correctamente todos los campos requeridos',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#635BFF'
      });
      return;
    }

    setPaso(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePagoExitoso = async (paymentIntent) => {
    try {
      Swal.fire({
        title: 'Procesando...',
        text: 'Registrando tu participación',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch(`${API_BASE}/participantes/${rifa.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: participante.nombre.trim(),
          telefono: participante.telefono.trim(),
          email: participante.email.trim(),
          numerosSeleccionados: participante.numerosSeleccionados.map(num => String(num)),
          quiereRegistro: true,
          stripe_payment_intent_id: paymentIntent.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar participación');
      }

      await cargarRifaCompleta();
      
      await Swal.fire({
        icon: 'success',
        title: '¡Participación exitosa!',
        html: `
          <p>Los números <strong>${participante.numerosSeleccionados.join(', ')}</strong> han sido reservados.</p>
          <p>Tu pago ha sido procesado correctamente.</p>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#10b981'
      });
      
      // Resetear y volver al inicio
      setParticipante({
        nombre: '',
        telefono: '',
        email: '',
        numerosSeleccionados: []
      });
      setParticipanteErrors({
        nombre: '',
        telefono: '',
        email: ''
      });
      setPaso(1);
    } catch (error) {
      console.error('Error al confirmar participación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar participación',
        text: error.message,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  if (loading) {
    return (
      <div className="participate-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando rifa...</p>
        </div>
      </div>
    );
  }

  if (!rifa) {
    return (
      <div className="participate-container">
        <div className="error-state">
          <h2>Rifa no encontrada</h2>
          <p>La rifa que buscas no existe o ha sido eliminada.</p>
          <Link to="/portal" className="btn-primary">Ver Rifas</Link>
        </div>
      </div>
    );
  }

  if (!rifa.activa) {
    return (
      <div className="participate-container">
        <div className="error-state">
          <h2>Rifa Finalizada</h2>
          <p>Esta rifa ya ha finalizado y no acepta más participantes.</p>
          <Link to="/portal" className="btn-primary">Ver Otras Rifas</Link>
        </div>
      </div>
    );
  }

  const totalPagar = rifa.precio * participante.numerosSeleccionados.length;
  const primeraFoto = rifa.fotosPremios && rifa.fotosPremios.length > 0 
    ? rifa.fotosPremios[0].url 
    : null;

  // Calcular porcentaje vendido
  const totalNumeros = numerosDisponibles.length;
  const numerosVendidos = (rifa.numerosVendidos || []).length;
  const porcentajeVendido = totalNumeros > 0 ? Math.round((numerosVendidos / totalNumeros) * 100) : 0;

  // Función para compartir rifa
  const compartirRifa = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Participa en: ${rifa.nombre}`,
        text: `¡Echa un vistazo a esta rifa en SorteoHub!`,
        url: url
      }).catch(err => console.log('Error compartiendo:', err));
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(url).then(() => {
        Swal.fire({
          icon: 'success',
          title: '¡Link copiado!',
          text: 'El enlace de la rifa se ha copiado al portapapeles',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#635BFF',
          timer: 2000
        });
      });
    }
  };

  const numerosFiltrados = () => {
    const todosNumeros = numerosDisponibles.sort((a, b) => a - b);
    switch (filtro) {
      case 'disponibles':
        return todosNumeros.filter(n => 
          !(rifa.numerosVendidos || []).includes(n) && 
          !(rifa.numerosReservados || []).includes(n)
        );
      case 'todos':
        return todosNumeros;
      case 'vendidos':
        return (rifa.numerosVendidos || []).sort((a, b) => a - b);
      case 'reservados':
        return (rifa.numerosReservados || []).sort((a, b) => a - b);
      default:
        return todosNumeros;
    }
  };

  const numerosParaMostrar = () => {
    const filtrados = numerosFiltrados();
    const seleccionados = participante.numerosSeleccionados;
    const seleccionadosFaltantes = seleccionados.filter(n => !filtrados.includes(n));
    const todos = [...filtrados, ...seleccionadosFaltantes];
    return [...new Set(todos)].sort((a, b) => a - b);
  };

  const numerosDisponiblesCount = (numerosDisponibles || []).filter(n => 
    !(rifa.numerosVendidos || []).includes(n) && 
    !(rifa.numerosReservados || []).includes(n) &&
    !participante.numerosSeleccionados.includes(n)
  ).length;
  const numerosVendidosCount = (rifa.numerosVendidos || []).length;
  const numerosReservadosCount = (rifa.numerosReservados || []).length;

  return (
    <div className="participate-container-modern">
      {/* Header */}
      <div className="participate-header-modern">
        <div className="header-top">
          <Link to="/portal" className="back-link">
            <span className="back-icon">←</span>
            <span>Volver a Rifas</span>
          </Link>
          <button 
            className="share-button"
            onClick={compartirRifa}
            title="Compartir rifa"
          >
            <span className="share-icon">🔗</span>
            <span>Compartir</span>
          </button>
        </div>
        <h1 className="rifa-title-modern">{rifa.nombre}</h1>
        <div className="rifa-meta">
          <span className="meta-item">💰 ${rifa.precio} MXN</span>
          <span className="meta-item">🎫 {numerosDisponibles.length} números</span>
          {rifa.fecha_fin && tiempoRestante && !tiempoRestante.terminado && (
            <span className="meta-item time-remaining">
              ⏰ {tiempoRestante.dias > 0 ? `${tiempoRestante.dias}d ` : ''}
              {tiempoRestante.horas}h {tiempoRestante.minutos}m restantes
            </span>
          )}
        </div>
        
        {/* Barra de progreso visual */}
        <div className="rifa-progress-section">
          <div className="progress-header">
            <span className="progress-label">Progreso de Venta</span>
            <span className="progress-percentage">{porcentajeVendido}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${porcentajeVendido}%` }}
            ></div>
          </div>
          <div className="progress-stats">
            <span>{numerosVendidos} vendidos</span>
            <span>•</span>
            <span>{totalNumeros - numerosVendidos} disponibles</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="steps-indicator">
        <div className={`step ${paso >= 1 ? 'active' : ''} ${paso > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Selecciona Números</div>
        </div>
        <div className={`step ${paso >= 2 ? 'active' : ''} ${paso > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Tus Datos</div>
        </div>
        <div className={`step ${paso >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Pago Seguro</div>
        </div>
      </div>

      {/* Paso 1: Selección de Números */}
      {paso === 1 && (
        <div className="step-content">
          <div className="selection-section">
            <div className="selection-header">
              <h2>🎯 Selecciona tus números</h2>
              <div className="selection-summary">
                <span className="selected-count">
                  {participante.numerosSeleccionados.length} {participante.numerosSeleccionados.length === 1 ? 'número seleccionado' : 'números seleccionados'}
                </span>
                {participante.numerosSeleccionados.length > 0 && (
                  <span className="total-amount">
                    Total: ${totalPagar.toFixed(2)} MXN
                  </span>
                )}
              </div>
            </div>

            {/* Números Sugeridos */}
            {numerosSugeridos.length > 0 && (
              <div className="sugeridos-section">
                <div className="sugeridos-header">
                  <span className="sugeridos-icon">🍀</span>
                  <h3>Números de la Suerte Sugeridos</h3>
                </div>
                <div className="sugeridos-grid">
                  {numerosSugeridos.map(numero => {
                    const vendido = (rifa.numerosVendidos || []).includes(numero);
                    const reservado = (rifa.numerosReservados || []).includes(numero);
                    const disponible = !vendido && !reservado;
                    const seleccionado = participante.numerosSeleccionados.includes(numero);
                    
                    if (!disponible && !seleccionado) return null;
                    
                    return (
                      <button
                        key={numero}
                        className={`sugerido-btn ${seleccionado ? 'seleccionado' : ''}`}
                        onClick={() => seleccionarNumero(numero)}
                        disabled={!disponible && !seleccionado}
                      >
                        {numero}
                        {seleccionado && <span className="check-icon">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filtros */}
            <div className="filtros-modern">
              <button
                className={`filtro-btn-modern ${filtro === 'disponibles' ? 'active' : ''}`}
                onClick={() => setFiltro('disponibles')}
              >
                Disponibles ({numerosDisponiblesCount})
              </button>
              <button
                className={`filtro-btn-modern ${filtro === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltro('todos')}
              >
                Todos ({numerosDisponibles.length})
              </button>
              <button
                className={`filtro-btn-modern ${filtro === 'vendidos' ? 'active' : ''}`}
                onClick={() => setFiltro('vendidos')}
              >
                Vendidos ({numerosVendidosCount})
              </button>
              <button
                className={`filtro-btn-modern ${filtro === 'reservados' ? 'active' : ''}`}
                onClick={() => setFiltro('reservados')}
              >
                Reservados ({numerosReservadosCount})
              </button>
            </div>

            {/* Grid de Números */}
            <div className="numeros-grid-modern">
              {numerosParaMostrar().map(numero => {
                const vendido = (rifa.numerosVendidos || []).includes(numero);
                const reservado = (rifa.numerosReservados || []).includes(numero);
                const disponible = !vendido && !reservado;
                const seleccionado = participante.numerosSeleccionados.includes(numero);
                
                let estado = 'disponible';
                if (seleccionado) estado = 'seleccionado';
                else if (vendido) estado = 'vendido';
                else if (reservado) estado = 'reservado';
                
                const puedeInteractuar = disponible || seleccionado;
                
                return (
                  <button
                    key={numero}
                    className={`numero-btn-modern ${estado}`}
                    onClick={() => seleccionarNumero(numero)}
                    disabled={!puedeInteractuar && !seleccionado}
                    title={
                      seleccionado ? 'Seleccionado - Click para remover' :
                      vendido ? 'Vendido' : 
                      reservado ? 'Reservado' : 
                      'Disponible'
                    }
                  >
                    {numero}
                    {seleccionado && <span className="check-icon">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Vista Previa de Participación */}
            {participante.numerosSeleccionados.length > 0 && (
              <div className="participacion-preview">
                <div className="preview-header">
                  <span className="preview-icon">👁️</span>
                  <h3>Vista Previa de tu Participación</h3>
                </div>
                <div className="preview-content">
                  <div className="preview-item">
                    <span className="preview-label">Números seleccionados:</span>
                    <div className="preview-numbers-list">
                      {participante.numerosSeleccionados.sort((a, b) => a - b).map(num => (
                        <span key={num} className="preview-number-badge">{num}</span>
                      ))}
                    </div>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Cantidad:</span>
                    <span className="preview-value">{participante.numerosSeleccionados.length} {participante.numerosSeleccionados.length === 1 ? 'número' : 'números'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Precio por número:</span>
                    <span className="preview-value">${rifa.precio} MXN</span>
                  </div>
                  <div className="preview-item total-preview">
                    <span className="preview-label">Total a pagar:</span>
                    <span className="preview-total-amount">${totalPagar.toFixed(2)} MXN</span>
                  </div>
                </div>
              </div>
            )}

            {/* Botón Continuar */}
            {participante.numerosSeleccionados.length > 0 && (
              <div className="continue-section">
                <button 
                  className="btn-continue-modern"
                  onClick={continuarADatos}
                >
                  Continuar con mis datos →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paso 2: Datos del Participante */}
      {paso === 2 && (
        <div className="step-content">
          <div className="data-section">
            <div className="section-header">
              <h2>👤 Completa tus datos</h2>
              <p className="section-subtitle">Necesitamos esta información para procesar tu participación</p>
            </div>

            <div className="form-modern">
              <div className="form-group-modern">
                <label htmlFor="nombre">Nombre completo *</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={participante.nombre}
                  maxLength={100}
                  onChange={(e) => {
                    let value = e.target.value;
                    
                    // Limitar a 100 caracteres
                    if (value.length > 100) {
                      value = value.substring(0, 100);
                    }
                    
                    setParticipante({...participante, nombre: value});
                    
                    // Validar en tiempo real solo si hay contenido
                    if (value.trim()) {
                      const validation = validateNombre(value, 2);
                      setParticipanteErrors({...participanteErrors, nombre: validation.error});
                    } else {
                      setParticipanteErrors({...participanteErrors, nombre: ''});
                    }
                  }}
                  onBlur={(e) => {
                    const validation = validateNombre(e.target.value, 2);
                    setParticipanteErrors({...participanteErrors, nombre: validation.error});
                  }}
                  className={participanteErrors.nombre ? 'input-error' : ''}
                />
                {participanteErrors.nombre && (
                  <span className="error-text">{participanteErrors.nombre}</span>
                )}
                {!participanteErrors.nombre && participante.nombre && (
                  <span className="success-text">✓ Nombre válido</span>
                )}
              </div>
              
              <div className="form-group-modern">
                <label htmlFor="telefono">Teléfono *</label>
                <input
                  id="telefono"
                  type="tel"
                  placeholder="Ej: +52 55 1234 5678 o 5512345678"
                  value={participante.telefono}
                  maxLength={20}
                  onChange={(e) => {
                    let value = e.target.value;
                    
                    // Permitir solo números, espacios, guiones, paréntesis, puntos y el símbolo +
                    value = value.replace(/[^\d\s\-\(\)\.\+]/g, '');
                    
                    // Limitar a 20 caracteres
                    if (value.length > 20) {
                      value = value.substring(0, 20);
                    }
                    
                    setParticipante({...participante, telefono: value});
                    
                    // Validar en tiempo real solo si hay contenido
                    if (value.trim()) {
                      const validation = validateTelefono(value, true);
                      setParticipanteErrors({...participanteErrors, telefono: validation.error});
                    } else {
                      // Si está vacío pero es requerido, mostrar error solo en blur
                      setParticipanteErrors({...participanteErrors, telefono: ''});
                    }
                  }}
                  onBlur={(e) => {
                    const validation = validateTelefono(e.target.value, true);
                    setParticipanteErrors({...participanteErrors, telefono: validation.error});
                  }}
                  className={participanteErrors.telefono ? 'input-error' : ''}
                />
                {participanteErrors.telefono && (
                  <span className="error-text">{participanteErrors.telefono}</span>
                )}
                {!participanteErrors.telefono && participante.telefono && (
                  <span className="success-text">✓ Formato válido</span>
                )}
              </div>
              
              <div className="form-group-modern">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Ej: tu@email.com"
                  value={participante.email}
                  maxLength={254}
                  onChange={(e) => {
                    let value = e.target.value.toLowerCase().trim();
                    
                    // Limitar a 254 caracteres (estándar de email)
                    if (value.length > 254) {
                      value = value.substring(0, 254);
                    }
                    
                    setParticipante({...participante, email: value});
                    
                    // Validar en tiempo real solo si hay contenido
                    if (value.trim()) {
                      const validation = validateEmail(value);
                      setParticipanteErrors({...participanteErrors, email: validation.error});
                    } else {
                      setParticipanteErrors({...participanteErrors, email: ''});
                    }
                  }}
                  onBlur={(e) => {
                    const validation = validateEmail(e.target.value.trim());
                    setParticipanteErrors({...participanteErrors, email: validation.error});
                  }}
                  className={participanteErrors.email ? 'input-error' : ''}
                />
                {participanteErrors.email && (
                  <span className="error-text">{participanteErrors.email}</span>
                )}
                {!participanteErrors.email && participante.email && (
                  <span className="success-text">✓ Email válido</span>
                )}
              </div>

              <div className="data-summary">
                <div className="summary-card">
                  <div className="summary-row">
                    <span>Números seleccionados:</span>
                    <strong>{participante.numerosSeleccionados.sort((a, b) => a - b).join(', ')}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Precio por número:</span>
                    <strong>${rifa.precio} MXN</strong>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total a pagar:</span>
                    <strong className="total-amount-large">${totalPagar.toFixed(2)} MXN</strong>
                  </div>
                </div>
              </div>

              <div className="form-actions-modern">
                <button 
                  className="btn-back-modern"
                  onClick={() => setPaso(1)}
                >
                  ← Volver
                </button>
                <button 
                  className="btn-continue-modern"
                  onClick={continuarAPago}
                  disabled={
                    !participante.nombre.trim() || 
                    !participante.telefono.trim() || 
                    !participante.email.trim() ||
                    participanteErrors.nombre || 
                    participanteErrors.telefono || 
                    participanteErrors.email
                  }
                >
                  Continuar al Pago →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paso 3: Pago con Stripe */}
      {paso === 3 && stripeDisponible && (
        <div className="step-content">
          <div className="payment-section">
            <div className="section-header">
              <h2>💳 Pago Seguro</h2>
              <p className="section-subtitle">Procesado de forma segura por Stripe</p>
            </div>

            {/*<div className="payment-summary-card">
              <div className="summary-item-modern">
                <span>Números:</span>
                <strong>{participante.numerosSeleccionados.sort((a, b) => a - b).join(', ')}</strong>
              </div>
              <div className="summary-item-modern">
                <span>Total:</span>
                <strong className="total-large">${totalPagar.toFixed(2)} MXN</strong>
              </div>
            </div>
            */}
            <div className="stripe-container-modern">
              <StripePayment
                rifaId={rifa.id}
                amount={totalPagar}
                numerosSeleccionados={participante.numerosSeleccionados}
                onSuccess={handlePagoExitoso}
                onCancel={() => setPaso(2)}
              />
            </div>

            <button 
              className="btn-back-modern"
              onClick={() => setPaso(2)}
              style={{ marginTop: '2rem' }}
            >
              ← Volver a Datos
            </button>
          </div>
        </div>
      )}

      {paso === 3 && !stripeDisponible && (
        <div className="step-content">
          <div className="error-state">
            <h2>⚠️ Pago no disponible</h2>
            <p>El creador de esta rifa no ha configurado los datos de pago.</p>
            <button 
              className="btn-back-modern"
              onClick={() => setPaso(2)}
            >
              ← Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipateRaffle;
