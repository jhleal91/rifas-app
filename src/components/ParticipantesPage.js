import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { showSuccess, showError, showConfirm } from '../utils/swal';

const ParticipantesPage = () => {
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
  }, [id]);

  const cargarDatosRifa = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/rifas/${id}`, {
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
      const response = await fetch(`http://localhost:5001/api/participantes/${id}/confirmar-venta`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participanteId })
      });

      if (response.ok) {
        await cargarDatosRifa(); // Recargar datos
        await showSuccess('Venta confirmada', 'La venta se confirmó exitosamente.');
      } else {
        const error = await response.json();
        showError('Error', error.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error', 'Error al confirmar la venta. Por favor, intenta nuevamente.');
    }
  };

  const rechazarPago = async (participanteId) => {
    const confirmed = await showConfirm(
      'Rechazar Pago',
      '¿Estás seguro de que quieres rechazar este pago? Los números se liberarán.',
      {
        confirmText: 'Sí, rechazar',
        cancelText: 'Cancelar',
        icon: 'warning',
        confirmColor: '#ef4444'
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/participantes/${participanteId}/rechazar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await cargarDatosRifa(); // Recargar datos
        await showSuccess('Pago rechazado', 'El pago fue rechazado y los números fueron liberados.');
      } else {
        const error = await response.json();
        showError('Error', error.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error', 'Error al rechazar el pago. Por favor, intenta nuevamente.');
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
          <p>Cargando participantes...</p>
        </div>
      </div>
    );
  }

  if (!rifa) {
    return (
      <div className="participantes-page">
        <div className="error-container">
          <h2>Rifa no encontrada</h2>
          <Link to="/dashboard" className="btn-primary">Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="participantes-page">
      <div className="page-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>›</span>
            <Link to={`/gestionar/${id}`}>Gestionar Rifa</Link>
            <span>›</span>
            <span>Participantes</span>
          </div>
          <h1>👥 Participantes - {rifa.nombre}</h1>
          <p className="page-description">
            Gestiona todos los participantes de esta rifa
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{participantes.length}</div>
            <div className="stat-label">Total Participantes</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">
              {participantes.filter(p => !p.estado || p.estado === 'pendiente').length}
            </div>
            <div className="stat-label">Pendientes</div>
          </div>
          <div className="stat-card confirmed">
            <div className="stat-number">
              {participantes.filter(p => p.estado === 'confirmado').length}
            </div>
            <div className="stat-label">Confirmados</div>
          </div>
          <div className="stat-card revenue">
            <div className="stat-number">
              ${participantes.reduce((sum, p) => sum + (parseFloat(p.total_pagado) || 0), 0).toFixed(2)}
            </div>
            <div className="stat-label">Total Recaudado</div>
          </div>
        </div>

        {/* Filtros y controles */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Buscar por nombre:</label>
              <input
                type="text"
                placeholder="Nombre del participante..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Estado:</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmado">Confirmados</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Ordenar por:</label>
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
                className="filter-select"
              >
                <option value="fecha">Fecha (más reciente)</option>
                <option value="nombre">Nombre (A-Z)</option>
                <option value="total">Total (mayor a menor)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de participantes */}
        <div className="table-container">
          <table className="participantes-table">
            <thead>
              <tr>
                <th>Participante</th>
                <th>Números</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {participantesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    {filtroNombre || filtroEstado !== 'todos' 
                      ? 'No se encontraron participantes con los filtros aplicados'
                      : 'No hay participantes registrados'
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
                          'No especificados'
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
                        {participante.estado === 'confirmado' ? '✅ Confirmado' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td>
                      {(!participante.estado || participante.estado === 'pendiente') ? (
                        <div className="action-buttons">
                          <button
                            className="btn-confirm-small"
                            onClick={() => confirmarVenta(participante.id)}
                            title="Confirmar venta"
                          >
                            ✅
                          </button>
                          <button
                            className="btn-reject-small"
                            onClick={() => rechazarPago(participante.id)}
                            title="Rechazar pago"
                          >
                            ❌
                          </button>
                        </div>
                      ) : (
                        <span className="no-actions">-</span>
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
