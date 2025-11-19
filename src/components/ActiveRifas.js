import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ActiveRifas = ({ rifas }) => {
  const { t } = useTranslation();
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
        <h2>{t('activeRifas.title')}</h2>
        <div className="no-rifas">
          <p>{t('activeRifas.empty.message')}</p>
          <p>{t('activeRifas.empty.createFirst')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-rifas">
      <h2>{t('activeRifas.title')} ({rifas.length})</h2>
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
                  {rifa.activa ? t('activeRifas.status.active') : t('activeRifas.status.inactive')}
                </span>
              </div>
              
              <div className="rifa-info-simple">
                {/* Premio principal */}
                {rifa.premios && rifa.premios.length > 0 && (
                  <div className="premio-principal">
                    <span className="premio-label">{t('activeRifas.prize')}</span>
                    <span className="premio-valor">{rifa.premios[0].nombre}</span>
                  </div>
                )}
                
                {/* Boletos disponibles */}
                <div className="disponibles-info">
                  <span className="disponibles-label">{t('activeRifas.available')}</span>
                  <span className="disponibles-valor">{disponibles}</span>
                </div>
                
                {/* Días restantes */}
                {diasRestantes !== null && (
                  <div className="dias-info">
                    <span className="dias-label">{t('activeRifas.daysRemaining')}</span>
                    <span className={`dias-valor ${diasRestantes <= 3 ? 'urgente' : diasRestantes <= 7 ? 'proximo' : 'normal'}`}>
                      {diasRestantes > 0 ? `${diasRestantes} ${t('activeRifas.days')}` : t('activeRifas.finished')}
                    </span>
                  </div>
                )}
              </div>

              {/* Información expandible */}
              {isExpanded && (
                <div className="rifa-details">
                  <div className="details-section">
                    <h4>{t('activeRifas.paymentInfo.title')}</h4>
                    <div className="pago-info">
                      <div className="pago-item">
                        <span className="pago-label">{t('activeRifas.paymentInfo.pricePerTicket')}</span>
                        <span className="pago-valor">${rifa.precio}</span>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>{t('activeRifas.stats.title')}</h4>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">{t('activeRifas.stats.type')}</span>
                        <span className="stat-value">
                          {rifa.tipo === 'numeros' ? t('activeRifas.raffleTypes.numeros') : 
                           rifa.tipo === 'baraja' ? t('activeRifas.raffleTypes.baraja') :
                           rifa.tipo === 'abecedario' ? t('activeRifas.raffleTypes.abecedario') :
                           rifa.tipo === 'animales' ? t('activeRifas.raffleTypes.animales') :
                           rifa.tipo === 'colores' ? t('activeRifas.raffleTypes.colores') :
                           rifa.tipo === 'equipos' ? t('activeRifas.raffleTypes.equipos') :
                           rifa.tipo === 'emojis' ? t('activeRifas.raffleTypes.emojis') :
                           rifa.tipo === 'paises' ? t('activeRifas.raffleTypes.paises') : t('activeRifas.raffleTypes.numeros')}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{t('activeRifas.stats.totalElements')}</span>
                        <span className="stat-value">{totalElementos}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{t('activeRifas.stats.sold')}</span>
                        <span className="stat-value sold">{vendidos}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{t('activeRifas.stats.reserved')}</span>
                        <span className="stat-value reserved">{reservados}</span>
                      </div>
                      {rifa.fechaFin && (
                        <div className="stat-item">
                          <span className="stat-label">{t('activeRifas.stats.endDate')}</span>
                          <span className="stat-value">{new Date(rifa.fechaFin).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {rifa.premios && rifa.premios.length > 0 && (
                    <div className="details-section">
                      <h4>{t('activeRifas.prizes.title')}</h4>
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
                  {isExpanded ? t('activeRifas.actions.hideDetail') : t('activeRifas.actions.showDetail')}
                </button>
                <Link to={`/gestionar/${rifa.id}`} className="btn-primary">
                  {t('activeRifas.actions.manage')}
                </Link>
                <Link to={`/public/${rifa.id}`} className="btn-secondary">
                  {t('activeRifas.actions.viewPublic')}
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
