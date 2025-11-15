import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requireGuest = false }) => {
  const { user, isAdmin, isGuest, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al landing
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  // Si requiere admin y no es admin, redirigir
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/landing" replace />;
  }

  // Si requiere guest y no es guest, redirigir
  if (requireGuest && !isGuest) {
    return <Navigate to="/landing" replace />;
  }

  // Si todo está bien, renderizar el componente
  return children;
};

export default ProtectedRoute;
