import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { rifasService } from '../services/api';
import { useAuth } from './AuthContext';

const RifasContext = createContext();

export const useRifas = () => {
  const context = useContext(RifasContext);
  if (!context) {
    throw new Error('useRifas debe ser usado dentro de un RifasProvider');
  }
  return context;
};

// Función helper para procesar rifas del backend
const procesarRifa = (rifa, isGuest = false) => {
  if (!rifa) return rifa;
  
  // Normalizar fotosPremios - puede venir como fotos_premios o fotosPremios
  let fotosPremios = rifa.fotosPremios || rifa.fotos_premios || [];
  if (typeof fotosPremios === 'string') {
    try {
      fotosPremios = JSON.parse(fotosPremios);
    } catch (e) {
      console.error(`Error parsing fotosPremios for rifa ${rifa.id}:`, e);
      fotosPremios = [];
    }
  }
  if (fotosPremios === null) {
    fotosPremios = [];
  }
  if (!Array.isArray(fotosPremios)) {
    fotosPremios = [];
  }
  
  // Debug: Log para rifa específica
  if (rifa.id === '1762310069179') {
    console.log(`🔍 Frontend - Rifa ${rifa.id}:`);
    console.log('  - fotosPremios:', rifa.fotosPremios);
    console.log('  - fotos_premios:', rifa.fotos_premios);
    console.log('  - fotosPremios normalizado:', fotosPremios);
  }
  
  // Para invitados, usar los números reales del backend (ya vienen en numerosVendidos y numerosReservados)
  if (isGuest) {
    const elementos = rifa.elementos_personalizados || [];
    // Usar los números vendidos y reservados reales del backend
    const numerosVendidos = (rifa.numerosVendidos || []).map(n => String(n));
    const numerosReservados = (rifa.numerosReservados || []).map(n => String(n));
    
    return {
      ...rifa,
      fotosPremios: fotosPremios, // Asegurar que fotosPremios esté presente
      // Usar números vendidos/reservados reales del backend
      numerosVendidos: numerosVendidos,
      numerosReservados: numerosReservados,
      participantes: [], // No mostrar participantes
      // Para compatibilidad con código existente
      numerosDisponibles: elementos,
      // Preservar estadísticas agregadas del backend para mostrar en la UI
      elementos_vendidos: rifa.elementos_vendidos,
      elementos_reservados: rifa.elementos_reservados,
      elementos_disponibles: rifa.elementos_disponibles,
      total_participantes: rifa.total_participantes,
      total_recaudado: rifa.total_recaudado
    };
  }
  
  // Para usuarios autenticados, usar los números del backend (más confiable)
  // El backend ya calcula correctamente los números vendidos y reservados
  // Usar los números vendidos y reservados del backend (ya vienen normalizados)
  const numerosVendidos = (rifa.numerosVendidos || []).map(n => String(n));
  const numerosReservados = (rifa.numerosReservados || []).map(n => String(n));
  
  return {
    ...rifa,
    fotosPremios: fotosPremios, // Asegurar que fotosPremios esté presente
    numerosVendidos,
    numerosReservados,
    // Para compatibilidad con código existente
    numerosDisponibles: rifa.elementos_personalizados || []
  };
};

