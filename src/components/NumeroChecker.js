import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './NumeroChecker.css';

const API_BASE = 'http://localhost:5001/api';

const NumeroChecker = () => {
  const { t } = useTranslation();
  const [rifas, setRifas] = useState([]);
  const [rifaId, setRifaId] = useState('');
  const [numero, setNumero] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para el buscador avanzado
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroFecha, setFiltroFecha] = useState('todas');
  const [showDropdown, setShowDropdown] = useState(false);
  const [cargandoRifas, setCargandoRifas] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Calcular paso actual para el wizard
  // Paso 1: Seleccionar rifa
  // Paso 2: Ingresar número (solo si hay rifaId pero no hay resultado)
  // Paso 3: Ver resultado (solo si hay resultado)
  const currentStep = resultado && !resultado.error ? 3 : (rifaId ? 2 : 1);
  const totalSteps = 3;

  useEffect(() => {
    cargarRifas();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarRifas = async () => {
    setCargandoRifas(true);
    try {
      const res = await fetch(`${API_BASE}/rifas`);
      const data = await res.json();
      if (data.rifas) {
        setRifas(data.rifas);
        console.log('Rifas cargadas:', data.rifas.length);
      } else {
        console.warn('No se recibieron rifas en la respuesta:', data);
      }
    } catch (err) {
      console.error('Error cargando rifas:', err);
      setRifas([]);
    } finally {
      setCargandoRifas(false);
    }
  };

  const rifaSeleccionada = rifas?.find(r => r.id === parseInt(rifaId));

  const rifasFiltradas = rifas.filter(rifa => {
    const coincideBusqueda = busqueda === '' ||
      rifa.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      rifa.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      rifa.tipo?.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstado = filtroEstado === 'todas' ||
      (filtroEstado === 'activas' && rifa.activa) ||
      (filtroEstado === 'finalizadas' && !rifa.activa);
    
    if (filtroFecha !== 'todas' && rifa.fecha_sorteo) {
      const fechaSorteo = new Date(rifa.fecha_sorteo);
      const ahora = new Date();
      const diferenciaDias = Math.ceil((fechaSorteo - ahora) / (1000 * 60 * 60 * 24));
      
      if (filtroFecha === 'recientes' && diferenciaDias > 0) return false;
      if (filtroFecha === 'proximas' && diferenciaDias <= 0) return false;
    }
    
    return coincideBusqueda && coincideEstado;
  });

  const verificar = async (e) => {
    e.preventDefault();
    setResultado(null);
    if (!rifaId || !numero) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rifas/${rifaId}/verificar?numero=${encodeURIComponent(numero)}`);
      const data = await res.json();
      setResultado(data);
    } catch (err) {
      setResultado({ error: 'Error verificando número' });
    } finally {
      setLoading(false);
    }
  };

  const formatearNumero = (num) => {
    if (!num) return '';
    return num.toString().padStart(6, '0').split('').map((digit, idx) => (
      <span key={idx} className="numero-digit">{digit}</span>
    ));
  };

  return (
    <div className="numero-checker-wizard">
      {/* Progress Bar */}
      <div className="wizard-progress">
        <div className="wizard-progress-bar">
          <div 
            className="wizard-progress-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="wizard-steps-indicators">
          <div className={`wizard-step-indicator ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-indicator-number">1</div>
            <div className="step-indicator-label">{t('winnerCheck.steps.selectRaffle')}</div>
          </div>
          <div className={`wizard-step-indicator ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-indicator-number">2</div>
            <div className="step-indicator-label">{t('winnerCheck.steps.enterNumber')}</div>
          </div>
          <div className={`wizard-step-indicator ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-indicator-number">3</div>
            <div className="step-indicator-label">{t('winnerCheck.steps.viewResult')}</div>
          </div>
        </div>
      </div>

      {/* Paso 1: Seleccionar Rifa */}
      <div className={`wizard-step ${currentStep === 1 ? 'active' : 'hidden'}`}>
        <div className="wizard-step-content">
          <div className="wizard-step-header">
            <div className="wizard-step-icon">🎫</div>
            <h2 className="wizard-step-title">{t('winnerCheck.selectRaffle.title')}</h2>
            <p className="wizard-step-description">{t('winnerCheck.selectRaffle.description')}</p>
          </div>
          
          {rifaSeleccionada ? (
            <div className="rifa-seleccionada-card">
              <div className="rifa-card-content">
                <div className="rifa-card-icon">🎫</div>
                <div className="rifa-card-info">
                  <h3 className="rifa-card-title">{rifaSeleccionada.nombre}</h3>
                  {rifaSeleccionada.fecha_sorteo && (
                    <p className="rifa-card-date">
                      📅 {new Date(rifaSeleccionada.fecha_sorteo).toLocaleDateString('es-MX', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  )}
                  {rifaSeleccionada.numero_total && (
                    <p className="rifa-card-numbers">
                      🔢 {t('winnerCheck.selectRaffle.total')} <strong>{rifaSeleccionada.numero_total}</strong> {t('winnerCheck.selectRaffle.numbers')}
                    </p>
                  )}
                </div>
              </div>
              <button 
                className="rifa-card-change-btn"
                onClick={() => {
                  setRifaId('');
                  setNumero('');
                  setResultado(null);
                  setBusqueda('');
                  setFiltroEstado('todas');
                  setFiltroFecha('todas');
                }}
                type="button"
              >
                {t('winnerCheck.selectRaffle.change')}
              </button>
            </div>
          ) : (
            <div className="rifa-buscador-avanzado">
              <div className="rifa-search-wrapper" ref={searchRef}>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="rifa-search-input"
                  placeholder={t('winnerCheck.selectRaffle.searchPlaceholder')}
                />
                {busqueda && (
                  <button
                    className="clear-search-btn"
                    onClick={() => {
                      setBusqueda('');
                      setShowDropdown(false);
                    }}
                    type="button"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="rifa-filtros-rapidos">
                <div className="filtro-group">
                  <label>{t('portal.filters.status')}</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => {
                      setFiltroEstado(e.target.value);
                      setShowDropdown(true);
                    }}
                    className="filtro-select-small"
                  >
                    <option value="todas">{t('winnerCheck.selectRaffle.status.all')}</option>
                    <option value="activas">{t('winnerCheck.selectRaffle.status.active')}</option>
                    <option value="finalizadas">{t('winnerCheck.selectRaffle.status.finished')}</option>
                  </select>
                </div>
                <div className="filtro-group">
                  <label>{t('common.date')}</label>
                  <select
                    value={filtroFecha}
                    onChange={(e) => {
                      setFiltroFecha(e.target.value);
                      setShowDropdown(true);
                    }}
                    className="filtro-select-small"
                  >
                    <option value="todas">{t('winnerCheck.selectRaffle.date.all')}</option>
                    <option value="recientes">{t('winnerCheck.selectRaffle.date.recent')}</option>
                    <option value="proximas">{t('winnerCheck.selectRaffle.date.upcoming')}</option>
                  </select>
                </div>
                <div className="filtro-count">
                  {rifasFiltradas.length} {rifasFiltradas.length === 1 ? t('winnerCheck.selectRaffle.found') : t('winnerCheck.selectRaffle.foundPlural')}
                </div>
              </div>

              {showDropdown && (
                <div className="rifa-dropdown" ref={dropdownRef}>
                  {cargandoRifas ? (
                    <div className="dropdown-loading">
                      <div className="spinner"></div>
                      <span>{t('winnerCheck.selectRaffle.loading')}</span>
                    </div>
                  ) : rifasFiltradas.length === 0 ? (
                    <div className="dropdown-empty">
                      <span>🔍</span>
                      <p>
                        {rifas.length === 0 
                          ? t('winnerCheck.selectRaffle.noRaffles')
                          : t('winnerCheck.selectRaffle.noResults')}
                      </p>
                      {rifas.length > 0 && (
                        <button
                          className="btn-limpiar-filtros"
                          onClick={() => {
                            setBusqueda('');
                            setFiltroEstado('todas');
                            setFiltroFecha('todas');
                          }}
                          type="button"
                        >
                          {t('winnerCheck.selectRaffle.clearFilters')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="rifa-dropdown-list">
                      {rifasFiltradas.slice(0, 50).map(rifa => (
                        <div
                          key={rifa.id}
                          className="rifa-dropdown-item"
                          onClick={() => {
                            setRifaId(rifa.id.toString());
                            setShowDropdown(false);
                            setBusqueda('');
                          }}
                        >
                          <div className="dropdown-item-icon">🎫</div>
                          <div className="dropdown-item-content">
                            <div className="dropdown-item-title">{rifa.nombre}</div>
                            <div className="dropdown-item-meta">
                              {rifa.fecha_sorteo && (
                                <span className="dropdown-item-date">
                                  📅 {new Date(rifa.fecha_sorteo).toLocaleDateString('es-MX', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              )}
                              {rifa.activa ? (
                                <span className="dropdown-item-badge activa">{t('portal.table.active')}</span>
                              ) : (
                                <span className="dropdown-item-badge finalizada">{t('portal.table.finished')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {rifasFiltradas.length > 50 && (
                        <div className="dropdown-more">
                          {t('winnerCheck.selectRaffle.showing')} {rifasFiltradas.length} rifas. {t('winnerCheck.selectRaffle.refineSearch')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Paso 2: Ingresar Número */}
      {rifaId && !resultado && (
        <div className={`wizard-step ${currentStep === 2 ? 'active' : 'hidden'}`}>
          <div className="wizard-step-content">
            <div className="wizard-step-header">
              <div className="wizard-step-icon">🔢</div>
              <h2 className="wizard-step-title">{t('winnerCheck.enterNumber.title')}</h2>
              <p className="wizard-step-description">{t('winnerCheck.enterNumber.description')}</p>
            </div>
            <form onSubmit={verificar} className="numero-checker-form">
              <div className="numero-input-wrapper">
                <span className="numero-input-icon">🎫</span>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                  className="numero-input"
                  placeholder={t('winnerCheck.enterNumber.placeholder')}
                  maxLength="6"
                  autoFocus
                />
                <button 
                  type="submit"
                  className="numero-search-btn"
                  disabled={!numero || loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      {t('winnerCheck.enterNumber.verifying')}
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      {t('winnerCheck.enterNumber.verify')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paso 3: Resultados */}
      {resultado && !resultado.error && (
        <div className={`wizard-step ${currentStep === 3 ? 'active' : 'hidden'}`}>
          <div className="wizard-step-content">
            <div className="wizard-step-header">
              <div className="wizard-step-icon">🎉</div>
              <h2 className="wizard-step-title">{t('winnerCheck.result.title')}</h2>
            </div>
            
            {resultado.estado === 'ganador' && (
              <div className="resultado-card ganador">
                <div className="resultado-badge ganador">🎉</div>
                <div className="resultado-content">
                  <h3 className="resultado-title ganador">{t('winnerCheck.result.winner.title')}</h3>
                  <div className="resultado-numero">
                    <span className="resultado-label">{t('winnerCheck.result.winner.ticketNumber')}</span>
                    <div className="numero-display ganador">
                      {formatearNumero(resultado.numero_ganador || numero)}
                    </div>
                  </div>
                  {resultado.premio && (
                    <div className="resultado-premio">
                      <span className="premio-label">{t('winnerCheck.result.winner.prizeValue')}</span>
                      <span className="premio-amount">{resultado.premio}</span>
                    </div>
                  )}
                  <div className="resultado-message ganador">
                    {t('winnerCheck.result.winner.message')}
                  </div>
                  <button
                    className="btn-verificar-otro"
                    onClick={() => {
                      setNumero('');
                      setResultado(null);
                    }}
                    type="button"
                  >
                    {t('winnerCheck.result.winner.verifyAnother')}
                  </button>
                </div>
              </div>
            )}

            {resultado.estado === 'no_ganador' && (
              <div className="resultado-card no-ganador">
                <div className="resultado-badge no-ganador">😕</div>
                <div className="resultado-content">
                  <h3 className="resultado-title no-ganador">{t('winnerCheck.result.notWinner.title')}</h3>
                  <div className="resultado-numero">
                    <span className="resultado-label">{t('winnerCheck.result.notWinner.yourNumber')}</span>
                    <div className="numero-display">
                      {formatearNumero(numero)}
                    </div>
                  </div>
                  <div className="resultado-message no-ganador">
                    {t('winnerCheck.result.notWinner.message')}
                  </div>
                  {resultado.numero_ganador && (
                    <div className="numero-ganador-info">
                      <span className="ganador-label">{t('winnerCheck.result.notWinner.winnerNumber')}</span>
                      <div className="numero-display ganador-real">
                        {formatearNumero(resultado.numero_ganador)}
                      </div>
                    </div>
                  )}
                  <button
                    className="btn-verificar-otro"
                    onClick={() => {
                      setNumero('');
                      setResultado(null);
                    }}
                    type="button"
                  >
                    {t('winnerCheck.result.notWinner.verifyAnother')}
                  </button>
                </div>
              </div>
            )}

            {resultado.estado === 'pendiente' && (
              <div className="resultado-card pendiente">
                <div className="resultado-badge pendiente">⏳</div>
                <div className="resultado-content">
                  <h3 className="resultado-title pendiente">{t('winnerCheck.result.pending.title')}</h3>
                  <div className="resultado-message pendiente">
                    {t('winnerCheck.result.pending.message')}
                  </div>
                  <button
                    className="btn-verificar-otro"
                    onClick={() => {
                      setNumero('');
                      setResultado(null);
                    }}
                    type="button"
                  >
                    {t('winnerCheck.result.pending.verifyAnother')}
                  </button>
                </div>
              </div>
            )}

            {resultado.estado === 'sin_resultado' && (
              <div className="resultado-card sin-resultado">
                <div className="resultado-badge sin-resultado">⚠️</div>
                <div className="resultado-content">
                  <h3 className="resultado-title sin-resultado">{t('winnerCheck.result.noResult.title')}</h3>
                  <div className="resultado-message sin-resultado">
                    {t('winnerCheck.result.noResult.message')}
                  </div>
                  <button
                    className="btn-verificar-otro"
                    onClick={() => {
                      setNumero('');
                      setResultado(null);
                    }}
                    type="button"
                  >
                    {t('winnerCheck.result.noResult.verifyAnother')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {resultado && resultado.error && (
        <div className="resultado-card error">
          <div className="resultado-badge error">❌</div>
          <div className="resultado-content">
            <h3 className="resultado-title error">{t('winnerCheck.result.error.title')}</h3>
            <div className="resultado-message error">{resultado.error}</div>
            <button
              className="btn-verificar-otro"
              onClick={() => {
                setNumero('');
                setResultado(null);
              }}
              type="button"
            >
              {t('winnerCheck.result.error.tryAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NumeroChecker;
