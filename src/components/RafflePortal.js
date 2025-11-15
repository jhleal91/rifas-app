import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRifas } from '../contexts/RifasContext';
import { catalogosService } from '../services/api';
import AdBanner from './AdBanner';
import AdCarousel from './AdCarousel';
import AffiliateLinks from './AffiliateLinks';
import { RatingDisplay } from './RatingComponent';
import SponsoredBusinessesSection from './SponsoredBusinessesSection';
import CuponesSection from './CuponesSection';
import SEO from './SEO';
import analytics from '../services/analytics';
import './RafflePortal.css';

const RafflePortal = () => {
  const { t } = useTranslation();
  const { rifas, loading, error, loadPublicRifas } = useRifas();
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'activas', 'finalizadas'
  const [busqueda, setBusqueda] = useState('');
  // Vista por defecto: cards
  const [viewMode, setViewMode] = useState('cards');
  // Estado para controlar qué cards tienen las fotos expandidas
  const [expandedCards, setExpandedCards] = useState(new Set());
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6; // 2 filas x 3 cards
  
  // Filtros geográficos
  const [paisFiltro, setPaisFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [alcanceFiltro, setAlcanceFiltro] = useState('');
  const [manejaEnvioFiltro, setManejaEnvioFiltro] = useState(false);
  
  // Filtros adicionales para tabla
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [progresoFiltro, setProgresoFiltro] = useState(''); // 'todas', 'nuevas', 'en-progreso', 'completadas'
  const [sortBy, setSortBy] = useState(''); // 'nombre', 'precio', 'progreso', 'tiempo', 'organizador'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  
  // Catálogos
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  
  // Cargar países al montar
  useEffect(() => {
    const cargarPaises = async () => {
      try {
        const response = await catalogosService.getPaises();
        setPaises(response.paises || []);
      } catch (error) {
        console.error('Error cargando países:', error);
      }
    };
    cargarPaises();
  }, []);
  
  // Cargar estados cuando cambie el país del filtro
  useEffect(() => {
    const cargarEstados = async () => {
      if (paisFiltro) {
        try {
          const response = await catalogosService.getEstados(paisFiltro);
          setEstados(response.estados || []);
        } catch (error) {
          console.error('Error cargando estados:', error);
          setEstados([]);
        }
      } else {
        setEstados([]);
        setEstadoFiltro('');
      }
    };
    cargarEstados();
  }, [paisFiltro]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filtro, busqueda, paisFiltro, estadoFiltro, alcanceFiltro, manejaEnvioFiltro, tipoFiltro, precioMin, precioMax, progresoFiltro]);

  // Track page view (debe estar antes de los returns condicionales)
  useEffect(() => {
    if (!loading && rifas) {
      const rifasArray = rifas || [];
      analytics.trackPageView('Raffle Portal', {
        rifasCount: rifasArray.length,
        activeFilters: {
          filtro,
          busqueda,
          paisFiltro,
          estadoFiltro
        }
      });
    }
  }, [loading, rifas, filtro, busqueda, paisFiltro, estadoFiltro]);

  // Vista por defecto: cards (sin ajuste automático por tamaño de pantalla)

  // Función para obtener el texto de ubicación
  const obtenerUbicacionTexto = (rifa) => {
    const partes = [];
    if (rifa.ciudad) partes.push(rifa.ciudad);
    if (rifa.estado) {
      // Si el estado coincide con el filtro, usar el estado cargado, sino mostrar código
      const estadoInfo = estados.find(e => e.codigo === rifa.estado);
      if (estadoInfo) {
        partes.push(estadoInfo.nombre_es || estadoInfo.nombre);
      } else {
        partes.push(rifa.estado);
      }
    }
    const paisInfo = paises.find(p => p.codigo === rifa.pais);
    if (paisInfo) {
      partes.push(paisInfo.nombre_es || paisInfo.nombre);
    } else if (rifa.pais) {
      partes.push(rifa.pais);
    }
    return partes.length > 0 ? partes.join(', ') : null;
  };

  // Función para obtener el nombre del tipo de rifa
  const obtenerNombreTipo = (tipo) => {
    const tipos = {
      'numeros': t('portal.raffleTypes.numeros'),
      'lotería': t('portal.raffleTypes.loteria'),
      'baraja': t('portal.raffleTypes.baraja'),
      'animales': t('portal.raffleTypes.animales'),
      'colores': t('portal.raffleTypes.colores'),
      'equipos': t('portal.raffleTypes.equipos'),
      'abecedario': t('portal.raffleTypes.abecedario'),
      'emojis': t('portal.raffleTypes.emojis'),
      'paises': t('portal.raffleTypes.paises')
    };
    return tipos[tipo] || t('portal.raffleTypes.numeros');
  };

  // Función para calcular días restantes
  const calcularDiasRestantes = (fechaFin) => {
    if (!fechaFin) return null;
    
    const hoy = new Date();
    const fechaFinal = new Date(fechaFin);
    const diferencia = fechaFinal - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias < 0) return t('portal.timeRemaining.finished');
    if (dias === 0) return t('portal.timeRemaining.endsToday');
    if (dias === 1) return t('portal.timeRemaining.dayRemaining');
    return t('portal.timeRemaining.daysRemaining', { count: dias });
  };

  // Función para determinar el nivel de urgencia
  const obtenerNivelUrgencia = (fechaFin) => {
    if (!fechaFin) return 'low';
    
    const hoy = new Date();
    const fechaFinal = new Date(fechaFin);
    const diferencia = fechaFinal - hoy;
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias < 0) return 'finished';
    if (dias <= 1) return 'high';
    if (dias <= 3) return 'medium';
    return 'low';
  };

  // El contexto ya carga las rifas automáticamente al montar
  // No necesitamos un useEffect adicional aquí para evitar bucles infinitos

  // Validar que rifas existe antes de usar filter
  if (loading) {
    return (
      <div className="portal-container">
        <div className="loading-state">
          <h2>{t('portal.loadingRaffles')}</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-container">
        <div className="portal-header">
          <div className="portal-header-content">
            <div className="portal-title-section">
              <div className="portal-title-wrapper">
                <span className="portal-icon">🎟️</span>
                <h1>
                  <span className="portal-title-part1">{t('portal.title').split(' ')[0]}</span>
                  <span className="portal-title-part2"> {t('portal.title').split(' ').slice(1).join(' ')}</span>
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="empty-state-container">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <h2 className="empty-state-title">{t('portal.errorLoading')}</h2>
            <p className="empty-state-description">
              {error || t('portal.errorDescription')}
            </p>
            <div className="empty-state-actions">
              <button 
                className="btn-retry"
                onClick={() => {
                  loadPublicRifas();
                }}
              >
                {t('portal.reloadRaffles')}
              </button>
              <button 
                className="btn-secondary-empty"
                onClick={() => window.location.reload()}
              >
                {t('portal.reloadPage')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rifasArray = rifas || [];
  
  let rifasFiltradas = rifasArray.filter(rifa => {
    // Filtro por estado (activas/finalizadas)
    const coincideFiltro = filtro === 'todas' || 
      (filtro === 'activas' && rifa.activa) ||
      (filtro === 'finalizadas' && !rifa.activa);
    
    // Filtro de búsqueda
    const coincideBusqueda = busqueda === '' ||
      rifa.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      rifa.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    
    // Filtro por país
    const coincidePais = paisFiltro === '' || rifa.pais === paisFiltro;
    
    // Filtro por estado/provincia
    const coincideEstado = estadoFiltro === '' || rifa.estado === estadoFiltro;
    
    // Filtro por alcance
    const coincideAlcance = alcanceFiltro === '' || rifa.alcance === alcanceFiltro;
    
    // Filtro por manejo de envío
    const coincideEnvio = !manejaEnvioFiltro || rifa.maneja_envio === true;
    
    // Filtro por tipo de rifa
    const coincideTipo = tipoFiltro === '' || rifa.tipo === tipoFiltro;
    
    // Filtro por precio mínimo
    const coincidePrecioMin = precioMin === '' || parseFloat(rifa.precio) >= parseFloat(precioMin);
    
    // Filtro por precio máximo
    const coincidePrecioMax = precioMax === '' || parseFloat(rifa.precio) <= parseFloat(precioMax);
    
    // Filtro por progreso
    const progreso = (rifa.elementos_vendidos || 0) / rifa.cantidad_elementos;
    let coincideProgreso = true;
    if (progresoFiltro === 'nuevas') {
      coincideProgreso = progreso === 0;
    } else if (progresoFiltro === 'en-progreso') {
      coincideProgreso = progreso > 0 && progreso < 1;
    } else if (progresoFiltro === 'completadas') {
      coincideProgreso = progreso >= 1;
    }
    
    return coincideFiltro && coincideBusqueda && coincidePais && coincideEstado && coincideAlcance && coincideEnvio && coincideTipo && coincidePrecioMin && coincidePrecioMax && coincideProgreso;
  });
  
  // Ordenamiento
  if (sortBy) {
    rifasFiltradas = [...rifasFiltradas].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'nombre':
          aValue = a.nombre?.toLowerCase() || '';
          bValue = b.nombre?.toLowerCase() || '';
          break;
        case 'precio':
          aValue = parseFloat(a.precio) || 0;
          bValue = parseFloat(b.precio) || 0;
          break;
        case 'progreso':
          aValue = (a.elementos_vendidos || 0) / a.cantidad_elementos;
          bValue = (b.elementos_vendidos || 0) / b.cantidad_elementos;
          break;
        case 'tiempo':
          aValue = a.fecha_fin ? new Date(a.fecha_fin).getTime() : 0;
          bValue = b.fecha_fin ? new Date(b.fecha_fin).getTime() : 0;
          break;
        case 'organizador':
          aValue = (a.creador_nombre || '').toLowerCase();
          bValue = (b.creador_nombre || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const rifasActivas = rifasArray.filter(rifa => rifa.activa).length;
  const rifasFinalizadas = rifasArray.filter(rifa => !rifa.activa).length;

  // Paginación
  const totalPages = Math.ceil(rifasFiltradas.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const rifasPaginadas = rifasFiltradas.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Mantener la posición del scroll al cambiar de página
  };

  return (
    <div className="portal-container">
      <SEO 
        title={`${t('portal.title')} - SorteoHub`}
        description="Explora todas las rifas disponibles. Participa en sorteos emocionantes y gana premios increíbles."
        keywords="rifas disponibles, participar en rifas, sorteos activos, portal rifas"
      />
      <div className="portal-header">
        <div className="portal-header-content">
          <div className="portal-title-section">
            <div className="portal-title-wrapper">
              <span className="portal-icon">🎟️</span>
              <h1>
                <span className="portal-title-part1">{t('portal.title').split(' ')[0]}</span>
                <span className="portal-title-part2"> {t('portal.title').split(' ').slice(1).join(' ')}</span>
              </h1>
            </div>
            <p className="portal-subtitle">{t('portal.subtitle')}</p>
          </div>
        
        </div>
      </div>

      {/* Carrusel de anuncios principales */}
      <AdCarousel 
        placement="portal_top" 
        interval={35000} 
        maxAds={5}
        className="desktop-only"
      />

      <div className="portal-controls-compact">
        {/* Búsqueda y filtros en una sola línea */}
        <div className="portal-controls-row">
          <div className="search-box-compact">
            <div className="search-wrapper-compact">
              <input
                type="text"
                placeholder={t('portal.searchPlaceholder')}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-input-compact"
              />
              {busqueda && (
                <button 
                  className="clear-search-btn-compact"
                  onClick={() => setBusqueda('')}
                  aria-label={t('portal.clearSearch')}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* Filtros de Estado - Compactos */}
          <div className="filtros-portal-compact">
            <button 
              className={`filtro-portal-btn-compact ${filtro === 'todas' ? 'activo' : ''}`}
              onClick={() => setFiltro('todas')}
              type="button"
            >
              {t('portal.filters.all')} ({rifas.length})
            </button>
            <button 
              className={`filtro-portal-btn-compact ${filtro === 'activas' ? 'activo' : ''}`}
              onClick={() => setFiltro('activas')}
              type="button"
            >
              {t('portal.filters.active')} ({rifasActivas})
            </button>
            <button 
              className={`filtro-portal-btn-compact ${filtro === 'finalizadas' ? 'activo' : ''}`}
              onClick={() => setFiltro('finalizadas')}
              type="button"
            >
              {t('portal.filters.finished')} ({rifasFinalizadas})
            </button>
          </div>
        </div>
        
        {/* Filtros Avanzados - Compactos en una línea */}
        <div className="filtros-avanzados-compact">
          <div className="filtro-item-compact">
            <select
              value={paisFiltro}
              onChange={(e) => setPaisFiltro(e.target.value)}
              className="filtro-select-compact"
            >
              <option value="">{t('portal.filters.allCountries')}</option>
              {paises.map(pais => (
                <option key={pais.id} value={pais.codigo}>
                  {pais.nombre_es || pais.nombre}
                </option>
              ))}
            </select>
          </div>
          
          {paisFiltro && (
            <div className="filtro-item-compact">
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="filtro-select-compact"
              >
                <option value="">{t('portal.filters.allStates')}</option>
                {estados.map(estado => (
                  <option key={estado.id} value={estado.codigo}>
                    {estado.nombre_es || estado.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="filtro-item-compact">
            <select
              value={alcanceFiltro}
              onChange={(e) => setAlcanceFiltro(e.target.value)}
              className="filtro-select-compact"
            >
              <option value="">{t('portal.filters.allScopes')}</option>
              <option value="local">{t('portal.scopes.local')}</option>
              <option value="nacional">{t('portal.scopes.nacional')}</option>
              <option value="internacional">{t('portal.scopes.internacional')}</option>
            </select>
          </div>
          
          <div className="filtro-item-compact checkbox-compact">
            <label className="checkbox-label-compact">
              <input
                type="checkbox"
                checked={manejaEnvioFiltro}
                onChange={(e) => setManejaEnvioFiltro(e.target.checked)}
              />
              <span>{t('portal.filters.handlesShipping')}</span>
            </label>
          </div>
          
          {(paisFiltro || estadoFiltro || alcanceFiltro || manejaEnvioFiltro) && (
            <button
              className="limpiar-filtros-btn-compact"
              onClick={() => {
                setPaisFiltro('');
                setEstadoFiltro('');
                setAlcanceFiltro('');
                setManejaEnvioFiltro(false);
              }}
              type="button"
            >
              {t('portal.filters.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Toggle de vista y filtros avanzados para tabla */}
      <div className="table-controls-wrapper">
        {/* Filtros avanzados - Solo visible en vista tabla */}
        {viewMode === 'table' && (
          <div className="table-filters-advanced">
            <div className="table-filter-group">
              <label>{t('portal.filters.type')}</label>
              <select 
                value={tipoFiltro} 
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="table-filter-select"
              >
                <option value="">{t('portal.filters.allTypes')}</option>
                <option value="numeros">{t('portal.raffleTypes.numeros')}</option>
                <option value="baraja">{t('portal.raffleTypes.baraja')}</option>
                <option value="abecedario">{t('portal.raffleTypes.abecedario')}</option>
                <option value="animales">{t('portal.raffleTypes.animales')}</option>
                <option value="colores">{t('portal.raffleTypes.colores')}</option>
                <option value="equipos">{t('portal.raffleTypes.equipos')}</option>
                <option value="emojis">{t('portal.raffleTypes.emojis')}</option>
                <option value="paises">{t('portal.raffleTypes.paises')}</option>
              </select>
            </div>
            
            <div className="table-filter-group">
              <label>{t('portal.filters.price')}</label>
              <div className="precio-range">
                <input
                  type="number"
                  placeholder={t('portal.filters.min')}
                  value={precioMin}
                  onChange={(e) => setPrecioMin(e.target.value)}
                  className="table-filter-input"
                  min="0"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder={t('portal.filters.max')}
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                  className="table-filter-input"
                  min="0"
                />
              </div>
            </div>
            
            <div className="table-filter-group">
              <label>{t('portal.filters.progress')}</label>
              <select 
                value={progresoFiltro} 
                onChange={(e) => setProgresoFiltro(e.target.value)}
                className="table-filter-select"
              >
                <option value="">{t('portal.filters.allProgress')}</option>
                <option value="nuevas">{t('portal.filters.new')}</option>
                <option value="en-progreso">{t('portal.filters.inProgress')}</option>
                <option value="completadas">{t('portal.filters.completed')}</option>
              </select>
            </div>
            
            {(tipoFiltro || precioMin || precioMax || progresoFiltro) && (
              <button
                className="table-filter-clear"
                onClick={() => {
                  setTipoFiltro('');
                  setPrecioMin('');
                  setPrecioMax('');
                  setProgresoFiltro('');
                }}
                type="button"
              >
                {t('portal.filters.clear')}
              </button>
            )}
          </div>
        )}
        
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title={t('portal.viewMode.cardsTitle')}
          >
            {t('portal.viewMode.cards')}
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title={t('portal.viewMode.tableTitle')}
          >
            {t('portal.viewMode.table')}
          </button>
        </div>
      </div>

        {rifasFiltradas.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state">
              {rifasArray.length === 0 ? (
                <>
                  <div className="empty-state-icon">🎟️</div>
                  <h2 className="empty-state-title">{t('portal.emptyState.noRaffles')}</h2>
                  <p className="empty-state-description">
                    {t('portal.emptyState.noRafflesDescription')}
                  </p>
                  <div className="empty-state-actions">
                    <Link to="/landing" className="btn-primary-empty">
                      {t('portal.emptyState.signUp')}
                    </Link>
                    <button 
                      className="btn-secondary-empty"
                      onClick={() => {
                        loadPublicRifas();
                      }}
                    >
                      {t('portal.reloadRaffles')}
                    </button>
                    <Link to="/" className="btn-secondary-empty">
                      {t('portal.emptyState.goHome')}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="empty-state-icon">🔍</div>
                  <h2 className="empty-state-title">{t('portal.emptyState.noResults')}</h2>
                  <p className="empty-state-description">
                    {t('portal.emptyState.noResultsDescription')}
                  </p>
                  <div className="empty-state-actions">
                    <button 
                      className="btn-primary-empty"
                      onClick={() => {
                        setBusqueda('');
                        setFiltro('todas');
                        setPaisFiltro('');
                        setEstadoFiltro('');
                        setAlcanceFiltro('');
                        setManejaEnvioFiltro(false);
                        setTipoFiltro('');
                        setPrecioMin('');
                        setPrecioMax('');
                        setProgresoFiltro('');
                        setSortBy('');
                      }}
                    >
                      {t('portal.emptyState.clearFilters')}
                    </button>
                    <Link to="/" className="btn-secondary-empty">
                      {t('portal.emptyState.goHome')}
                    </Link>
                  </div>
                </>
              )}
            </div>
            
            {/* Sugerencias de afiliados cuando no hay rifas */}
            {rifasArray.length === 0 && (
              <div className="empty-state-suggestions">
                <AffiliateLinks category="general" limit={3} />
              </div>
            )}
          </div>
      ) : viewMode === 'table' ? (
        <div className="rifas-table-container">
          <table className="rifas-table">
            <thead>
              <tr>
                <th>
                  <div className="table-header-sortable" onClick={() => {
                    if (sortBy === 'nombre') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('nombre');
                      setSortOrder('asc');
                    }
                  }}>
                    {t('portal.table.raffle')}
                    {sortBy === 'nombre' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
                <th>
                  <div className="table-header-sortable" onClick={() => {
                    if (sortBy === 'organizador') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('organizador');
                      setSortOrder('asc');
                    }
                  }}>
                    {t('portal.table.organizer')}
                    {sortBy === 'organizador' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
                <th>{t('portal.table.status')}</th>
                <th>
                  <div className="table-header-sortable" onClick={() => {
                    if (sortBy === 'precio') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('precio');
                      setSortOrder('asc');
                    }
                  }}>
                    {t('portal.table.price')}
                    {sortBy === 'precio' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
                <th>{t('portal.table.type')}</th>
                <th>
                  <div className="table-header-sortable" onClick={() => {
                    if (sortBy === 'progreso') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('progreso');
                      setSortOrder('asc');
                    }
                  }}>
                    {t('portal.table.progress')}
                    {sortBy === 'progreso' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
                <th>{t('portal.table.location')}</th>
                <th>
                  <div className="table-header-sortable" onClick={() => {
                    if (sortBy === 'tiempo') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('tiempo');
                      setSortOrder('asc');
                    }
                  }}>
                    {t('portal.table.timeRemaining')}
                    {sortBy === 'tiempo' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
                <th>{t('portal.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rifasFiltradas.map(rifa => (
                <tr key={rifa.id}>
                  <td>
                    <div className="table-rifa-info">
                      <strong>{rifa.nombre}</strong>
                      {rifa.descripcion && (
                        <small>{rifa.descripcion.length > 50 ? rifa.descripcion.substring(0, 50) + '...' : rifa.descripcion}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="table-organizer">
                      <div className="organizer-info">
                        <span className="organizer-icon">👤</span>
                        <div className="organizer-details">
                          <span className="organizer-name">{rifa.creador_nombre || t('portal.table.noName')}</span>
                                                  </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`table-status ${rifa.activa ? 'active' : 'inactive'}`}>
                      {rifa.activa ? t('portal.table.active') : t('portal.table.finished')}
                    </span>
                  </td>
                  <td>
                    <span className="table-price">${rifa.precio}</span>
                  </td>
                  <td>
                    <span className="table-type">{obtenerNombreTipo(rifa.tipo)}</span>
                  </td>
                  <td>
                    <div className="table-progress">
                      <div className="table-progress-bar">
                        <div 
                          className="table-progress-fill"
                          style={{
                            width: `${Math.min(((rifa.elementos_vendidos || 0) / rifa.cantidad_elementos) * 100, 100)}%`,
                            background: ((rifa.elementos_vendidos || 0) / rifa.cantidad_elementos) >= 0.8
                              ? '#10b981'
                              : ((rifa.elementos_vendidos || 0) / rifa.cantidad_elementos) >= 0.5
                              ? '#3b82f6'
                              : '#f97316'
                          }}
                        ></div>
                      </div>
                      <span className="table-progress-text">
                        {rifa.elementos_vendidos || 0} / {rifa.cantidad_elementos}
                      </span>
                    </div>
                  </td>
                  <td>
                    {obtenerUbicacionTexto(rifa) ? (
                      <span className="table-location">
                        📍 {obtenerUbicacionTexto(rifa)}
                        {rifa.alcance && (
                          <> {rifa.alcance === 'local' && '🏘️'}
                          {rifa.alcance === 'nacional' && '🇲🇽'}
                          {rifa.alcance === 'internacional' && '🌍'}</>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>
                    {rifa.fecha_fin ? (
                      <span className={`table-time ${obtenerNivelUrgencia(rifa.fecha_fin) === 'high' ? 'urgent' : ''}`}>
                        {calcularDiasRestantes(rifa.fecha_fin)}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {rifa.activa ? (
                        <>
                          <Link 
                            to={`/participar/${rifa.id}`} 
                            className="table-action-btn table-action-primary"
                            title={t('portal.table.participate')}
                          >
                            🎫
                          </Link>
                          <Link 
                            to={`/public/${rifa.id}`} 
                            className="table-action-btn"
                            title={t('portal.table.viewDetails')}
                          >
                            👁️
                          </Link>
                        </>
                      ) : (
                        <Link 
                          to={`/public/${rifa.id}`} 
                          className="table-action-btn table-action-primary"
                          title={t('portal.table.viewDetails')}
                        >
                          👁️
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
        <>
          <div className="rifas-portal-grid-compact">
            {rifasPaginadas.map(rifa => {
            // Formatear ubicación: Ciudad, Código Estado, País
            const partesUbicacion = [];
            if (rifa.ciudad) partesUbicacion.push(rifa.ciudad);
            if (rifa.estado) partesUbicacion.push(rifa.estado); // Código del estado (ej: NLE)
            
            const paisInfo = paises.find(p => p.codigo === rifa.pais);
            const nombrePais = paisInfo ? (paisInfo.nombre_es || paisInfo.nombre) : (rifa.pais || '');
            if (nombrePais) partesUbicacion.push(nombrePais);
            
            const ubicacionTexto = partesUbicacion.length > 0 ? partesUbicacion.join(', ') : null;
            
            const emojiPais = rifa.pais === 'MX' || rifa.pais === 'MEX' ? '🇲🇽' : 
                             rifa.pais === 'US' || rifa.pais === 'USA' ? '🇺🇸' :
                             rifa.pais === 'CO' || rifa.pais === 'COL' ? '🇨🇴' :
                             rifa.pais === 'VE' || rifa.pais === 'VEN' ? '🇻🇪' :
                             rifa.pais === 'PE' || rifa.pais === 'PER' ? '🇵🇪' :
                             rifa.pais === 'CL' || rifa.pais === 'CHL' ? '🇨🇱' :
                             rifa.pais === 'AR' || rifa.pais === 'ARG' ? '🇦🇷' :
                             rifa.pais === 'EC' || rifa.pais === 'ECU' ? '🇪🇨' : '🌍';
            
            // Normalizar fotosPremios - puede venir como array o como JSON string
            let fotosPremios = [];
            if (rifa.fotosPremios) {
              if (Array.isArray(rifa.fotosPremios)) {
                fotosPremios = rifa.fotosPremios;
              } else if (typeof rifa.fotosPremios === 'string') {
                try {
                  fotosPremios = JSON.parse(rifa.fotosPremios);
                } catch (e) {
                  console.error('Error parsing fotosPremios:', e);
                }
              }
            }
            
            const primeraFoto = fotosPremios.length > 0 
              ? (fotosPremios[0].url || fotosPremios[0].url_foto || fotosPremios[0].url_foto)
              : null;
            const tieneFotos = fotosPremios.length > 0;
            const isExpanded = expandedCards.has(rifa.id);
            
            const toggleFotos = (e) => {
              e.preventDefault();
              e.stopPropagation();
              const newExpanded = new Set(expandedCards);
              if (isExpanded) {
                newExpanded.delete(rifa.id);
              } else {
                newExpanded.add(rifa.id);
              }
              setExpandedCards(newExpanded);
            };
            
            return (
              <div key={rifa.id} className="rifa-portal-card-compact-wrapper">
                <Link 
                  to={`/public/${rifa.id}`}
                  className="rifa-portal-card-compact"
                >
                  {/* Imagen del premio - siempre visible si existe */}
                  {primeraFoto ? (
                    <div className="rifa-card-compact-image">
                      <img 
                        src={primeraFoto} 
                        alt={rifa.nombre}
                        onError={(e) => {
                          console.error('Error cargando imagen:', primeraFoto);
                          e.target.style.display = 'none';
                        }}
                      />
                      {fotosPremios.length > 1 && (
                        <span className="fotos-count-badge">+{fotosPremios.length - 1}</span>
                      )}
                    </div>
                  ) : (
                    <div className="rifa-card-compact-image-placeholder">
                      <span className="placeholder-icon">🏆</span>
                      <span className="placeholder-text">{t('portal.card.noImage')}</span>
                    </div>
                  )}
                  
                  <div className="rifa-card-compact-header">
                    <h3 className="rifa-card-compact-title">{rifa.nombre}</h3>
                    <span className={`rifa-card-compact-status ${rifa.activa ? 'activa' : 'finalizada'}`}>
                      {rifa.activa ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <div className="rifa-card-compact-info">
                    <div className="rifa-card-compact-price">
                      <span className="rifa-card-compact-price-label">{t('portal.card.price')}</span>
                      <span className="rifa-card-compact-price-value">${rifa.precio}</span>
                    </div>
                    {rifa.fecha_fin && (
                      <div className="rifa-card-compact-date">
                        <span className="rifa-card-compact-date-label">{t('portal.card.date')}</span>
                        <span className="rifa-card-compact-date-value">
                          {new Date(rifa.fecha_fin).toLocaleDateString('es-MX', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    {ubicacionTexto && (
                      <div className="rifa-card-compact-location">
                        <span className="rifa-card-compact-location-label">{t('portal.card.location')}</span>
                        <span className="rifa-card-compact-location-value">
                          {ubicacionTexto} {emojiPais}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                {tieneFotos && (
                  <div className="rifa-card-premios-toggle">
                    <button 
                      className={`btn-ver-premios ${isExpanded ? 'expanded' : ''}`}
                      onClick={toggleFotos}
                      type="button"
                    >
                      <span className="btn-icon">{isExpanded ? '📸' : '🏆'}</span>
                      <span>{isExpanded ? t('portal.card.hidePrizes') : t('portal.card.viewPrizes')}</span>
                      <span className="btn-arrow">{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    {isExpanded && (
                      <div className="rifa-card-premios-fotos">
                        <div className="premios-fotos-grid">
                          {fotosPremios.map((foto, index) => (
                            <div key={foto.id || index} className="premio-foto-item">
                              <img 
                                src={foto.url || foto.url_foto} 
                                alt={foto.descripcion || `Premio ${index + 1}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(foto.url || foto.url_foto, '_blank');
                                }}
                              />
                              {foto.descripcion && (
                                <div className="premio-foto-desc">{foto.descripcion}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
            })}
          </div>
          
          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                type="button"
              >
                {t('portal.pagination.previous')}
              </button>
              
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Mostrar siempre primera, última, actual y sus vecinos
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                        type="button"
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                type="button"
              >
                {t('portal.pagination.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Banner publicitario después de las rifas */}
      <div style={{ margin: '3rem 0', display: 'flex', justifyContent: 'center' }}>
        <AdBanner 
          placement="portal_top"
          size="728x90"
          className="portal-ads-after-rifas"
        />
      </div>

      {/* Link simple a Consulta de Ganadores */}
      <div style={{ 
        margin: '2rem 0', 
        textAlign: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '16px',
        border: '2px solid #e2e8f0'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          color: '#1e293b',
          fontSize: '1.5rem',
          fontWeight: 700
        }}>
          {t('portal.winnerCheck.title')}
        </h3>
        <p style={{ 
          margin: '0 0 1.5rem 0', 
          color: '#64748b',
          fontSize: '1rem'
        }}>
          {t('portal.winnerCheck.description')}
        </p>
        <Link 
          to="/consulta-ganadores" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 2rem',
            background: 'linear-gradient(135deg, #1e22aa 0%, #2563eb 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(30, 34, 170, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 24px rgba(30, 34, 170, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(30, 34, 170, 0.3)';
          }}
        >
          {t('portal.winnerCheck.button')}
        </Link>
      </div>

      {/* Sección de negocios patrocinadores - Anuncios reales */}
      <SponsoredBusinessesSection />

      {/* Sección de Cupones - Al final para no interferir con las rifas */}
      <CuponesSection maxCupones={6} showTitle={true} />

    </div>
  );
};

export default RafflePortal;