export const RifasProvider = ({ children }) => {
  const [rifas, setRifas] = useState([]);
  const [myRifas, setMyRifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAdmin } = useAuth();

  const loadPublicRifas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await rifasService.getPublicRifas(filters);
      const rifasProcesadas = (response.rifas || []).map(rifa => procesarRifa(rifa, !isAdmin));
      
      // Siempre actualizar el estado, incluso si está vacío
      setRifas(rifasProcesadas);
      
      // Si no hay rifas pero la respuesta fue exitosa, no es un error
      // El componente mostrará el estado vacío apropiado
      if (rifasProcesadas.length === 0) {
        setError(null); // Limpiar cualquier error previo
      }
      
      // Log para debugging
      console.log('RifasContext - Rifas públicas cargadas:', rifasProcesadas.length);
    } catch (error) {
      console.error('Error cargando rifas públicas:', error);
      
      // Determinar el tipo de error y mostrar mensaje apropiado
      let errorMessage = 'No se encontraron rifas activas en este momento';
      
      if (error.message) {
        const errorMsg = error.message.toLowerCase();
        
        // Error de red/conexión
        if (errorMsg.includes('failed to fetch') || 
            errorMsg.includes('network error') || 
            errorMsg.includes('load failed') ||
            errorMsg.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.';
        }
        // Error de servidor (500, 503, etc.)
        else if (errorMsg.includes('500') || 
                 errorMsg.includes('503') || 
                 errorMsg.includes('servidor') ||
                 errorMsg.includes('internal')) {
          errorMessage = 'El servidor no está disponible en este momento. Por favor, intenta más tarde.';
        }
        // Error de rate limiting
        else if (errorMsg.includes('rate limit') || 
                 errorMsg.includes('demasiadas solicitudes')) {
          errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento e intenta de nuevo.';
        }
        // Error de autenticación (aunque no debería pasar aquí)
        else if (errorMsg.includes('401') || 
                 errorMsg.includes('unauthorized') ||
                 errorMsg.includes('no autorizado')) {
          errorMessage = 'Error de autenticación. Por favor, recarga la página.';
        }
        // Error 404 o no encontrado
        else if (errorMsg.includes('404') || 
                 errorMsg.includes('not found') ||
                 errorMsg.includes('no encontrado')) {
          errorMessage = 'No se encontraron rifas activas en este momento.';
        }
        // Otros errores
        else {
          errorMessage = 'No se pudieron cargar las rifas. Por favor, intenta de nuevo.';
        }
      }
      
      setError(errorMessage);
      // En caso de error, limpiar las rifas para evitar mostrar datos obsoletos
      setRifas([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadMyRifas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rifasService.getMyRifas();
      console.log('RifasContext - Mis rifas cargadas:', response);
      const rifasProcesadas = (response.rifas || []).map(rifa => procesarRifa(rifa, false));
      setMyRifas(rifasProcesadas);
    } catch (error) {
      console.error('Error cargando mis rifas:', error);
      setError('Error al cargar tus rifas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar rifas públicas al montar el componente
  useEffect(() => {
    loadPublicRifas();
  }, [loadPublicRifas]);

  // Cargar mis rifas si es admin
  useEffect(() => {
    if (isAdmin) {
      loadMyRifas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const getRifaById = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await rifasService.getRifaById(id);
      return procesarRifa(response.rifa, !isAdmin);
    } catch (error) {
      console.error('Error obteniendo rifa:', error);
      setError('Error al cargar la rifa');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createRifa = async (rifaData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await rifasService.createRifa(rifaData);
      
      // Recargar mis rifas
      await loadMyRifas();
      
      return { success: true, rifa: response.rifa };
    } catch (error) {
      console.error('Error creando rifa:', error);
      const errorMessage = error.message || 'Error al crear la rifa';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateRifa = async (id, rifaData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await rifasService.updateRifa(id, rifaData);
      
      // Actualizar en mis rifas
      setMyRifas(prev => prev.map(rifa => 
        rifa.id === id ? { ...rifa, ...response.rifa } : rifa
      ));
      
      return { success: true, rifa: response.rifa };
    } catch (error) {
      console.error('Error actualizando rifa:', error);
      const errorMessage = error.message || 'Error al actualizar la rifa';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteRifa = async (id) => {
    try {
      setLoading(true);
      setError(null);

      await rifasService.deleteRifa(id);
      
      // Recargar mis rifas para obtener datos actualizados del backend
      await loadMyRifas();
      
      return { success: true };
    } catch (error) {
      console.error('Error eliminando rifa:', error);
      const errorMessage = error.message || 'Error al eliminar la rifa';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    // Estado
    rifas,
    myRifas,
    loading,
    error,
    
    // Acciones
    loadPublicRifas,
    loadMyRifas,
    getRifaById,
    createRifa,
    updateRifa,
    deleteRifa,
    clearError,
    
    // Utilidades
    getRifasForUser: () => isAdmin ? myRifas : rifas,
  };

  return (
    <RifasContext.Provider value={value}>
      {children}
    </RifasContext.Provider>
  );
};
