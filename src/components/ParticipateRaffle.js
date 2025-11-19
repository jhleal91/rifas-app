import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { validateEmail, validateNombre, validateTelefono } from '../utils/validation';
import Swal from 'sweetalert2';
import StripePayment from './StripePayment';

import { API_BASE } from '../config/api';

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


const ParticipateRaffle = ({ rifas, setRifas }) => {
  const { t } = useTranslation();
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

  useEffect(() => {
    cargarRifaCompleta();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        title: t('participateRaffle.alerts.selectNumbers.title'),
        text: t('participateRaffle.alerts.selectNumbers.text'),
        confirmButtonText: t('participateRaffle.alerts.selectNumbers.confirm'),
        confirmButtonColor: '#635BFF'
      });
      return;
    }
    setPaso(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [participanteId, setParticipanteId] = useState(null);
  const [registrandoParticipante, setRegistrandoParticipante] = useState(false);

  const continuarAPago = async () => {
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
        title: t('participateRaffle.alerts.completeFields.title'),
        text: t('participateRaffle.alerts.completeFields.text'),
        confirmButtonText: t('participateRaffle.alerts.completeFields.confirm'),
        confirmButtonColor: '#635BFF'
      });
      return;
    }

    // Registrar participante ANTES de crear el Payment Intent
    // Esto permite que el webhook tenga el participante_id para marcar números como vendidos
    try {
      setRegistrandoParticipante(true);
      Swal.fire({
        title: t('participateRaffle.alerts.processing.title'),
        text: 'Registrando tu participación...',
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
          quiereRegistro: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar participación');
      }

      const data = await response.json();
      const nuevoParticipanteId = data.participante?.id || data.id;
      
      if (!nuevoParticipanteId) {
        throw new Error('No se recibió el ID del participante');
      }

      setParticipanteId(nuevoParticipanteId);
      Swal.close();
      setPaso(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error registrando participante:', error);
      Swal.fire({
        icon: 'error',
        title: t('participateRaffle.alerts.error.title'),
        text: error.message || 'Error al registrar tu participación. Por favor, intenta nuevamente.',
        confirmButtonText: t('participateRaffle.alerts.error.confirm'),
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setRegistrandoParticipante(false);
    }
  };

  const handlePagoExitoso = async (paymentIntent) => {
    try {
      // El participante ya está registrado y el webhook procesará automáticamente
      // Solo necesitamos recargar la rifa y mostrar éxito
      Swal.fire({
        title: t('participateRaffle.alerts.processing.title'),
        text: 'Verificando pago...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Esperar un momento para que el webhook procese
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Recargar la rifa para ver los números actualizados
      await cargarRifaCompleta();
      
      await Swal.fire({
        icon: 'success',
        title: t('participateRaffle.alerts.success.title'),
        html: `
          <p>${t('participateRaffle.alerts.success.numbersReserved')} <strong>${participante.numerosSeleccionados.join(', ')}</strong> ${t('participateRaffle.alerts.success.haveBeenReserved')}</p>
          <p>${t('participateRaffle.alerts.success.paymentProcessed')}</p>
          <p style="font-size: 0.9rem; color: #64748b; margin-top: 1rem;">
            Recibirás un email de confirmación en breve.
          </p>
        `,
        confirmButtonText: t('participateRaffle.alerts.success.confirm'),
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
      setParticipanteId(null);
      setPaso(1);
    } catch (error) {
      console.error('Error al confirmar participación:', error);
      Swal.fire({
        icon: 'error',
        title: t('participateRaffle.alerts.error.title'),
        text: error.message || 'Hubo un error al procesar tu pago. El webhook lo procesará automáticamente.',
        confirmButtonText: t('participateRaffle.alerts.error.confirm'),
        confirmButtonColor: '#ef4444'
      });
    }
  };

  if (loading) {
    return (
      <div className="participate-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>{t('participateRaffle.loading')}</p>
        </div>
      </div>
    );
  }

  if (!rifa) {
    return (
      <div className="participate-container">
        <div className="error-state">
          <h2>{t('participateRaffle.notFound.title')}</h2>
          <p>{t('participateRaffle.notFound.message')}</p>
          <Link to="/portal" className="btn-primary">{t('participateRaffle.notFound.viewRifas')}</Link>
        </div>
      </div>
    );
  }

  if (!rifa.activa) {
    return (
      <div className="participate-container">
        <div className="error-state">
          <h2>{t('participateRaffle.finished.title')}</h2>
          <p>{t('participateRaffle.finished.message')}</p>
          <Link to="/portal" className="btn-primary">{t('participateRaffle.finished.viewOthers')}</Link>
        </div>
      </div>
    );
  }

  const totalPagar = rifa.precio * participante.numerosSeleccionados.length;

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
          title: t('participateRaffle.alerts.share.title'),
          text: t('participateRaffle.alerts.share.text'),
          confirmButtonText: t('participateRaffle.alerts.share.confirm'),
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
            <span>{t('participateRaffle.header.backToRifas')}</span>
          </Link>
          <button 
            className="share-button"
            onClick={compartirRifa}
            title={t('participateRaffle.header.shareTitle')}
          >
            <span className="share-icon">🔗</span>
            <span>{t('participateRaffle.header.share')}</span>
          </button>
        </div>
        <h1 className="rifa-title-modern">{rifa.nombre}</h1>
        <div className="rifa-meta">
          <span className="meta-item">💰 ${rifa.precio} MXN</span>
          <span className="meta-item">🎫 {numerosDisponibles.length} números</span>
          {rifa.fecha_fin && tiempoRestante && !tiempoRestante.terminado && (
            <span className="meta-item time-remaining">
              ⏰ {tiempoRestante.dias > 0 ? `${tiempoRestante.dias}d ` : ''}
              {tiempoRestante.horas}h {tiempoRestante.minutos}m {t('participateRaffle.header.remaining')}
            </span>
          )}
        </div>
        
        {/* Barra de progreso visual */}
        <div className="rifa-progress-section">
          <div className="progress-header">
            <span className="progress-label">{t('participateRaffle.progress.label')}</span>
            <span className="progress-percentage">{porcentajeVendido}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${porcentajeVendido}%` }}
            ></div>
          </div>
          <div className="progress-stats">
            <span>{numerosVendidos} {t('participateRaffle.progress.sold')}</span>
            <span>•</span>
            <span>{totalNumeros - numerosVendidos} {t('participateRaffle.progress.available')}</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="steps-indicator">
        <div className={`step ${paso >= 1 ? 'active' : ''} ${paso > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">{t('participateRaffle.steps.selectNumbers')}</div>
        </div>
        <div className={`step ${paso >= 2 ? 'active' : ''} ${paso > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">{t('participateRaffle.steps.yourData')}</div>
        </div>
        <div className={`step ${paso >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">{t('participateRaffle.steps.securePayment')}</div>
        </div>
      </div>

      {/* Paso 1: Selección de Números */}
      {paso === 1 && (
        <div className="step-content">
          <div className="selection-section">
            <div className="selection-header">
              <h2>{t('participateRaffle.step1.title')}</h2>
              <div className="selection-summary">
                <span className="selected-count">
                  {participante.numerosSeleccionados.length} {participante.numerosSeleccionados.length === 1 ? t('participateRaffle.step1.selected') : t('participateRaffle.step1.selectedPlural')}
                </span>
                {participante.numerosSeleccionados.length > 0 && (
                  <span className="total-amount">
                    {t('participateRaffle.step1.total')} ${totalPagar.toFixed(2)} MXN
                  </span>
                )}
              </div>
            </div>

            {/* Filtros */}
            <div className="filtros-modern">
              <button
                className={`filtro-btn-modern ${filtro === 'disponibles' ? 'active' : ''}`}
                onClick={() => setFiltro('disponibles')}
              >
                {t('participateRaffle.step1.filters.available')} ({numerosDisponiblesCount})
              </button>
              <button
                className={`filtro-btn-modern ${filtro === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltro('todos')}
              >
                {t('participateRaffle.step1.filters.all')} ({numerosDisponibles.length})
              </button>
              <button
                className={`filtro-btn-modern ${filtro === 'vendidos' ? 'active' : ''}`}
                onClick={() => setFiltro('vendidos')}
              >
                {t('participateRaffle.step1.filters.sold')} ({numerosVendidosCount})
              </button>
              <button
                className={`filtro-btn-modern ${filtro === 'reservados' ? 'active' : ''}`}
                onClick={() => setFiltro('reservados')}
              >
                {t('participateRaffle.step1.filters.reserved')} ({numerosReservadosCount})
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
                      seleccionado ? t('participateRaffle.step1.numberStates.selected') :
                      vendido ? t('participateRaffle.step1.numberStates.sold') : 
                      reservado ? t('participateRaffle.step1.numberStates.reserved') : 
                      t('participateRaffle.step1.numberStates.available')
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
                  <h3>{t('participateRaffle.step1.preview.title')}</h3>
                </div>
                <div className="preview-content">
                  <div className="preview-item">
                    <span className="preview-label">{t('participateRaffle.step1.preview.selectedNumbers')}</span>
                    <div className="preview-numbers-list">
                      {participante.numerosSeleccionados.sort((a, b) => a - b).map(num => (
                        <span key={num} className="preview-number-badge">{num}</span>
                      ))}
                    </div>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">{t('participateRaffle.step1.preview.quantity')}</span>
                    <span className="preview-value">{participante.numerosSeleccionados.length} {participante.numerosSeleccionados.length === 1 ? t('participateRaffle.step1.preview.number') : t('participateRaffle.step1.preview.numbers')}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">{t('participateRaffle.step1.preview.pricePerNumber')}</span>
                    <span className="preview-value">${rifa.precio} MXN</span>
                  </div>
                  <div className="preview-item total-preview">
                    <span className="preview-label">{t('participateRaffle.step1.preview.totalToPay')}</span>
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
                  {t('participateRaffle.step1.continue')}
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
              <h2>{t('participateRaffle.step2.title')}</h2>
              <p className="section-subtitle">{t('participateRaffle.step2.subtitle')}</p>
            </div>

            <div className="form-modern">
              <div className="form-group-modern">
                <label htmlFor="nombre">{t('participateRaffle.step2.name.label')}</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder={t('participateRaffle.step2.name.placeholder')}
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
                  <span className="success-text">{t('participateRaffle.step2.name.valid')}</span>
                )}
              </div>
              
              <div className="form-group-modern">
                <label htmlFor="telefono">{t('participateRaffle.step2.phone.label')}</label>
                <input
                  id="telefono"
                  type="tel"
                  placeholder={t('participateRaffle.step2.phone.placeholder')}
                  value={participante.telefono}
                  maxLength={20}
                  onChange={(e) => {
                    let value = e.target.value;
                    
                    // Permitir solo números, espacios, guiones, paréntesis, puntos y el símbolo +
                    value = value.replace(/[^\d\s\-().+]/g, '');
                    
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
                  <span className="success-text">{t('participateRaffle.step2.phone.valid')}</span>
                )}
              </div>
              
              <div className="form-group-modern">
                <label htmlFor="email">{t('participateRaffle.step2.email.label')}</label>
                <input
                  id="email"
                  type="email"
                  placeholder={t('participateRaffle.step2.email.placeholder')}
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
                  <span className="success-text">{t('participateRaffle.step2.email.valid')}</span>
                )}
              </div>

              <div className="data-summary">
                <div className="summary-card">
                  <div className="summary-row">
                    <span>{t('participateRaffle.step2.summary.selectedNumbers')}</span>
                    <strong>{participante.numerosSeleccionados.sort((a, b) => a - b).join(', ')}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t('participateRaffle.step2.summary.pricePerNumber')}</span>
                    <strong>${rifa.precio} MXN</strong>
                  </div>
                  <div className="summary-row total-row">
                    <span>{t('participateRaffle.step2.summary.totalToPay')}</span>
                    <strong className="total-amount-large">${totalPagar.toFixed(2)} MXN</strong>
                  </div>
                </div>
              </div>

              <div className="form-actions-modern">
                <button 
                  className="btn-back-modern"
                  onClick={() => setPaso(1)}
                >
                  {t('participateRaffle.step2.back')}
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
                  {t('participateRaffle.step2.continue')}
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
              <h2>{t('participateRaffle.step3.title')}</h2>
              <p className="section-subtitle">{t('participateRaffle.step3.subtitle')}</p>
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
              {participanteId ? (
                <StripePayment
                  rifaId={rifa.id}
                  amount={totalPagar}
                  numerosSeleccionados={participante.numerosSeleccionados}
                  participanteId={participanteId}
                  onSuccess={handlePagoExitoso}
                  onCancel={() => setPaso(2)}
                />
              ) : (
                <div className="stripe-payment-loading">
                  <div className="spinner"></div>
                  <p>Preparando pago...</p>
                </div>
              )}
            </div>

            <button 
              className="btn-back-modern"
              onClick={() => setPaso(2)}
              style={{ marginTop: '2rem' }}
            >
              {t('participateRaffle.step3.back')}
            </button>
          </div>
        </div>
      )}

      {paso === 3 && !stripeDisponible && (
        <div className="step-content">
          <div className="error-state">
            <h2>{t('participateRaffle.step3.notAvailable.title')}</h2>
            <p>{t('participateRaffle.step3.notAvailable.message')}</p>
            <button 
              className="btn-back-modern"
              onClick={() => setPaso(2)}
            >
              {t('participateRaffle.step3.notAvailable.back')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipateRaffle;
