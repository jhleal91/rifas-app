import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ActiveRifas = ({ rifas }) => {
  const [expandedCards, setExpandedCards] = useState({});

  // Función para calcular días restantes
  const calcularDiasRestantes = (fechaFin) => {
    if (!fechaFin) return null;
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diffTime = fin - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Función para alternar la expansión de una tarjeta
  const toggleExpansion = (rifaId) => {
    setExpandedCards(prev => ({
      ...prev,
      [rifaId]: !prev[rifaId]
    }));
  };

  if (rifas.length === 0) {
    return (
      <div className="lista-rifas">
        <h2>🎯 Rifas Activas</h2>
        <div className="no-rifas">
          <p>No hay rifas activas en este momento.</p>
          <p>¡Crea tu primera rifa para comenzar!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-rifas">
      <h2>🎯 Rifas Activas ({rifas.length})</h2>
      <div className="rifas-grid">
        {rifas.map(rifa => {
          const diasRestantes = calcularDiasRestantes(rifa.fechaFin);
          const isExpanded = expandedCards[rifa.id];
          const totalElementos = rifa.numerosDisponibles ? rifa.numerosDisponibles.length : 0;
          const vendidos = rifa.elementos_vendidos || 0;
          const reservados = rifa.elementos_reservados || 0;
          const disponibles = totalElementos - vendidos - reservados;
          
          return (
            <div key={rifa.id} className="rifa-card">
              <div className="rifa-header">
                <h3>{rifa.nombre}</h3>
                <span className={`rifa-status ${rifa.activa ? 'activa' : 'inactiva'}`}>
                  {rifa.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              
              <div className="rifa-info-simple">
                {/* Premio principal */}
                {rifa.premios && rifa.premios.length > 0 && (
                  <div className="premio-principal">
                    <span className="premio-label">🏆 Premio</span>
                    <span className="premio-valor">{rifa.premios[0].nombre}</span>
                  </div>
                )}
                
                {/* Boletos disponibles */}
                <div className="disponibles-info">
                  <span className="disponibles-label">🎫 Disponibles</span>
                  <span className="disponibles-valor">{disponibles}</span>
                </div>
                
                {/* Días restantes */}
                {diasRestantes !== null && (
                  <div className="dias-info">
                    <span className="dias-label">⏱ Días restantes</span>
                    <span className={`dias-valor ${diasRestantes <= 3 ? 'urgente' : diasRestantes <= 7 ? 'proximo' : 'normal'}`}>
                      {diasRestantes > 0 ? `${diasRestantes} días` : 'Finalizada'}
                    </span>
                  </div>
                )}
              </div>

              {/* Información expandible */}
              {isExpanded && (
                <div className="rifa-details">
                  <div className="details-section">
                    <h4>💳 Información de Pago</h4>
                    <div className="pago-info">
                      <div className="pago-item">
                        <span className="pago-label">Precio por boleto</span>
                        <span className="pago-valor">${rifa.precio}</span>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>📈 Estadísticas Completas</h4>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">Tipo</span>
                        <span className="stat-value">
                          {rifa.tipo === 'numeros' ? '🎲 Números' : 
                           rifa.tipo === 'baraja' ? '🃏 Baraja' :
                           rifa.tipo === 'abecedario' ? '🔤 Abecedario' :
                           rifa.tipo === 'animales' ? '🐲 Animales' :
                           rifa.tipo === 'colores' ? '🎨 Colores' :
                           rifa.tipo === 'equipos' ? '⚽ Equipos' :
                           rifa.tipo === 'emojis' ? '😀 Emojis' :
                           rifa.tipo === 'paises' ? '🌍 Países' : '🎲 Números'}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Total Elementos</span>
                        <span className="stat-value">{totalElementos}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Vendidos</span>
                        <span className="stat-value sold">{vendidos}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Reservados</span>
                        <span className="stat-value reserved">{reservados}</span>
                      </div>
                      {rifa.fechaFin && (
                        <div className="stat-item">
                          <span className="stat-label">Fecha Finalización</span>
                          <span className="stat-value">{new Date(rifa.fechaFin).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {rifa.premios && rifa.premios.length > 0 && (
                    <div className="details-section">
                      <h4>🏆 Todos los Premios</h4>
                      <div className="premios-list">
                        {rifa.premios.map((premio, index) => (
                          <div key={index} className="premio-item">
                            <span className="premio-nombre">{premio.nombre}</span>
                            {premio.descripcion && (
                              <span className="premio-descripcion">{premio.descripcion}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="rifa-actions">
                <button 
                  className="btn-detail"
                  onClick={() => toggleExpansion(rifa.id)}
                >
                  {isExpanded ? '▼ Ocultar Detalle' : '▶ Ver Detalle'}
                </button>
                <Link to={`/gestionar/${rifa.id}`} className="btn-primary">
                  ⚙️ Gestionar
                </Link>
                <Link to={`/public/${rifa.id}`} className="btn-secondary">
                  👁 Ver Público
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveRifas;
