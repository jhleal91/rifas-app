import React, { useState, useEffect } from 'react';
import { showSuccess, showError, showWarning } from '../utils/swal';

import { API_BASE } from '../config/api';

const RatingComponent = ({ rifaId, creadorId, participanteId, onRatingSubmit }) => {
  const [rifaRating, setRifaRating] = useState(0);
  const [creadorRating, setCreadorRating] = useState(0);
  const [comentarioRifa, setComentarioRifa] = useState('');
  const [comentarioCreador, setComentarioCreador] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  // Cargar calificación existente si existe
  useEffect(() => {
    const loadExistingRating = async () => {
      if (!rifaId || !participanteId) return;
      
      try {
        const response = await fetch(`${API_BASE}/ratings/rifa/${rifaId}`);
        if (response.ok) {
          const data = await response.json();
          const myRating = data.calificaciones.find(c => c.participante_id === participanteId);
          if (myRating) {
            setExistingRating(myRating);
            setRifaRating(myRating.calificacion_rifa || 0);
            setCreadorRating(myRating.calificacion_creador || 0);
            setComentarioRifa(myRating.comentario_rifa || '');
            setComentarioCreador(myRating.comentario_creador || '');
          }
        }
      } catch (error) {
        console.error('Error cargando calificación existente:', error);
      }
    };

    loadExistingRating();
  }, [rifaId, participanteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rifaRating && !creadorRating) {
      showWarning('Calificación requerida', 'Por favor, califica al menos la rifa o al creador');
      return;
    }

    if (!participanteId) {
      showWarning('Participación requerida', 'Debes participar en la rifa para poder calificar');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rifa_id: rifaId,
          participante_id: participanteId,
          calificacion_rifa: rifaRating || null,
          calificacion_creador: creadorRating || null,
          comentario_rifa: comentarioRifa || null,
          comentario_creador: comentarioCreador || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setExistingRating(data.calificacion);
        await showSuccess('¡Calificación guardada!', 'Tu calificación se guardó exitosamente.');
        if (onRatingSubmit) {
          onRatingSubmit(data.calificacion);
        }
      } else {
        const errorData = await response.json();
        showError('Error al guardar', errorData.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error enviando calificación:', error);
      showError('Error', 'Error al guardar calificación. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating, setRating, label) => {
    return (
      <div className="rating-stars-container">
        <label className="rating-label">{label}:</label>
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`rating-star ${star <= rating ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.classList.add('hover');
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.classList.remove('hover');
              }}
            >
              ⭐
            </button>
          ))}
          {rating > 0 && (
            <span className="rating-value">{rating}/5</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rating-component">
      <h3>{existingRating ? '📝 Editar Calificación' : '⭐ Calificar Rifa y Creador'}</h3>
      
      <form onSubmit={handleSubmit} className="rating-form">
        {/* Calificación de Rifa */}
        <div className="rating-section">
          <h4>🎟️ Califica la Rifa</h4>
          {renderStars(rifaRating, setRifaRating, 'Calificación')}
          <textarea
            className="rating-comment"
            placeholder="Comparte tu opinión sobre la rifa (opcional)..."
            value={comentarioRifa}
            onChange={(e) => setComentarioRifa(e.target.value)}
            rows={3}
          />
        </div>

        {/* Calificación de Creador */}
        {creadorId && (
          <div className="rating-section">
            <h4>👤 Califica al Creador</h4>
            {renderStars(creadorRating, setCreadorRating, 'Calificación')}
            <textarea
              className="rating-comment"
              placeholder="Comparte tu opinión sobre el creador (opcional)..."
              value={comentarioCreador}
              onChange={(e) => setComentarioCreador(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <button 
          type="submit" 
          className="btn-rating-submit"
          disabled={isSubmitting || (!rifaRating && !creadorRating)}
        >
          {isSubmitting ? 'Guardando...' : (existingRating ? 'Actualizar Calificación' : 'Enviar Calificación')}
        </button>
      </form>
    </div>
  );
};

// Componente para mostrar calificaciones (solo lectura)
export const RatingDisplay = ({ rifaId, creadorId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [rifaResponse, creadorResponse] = await Promise.all([
          rifaId ? fetch(`${API_BASE}/ratings/rifa/${rifaId}`).catch(() => null) : Promise.resolve(null),
          creadorId ? fetch(`${API_BASE}/ratings/creador/${creadorId}`).catch(() => null) : Promise.resolve(null)
        ]);

        const statsData = {};
        
        if (rifaResponse && rifaResponse.ok) {
          try {
            const rifaData = await rifaResponse.json();
            statsData.rifa = rifaData.estadisticas;
          } catch (e) {
            console.error('Error parseando respuesta de rifa:', e);
          }
        }

        if (creadorResponse && creadorResponse.ok) {
          try {
            const creadorData = await creadorResponse.json();
            statsData.creador = creadorData.estadisticas;
          } catch (e) {
            console.error('Error parseando respuesta de creador:', e);
          }
        }

        setStats(statsData);
      } catch (error) {
        console.error('Error cargando estadísticas de calificaciones:', error);
        // No mostrar error al usuario, simplemente no mostrar calificaciones
      } finally {
        setLoading(false);
      }
    };

    if (rifaId || creadorId) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [rifaId, creadorId]);

  if (loading) {
    return <div className="rating-display-loading">Cargando calificaciones...</div>;
  }

  const renderStars = (average) => {
    if (!average || average === 0) {
      return <span className="no-rating">Sin calificaciones</span>;
    }
    
    const fullStars = Math.floor(average);
    const hasHalfStar = average % 1 >= 0.5;
    
    return (
      <div className="rating-display-stars">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <span key={i} className="star full">⭐</span>;
          } else if (i === fullStars && hasHalfStar) {
            return <span key={i} className="star half">⭐</span>;
          } else {
            return <span key={i} className="star empty">☆</span>;
          }
        })}
        <span className="rating-average">{average.toFixed(1)}</span>
        <span className="rating-count">
          ({stats?.rifa?.total_calificaciones || stats?.creador?.total_calificaciones || 0} calificaciones)
        </span>
      </div>
    );
  };

  return (
    <div className="rating-display">
      {stats?.rifa && (
        <div className="rating-display-section">
          <h4>🎟️ Calificación de la Rifa</h4>
          {renderStars(parseFloat(stats.rifa.promedio_calificacion_rifa))}
          {stats.rifa.total_calificaciones > 0 && (
            <div className="rating-breakdown">
              <div className="rating-bar">
                <span>5⭐</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${(stats.rifa.calificaciones_5 / stats.rifa.total_calificaciones) * 100}%` }}
                  ></div>
                </div>
                <span>{stats.rifa.calificaciones_5}</span>
              </div>
              <div className="rating-bar">
                <span>4⭐</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${(stats.rifa.calificaciones_4 / stats.rifa.total_calificaciones) * 100}%` }}
                  ></div>
                </div>
                <span>{stats.rifa.calificaciones_4}</span>
              </div>
              <div className="rating-bar">
                <span>3⭐</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${(stats.rifa.calificaciones_3 / stats.rifa.total_calificaciones) * 100}%` }}
                  ></div>
                </div>
                <span>{stats.rifa.calificaciones_3}</span>
              </div>
              <div className="rating-bar">
                <span>2⭐</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${(stats.rifa.calificaciones_2 / stats.rifa.total_calificaciones) * 100}%` }}
                  ></div>
                </div>
                <span>{stats.rifa.calificaciones_2}</span>
              </div>
              <div className="rating-bar">
                <span>1⭐</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${(stats.rifa.calificaciones_1 / stats.rifa.total_calificaciones) * 100}%` }}
                  ></div>
                </div>
                <span>{stats.rifa.calificaciones_1}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {stats?.creador && (
        <div className="rating-display-section">
          <h4>👤 Calificación del Creador</h4>
          {renderStars(parseFloat(stats.creador.promedio_calificacion_creador))}
          <div className="creador-stats">
            <span className="rifas-count">🎯 {stats.creador.total_rifas_creadas} rifas creadas</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingComponent;

