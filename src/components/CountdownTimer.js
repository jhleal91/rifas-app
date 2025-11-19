import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CountdownTimer.css';

const CountdownTimer = ({ fechaFin, showLabel = false, size = 'medium' }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(null);

  const calculateTimeLeft = (fechaFin) => {
    if (!fechaFin) return null;
    
    const now = new Date().getTime();
    const end = new Date(fechaFin).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { expired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      totalHours: days * 24 + hours,
      expired: false
    };
  };

  useEffect(() => {
    if (!fechaFin) return;

    // Calcular inmediatamente
    setTimeLeft(calculateTimeLeft(fechaFin));

    // Actualizar cada segundo
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(fechaFin);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft?.expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fechaFin]);

  if (!timeLeft || timeLeft.expired) {
    return (
      <div className={`countdown-timer countdown-expired countdown-${size}`}>
        {t('countdown.expired')}
      </div>
    );
  }

  const isUrgent = timeLeft.totalHours < 24;
  const isVeryUrgent = timeLeft.totalHours < 6;

  return (
    <div className={`countdown-timer countdown-${size} ${isUrgent ? 'countdown-urgent' : ''} ${isVeryUrgent ? 'countdown-very-urgent' : ''}`}>
      {showLabel && (
        <span className="countdown-label">{t('countdown.ending')}: </span>
      )}
      {timeLeft.days > 0 && (
        <span className="countdown-unit">
          {timeLeft.days}
          <span className="countdown-unit-label">{t('countdown.days')}</span>
        </span>
      )}
      <span className="countdown-unit">
        {String(timeLeft.hours).padStart(2, '0')}
        <span className="countdown-unit-label">{t('countdown.hours')}</span>
      </span>
      <span className="countdown-separator">:</span>
      <span className="countdown-unit">
        {String(timeLeft.minutes).padStart(2, '0')}
        <span className="countdown-unit-label">{t('countdown.minutes')}</span>
      </span>
      {size === 'large' && (
        <>
          <span className="countdown-separator">:</span>
          <span className="countdown-unit">
            {String(timeLeft.seconds).padStart(2, '0')}
            <span className="countdown-unit-label">{t('countdown.seconds')}</span>
          </span>
        </>
      )}
    </div>
  );
};

export default CountdownTimer;

