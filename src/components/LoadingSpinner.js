import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Cargando...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClass = `spinner-${size}`;
  const containerClass = fullScreen ? 'loading-fullscreen' : 'loading-container';
  
  return (
    <div className={`${containerClass} ${className}`}>
      <div className="loading-content">
        <div className={`spinner ${sizeClass}`}>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;

