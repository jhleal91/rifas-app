import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError, showConfirm } from '../utils/swal';
import { API_BASE } from '../config/api';

const ParticipantesPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [rifa, setRifa] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [ordenarPor, setOrdenarPor] = useState('fecha');

  // Funciones de formateo
  const formatearTelefono = (telefono) => {
    if (!telefono) return '';
    // Remover caracteres no numéricos
    const numeros = telefono.replace(/\D/g, '');
    // Formatear como (XXX) XXX-XXXX para números de 10 dígitos
    if (numeros.length === 10) {
      return `(${numeros.slice(0, 3)}) ${numeros.slice(3, 6)}-${numeros.slice(6)}`;
    }
    // Formatear como +X (XXX) XXX-XXXX para números de 11 dígitos
    if (numeros.length === 11) {
      return `+${numeros[0]} (${numeros.slice(1, 4)}) ${numeros.slice(4, 7)}-${numeros.slice(7)}`;
    }
    return telefono;
  };

  const formatearEmail = (email) => {
    if (!email) return '';
    return email.toLowerCase();
  };

  useEffect(() => {
    cargarDatosRifa();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarDatosRifa = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/rifas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRifa(data.rifa);
        setParticipantes(data.rifa.participantes || []);
      } else {
        console.error('Error al cargar datos de la rifa');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarVenta = async (participanteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/participantes/${id}/confirmar-venta`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participanteId })
      });

      if (response.ok) {
        await cargarDatosRifa(); // Recargar datos
        await showSuccess(t('participantesPage.alerts.confirmSuccess.title'), t('participantesPage.alerts.confirmSuccess.message'));
      } else {
        const error = await response.json();
        showError(t('participantesPage.alerts.confirmError.title'), error.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showError(t('participantesPage.alerts.confirmError.title'), t('participantesPage.alerts.confirmError.message'));
    }
  };

  const rechazarPago = async (participanteId) => {
    const confirmed = await showConfirm(
      t('participantesPage.alerts.rejectConfirm.title'),
      t('participantesPage.alerts.rejectConfirm.message'),
      {
        confirmText: t('participantesPage.alerts.rejectConfirm.confirm'),
        cancelText: t('participantesPage.alerts.rejectConfirm.cancel'),
        icon: 'warning',
        confirmColor: '#ef4444'
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/participantes/${participanteId}/rechazar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await cargarDatosRifa(); // Recargar datos
        await showSuccess(t('participantesPage.alerts.rejectSuccess.title'), t('participantesPage.alerts.rejectSuccess.message'));
      } else {
        const error = await response.json();
        showError(t('participantesPage.alerts.rejectError.title'), error.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showError(t('participantesPage.alerts.rejectError.title'), t('participantesPage.alerts.rejectError.message'));
    }
  };

  // Filtrar y ordenar participantes
  const participantesFiltrados = participantes
    .filter(participante => {
      const coincideNombre = participante.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
      const coincideEstado = filtroEstado === 'todos' || 
        (filtroEstado === 'pendiente' && (!participante.estado || participante.estado === 'pendiente')) ||
        (filtroEstado === 'confirmado' && participante.estado === 'confirmado');
      
      return coincideNombre && coincideEstado;
    })
    .sort((a, b) => {
      switch (ordenarPor) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'fecha':
          return new Date(b.fecha_participacion) - new Date(a.fecha_participacion);
        case 'total':
          return (parseFloat(b.total_pagado) || 0) - (parseFloat(a.total_pagado) || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="participantes-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('participantesPage.loading')}</p>
        </div>
      </div>
    );
  }

  if (!rifa) {
    return (
      <div className="participantes-page">
        <div className="error-container">
          <h2>{t('participantesPage.notFound.title')}</h2>
          <Link to="/dashboard" className="btn-primary">{t('participantesPage.notFound.backToDashboard')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="participantes-page">
      <div className="page-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to="/dashboard">{t('participantesPage.breadcrumb.dashboard')}</Link>
            <span>›</span>
            <Link to={`/gestionar/${id}`}>{t('participantesPage.breadcrumb.manageRaffle')}</Link>
            <span>›</span>
            <span>{t('participantesPage.breadcrumb.participants')}</span>
          </div>
          <h1>{t('participantesPage.header.title')} {rifa.nombre}</h1>
          <p className="page-description">
            {t('participantesPage.header.description')}
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{participantes.length}</div>
            <div className="stat-label">{t('participantesPage.stats.totalParticipants')}</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">
              {participantes.filter(p => !p.estado || p.estado === 'pendiente').length}
            </div>
            <div className="stat-label">{t('participantesPage.stats.pending')}</div>
          </div>
          <div className="stat-card confirmed">
            <div className="stat-number">
              {participantes.filter(p => p.estado === 'confirmado').length}
            </div>
            <div className="stat-label">{t('participantesPage.stats.confirmed')}</div>
          </div>
          <div className="stat-card revenue">
            <div className="stat-number">
              ${participantes.reduce((sum, p) => sum + (parseFloat(p.total_pagado) || 0), 0).toFixed(2)}
            </div>
            <div className="stat-label">{t('participantesPage.stats.totalCollected')}</div>
          </div>
        </div>

        {/* Filtros y controles */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>{t('participantesPage.filters.searchByName')}</label>
              <input
                type="text"
                placeholder={t('participantesPage.filters.searchPlaceholder')}
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label>{t('participantesPage.filters.state')}</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="filter-select"
              >
                <option value="todos">{t('participantesPage.filters.all')}</option>
                <option value="pendiente">{t('participantesPage.filters.pending')}</option>
                <option value="confirmado">{t('participantesPage.filters.confirmed')}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t('participantesPage.filters.sortBy')}</label>
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
                className="filter-select"
              >
                <option value="fecha">{t('participantesPage.filters.dateRecent')}</option>
                <option value="nombre">{t('participantesPage.filters.nameAZ')}</option>
                <option value="total">{t('participantesPage.filters.totalHighLow')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de participantes */}
        <div className="table-container">
          <table className="participantes-table">
            <thead>
              <tr>
                <th>{t('participantesPage.table.participant')}</th>
                <th>{t('participantesPage.table.numbers')}</th>
                <th>{t('participantesPage.table.total')}</th>
                <th>{t('participantesPage.table.date')}</th>
                <th>{t('participantesPage.table.state')}</th>
                <th>{t('participantesPage.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {participantesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    {filtroNombre || filtroEstado !== 'todos' 
                      ? t('participantesPage.table.noDataFiltered')
                      : t('participantesPage.table.noData')
                    }
                  </td>
                </tr>
              ) : (
                participantesFiltrados.map(participante => (
                  <tr key={participante.id} className={`participante-row ${participante.estado || 'pendiente'}`}>
                    <td>
                      <div className="participante-info">
                        <div className="participante-nombre">{participante.nombre}</div>
                        {participante.email && (
                          <div className="participante-email">{formatearEmail(participante.email)}</div>
                        )}
                        {participante.telefono && (
                          <div className="participante-telefono">
                            <span className="contact-icon">📞</span>
                            {formatearTelefono(participante.telefono)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="numeros-info">
                        {participante.numeros_seleccionados ? 
                          participante.numeros_seleccionados.join(', ') : 
                          t('participantesPage.table.notSpecified')
                        }
                      </div>
                    </td>
                    <td>
                      <div className="total-info">
                        ${participante.total_pagado || '0.00'}
                      </div>
                    </td>
                    <td>
                      <div className="fecha-info">
                        {new Date(participante.fecha_participacion).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className={`estado-badge ${participante.estado || 'pendiente'}`}>
                        {participante.estado === 'confirmado' ? t('participantesPage.status.confirmed') : t('participantesPage.status.pending')}
                      </span>
                    </td>
                    <td>
                      {(!participante.estado || participante.estado === 'pendiente') ? (
                        <div className="action-buttons">
                          <button
                            className="btn-confirm-small"
                            onClick={() => confirmarVenta(participante.id)}
                            title={t('participantesPage.actions.confirmSale')}
                          >
                            ✅
                          </button>
                          <button
                            className="btn-reject-small"
                            onClick={() => rechazarPago(participante.id)}
                            title={t('participantesPage.actions.rejectPayment')}
                          >
                            ❌
                          </button>
                        </div>
                      ) : (
                        <span className="no-actions">{t('participantesPage.table.noActions')}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParticipantesPage;
