import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const ParticipanteView = () => {
  const { rifaId, participanteId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/participantes/${rifaId}/participante/${participanteId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error cargando datos');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error cargando datos del participante:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (rifaId && participanteId) {
      cargarDatos();
    }
  }, [rifaId, participanteId]);

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando tus datos...</p>
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

  if (!data) {
    return (
      <div className="error-container">
        <h2>❌ No se encontraron datos</h2>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    );
  }

  const { rifa, participante, estadisticas } = data;
  const diasRestantes = calcularDiasRestantes(rifa.fecha_fin);

  return (
    <div className="participante-view">
      <div className="container">
        {/* Header */}
        <div className="participante-header">
          <button 
            onClick={() => navigate('/')} 
            className="btn-back"
          >
            ← Regresar a las Rifas
          </button>
          <h1>🎫 Tus Números de la Rifa</h1>
        </div>

        {/* Información de la Rifa */}
        <div className="rifa-info-card">
          <div className="rifa-header">
            <h2>{rifa.nombre}</h2>
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
              <span className="label">Creador:</span>
              <span className="value">{rifa.creador_nombre}</span>
            </div>
          </div>
        </div>

        {/* Tus Números */}
        <div className="mis-numeros-card">
          <h3>🎯 Tus Elementos Seleccionados</h3>
          <div className="numeros-grid">
            {participante.numeros_seleccionados.map((numero, index) => (
              <div key={index} className="numero-seleccionado">
                {numero}
              </div>
            ))}
          </div>
          <div className="resumen-participacion">
            <p><strong>Total de elementos:</strong> {participante.numeros_seleccionados.length}</p>
            <p><strong>Total pagado:</strong> ${participante.total_pagado}</p>
            <p><strong>Fecha de participación:</strong> {new Date(participante.fecha_participacion).toLocaleDateString('es-MX')}</p>
          </div>
        </div>

        {/* Estadísticas Generales (sin datos confidenciales) */}
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
              {rifa.metodo_sorteo && (
                <div className="detail-item">
                  <span className="label">Método:</span>
                  <span className="value">{rifa.metodo_sorteo}</span>
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
      </div>
    </div>
  );
};

export default ParticipanteView;
