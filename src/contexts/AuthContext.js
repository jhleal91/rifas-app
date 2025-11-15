import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar si hay token
      if (!authService.isAuthenticated()) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Obtener información del usuario desde la API
      const response = await authService.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      // Si hay error, limpiar autenticación
      authService.logout();
      setUser(null);
      setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      
      // Guardar token y usuario
      authService.saveAuth(response.token, response.user);
      setUser(response.user);

      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error.message || 'Error al iniciar sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(userData);
      
      // Guardar token y usuario
      authService.saveAuth(response.token, response.user);
      setUser(response.user);

      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error.message || 'Error al registrar usuario';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
