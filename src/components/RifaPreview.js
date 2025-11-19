import React, { useState, useEffect } from 'react';
import { showSuccess, showError } from '../utils/swal';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const RifaPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rifa, setRifa] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showParticipateModal, setShowParticipateModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [participantData, setParticipantData] = useState({
    nombre: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    const cargarRifa = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/rifas/preview/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error cargando rifa');
        }

        const data = await response.json();
        setRifa(data.rifa);
        setEstadisticas(data.estadisticas);
      } catch (err) {
        console.error('Error cargando rifa:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarRifa();
    }
  }, [id]);

  const obtenerNombreTipo = (tipo) => {
    const tipos = {
      'numeros': 'Números',
      'abecedario': 'Abecedario',
      'baraja': 'Baraja',
      'colores': 'Colores',
      'equipos': 'Equipos Deportivos'
    };
    return tipos[tipo] || 'Números';
  };

  const calcularDiasRestantes = (fechaFin) => {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diffTime = fin - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleParticipate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/participantes/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(participantData)
      });

      if (response.ok) {
        await showSuccess('¡Registro exitoso!', 'Ahora puedes participar en esta rifa.');
        navigate(`/participar/${id}`);
      } else {
        const errorData = await response.json();
        showError('Error al registrarse', errorData.error || 'Ocurrió un error al registrarse');
      }
    } catch (error) {
      console.error('Error registrando participante:', error);
      showError('Error de conexión', 'Error al conectarse con el servidor. Por favor, intenta nuevamente.');
    }
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando rifa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    );
  }

  if (!rifa) {
    return (
      <div className="error-container">
        <h2>❌ Rifa no encontrada</h2>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    );
  }

  const diasRestantes = calcularDiasRestantes(rifa.fecha_fin);

  return (
    <div className="rifa-preview">
      <div className="container">
        {/* Header */}
        <div className="preview-header">
          <button 
            onClick={() => navigate('/')} 
            className="btn-back"
          >
            ← Volver al inicio
          </button>
          <div className="preview-badge">
            <span className="badge-icon">👁️</span>
            <span>Vista Previa</span>
          </div>
        </div>

        {/* Información de la Rifa */}
        <div className="rifa-info-card">
          <div className="rifa-header">
            <h1>{rifa.nombre}</h1>
            <span className="rifa-tipo">{obtenerNombreTipo(rifa.tipo)}</span>
          </div>
          
          {rifa.descripcion && (
            <p className="rifa-descripcion">{rifa.descripcion}</p>
          )}

          <div className="rifa-details">
            <div className="detail-item">
              <span className="label">Precio por elemento:</span>
              <span className="value">${rifa.precio}</span>
            </div>
            <div className="detail-item">
              <span className="label">Fecha límite:</span>
              <span className="value">{new Date(rifa.fecha_fin).toLocaleDateString('es-MX')}</span>
            </div>
            <div className="detail-item">
              <span className="label">Días restantes:</span>
              <span className={`value ${diasRestantes <= 3 ? 'urgent' : ''}`}>
                {diasRestantes} días
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Organizador:</span>
              <span className="value">{rifa.creador_nombre}</span>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="estadisticas-card">
          <h3>📊 Estado de la Rifa</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{estadisticas.elementos_vendidos}</span>
              <span className="stat-label">Vendidos</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{estadisticas.elementos_disponibles}</span>
              <span className="stat-label">Disponibles</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{estadisticas.total_participantes}</span>
              <span className="stat-label">Participantes</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">${estadisticas.total_recaudado}</span>
              <span className="stat-label">Recaudado</span>
            </div>
          </div>
        </div>

        {/* Elementos de la Rifa */}
        <div className="elementos-card">
          <h3>🎯 Elementos de la Rifa</h3>
          <div className="elementos-grid">
            {rifa.elementos_personalizados.map((elemento, index) => {
              const vendido = rifa.numerosVendidos.includes(String(elemento));
              const reservado = rifa.numerosReservados.includes(String(elemento));
              
              return (
                <div 
                  key={index} 
                  className={`elemento ${vendido ? 'vendido' : reservado ? 'reservado' : 'disponible'}`}
                  title={vendido ? 'Vendido' : reservado ? 'Reservado' : 'Disponible'}
                >
                  {elemento}
                </div>
              );
            })}
          </div>
        </div>

        {/* Información del Sorteo */}
        {rifa.fecha_sorteo && (
          <div className="sorteo-info-card">
            <h3>🎲 Información del Sorteo</h3>
            <div className="sorteo-details">
              <div className="detail-item">
                <span className="label">Fecha del sorteo:</span>
                <span className="value">{new Date(rifa.fecha_sorteo).toLocaleDateString('es-MX')}</span>
              </div>
              {rifa.plataforma_transmision && (
                <div className="detail-item">
                  <span className="label">Plataforma:</span>
                  <span className="value">{rifa.plataforma_transmision}</span>
                </div>
              )}
              {rifa.enlace_transmision && (
                <div className="detail-item">
                  <span className="label">Enlace:</span>
                  <a href={rifa.enlace_transmision} target="_blank" rel="noopener noreferrer" className="value link">
                    Ver transmisión
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reglas */}
        {rifa.reglas && (
          <div className="reglas-card">
            <h3>📋 Reglas de la Rifa</h3>
            <p>{rifa.reglas}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="acciones-card">
          <h3>🎫 ¿Te interesa participar?</h3>
          <p>Regístrate para participar en esta rifa o contacta al organizador para comprar números directamente.</p>
          <div className="acciones-buttons">
            <button 
              className="btn-participate"
              onClick={() => setShowParticipateModal(true)}
            >
              <span className="btn-icon">👤</span>
              <span>Registrarse y Participar</span>
            </button>
            <button 
              className="btn-buy"
              onClick={() => setShowBuyModal(true)}
            >
              <span className="btn-icon">💳</span>
              <span>Comprar Directamente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Registro */}
      {showParticipateModal && (
        <div className="modal-overlay" onClick={() => setShowParticipateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrarse para Participar</h3>
              <button 
                className="modal-close"
                onClick={() => setShowParticipateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleParticipate} className="modal-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={participantData.nombre}
                  onChange={(e) => setParticipantData({...participantData, nombre: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={participantData.email}
                  onChange={(e) => setParticipantData({...participantData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={participantData.telefono}
                  onChange={(e) => setParticipantData({...participantData, telefono: e.target.value})}
                  required
                />
              </div>
              <div className="info-message">
                <p>📧 Con tu registro podrás participar en esta rifa y recibir notificaciones.</p>
              </div>
              <button type="submit" className="btn-primary">
                <span className="btn-icon">👤</span>
                <span>Registrarse y Participar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Compra */}
      {showBuyModal && (
        <div className="modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Comprar Números Directamente</h3>
              <button 
                className="modal-close"
                onClick={() => setShowBuyModal(false)}
              >
                ×
              </button>
            </div>
            <div className="buy-info">
              <p>Para comprar números directamente, contacta al organizador:</p>
              <div className="contact-info">
                <p><strong>Organizador:</strong> {rifa.creador_nombre}</p>
                <p><strong>Precio por número:</strong> ${rifa.precio}</p>
                <p><strong>Números disponibles:</strong> {estadisticas.elementos_disponibles}</p>
              </div>
              <div className="contact-actions">
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = `mailto:${rifa.creador_email}?subject=Interés en la rifa: ${rifa.nombre}`}
                >
                  <span className="btn-icon">📧</span>
                  <span>Enviar Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RifaPreview;
