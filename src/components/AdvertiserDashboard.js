import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError, showWarning } from './NotificationToast';
import { showConfirm, showDangerConfirm } from '../utils/swal';
import StripeCreditPayment from './StripeCreditPayment';
import BusinessProfileModal from './BusinessProfileModal';

const API_BASE = 'http://localhost:5001/api';

const AdvertiserDashboard = ({ onLogout }) => {
  const { t } = useTranslation();
  const [view, setView] = useState('overview'); // 'overview', 'ads', 'newAd', 'editAd', 'clicks', 'cupones', 'newCupon', 'editCupon'
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState({ credito_actual: 0, credito_total_acumulado: 0 });
  const [showLoadCredits, setShowLoadCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showBusinessProfileModal, setShowBusinessProfileModal] = useState(false);
  const [advertiserProfile, setAdvertiserProfile] = useState(null);
  const [stats, setStats] = useState({
    ads: { total: 0, activos: 0 },
    impressions: 0,
    clicks: 0,
    ctr: 0,
    gasto: {
      mensual: 0,
      presupuestoTotal: 0,
      disponible: null,
      porcentajeUsado: 0
    },
    recent: {
      impressions: 0,
      clicks: 0,
      impressionsChange: 0,
      clicksChange: 0
    },
    previous: {
      impressions: 0,
      clicks: 0
    }
  });
  const [ads, setAds] = useState([]);
  const [editingAd, setEditingAd] = useState(null);
  const [selectedAdId, setSelectedAdId] = useState(null);
  const [clicks, setClicks] = useState([]);
  const [clicksLoading, setClicksLoading] = useState(false);
  const [clicksPagination, setClicksPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [clickFilters, setClickFilters] = useState({
    adId: null, // null = todos los anuncios
    fechaDesde: '',
    fechaHasta: '',
    ciudad: '',
    estado: '',
    pais: '',
    navegador: '',
    mostrarTodos: false // true = sin límite
  });
  // Vista por defecto: tabla en web, cards en móvil
  const [adsViewMode, setAdsViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? 'table' : 'cards';
    }
    return 'table';
  });
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion_corta: '',
    url_destino: '',
    imagen_url: '',
    categoria: '',
    ubicacion_display: [], // Array de ubicaciones seleccionadas
    presupuesto_mensual: '',
    modelo_facturacion: 'HYBRID' // CPM, CPC, o HYBRID (precios fijos definidos por la plataforma)
  });
  
  // Estados para cupones
  const [cupones, setCupones] = useState([]);
  const [editingCupon, setEditingCupon] = useState(null);
  const [cuponFormData, setCuponFormData] = useState({
    codigo: '',
    titulo: '',
    descripcion: '',
    descuento_tipo: 'porcentaje',
    descuento_valor: '',
    monto_minimo: '',
    fecha_inicio: '',
    fecha_fin: '',
    usos_maximos: '',
    imagen_url: ''
  });

  const loadCupones = async () => {
    const token = localStorage.getItem('advertiserToken');
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE}/advertisers/cupones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCupones(data.cupones || []);
      }
    } catch (e) {
      console.error('Error cargando cupones:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (view === 'cupones') {
      loadCupones();
    }
  }, [view]);

  // Ajustar vista según el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setAdsViewMode(isMobile ? 'cards' : 'table');
    };

    // Ajustar al cargar
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Escuchar evento para mostrar modal de perfil de negocio
  useEffect(() => {
    const handleShowBusinessProfile = () => {
      setShowBusinessProfileModal(true);
    };
    
    window.addEventListener('showBusinessProfileModal', handleShowBusinessProfile);
    return () => window.removeEventListener('showBusinessProfileModal', handleShowBusinessProfile);
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('advertiserToken');
    console.log('🔑 Token encontrado en dashboard:', token ? 'SÍ' : 'NO');
    console.log('🔑 Valor completo del token:', token);
    
    if (!token || token === 'null' || token === 'undefined') {
      setLoading(false);
      showWarning('No estás autenticado. Por favor, inicia sesión.', 'Sesión requerida');
      window.location.href = '/anunciantes';
      return;
    }

    try {
      const [creditsRes, statsRes, adsRes, profileRes] = await Promise.all([
        fetch(`${API_BASE}/advertisers/credits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/advertisers/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/advertisers/ads`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/advertisers/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Si alguna respuesta es 401, el token expiró
      if (creditsRes.status === 401 || statsRes.status === 401 || adsRes.status === 401 || (profileRes && profileRes.status === 401)) {
        localStorage.removeItem('advertiserToken');
        showWarning('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
        window.location.href = '/anunciantes';
        return;
      }

      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setCredits(creditsData);
      }

      // Cargar perfil de negocio (guardar advertiserId para el link del perfil)
      if (profileRes && profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.advertiser && profileData.advertiser.id) {
          localStorage.setItem('advertiserId', profileData.advertiser.id);
          setAdvertiserProfile(profileData.advertiser);
          
          // Si no tiene nombre_comercial configurado, mostrar modal automáticamente
          if (!profileData.advertiser.nombre_comercial) {
            setTimeout(() => {
              setShowBusinessProfileModal(true);
            }, 1500);
          }
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('📊 Estadísticas recibidas del servidor:', statsData);
        console.log('📊 Tipo de datos:', typeof statsData.ads?.total, typeof statsData.impressions);
        // Asegurar que todos los valores sean números
        const normalizedStats = {
          ads: {
            total: Number(statsData.ads?.total || 0),
            activos: Number(statsData.ads?.activos || 0)
          },
          impressions: Number(statsData.impressions || 0),
          clicks: Number(statsData.clicks || 0),
          ctr: Number(statsData.ctr || 0),
          recent: {
            impressions: Number(statsData.recent?.impressions || 0),
            clicks: Number(statsData.recent?.clicks || 0),
            impressionsChange: Number(statsData.recent?.impressionsChange || 0),
            clicksChange: Number(statsData.recent?.clicksChange || 0)
          },
          previous: {
            impressions: Number(statsData.previous?.impressions || 0),
            clicks: Number(statsData.previous?.clicks || 0)
          }
        };
        console.log('📊 Estadísticas normalizadas:', normalizedStats);
        setStats(normalizedStats);
        console.log('📊 Estado stats actualizado');
      } else {
        const errorText = await statsRes.text();
        console.error('❌ Error cargando estadísticas:', statsRes.status, errorText);
        setStats({
          ads: { total: 0, activos: 0 },
          impressions: 0,
          clicks: 0,
          ctr: 0,
          recent: {
            impressions: 0,
            clicks: 0,
            impressionsChange: 0,
            clicksChange: 0
          },
          previous: {
            impressions: 0,
            clicks: 0
          }
        });
      }

      if (adsRes.ok) {
        const adsData = await adsRes.json();
        console.log('📋 Anuncios cargados:', adsData.ads?.length || 0, adsData.ads);
        // Parsear ubicacion_display si viene como JSONB (array o string)
        const adsParsed = (adsData.ads || []).map(ad => {
          let ubicaciones = [];
          if (typeof ad.ubicacion_display === 'string') {
            try {
              ubicaciones = JSON.parse(ad.ubicacion_display);
            } catch {
              ubicaciones = [ad.ubicacion_display];
            }
          } else if (Array.isArray(ad.ubicacion_display)) {
            ubicaciones = ad.ubicacion_display;
          }
          return { ...ad, ubicacion_display: ubicaciones };
        });
        setAds(adsParsed);
      } else {
        const errorText = await adsRes.text();
        console.error('Error cargando anuncios:', adsRes.status, errorText);
      }
    } catch (e) {
      console.error('Error cargando datos:', e);
    } finally {
      setLoading(false);
    }
  };


  const handleLoadCredits = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('advertiserToken');
    
    if (!token) {
      showError('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
      window.location.href = '/anunciantes';
      return;
    }

    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      showWarning('Por favor, ingresa un monto válido mayor a $0', 'Monto inválido');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/advertisers/credits/load`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          monto: parseFloat(creditAmount),
          descripcion: `Carga de crédito desde dashboard`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCredits(data);
        setShowLoadCredits(false);
        setCreditAmount('');
        showSuccess(data.message || 'Crédito cargado exitosamente', '¡Éxito!');
        loadData(); // Recargar datos para actualizar estadísticas
      } else {
        showError(data.error || 'Error cargando crédito', 'Error al cargar crédito');
      }
    } catch (error) {
      console.error('Error cargando crédito:', error);
      showError('Error cargando crédito. Por favor, intenta nuevamente.', 'Error');
    }
  };

  const handleSaveAd = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('advertiserToken');
    
    if (!token) {
      showError('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
      window.location.href = '/anunciantes';
      return;
    }

    // Validar que se haya seleccionado al menos una ubicación
    if (!formData.ubicacion_display || formData.ubicacion_display.length === 0) {
      showWarning('Debes seleccionar al menos una ubicación de display', 'Ubicación requerida');
      return;
    }

    // Validar que el presupuesto mensual no exceda los créditos disponibles
    const presupuestoMensual = parseFloat(formData.presupuesto_mensual) || 0;
    if (presupuestoMensual > 0 && presupuestoMensual > credits.credito_actual) {
      showWarning(
        `El límite de presupuesto mensual ($${presupuestoMensual.toFixed(2)}) no puede ser mayor a tus créditos disponibles ($${credits.credito_actual.toFixed(2)}). Por favor, reduce el límite o carga más créditos.`,
        'Límite excedido'
      );
      return;
    }

    try {
      const url = editingAd
        ? `${API_BASE}/advertisers/ads/${editingAd.id}`
        : `${API_BASE}/advertisers/ads`;
      const method = editingAd ? 'PUT' : 'POST';

      // Preparar datos para envío (convertir strings a números donde sea necesario)
      // Los precios CPM y CPC son fijos y se asignan automáticamente en el backend
      const dataToSend = {
        ...formData,
        presupuesto_mensual: parseFloat(formData.presupuesto_mensual) || 0
      };

      console.log('📤 Enviando anuncio:', { method, url, dataToSend });
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const responseData = await res.json();
      console.log('📥 Respuesta del servidor:', { status: res.status, data: responseData });

      if (res.ok) {
        showSuccess(editingAd ? 'Anuncio actualizado exitosamente' : 'Anuncio creado exitosamente', '¡Éxito!');
        await loadData(); // Recargar todos los datos
        setView('ads'); // Cambiar a la vista de anuncios
        setEditingAd(null);
        setFormData({
          titulo: '',
          descripcion_corta: '',
          url_destino: '',
          imagen_url: '',
          categoria: '',
          ubicacion_display: [],
          presupuesto_mensual: ''
        });
      } else {
        if (res.status === 401) {
          showWarning('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
          localStorage.removeItem('advertiserToken');
          window.location.href = '/anunciantes';
        } else {
          console.error('Error guardando anuncio:', responseData);
          showError(responseData.error || 'Error guardando anuncio', 'Error');
        }
      }
    } catch (e) {
      console.error('Excepción guardando anuncio:', e);
      showError('Error guardando anuncio: ' + e.message, 'Error');
    }
  };

  const handleEditAd = (ad) => {
    setEditingAd(ad);
    // Manejar ubicacion_display como array o string (compatibilidad)
    let ubicaciones = [];
    if (Array.isArray(ad.ubicacion_display)) {
      ubicaciones = ad.ubicacion_display;
    } else if (typeof ad.ubicacion_display === 'string') {
      ubicaciones = [ad.ubicacion_display];
    }
    
    setFormData({
      titulo: ad.titulo || '',
      descripcion_corta: ad.descripcion_corta || '',
      url_destino: ad.url_destino || '',
      imagen_url: ad.imagen_url || '',
      categoria: ad.categoria || '',
      ubicacion_display: ubicaciones,
      presupuesto_mensual: ad.presupuesto_mensual || '',
      modelo_facturacion: ad.modelo_facturacion || 'HYBRID'
    });
    setView('newAd');
  };

  const handleDeleteAd = async (id) => {
    const confirmed = await showDangerConfirm(
      'Eliminar Anuncio',
      '¿Estás seguro de que deseas eliminar este anuncio? Esta acción no se puede deshacer.',
      { 
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );
    if (!confirmed) return;

    const token = localStorage.getItem('advertiserToken');
    if (!token) {
      showWarning('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
      window.location.href = '/anunciantes';
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/advertisers/ads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        await loadData();
      } else if (res.status === 401) {
        showWarning('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
        localStorage.removeItem('advertiserToken');
        window.location.href = '/anunciantes';
      } else {
        showError('Error eliminando anuncio', 'Error');
      }
    } catch (e) {
      showError('Error eliminando anuncio', 'Error');
    }
  };

  const handleToggleAd = async (id) => {
    const token = localStorage.getItem('advertiserToken');
    if (!token) {
      showError('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
      window.location.href = '/anunciantes';
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/advertisers/ads/${id}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        await loadData();
      } else if (res.status === 401) {
        showWarning('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
        localStorage.removeItem('advertiserToken');
        window.location.href = '/anunciantes';
      }
    } catch (e) {
      showError('Error actualizando anuncio', 'Error');
    }
  };

  const loadAdClicks = async (adId = null, page = 1, filters = null) => {
    const token = localStorage.getItem('advertiserToken');
    if (!token) return;

    setClicksLoading(true);
    try {
      const activeFilters = filters || clickFilters;
      const targetAdId = adId || activeFilters.adId || selectedAdId;
      
      if (!targetAdId && !activeFilters.adId) {
        // Si no hay anuncio seleccionado, cargar todos
        const allParams = new URLSearchParams();
        allParams.append('page', page.toString());
        allParams.append('limit', activeFilters.mostrarTodos ? '9999' : '100');
        
        if (activeFilters.fechaDesde) allParams.append('fechaDesde', activeFilters.fechaDesde);
        if (activeFilters.fechaHasta) allParams.append('fechaHasta', activeFilters.fechaHasta);
        if (activeFilters.ciudad) allParams.append('ciudad', activeFilters.ciudad);
        if (activeFilters.estado) allParams.append('estado', activeFilters.estado);
        if (activeFilters.pais) allParams.append('pais', activeFilters.pais);
        if (activeFilters.navegador) allParams.append('navegador', activeFilters.navegador);

        const res = await fetch(`${API_BASE}/advertisers/clicks/all?${allParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setClicks(data.clicks || []);
          setClicksPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
        } else if (res.status === 401) {
          showWarning('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
          localStorage.removeItem('advertiserToken');
          window.location.href = '/anunciantes';
        }
        return;
      }

      // Construir query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', activeFilters.mostrarTodos ? '9999' : '100');
      
      if (activeFilters.fechaDesde) params.append('fechaDesde', activeFilters.fechaDesde);
      if (activeFilters.fechaHasta) params.append('fechaHasta', activeFilters.fechaHasta);
      if (activeFilters.ciudad) params.append('ciudad', activeFilters.ciudad);
      if (activeFilters.estado) params.append('estado', activeFilters.estado);
      if (activeFilters.pais) params.append('pais', activeFilters.pais);
      if (activeFilters.navegador) params.append('navegador', activeFilters.navegador);

      const res = await fetch(`${API_BASE}/advertisers/ads/${targetAdId}/clicks?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setClicks(data.clicks || []);
        setClicksPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
      } else if (res.status === 401) {
        showWarning('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Sesión expirada');
        localStorage.removeItem('advertiserToken');
        window.location.href = '/anunciantes';
      }
    } catch (e) {
      console.error('Error cargando clicks:', e);
      showError('Error cargando clicks', 'Error');
    } finally {
      setClicksLoading(false);
    }
  };

  const handleViewClicks = (adId) => {
    setSelectedAdId(adId);
    setClickFilters(prev => ({ ...prev, adId }));
    setView('clicks');
    loadAdClicks(adId, 1, { ...clickFilters, adId });
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...clickFilters, [filterName]: value };
    setClickFilters(newFilters);
    // Si cambia el anuncio, actualizar selectedAdId
    if (filterName === 'adId') {
      setSelectedAdId(value || null);
    }
  };

  const handleApplyFilters = () => {
    loadAdClicks(clickFilters.adId || selectedAdId, 1, clickFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      adId: selectedAdId, // Mantener el anuncio actual si estaba seleccionado
      fechaDesde: '',
      fechaHasta: '',
      ciudad: '',
      estado: '',
      pais: '',
      navegador: '',
      mostrarTodos: false
    };
    setClickFilters(clearedFilters);
    loadAdClicks(selectedAdId, 1, clearedFilters);
  };

  // Obtener valores únicos para los filtros (desde todos los clicks cargados)
  const getUniqueValues = (field) => {
    const values = new Set();
    clicks.forEach(click => {
      const value = click[field];
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  };

  // Cargar valores únicos para filtros cuando cambia la selección
  useEffect(() => {
    if (view === 'clicks' && clicks.length > 0) {
      // Los valores únicos se actualizan automáticamente cuando clicks cambia
    }
  }, [clicks, view]);

  const getBrowserFromUserAgent = (userAgent) => {
    if (!userAgent) return 'Desconocido';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Otro';
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '';
    // Convertir código de país a emoji de bandera
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  if (loading) {
    return <div className="advertiser-dashboard"><div className="loading">{t('advertiser.dashboard.loading')}</div></div>;
  }

  return (
    <div className="advertiser-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>📣 {t('advertiser.dashboard.title')}</h1>
          <div className="dashboard-nav">
            <button
              className={view === 'overview' ? 'active' : ''}
              onClick={() => setView('overview')}
            >
              {t('advertiser.dashboard.nav.overview')}
            </button>
            <button
              className={view === 'ads' ? 'active' : ''}
              onClick={() => setView('ads')}
            >
              {t('advertiser.dashboard.nav.ads')}
            </button>
            <button
              className={view === 'newAd' ? 'active' : ''}
              onClick={() => {
                setView('newAd');
                setEditingAd(null);
                setFormData({
                  titulo: '',
                  descripcion_corta: '',
                  url_destino: '',
                  imagen_url: '',
                  categoria: '',
                  ubicacion_display: [],
                  presupuesto_mensual: '',
                  modelo_facturacion: 'HYBRID'
                });
              }}
            >
              {t('advertiser.dashboard.nav.newAd')}
            </button>
            <button
              className={view === 'cupones' || view === 'newCupon' || view === 'editCupon' ? 'active' : ''}
              onClick={() => {
                setView('cupones');
                loadCupones();
              }}
            >
              {t('advertiser.dashboard.nav.coupons')}
            </button>
          </div>
        </div>

        {view === 'clicks' && (
          <div className="dashboard-content">
            <div className="dashboard-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2>{t('advertiser.dashboard.clicks.title')}</h2>
                  {selectedAdId && ads.find(ad => ad.id === selectedAdId) && (
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                      {t('advertiser.dashboard.clicks.ad')} <strong>{ads.find(ad => ad.id === selectedAdId).titulo}</strong>
                    </p>
                  )}
                  {!selectedAdId && clickFilters.adId === null && (
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                      <strong>{t('advertiser.dashboard.clicks.allAds')}</strong>
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('advertiserToken');
                      if (!token) return;
                      
                      const confirmed = await showConfirm(
                        t('advertiser.dashboard.clicks.updateLocations'),
                        t('advertiser.dashboard.clicks.updateLocationsConfirm'),
                        {
                          icon: 'info',
                          confirmText: t('advertiser.dashboard.clicks.update'),
                          cancelText: t('advertiser.dashboard.credits.cancel')
                        }
                      );
                      
                      if (confirmed) {
                        try {
                          const adIdToUpdate = selectedAdId || clickFilters.adId;
                          if (!adIdToUpdate) {
                            showWarning('Selecciona un anuncio específico para actualizar ubicaciones', 'Anuncio requerido');
                            return;
                          }
                          const res = await fetch(`${API_BASE}/advertisers/ads/${adIdToUpdate}/clicks/update-locations`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          const data = await res.json();
                          if (res.ok) {
                            showSuccess(
                              `Actualizado: ${data.updated} clicks. Omitidos (IPs locales): ${data.skipped}`,
                              'Ubicaciones actualizadas'
                            );
                            loadAdClicks(selectedAdId || clickFilters.adId, clicksPagination.page, clickFilters);
                          } else {
                            showError('Error actualizando ubicaciones', 'Error');
                          }
                        } catch (e) {
                          showError('Error actualizando ubicaciones', 'Error');
                        }
                      }
                    }}
                    className="btn-advertiser-action"
                    disabled={!selectedAdId && clickFilters.adId === null}
                  >
                    🔄 Actualizar Ubicaciones
                  </button>
                  <button
                    onClick={() => setView('ads')}
                    className="btn-advertiser-action back-btn"
                  >
                    {t('advertiser.dashboard.clicks.backToAds')}
                  </button>
                </div>
              </div>

              {/* Filtros */}
              <div className="clicks-filters-container">
                <div className="clicks-filters-header">
                  <h3>{t('advertiser.dashboard.clicks.filters.title')}</h3>
                  <button onClick={handleClearFilters} className="btn-clear-filters">
                    {t('advertiser.dashboard.clicks.filters.clear')}
                  </button>
                </div>
                
                {/* Grupo: Campaña */}
                <div className="filter-section">
                  <div className="filter-section-title">{t('advertiser.dashboard.clicks.filters.campaign')}</div>
                  <div className="filter-section-content">
                    <div className="filter-group filter-group-full">
                      <label>{t('advertiser.dashboard.clicks.filters.ad')}</label>
                      <select
                        value={clickFilters.adId || selectedAdId || ''}
                        onChange={(e) => {
                          const newAdId = e.target.value === '' ? null : parseInt(e.target.value);
                          handleFilterChange('adId', newAdId);
                          setSelectedAdId(newAdId);
                          if (newAdId) {
                            loadAdClicks(newAdId, 1, { ...clickFilters, adId: newAdId });
                          } else {
                            loadAdClicks(null, 1, { ...clickFilters, adId: null });
                          }
                        }}
                        className="filter-select"
                      >
                        <option value="">{t('advertiser.dashboard.clicks.filters.allAds')} ({stats.clicks ?? 0} {t('advertiser.dashboard.clicks.filters.clicksTotal')})</option>
                        {ads.map(ad => (
                          <option key={ad.id} value={ad.id}>
                            {ad.titulo} ({ad.stats?.clicks || 0} clicks)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Grupo: Fechas */}
                <div className="filter-section">
                  <div className="filter-section-title">{t('advertiser.dashboard.clicks.filters.dateRange')}</div>
                  <div className="filter-section-content filter-section-dates">
                    <div className="filter-group">
                      <label>{t('advertiser.dashboard.clicks.filters.from')}</label>
                      <input
                        type="date"
                        value={clickFilters.fechaDesde}
                        onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                    <div className="filter-group">
                      <label>{t('advertiser.dashboard.clicks.filters.to')}</label>
                      <input
                        type="date"
                        value={clickFilters.fechaHasta}
                        onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Grupo: Ubicación */}
                <div className="filter-section">
                  <div className="filter-section-title">{t('advertiser.dashboard.clicks.filters.location')}</div>
                  <div className="filter-section-content">
                    <div className="filter-group">
                      <label>{t('advertiser.dashboard.clicks.filters.country')}</label>
                      <select
                        value={clickFilters.pais}
                        onChange={(e) => handleFilterChange('pais', e.target.value)}
                        className="filter-select"
                      >
                        <option value="">{t('advertiser.dashboard.clicks.filters.allCountries')}</option>
                        {getUniqueValues('pais').map(pais => (
                          <option key={pais} value={pais}>{pais}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>{t('advertiser.dashboard.clicks.filters.state')}</label>
                      <select
                        value={clickFilters.estado}
                        onChange={(e) => handleFilterChange('estado', e.target.value)}
                        className="filter-select"
                      >
                        <option value="">{t('advertiser.dashboard.clicks.filters.allStates')}</option>
                        {getUniqueValues('estado').map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>{t('advertiser.dashboard.clicks.filters.city')}</label>
                      <select
                        value={clickFilters.ciudad}
                        onChange={(e) => handleFilterChange('ciudad', e.target.value)}
                        className="filter-select"
                      >
                        <option value="">{t('advertiser.dashboard.clicks.filters.allCities')}</option>
                        {getUniqueValues('ciudad').map(ciudad => (
                          <option key={ciudad} value={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Grupo: Técnico */}
                <div className="filter-section">
                  <div className="filter-section-title">{t('advertiser.dashboard.clicks.filters.technical')}</div>
                  <div className="filter-section-content">
                    <div className="filter-group">
                      <label>{t('advertiser.dashboard.clicks.filters.browser')}</label>
                      <select
                        value={clickFilters.navegador}
                        onChange={(e) => handleFilterChange('navegador', e.target.value)}
                        className="filter-select"
                      >
                        <option value="">{t('advertiser.dashboard.clicks.filters.allBrowsers')}</option>
                        {['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Otro'].map(nav => (
                          <option key={nav} value={nav}>{nav}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Opciones adicionales */}
                <div className="filter-section filter-section-options">
                  <div className="filter-section-content">
                    <div className="filter-group filter-group-checkbox">
                      <label className="checkbox-option-label">
                        <input
                          type="checkbox"
                          checked={clickFilters.mostrarTodos}
                          onChange={(e) => handleFilterChange('mostrarTodos', e.target.checked)}
                        />
                        <span>{t('advertiser.dashboard.clicks.filters.showAll')}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="clicks-filters-actions">
                  <button onClick={handleApplyFilters} className="btn-apply-filters">
                    {t('advertiser.dashboard.clicks.filters.apply')}
                  </button>
                  <span className="filter-results-count">
                    {t('advertiser.dashboard.clicks.filters.showing')} {clicks.length} {t('advertiser.dashboard.clicks.filters.of')} {clicksPagination.total} {t('advertiser.dashboard.clicks.filters.clicks')}
                  </span>
                </div>
              </div>

              {clicksLoading ? (
                <div className="loading-state">{t('advertiser.dashboard.clicks.loading')}</div>
              ) : clicks.length === 0 ? (
                <div className="no-ads">
                  <p>{t('advertiser.dashboard.clicks.noClicks')}</p>
                </div>
              ) : (
                <>
                  <div className="clicks-table-container">
                    <table className="clicks-table">
                      <thead>
                        <tr>
                          <th>{t('advertiser.dashboard.clicks.table.dateTime')}</th>
                          {(!selectedAdId && clickFilters.adId === null) && <th>{t('advertiser.dashboard.clicks.table.campaign')}</th>}
                          <th>{t('advertiser.dashboard.clicks.table.location')}</th>
                          <th>{t('advertiser.dashboard.clicks.table.page')}</th>
                          <th>{t('advertiser.dashboard.clicks.table.browser')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clicks.map(click => (
                          <tr key={click.id}>
                            <td>
                              {new Date(click.created_at).toLocaleString('es-MX', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                            {(!selectedAdId && clickFilters.adId === null) && (
                              <td>
                                {click.anuncio_titulo ? (
                                  <span className="campaign-name" title={`ID: ${click.anuncio_id}`}>
                                    {click.anuncio_titulo}
                                  </span>
                                ) : (
                                  <span className="campaign-name">{t('advertiser.dashboard.clicks.table.na')}</span>
                                )}
                              </td>
                            )}
                            <td>
                              {click.ciudad || click.estado || click.pais ? (
                                <div className="click-location">
                                  {click.ciudad && <span className="location-city">{click.ciudad}</span>}
                                  {click.estado && <span className="location-state">{click.estado}</span>}
                                  {click.pais && (
                                    <span className="location-country">
                                      {click.pais_codigo ? `${getCountryFlag(click.pais_codigo)} ` : ''}
                                      {click.pais}
                                    </span>
                                  )}
                                  {!click.ciudad && !click.estado && !click.pais && (
                                    <span className="location-ip">{click.ip || 'N/A'}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="location-ip">{click.ip || 'N/A'}</span>
                              )}
                            </td>
                            <td>{click.path || t('advertiser.dashboard.clicks.table.na')}</td>
                            <td>{getBrowserFromUserAgent(click.user_agent) || t('advertiser.dashboard.clicks.table.na')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {clicksPagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        disabled={clicksPagination.page === 1}
                        onClick={() => loadAdClicks(selectedAdId, clicksPagination.page - 1)}
                        className="btn-secondary"
                      >
                        {t('advertiser.dashboard.clicks.pagination.previous')}
                      </button>
                      <span>
                        {t('advertiser.dashboard.clicks.pagination.page')} {clicksPagination.page} {t('advertiser.dashboard.clicks.pagination.of')} {clicksPagination.totalPages} 
                        ({clicksPagination.total} {t('advertiser.dashboard.clicks.pagination.total')})
                      </span>
                      <button
                        disabled={clicksPagination.page >= clicksPagination.totalPages}
                        onClick={() => loadAdClicks(selectedAdId, clicksPagination.page + 1)}
                        className="btn-secondary"
                      >
                        {t('advertiser.dashboard.clicks.pagination.next')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {view === 'overview' && (
          <div className="dashboard-content">
            {/* Créditos */}
            <div className="dashboard-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>{t('advertiser.dashboard.credits.title')}</h2>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowLoadCredits(!showLoadCredits);
                    if (showLoadCredits) {
                      // Si se está cerrando, resetear todo
                      setShowPaymentForm(false);
                      setCreditAmount('');
                    }
                  }}
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
                >
                  {showLoadCredits ? t('advertiser.dashboard.credits.cancel') : t('advertiser.dashboard.credits.loadCredits')}
                </button>
              </div>
              
              {showLoadCredits ? (
                <div className="credit-load-form">
                  {showPaymentForm && creditAmount && parseFloat(creditAmount) >= 10 ? (
                    <div>
                      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>{t('advertiser.dashboard.credits.loadForm.summary')}</p>
                        <p style={{ margin: 0, fontSize: '1.1rem' }}>
                          {t('advertiser.dashboard.credits.loadForm.amount')} <strong>${parseFloat(creditAmount).toFixed(2)} MXN</strong>
                        </p>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setShowPaymentForm(false);
                          }}
                          style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}
                        >
                          {t('advertiser.dashboard.credits.loadForm.changeAmount')}
                        </button>
                      </div>
                      <StripeCreditPayment
                        amount={parseFloat(creditAmount)}
                        onSuccess={(paymentIntent) => {
                          setShowLoadCredits(false);
                          setShowPaymentForm(false);
                          setCreditAmount('');
                          loadData(); // Recargar datos para actualizar créditos
                        }}
                        onCancel={() => {
                          setShowPaymentForm(false);
                        }}
                      />
                    </div>
                  ) : (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const amount = parseFloat(creditAmount);
                      if (!creditAmount || amount <= 0) {
                        showWarning(t('advertiser.dashboard.credits.loadForm.invalidAmount'), 'Monto inválido');
                        return;
                      }
                      if (amount < 10) {
                        showWarning('Monto mínimo', t('advertiser.dashboard.credits.loadForm.minAmount'));
                        return;
                      }
                      // Mostrar formulario de pago
                      setShowPaymentForm(true);
                    }} className="credit-load-form">
                      <div className="form-group">
                        <label>{t('advertiser.dashboard.credits.loadForm.title')}</label>
                        <input
                          type="number"
                          value={creditAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCreditAmount(value);
                            // Resetear el formulario de pago si cambia el monto
                            if (showPaymentForm) {
                              setShowPaymentForm(false);
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value > 0 && value < 10) {
                              showWarning('Monto mínimo', t('advertiser.dashboard.credits.loadForm.minAmount'));
                            }
                          }}
                          min="10"
                          step="0.01"
                          placeholder={t('advertiser.dashboard.credits.loadForm.placeholder')}
                          required
                          autoFocus
                        />
                        <small style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                          {t('advertiser.dashboard.credits.loadForm.tip1')}
                        </small>
                        <small style={{ color: '#f59e0b', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                          {t('advertiser.dashboard.credits.loadForm.tip2')}
                        </small>
                        <small style={{ color: '#10b981', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                          {t('advertiser.dashboard.credits.loadForm.tip3')}
                        </small>
                      </div>
                      <div className="form-actions">
                        <button 
                          type="button" 
                          className="btn-secondary"
                          onClick={() => {
                            setShowLoadCredits(false);
                            setShowPaymentForm(false);
                            setCreditAmount('');
                          }}
                        >
                          {t('advertiser.dashboard.credits.cancel')}
                        </button>
                        <button 
                          type="submit" 
                          className="btn-primary"
                          disabled={!creditAmount || parseFloat(creditAmount) < 10}
                        >
                          {t('advertiser.dashboard.credits.loadForm.continue')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="credit-info">
                  <div className="credit-balance">
                    <div className="credit-amount">
                      <span className="credit-label">{t('advertiser.dashboard.credits.available')}</span>
                      <span className="credit-value">${credits.credito_actual?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="credit-total">
                      <span className="credit-label-small">{t('advertiser.dashboard.credits.totalLoaded')}</span>
                      <span className="credit-value-small">${credits.credito_total_acumulado?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  {credits.credito_actual <= 0 && (
                    <div className="credit-warning">
                      {t('advertiser.dashboard.credits.noCredits')}
                    </div>
                  )}
                  <div className="credit-info-text">
                    <p><strong>{t('advertiser.dashboard.credits.howItWorks')}</strong></p>
                    <ul>
                      <li>{t('advertiser.dashboard.credits.howItWorks1')}</li>
                      <li>{t('advertiser.dashboard.credits.howItWorks2')}</li>
                      <li>{t('advertiser.dashboard.credits.howItWorks3')}</li>
                      <li>{t('advertiser.dashboard.credits.howItWorks4')}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Estadísticas - Siempre mostrar, incluso si no hay datos */}
            <div className="dashboard-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>{t('advertiser.dashboard.stats.title')}</h2>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  {t('advertiser.dashboard.stats.last7Days')}
                </div>
              </div>
              
              <div className="stats-grid-enhanced">
                <div className="stat-card-enhanced">
                  <div className="stat-header">
                    <span className="stat-label">{t('advertiser.dashboard.stats.impressions')}</span>
                    <span className="stat-icon">👁️</span>
                  </div>
                  <div className="stat-value">{stats.impressions?.toLocaleString() ?? 0}</div>
                  <div className="stat-comparison">
                    <span className="stat-recent">{stats.recent?.impressions?.toLocaleString() ?? 0} {t('advertiser.dashboard.stats.last7DaysLabel')}</span>
                    {stats.recent?.impressionsChange !== undefined && stats.recent.impressionsChange !== 0 && (
                      <span className={`stat-change ${stats.recent.impressionsChange >= 0 ? 'positive' : 'negative'}`}>
                        {stats.recent.impressionsChange >= 0 ? '↑' : '↓'} {Math.abs(stats.recent.impressionsChange)}%
                      </span>
                    )}
                  </div>
                  <div className="stat-subtitle">{t('advertiser.dashboard.stats.vsPrevious')}</div>
                </div>

                <div 
                  className="stat-card-enhanced stat-card-clickable"
                  onClick={() => {
                    const adWithClicks = ads.find(ad => ad.stats?.clicks > 0);
                    if (adWithClicks) {
                      handleViewClicks(adWithClicks.id);
                    } else if (ads.length > 0) {
                      handleViewClicks(ads[0].id);
                    } else {
                      showWarning('No tienes anuncios para ver clicks', 'Sin anuncios');
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                  title="Ver detalle de clicks"
                >
                  <div className="stat-header">
                    <span className="stat-label">{t('advertiser.dashboard.stats.clicks')}</span>
                    <span className="stat-icon">🖱️</span>
                  </div>
                  <div className="stat-value">{stats.clicks?.toLocaleString() ?? 0}</div>
                  <div className="stat-comparison">
                    <span className="stat-recent">{stats.recent?.clicks?.toLocaleString() ?? 0} {t('advertiser.dashboard.stats.last7DaysLabel')}</span>
                    {stats.recent?.clicksChange !== undefined && stats.recent.clicksChange !== 0 && (
                      <span className={`stat-change ${stats.recent.clicksChange >= 0 ? 'positive' : 'negative'}`}>
                        {stats.recent.clicksChange >= 0 ? '↑' : '↓'} {Math.abs(stats.recent.clicksChange)}%
                      </span>
                    )}
                  </div>
                  <div className="stat-subtitle">{t('advertiser.dashboard.stats.vsPrevious')} {t('advertiser.dashboard.stats.viewDetail')}</div>
                </div>

                <div className="stat-card-enhanced">
                  <div className="stat-header">
                    <span className="stat-label">{t('advertiser.dashboard.stats.ctr')}</span>
                    <span className="stat-icon">📊</span>
                  </div>
                  <div className="stat-value">{stats.ctr?.toFixed(2) ?? '0.00'}%</div>
                  <div className="stat-description">{t('advertiser.dashboard.stats.clickThroughRate')}</div>
                  <div className="stat-formula">
                    {(stats.impressions ?? 0) > 0 ? (
                      <small>{stats.clicks ?? 0} {t('advertiser.dashboard.stats.clicksLabel')} / {stats.impressions ?? 0} {t('advertiser.dashboard.stats.impressionsLabel')}</small>
                    ) : (
                      <small>{t('advertiser.dashboard.stats.insufficientData')}</small>
                    )}
                  </div>
                </div>

                <div className="stat-card-enhanced">
                  <div className="stat-header">
                    <span className="stat-label">{t('advertiser.dashboard.stats.activeAds')}</span>
                    <span className="stat-icon">🎯</span>
                  </div>
                  <div className="stat-value">{stats.ads?.activos ?? 0}</div>
                  <div className="stat-comparison">
                    <span className="stat-recent">{t('advertiser.dashboard.stats.ofTotal')} {stats.ads?.total ?? 0} {t('advertiser.dashboard.stats.total')}</span>
                  </div>
                  <div className="stat-subtitle">{t('advertiser.dashboard.stats.published')}</div>
                </div>

                {/* Card de Presupuesto */}
                {stats.gasto && (
                  <div className={`stat-card-enhanced ${stats.gasto.porcentajeUsado >= 80 ? 'stat-card-warning' : ''}`}>
                    <div className="stat-header">
                      <span className="stat-label">{t('advertiser.dashboard.stats.budget')}</span>
                      <span className="stat-icon">💰</span>
                    </div>
                    {stats.gasto.presupuestoTotal > 0 ? (
                      <>
                        <div className="stat-value">${stats.gasto.mensual?.toFixed(2) ?? '0.00'}</div>
                        <div className="stat-comparison">
                          <span className="stat-recent">{t('advertiser.dashboard.stats.ofAssigned')} ${stats.gasto.presupuestoTotal?.toFixed(2)} {t('advertiser.dashboard.stats.assigned')}</span>
                          {stats.gasto.porcentajeUsado >= 80 && (
                            <span className="stat-change negative">
                              ⚠️ {stats.gasto.porcentajeUsado}% {t('advertiser.dashboard.stats.used')}
                            </span>
                          )}
                        </div>
                        <div className="stat-subtitle">
                          {stats.gasto.disponible !== null && (
                            <>{t('advertiser.dashboard.stats.available')} ${stats.gasto.disponible.toFixed(2)}</>
                          )}
                        </div>
                        {stats.gasto.porcentajeUsado >= 90 && (
                          <div style={{ 
                            marginTop: '0.5rem', 
                            padding: '0.5rem', 
                            background: '#fee2e2', 
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            color: '#dc2626',
                            fontWeight: 600
                          }}>
                            {t('advertiser.dashboard.stats.budgetAlmostExhausted')}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="stat-value">{t('advertiser.dashboard.stats.noLimit')}</div>
                        <div className="stat-subtitle">{t('advertiser.dashboard.stats.noBudget')}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'ads' && (
          <div className="dashboard-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{t('advertiser.dashboard.ads.title')}</h2>
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${adsViewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setAdsViewMode('cards')}
                  title="Vista de tarjetas"
                >
                  {t('advertiser.dashboard.ads.cardsView')}
                </button>
                <button
                  className={`view-toggle-btn ${adsViewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setAdsViewMode('table')}
                  title="Vista de tabla"
                >
                  {t('advertiser.dashboard.ads.tableView')}
                </button>
              </div>
            </div>
            {ads.length === 0 ? (
              <div className="no-ads">
                <p>{t('advertiser.dashboard.ads.noAds')}</p>
                <button onClick={() => setView('newAd')}>{t('advertiser.dashboard.ads.createFirst')}</button>
              </div>
            ) : adsViewMode === 'table' ? (
              <div className="ads-table-container">
                <table className="ads-table">
                  <thead>
                    <tr>
                      <th>{t('advertiser.dashboard.ads.table.ad')}</th>
                      <th>{t('advertiser.dashboard.ads.table.status')}</th>
                      <th>{t('advertiser.dashboard.ads.table.locations')}</th>
                      <th>{t('advertiser.dashboard.ads.table.budget')}</th>
                      <th>{t('advertiser.dashboard.ads.table.impressions')}</th>
                      <th>{t('advertiser.dashboard.ads.table.clicks')}</th>
                      <th>{t('advertiser.dashboard.ads.table.ctr')}</th>
                      <th>{t('advertiser.dashboard.ads.table.spend')}</th>
                      <th>{t('advertiser.dashboard.ads.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map(ad => (
                      <tr key={ad.id}>
                        <td>
                          <div className="table-ad-info">
                            <strong>{ad.titulo}</strong>
                            {ad.descripcion_corta && (
                              <small>{ad.descripcion_corta}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`table-status ${ad.activo ? 'active' : 'inactive'}`}>
                            {ad.activo ? t('advertiser.dashboard.ads.table.active') : t('advertiser.dashboard.ads.table.inactive')}
                          </span>
                        </td>
                        <td>
                          {ad.ubicacion_display && Array.isArray(ad.ubicacion_display) && ad.ubicacion_display.length > 0 ? (
                            <div className="table-locations">
                              {ad.ubicacion_display.map((loc, idx) => {
                                const labels = {
                                  'portal_top': t('advertiser.dashboard.ads.locations.portalTop'),
                                  'portal_card': t('advertiser.dashboard.ads.locations.portalCard'),
                                  'landing_inline': t('advertiser.dashboard.ads.locations.landingInline'),
                                  'dashboard_banner': t('advertiser.dashboard.ads.locations.dashboardBanner')
                                };
                                return (
                                  <span key={idx} className="table-location-badge">
                                    {labels[loc] || loc}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div className="table-budget">
                            <span className="table-amount">${ad.presupuesto_mensual || 0}</span>
                            {ad.stats?.gasto?.presupuesto > 0 && (
                              <div className="table-progress-mini">
                                <div 
                                  className="table-progress-fill"
                                  style={{
                                    width: `${Math.min(parseFloat(ad.stats.gasto.porcentajeUsado) || 0, 100)}%`,
                                    background: parseFloat(ad.stats.gasto.porcentajeUsado) >= 90 
                                      ? '#ef4444' 
                                      : parseFloat(ad.stats.gasto.porcentajeUsado) >= 80 
                                      ? '#f59e0b' 
                                      : '#10b981'
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="table-metric">{ad.stats?.impressions || 0}</span>
                        </td>
                        <td>
                          <span className="table-metric">{ad.stats?.clicks || 0}</span>
                        </td>
                        <td>
                          <span className="table-metric table-ctr">{ad.stats?.ctr || '0.00'}%</span>
                        </td>
                        <td>
                          <span className="table-metric">
                            ${ad.stats?.gasto?.mensual?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button 
                              onClick={() => handleViewClicks(ad.id)} 
                              className="table-action-btn table-action-primary"
                              title={t('advertiser.dashboard.ads.table.viewClicks')}
                            >
                              📊
                            </button>
                            <button 
                              onClick={() => handleEditAd(ad)} 
                              className="table-action-btn"
                              title={t('advertiser.dashboard.ads.table.edit')}
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleToggleAd(ad.id)} 
                              className="table-action-btn"
                              title={ad.activo ? t('advertiser.dashboard.ads.table.deactivate') : t('advertiser.dashboard.ads.table.activate')}
                            >
                              {ad.activo ? '⏸️' : '▶️'}
                            </button>
                            <button 
                              onClick={() => handleDeleteAd(ad.id)} 
                              className="table-action-btn table-action-danger"
                              title={t('advertiser.dashboard.ads.table.delete')}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ads-list">
                {ads.map(ad => (
                  <div key={ad.id} className="ad-card">
                    <div className="ad-header">
                      <h3>{ad.titulo}</h3>
                      <span className={`ad-status ${ad.activo ? 'active' : 'inactive'}`}>
                        {ad.activo ? t('advertiser.dashboard.ads.table.active') : t('advertiser.dashboard.ads.table.inactive')}
                      </span>
                    </div>
                    <p>{ad.descripcion_corta}</p>
                    {ad.ubicacion_display && Array.isArray(ad.ubicacion_display) && ad.ubicacion_display.length > 0 && (
                      <div className="ad-locations" style={{ 
                        marginTop: '0.5rem', 
                        marginBottom: '0.5rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{t('advertiser.dashboard.ads.card.locations')}</span>
                        {ad.ubicacion_display.map((loc, idx) => {
                          const labels = {
                            'portal_top': t('advertiser.dashboard.ads.locations.portalTop'),
                            'portal_card': t('advertiser.dashboard.ads.locations.portalCard'),
                            'landing_inline': t('advertiser.dashboard.ads.locations.landingInline'),
                            'dashboard_banner': t('advertiser.dashboard.ads.locations.dashboardBanner')
                          };
                          return (
                            <span 
                              key={idx}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.25rem 0.75rem',
                                background: '#e0e7ff',
                                color: '#1e22aa',
                                borderRadius: '12px',
                                fontWeight: 500
                              }}
                            >
                              {labels[loc] || loc}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className="ad-meta">
                      <span>💰 ${ad.presupuesto_mensual || 0}</span>
                    </div>
                    
                    {/* Estadísticas por anuncio */}
                    {ad.stats && (
                      <div className="ad-stats">
                        <div className="ad-stat-item">
                          <span className="ad-stat-label">{t('advertiser.dashboard.ads.card.model')}</span>
                          <span className="ad-stat-value" style={{ fontSize: '0.85rem' }}>
                            {ad.stats.modelo === 'HYBRID' ? t('advertiser.dashboard.ads.card.hybrid') : 
                             ad.stats.modelo === 'CPM' ? t('advertiser.dashboard.ads.card.cpm') : 
                             t('advertiser.dashboard.ads.card.cpc')}
                          </span>
                        </div>
                        {(ad.stats.modelo === 'HYBRID' || ad.stats.modelo === 'CPM') && (
                          <div className="ad-stat-item">
                            <span className="ad-stat-label">CPM:</span>
                            <span className="ad-stat-value" style={{ fontSize: '0.85rem' }}>
                              ${ad.stats.costoPorMil?.toFixed(2) || '2.00'}/1k
                            </span>
                          </div>
                        )}
                        {(ad.stats.modelo === 'HYBRID' || ad.stats.modelo === 'CPC') && (
                          <div className="ad-stat-item">
                            <span className="ad-stat-label">CPC:</span>
                            <span className="ad-stat-value" style={{ fontSize: '0.85rem' }}>
                              ${ad.stats.costoPorClick?.toFixed(2) || '0.50'}
                            </span>
                          </div>
                        )}
                        <div className="ad-stat-item">
                          <span className="ad-stat-label">{t('advertiser.dashboard.ads.card.impressions')}</span>
                          <span className="ad-stat-value">{ad.stats.impressions || 0}</span>
                        </div>
                        <div className="ad-stat-item">
                          <span className="ad-stat-label">{t('advertiser.dashboard.ads.card.clicks')}</span>
                          <span className="ad-stat-value">{ad.stats.clicks || 0}</span>
                        </div>
                        <div className="ad-stat-item">
                          <span className="ad-stat-label">{t('advertiser.dashboard.ads.card.ctr')}</span>
                          <span className="ad-stat-value">{ad.stats.ctr || '0.00'}%</span>
                        </div>
                        {ad.stats.gasto && ad.stats.gasto.presupuesto > 0 && (
                          <>
                            <div className="ad-stat-item">
                              <span className="ad-stat-label">{t('advertiser.dashboard.ads.card.spend')}</span>
                              <span className={`ad-stat-value ${ad.stats.gasto.cercaDelLimite ? 'stat-warning' : ''}`}>
                                ${ad.stats.gasto.mensual?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            <div className="ad-stat-item" style={{ width: '100%', marginTop: '0.5rem' }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '0.25rem'
                              }}>
                                <span className="ad-stat-label">{t('advertiser.dashboard.ads.card.budget')}</span>
                                <span className="ad-stat-value" style={{ fontSize: '0.9rem' }}>
                                  {ad.stats.gasto.porcentajeUsado}% {t('advertiser.dashboard.ads.card.used')}
                                </span>
                              </div>
                              <div style={{
                                width: '100%',
                                height: '8px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${Math.min(parseFloat(ad.stats.gasto.porcentajeUsado) || 0, 100)}%`,
                                  height: '100%',
                                  background: parseFloat(ad.stats.gasto.porcentajeUsado) >= 90 
                                    ? '#ef4444' 
                                    : parseFloat(ad.stats.gasto.porcentajeUsado) >= 80 
                                    ? '#f59e0b' 
                                    : '#10b981',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              {ad.stats.gasto.cercaDelLimite && (
                                <div style={{ 
                                  marginTop: '0.25rem',
                                  fontSize: '0.75rem',
                                  color: '#f59e0b',
                                  fontWeight: 600
                                }}>
                                  ⚠️ {ad.stats.gasto.disponible !== null && ad.stats.gasto.disponible > 0 
                                    ? `${t('advertiser.dashboard.ads.card.remaining')} $${ad.stats.gasto.disponible.toFixed(2)}` 
                                    : t('advertiser.dashboard.ads.card.budgetExhausted')}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="ad-actions">
                      <button onClick={() => handleViewClicks(ad.id)} className="btn-view-clicks">
                        {t('advertiser.dashboard.ads.card.viewClicks')}
                      </button>
                      <button onClick={() => handleEditAd(ad)}>{t('advertiser.dashboard.ads.card.edit')}</button>
                      <button onClick={() => handleToggleAd(ad.id)}>
                        {ad.activo ? t('advertiser.dashboard.ads.card.deactivate') : t('advertiser.dashboard.ads.card.activate')}
                      </button>
                      <button onClick={() => handleDeleteAd(ad.id)} className="delete">
                        {t('advertiser.dashboard.ads.card.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'newAd' && (
          <div className="dashboard-content">
            <h2>{editingAd ? t('advertiser.dashboard.adForm.edit') : t('advertiser.dashboard.adForm.new')}</h2>
            <form className="ad-form" onSubmit={handleSaveAd}>
              <div className="form-group">
                <label>{t('advertiser.dashboard.adForm.title')}</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  required
                  maxLength={120}
                />
              </div>

              <div className="form-group">
                <label>{t('advertiser.dashboard.adForm.shortDescription')}</label>
                <textarea
                  value={formData.descripcion_corta}
                  onChange={(e) => setFormData({...formData, descripcion_corta: e.target.value})}
                  maxLength={180}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('advertiser.dashboard.adForm.destinationUrl')}</label>
                  <input
                    type="url"
                    value={formData.url_destino}
                    onChange={(e) => setFormData({...formData, url_destino: e.target.value})}
                    required
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>{t('advertiser.dashboard.adForm.imageUrl')}</label>
                  <input
                    type="url"
                    value={formData.imagen_url}
                    onChange={(e) => setFormData({...formData, imagen_url: e.target.value})}
                    placeholder={t('advertiser.dashboard.adForm.imageUrlPlaceholder')}
                  />
                  <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    {t('advertiser.dashboard.adForm.imageUrlWarning')}
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('advertiser.dashboard.adForm.displayLocations')}</label>
                  <div className="checkbox-group">
                    {[
                      { value: 'portal_top', label: t('advertiser.dashboard.ads.locations.portalTop') },
                      { value: 'portal_card', label: t('advertiser.dashboard.ads.locations.portalCard') },
                      { value: 'landing_inline', label: t('advertiser.dashboard.ads.locations.landingInline') },
                      { value: 'dashboard_banner', label: t('advertiser.dashboard.ads.locations.dashboardBanner') },
                      { value: 'sponsored_business', label: t('advertiser.dashboard.ads.locations.sponsoredBusiness') }
                    ].map(option => (
                      <label key={option.value} className="checkbox-label">
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={(formData.ubicacion_display || []).includes(option.value)}
                          onChange={(e) => {
                            const current = formData.ubicacion_display || [];
                            if (e.target.checked) {
                              setFormData({...formData, ubicacion_display: [...current, option.value]});
                            } else {
                              setFormData({...formData, ubicacion_display: current.filter(v => v !== option.value)});
                            }
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {(!formData.ubicacion_display || formData.ubicacion_display.length === 0) && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem' }}>
                      {t('advertiser.dashboard.adForm.mustSelectLocation')}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>{t('advertiser.dashboard.adForm.category')}</label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('advertiser.dashboard.adForm.monthlyBudget')}</label>
                <input
                  type="number"
                  value={formData.presupuesto_mensual}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = parseFloat(value) || 0;
                    // Validar que no exceda los créditos disponibles
                    if (numValue > 0 && numValue > credits.credito_actual) {
                      showWarning(
                        t('advertiser.dashboard.adForm.validation.budgetExceeded', { amount: credits.credito_actual?.toFixed(2) || '0.00' }),
                        t('advertiser.dashboard.adForm.validation.limitExceeded')
                      );
                      return;
                    }
                    setFormData({...formData, presupuesto_mensual: value});
                  }}
                  min="0"
                  max={credits.credito_actual || 0}
                  step="0.01"
                  placeholder={`${t('advertiser.dashboard.adForm.monthlyBudgetPlaceholder')} $${credits.credito_actual?.toFixed(2) || '0.00'}`}
                  required
                />
                <small style={{ 
                  color: '#64748b', 
                  fontSize: '0.85rem', 
                  display: 'block', 
                  marginTop: '0.5rem',
                  lineHeight: '1.5'
                }}>
                  {t('advertiser.dashboard.adForm.monthlyBudgetTip1')}<br/>
                  {t('advertiser.dashboard.adForm.monthlyBudgetTip2')}<br/>
                  {t('advertiser.dashboard.adForm.monthlyBudgetTip3')} (${credits.credito_actual?.toFixed(2) || '0.00'} USD)<br/>
                  {t('advertiser.dashboard.adForm.monthlyBudgetTip4')}<br/>
                  {t('advertiser.dashboard.adForm.monthlyBudgetTip5')}<br/>
                  {t('advertiser.dashboard.adForm.monthlyBudgetTip6')}<br/>
                  {t('advertiser.dashboard.adForm.monthlyBudgetTip7')}
                </small>
                <small style={{ 
                  color: '#64748b', 
                  fontSize: '0.85rem', 
                  display: 'block', 
                  marginTop: '0.5rem',
                  lineHeight: '1.5'
                }}>
                  {t('advertiser.dashboard.adForm.pricingInfo')}<br/>
                  {t('advertiser.dashboard.adForm.pricingInfo1')}<br/>
                  {t('advertiser.dashboard.adForm.pricingInfo2')}<br/>
                  {t('advertiser.dashboard.adForm.pricingInfo3')}
                </small>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingAd ? t('advertiser.dashboard.adForm.save') : t('advertiser.dashboard.adForm.create')}
                </button>
                <button type="button" onClick={() => { setView('ads'); setEditingAd(null); }}>
                  {t('advertiser.dashboard.adForm.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vista de Cupones */}
        {view === 'cupones' && (
          <div className="dashboard-content">
            <div className="dashboard-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>{t('advertiser.dashboard.coupons.title')}</h2>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setView('newCupon');
                    setEditingCupon(null);
                    setCuponFormData({
                      codigo: '',
                      titulo: '',
                      descripcion: '',
                      descuento_tipo: 'porcentaje',
                      descuento_valor: '',
                      monto_minimo: '',
                      fecha_inicio: '',
                      fecha_fin: '',
                      usos_maximos: '',
                      imagen_url: ''
                    });
                  }}
                >
                  {t('advertiser.dashboard.coupons.create')}
                </button>
              </div>

              {cupones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎟️</div>
                  <p>{t('advertiser.dashboard.coupons.noCoupons')}</p>
                  <p>{t('advertiser.dashboard.coupons.createFirst')}</p>
                </div>
              ) : (
                <div className="cupones-grid">
                  {cupones.map(cupon => {
                    const hoy = new Date();
                    const fechaInicio = new Date(cupon.fecha_inicio);
                    const fechaFin = new Date(cupon.fecha_fin);
                    const activo = cupon.activo && hoy >= fechaInicio && hoy <= fechaFin;
                    const agotado = cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos;
                    
                    return (
                      <div key={cupon.id} className={`cupon-card ${!activo ? 'inactivo' : ''} ${agotado ? 'agotado' : ''}`}>
                        <div className="cupon-card-header">
                          <div className="cupon-codigo">{cupon.codigo}</div>
                          <div className="cupon-status">
                            {agotado ? (
                              <span className="status-badge agotado">{t('advertiser.dashboard.coupons.status.exhausted')}</span>
                            ) : activo ? (
                              <span className="status-badge activo">{t('advertiser.dashboard.coupons.status.active')}</span>
                            ) : (
                              <span className="status-badge inactivo">{t('advertiser.dashboard.coupons.status.inactive')}</span>
                            )}
                          </div>
                        </div>
                        <div className="cupon-card-body">
                          <h3 className="cupon-titulo">{cupon.titulo}</h3>
                          {cupon.descripcion && (
                            <p className="cupon-descripcion">{cupon.descripcion}</p>
                          )}
                          <div className="cupon-descuento">
                            {cupon.descuento_tipo === 'porcentaje' ? (
                              <span className="descuento-valor">{cupon.descuento_valor}% OFF</span>
                            ) : (
                              <span className="descuento-valor">${cupon.descuento_valor} OFF</span>
                            )}
                          </div>
                          <div className="cupon-info">
                            <div className="info-item">
                              <span className="info-label">{t('advertiser.dashboard.coupons.valid')}</span>
                              <span className="info-value">
                                {new Date(cupon.fecha_inicio).toLocaleDateString('es-MX')} - {new Date(cupon.fecha_fin).toLocaleDateString('es-MX')}
                              </span>
                            </div>
                            {cupon.monto_minimo > 0 && (
                              <div className="info-item">
                                <span className="info-label">{t('advertiser.dashboard.coupons.minimum')}</span>
                                <span className="info-value">${cupon.monto_minimo}</span>
                              </div>
                            )}
                            <div className="info-item">
                              <span className="info-label">{t('advertiser.dashboard.coupons.uses')}</span>
                              <span className="info-value">
                                {cupon.usos_actuales || 0} / {cupon.usos_maximos || '∞'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="cupon-card-actions">
                          <button
                            className="btn-action"
                            onClick={() => {
                              setEditingCupon(cupon);
                              setCuponFormData({
                                codigo: cupon.codigo,
                                titulo: cupon.titulo,
                                descripcion: cupon.descripcion || '',
                                descuento_tipo: cupon.descuento_tipo,
                                descuento_valor: cupon.descuento_valor,
                                monto_minimo: cupon.monto_minimo || '',
                                fecha_inicio: cupon.fecha_inicio,
                                fecha_fin: cupon.fecha_fin,
                                usos_maximos: cupon.usos_maximos || '',
                                imagen_url: cupon.imagen_url || ''
                              });
                              setView('editCupon');
                            }}
                          >
                            {t('advertiser.dashboard.coupons.edit')}
                          </button>
                          <button
                            className="btn-action btn-danger"
                            onClick={async () => {
                              const confirmed = await showDangerConfirm(
                                t('advertiser.dashboard.coupons.delete'),
                                `${t('advertiser.dashboard.coupons.deleteConfirm')} "${cupon.codigo}"?`,
                                {
                                  confirmText: t('advertiser.dashboard.coupons.delete'),
                                  cancelText: t('advertiser.dashboard.credits.cancel')
                                }
                              );
                              if (confirmed) {
                                const token = localStorage.getItem('advertiserToken');
                                try {
                                  const res = await fetch(`${API_BASE}/advertisers/cupones/${cupon.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  if (res.ok) {
                                    showSuccess('Cupón eliminado correctamente', 'Éxito');
                                    loadCupones();
                                  } else {
                                    const data = await res.json();
                                    showError(data.error || 'Error eliminando cupón', 'Error');
                                  }
                                } catch (e) {
                                  showError('Error eliminando cupón', 'Error');
                                }
                              }
                            }}
                          >
                            {t('advertiser.dashboard.coupons.delete')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulario de Crear/Editar Cupón */}
        {(view === 'newCupon' || view === 'editCupon') && (
          <div className="dashboard-content">
            <div className="dashboard-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>{editingCupon ? t('advertiser.dashboard.coupons.form.edit') : t('advertiser.dashboard.coupons.form.new')}</h2>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setView('cupones');
                    setEditingCupon(null);
                  }}
                >
                  {t('advertiser.dashboard.coupons.form.back')}
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const token = localStorage.getItem('advertiserToken');
                  if (!token) return;

                  try {
                    const url = editingCupon
                      ? `${API_BASE}/advertisers/cupones/${editingCupon.id}`
                      : `${API_BASE}/advertisers/cupones`;
                    const method = editingCupon ? 'PUT' : 'POST';

                    const res = await fetch(url, {
                      method,
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(cuponFormData)
                    });

                    const data = await res.json();
                    if (res.ok) {
                      showSuccess(editingCupon ? 'Cupón actualizado correctamente' : 'Cupón creado correctamente', 'Éxito');
                      setView('cupones');
                      setEditingCupon(null);
                      loadCupones();
                    } else {
                      showError(data.error || 'Error guardando cupón', 'Error');
                    }
                  } catch (e) {
                    showError('Error guardando cupón', 'Error');
                  }
                }}
              >
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('advertiser.dashboard.coupons.form.code')}</label>
                    <input
                      type="text"
                      value={cuponFormData.codigo}
                      onChange={(e) => setCuponFormData({...cuponFormData, codigo: e.target.value.toUpperCase()})}
                      placeholder={t('advertiser.dashboard.coupons.form.codePlaceholder')}
                      required
                      maxLength="50"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('advertiser.dashboard.coupons.form.title')}</label>
                    <input
                      type="text"
                      value={cuponFormData.titulo}
                      onChange={(e) => setCuponFormData({...cuponFormData, titulo: e.target.value})}
                      placeholder={t('advertiser.dashboard.coupons.form.titlePlaceholder')}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('advertiser.dashboard.coupons.form.description')}</label>
                  <textarea
                    value={cuponFormData.descripcion}
                    onChange={(e) => setCuponFormData({...cuponFormData, descripcion: e.target.value})}
                    placeholder={t('advertiser.dashboard.coupons.form.descriptionPlaceholder')}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('advertiser.dashboard.coupons.form.discountType')}</label>
                    <select
                      value={cuponFormData.descuento_tipo}
                      onChange={(e) => setCuponFormData({...cuponFormData, descuento_tipo: e.target.value})}
                      required
                    >
                      <option value="porcentaje">{t('advertiser.dashboard.coupons.form.percentage')}</option>
                      <option value="fijo">{t('advertiser.dashboard.coupons.form.fixed')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('advertiser.dashboard.coupons.form.discountValue')}</label>
                    <input
                      type="number"
                      value={cuponFormData.descuento_valor}
                      onChange={(e) => setCuponFormData({...cuponFormData, descuento_valor: e.target.value})}
                      placeholder={t('advertiser.dashboard.coupons.form.discountValuePlaceholder')}
                      required
                      min="0"
                      max={cuponFormData.descuento_tipo === 'porcentaje' ? '100' : undefined}
                      step="0.01"
                    />
                    <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                      {cuponFormData.descuento_tipo === 'porcentaje' 
                        ? t('advertiser.dashboard.coupons.form.percentageHint')
                        : t('advertiser.dashboard.coupons.form.fixedHint')}
                    </small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('advertiser.dashboard.coupons.form.minimumAmount')}</label>
                    <input
                      type="number"
                      value={cuponFormData.monto_minimo}
                      onChange={(e) => setCuponFormData({...cuponFormData, monto_minimo: e.target.value})}
                      placeholder={t('advertiser.dashboard.coupons.form.minimumAmountPlaceholder')}
                      min="0"
                      step="0.01"
                    />
                    <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                      {t('advertiser.dashboard.coupons.form.minimumAmountHint')}
                    </small>
                  </div>
                  <div className="form-group">
                    <label>{t('advertiser.dashboard.coupons.form.maxUses')}</label>
                    <input
                      type="number"
                      value={cuponFormData.usos_maximos}
                      onChange={(e) => setCuponFormData({...cuponFormData, usos_maximos: e.target.value})}
                      placeholder={t('advertiser.dashboard.coupons.form.maxUsesPlaceholder')}
                      min="1"
                    />
                    <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                      {t('advertiser.dashboard.coupons.form.maxUsesHint')}
                    </small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('advertiser.dashboard.coupons.form.startDate')}</label>
                    <input
                      type="date"
                      value={cuponFormData.fecha_inicio}
                      onChange={(e) => setCuponFormData({...cuponFormData, fecha_inicio: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('advertiser.dashboard.coupons.form.endDate')}</label>
                    <input
                      type="date"
                      value={cuponFormData.fecha_fin}
                      onChange={(e) => setCuponFormData({...cuponFormData, fecha_fin: e.target.value})}
                      required
                      min={cuponFormData.fecha_inicio}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('advertiser.dashboard.coupons.form.imageUrl')}</label>
                  <input
                    type="url"
                    value={cuponFormData.imagen_url}
                    onChange={(e) => setCuponFormData({...cuponFormData, imagen_url: e.target.value})}
                    placeholder={t('advertiser.dashboard.coupons.form.imageUrlPlaceholder')}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="submit" className="btn-primary">
                    {editingCupon ? t('advertiser.dashboard.coupons.form.update') : t('advertiser.dashboard.coupons.form.save')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setView('cupones');
                      setEditingCupon(null);
                    }}
                  >
                    {t('advertiser.dashboard.adForm.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de Perfil de Negocio */}
      {advertiserProfile && (
        <BusinessProfileModal
          isOpen={showBusinessProfileModal}
          onClose={() => setShowBusinessProfileModal(false)}
          advertiserId={advertiserProfile.id}
        />
      )}
    </div>
  );
};

export default AdvertiserDashboard;

