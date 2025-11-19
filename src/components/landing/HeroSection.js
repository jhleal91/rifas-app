import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { rifasService } from '../../services/api';

const HeroSection = ({ onShowRegister, onShowLogin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentRifaIndex, setCurrentRifaIndex] = useState(0);
  const [rifasActivas, setRifasActivas] = useState([]);

  // Cargar rifas activas reales
  useEffect(() => {
    const cargarRifasActivas = async () => {
      try {
        const response = await rifasService.getPublicRifas();
        const rifas = response.rifas || [];
        
        // Filtrar solo rifas activas y transformar al formato necesario
        const rifasFormateadas = rifas
          .filter(rifa => rifa.activa && new Date(rifa.fecha_fin) > new Date())
          .slice(0, 10) // Limitar a 10 rifas para el carrusel
          .map(rifa => {
            // Calcular días restantes
            const fechaFin = new Date(rifa.fecha_fin);
            const ahora = new Date();
            const diasRestantes = Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24));
            
            // Obtener el nombre del premio principal (primer premio)
            const premioPrincipal = rifa.premios && rifa.premios.length > 0 
              ? rifa.premios[0].nombre 
              : rifa.nombre;
            
            // Calcular números disponibles
            const totalNumeros = rifa.numerosDisponibles?.length || rifa.cantidad_elementos || 0;
            const vendidos = rifa.numerosVendidos?.length || 0;
            const reservados = rifa.numerosReservados?.length || 0;
            const disponibles = totalNumeros - vendidos - reservados;
            
            return {
              id: rifa.id,
              nombre: rifa.nombre,
              premio: premioPrincipal,
              disponibles: disponibles,
              dias: diasRestantes,
              precio: parseFloat(rifa.precio) || 0
            };
          });
        
        setRifasActivas(rifasFormateadas);
      } catch (error) {
        console.error('Error cargando rifas activas:', error);
        // Si hay error, usar rifas de ejemplo como fallback
        setRifasActivas([
          {
            nombre: "iPhone 15 Pro Max",
            premio: "iPhone 15 Pro Max 256GB",
            disponibles: 47,
            dias: 12,
            precio: 50
          }
        ]);
      }
    };

    cargarRifasActivas();
  }, []);

  // Rifas para mostrar (usar activas si hay, sino usar ejemplo como fallback)
  const rifasEjemplo = rifasActivas.length > 0 ? rifasActivas : [
    {
      nombre: t('landing.heroCard.loadingRaffles'),
      premio: t('landing.heroCard.comingSoon'),
      disponibles: 0,
      dias: 0,
      precio: 0
    }
  ];

  // Rotar rifas cada 4 segundos
  useEffect(() => {
    if (rifasEjemplo.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentRifaIndex((prevIndex) => 
        (prevIndex + 1) % rifasEjemplo.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [rifasEjemplo.length]);

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            <span className="hero-icon">🎟️</span>
            SorteoHub
          </h1>
          <p className="hero-subtitle">
            {t('landing.subtitle')}
          </p>
          <p className="hero-description">
            {t('landing.description')}
          </p>
          <div className="hero-buttons">
            <button 
              className="btn-hero-primary"
              onClick={onShowRegister}
            >
              <span className="btn-icon">🚀</span>
              <span>{t('landing.createAccount')}</span>
            </button>
            <button 
              className="btn-hero-login"
              onClick={() => navigate('/anunciantes?mode=register')}
            >
              <span className="btn-icon">📣</span>
              <span>{t('landing.iAmAdvertiser')}</span>
            </button>
          </div>
          <div className="login-section">
            <p>{t('landing.alreadyHaveAccount')}</p>
            <button 
              className="btn-hero-login"
              onClick={onShowLogin}
            >
              <span className="btn-icon">🔑</span>
              <span>{t('landing.login')}</span>
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-card">
            <div className="card-header">
              <span className="card-icon">🎯</span>
              <span>{t('landing.heroCard.activeRaffle')}</span>
              <div className="card-indicators">
                {rifasEjemplo.map((_, index) => (
                  <span 
                    key={index}
                    className={`indicator ${index === currentRifaIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
            <div className="card-content">
              {rifasEjemplo.length > 0 && rifasEjemplo[currentRifaIndex] ? (
                <>
                  <h3>{rifasEjemplo[currentRifaIndex].nombre}</h3>
                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-label">{t('landing.heroCard.available')}</span>
                      <span className="stat-value available">{rifasEjemplo[currentRifaIndex].disponibles}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">{t('landing.heroCard.daysRemaining')}</span>
                      <span className={`stat-value days ${rifasEjemplo[currentRifaIndex].dias <= 5 ? 'urgent' : rifasEjemplo[currentRifaIndex].dias <= 10 ? 'warning' : 'normal'}`}>
                        {rifasEjemplo[currentRifaIndex].dias}
                      </span>
                    </div>
                  </div>
                  <div className="card-prize">
                    <span className="prize-icon">🏆</span>
                    <span>{rifasEjemplo[currentRifaIndex].premio}</span>
                  </div>
                  <div className="card-price">
                    <span className="price-label">{t('landing.heroCard.pricePerTicket')}</span>
                    <span className="price-value">${rifasEjemplo[currentRifaIndex].precio.toFixed(2)}</span>
                  </div>
                  {rifasEjemplo[currentRifaIndex].id && (
                    <Link 
                      to={`/public/${rifasEjemplo[currentRifaIndex].id}`}
                      className="btn-ver-rifa-hero"
                    >
                      {t('landing.heroCard.viewRaffle')}
                    </Link>
                  )}
                </>
              ) : (
                <div className="card-loading">
                  <p>{t('landing.heroCard.loading')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

