import React, { useState, useEffect } from 'react';
import TermsAndConditions from './TermsAndConditions';
import { catalogosService, uploadService } from '../services/api';
import { showError } from '../utils/swal';

// Mapa completo de colores en español
const coloresMap = {
  // Colores básicos
  'rojo': '#FF0000', 'azul': '#0000FF', 'verde': '#00FF00', 'amarillo': '#FFFF00',
  'morado': '#800080', 'naranja': '#FFA500', 'negro': '#000000', 'blanco': '#FFFFFF',
  'marrón': '#8B4513', 'rosa': '#FFC0CB', 'gris': '#808080',
  
  // Variaciones de rojo
  'rojo oscuro': '#8B0000', 'rojo claro': '#FFB6C1', 'rojo carmesí': '#DC143C',
  'rojo escarlata': '#FF2400', 'rojo bermellón': '#E34234', 'rojo granate': '#800020',
  'rojo cereza': '#DE3163', 'rojo coral': '#FF7F50', 'rojo salmón': '#FA8072',
  
  // Variaciones de azul
  'azul oscuro': '#000080', 'azul claro': '#87CEEB', 'azul marino': '#000080',
  'azul cielo': '#87CEEB', 'azul turquesa': '#40E0D0', 'azul cian': '#00FFFF',
  'azul índigo': '#4B0082', 'azul real': '#4169E1', 'azul acero': '#4682B4',
  'azul pizarra': '#708090', 'azul medianoche': '#191970', 'azul dodger': '#1E90FF',
  
  // Variaciones de verde
  'verde oscuro': '#006400', 'verde claro': '#90EE90', 'verde lima': '#32CD32',
  'verde esmeralda': '#50C878', 'verde oliva': '#808000', 'verde menta': '#98FB98',
  'verde bosque': '#228B22', 'verde mar': '#2E8B57', 'verde primavera': '#00FF7F',
  'verde chartreuse': '#7FFF00', 'verde jade': '#00A86B', 'verde musgo': '#8A9A5B',
  
  // Variaciones de amarillo
  'amarillo oscuro': '#B8860B', 'amarillo claro': '#FFFFE0', 'amarillo dorado': '#FFD700',
  'amarillo canario': '#FFFF99', 'amarillo mostaza': '#FFDB58', 'amarillo limón': '#FFF700',
  'amarillo ámbar': '#FFBF00', 'amarillo crema': '#FFFDD0', 'amarillo maíz': '#FBEC5D',
  
  // Variaciones de morado/púrpura
  'morado oscuro': '#4B0082', 'morado claro': '#DDA0DD', 'púrpura': '#6A0DAD',
  'violeta': '#8A2BE2', 'lavanda': '#E6E6FA', 'magenta': '#FF00FF',
  'fucsia': '#FF1493', 'lila': '#C8A2C8', 'púrpura real': '#663399',
  
  // Variaciones de naranja
  'naranja oscuro': '#FF8C00', 'naranja claro': '#FFB347', 'naranja coral': '#FF7F50',
  'naranja melocotón': '#FFDAB9', 'naranja salmón': '#FA8072', 'naranja mandarina': '#F28500',
  'naranja persa': '#D99058', 'naranja quemado': '#CC5500',
  
  // Variaciones de marrón/café
  'marrón oscuro': '#654321', 'marrón claro': '#D2B48C', 'café': '#A0522D',
  'café claro': '#D2691E', 'café oscuro': '#8B4513', 'chocolate': '#7B3F00',
  'chocolate claro': '#D2691E', 'chocolate oscuro': '#3C2414', 'caramelo': '#D2691E',
  'bronce': '#CD7F32', 'cobre': '#B87333', 'caoba': '#C04000',
  
  // Variaciones de rosa
  'rosa oscuro': '#C71585', 'rosa claro': '#FFB6C1', 'rosa fucsia': '#FF1493',
  'rosa coral': '#FF7F50', 'rosa salmón': '#FA8072', 'rosa melocotón': '#FFDAB9',
  'rosa polvo': '#FFB6C1', 'rosa caliente': '#FF69B4', 'rosa profundo': '#FF1493',
  
  // Variaciones de gris
  'gris oscuro': '#696969', 'gris claro': '#D3D3D3', 'gris plata': '#C0C0C0',
  'gris carbón': '#36454F', 'gris pizarra': '#708090', 'gris acero': '#71797E',
  'gris perla': '#E2E2E2', 'gris humo': '#848884', 'gris hierro': '#4B4B4B',
  
  // Colores especiales
  'oro': '#FFD700', 'plata': '#C0C0C0', 'bronce': '#CD7F32',
  'turquesa': '#40E0D0', 'esmeralda': '#50C878', 'rubí': '#E0115F',
  'zafiro': '#0F52BA', 'ámbar': '#FFBF00', 'perla': '#F8F6F0',
  'marfil': '#FFFFF0', 'crema': '#FFFDD0', 'beige': '#F5F5DC',
  'coral': '#FF7F50', 'salmón': '#FA8072', 'melocotón': '#FFDAB9',
  'menta': '#98FB98', 'lima': '#32CD32', 'cian': '#00FFFF',
  'magenta': '#FF00FF', 'fucsia': '#FF1493'
};

// Función para obtener el color hexadecimal por nombre
const obtenerColorPorNombre = (nombreColor) => {
  if (!nombreColor) return '#E5E7EB'; // Gris por defecto
  
  const colorNormalizado = nombreColor.toLowerCase().trim();
  return coloresMap[colorNormalizado] || '#E5E7EB';
};

// Función para obtener colores disponibles (no usados)
const obtenerColoresDisponibles = (coloresEnUso) => {
  if (!coloresEnUso || coloresEnUso.length === 0) {
    return Object.keys(coloresMap);
  }
  
  const coloresUsados = coloresEnUso.map(color => {
    if (typeof color === 'string') {
      return color.toLowerCase().trim();
    }
    return '';
  }).filter(color => color !== '');
  
  return Object.keys(coloresMap).filter(color => !coloresUsados.includes(color.toLowerCase()));
};

const CreateRifaWizard = ({ nuevaRifa, setNuevaRifa, tiposRifas, manejarCambioTipo, agregarRifa, agregarPremio, actualizarPremio, eliminarPremio, manejarFotosPremios, eliminarFoto, actualizarFormaPago }) => {
  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [mostrarMensajeExito, setMostrarMensajeExito] = useState(false);
  const [rifaCreada, setRifaCreada] = useState(null);
  const [mostrarSugerenciasColores, setMostrarSugerenciasColores] = useState(false);
  
  // Estados para catálogos de ubicación
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargandoPaises, setCargandoPaises] = useState(false);
  const [cargandoEstados, setCargandoEstados] = useState(false);
  
  const totalPasos = 4;

  // Cargar países al montar el componente
  useEffect(() => {
    const cargarPaises = async () => {
      try {
        setCargandoPaises(true);
        const response = await catalogosService.getPaises();
        setPaises(response.paises || []);
      } catch (error) {
        console.error('Error cargando países:', error);
      } finally {
        setCargandoPaises(false);
      }
    };
    cargarPaises();
  }, []);

  // Cargar estados cuando cambie el país seleccionado
  useEffect(() => {
    const cargarEstados = async () => {
      if (nuevaRifa.pais) {
        try {
          setCargandoEstados(true);
          const response = await catalogosService.getEstados(nuevaRifa.pais);
          setEstados(response.estados || []);
        } catch (error) {
          console.error('Error cargando estados:', error);
          setEstados([]);
        } finally {
          setCargandoEstados(false);
        }
      } else {
        setEstados([]);
      }
    };
    cargarEstados();
  }, [nuevaRifa.pais]);

  // Asegurar que siempre haya al menos un premio cuando se entra al paso 3
  useEffect(() => {
    if (pasoActual === 3 && (!nuevaRifa.premios || nuevaRifa.premios.length === 0)) {
      // Crear el primer premio automáticamente
      const primerPremio = {
        id: Date.now(),
        nombre: '',
        descripcion: '',
        posicion: 1,
        fotos: []
      };
      setNuevaRifa({
        ...nuevaRifa,
        premios: [primerPremio]
      });
    }
  }, [pasoActual]);

  const siguientePaso = () => {
    if (pasoActual < totalPasos) {
      setPasoActual(pasoActual + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  const puedeContinuar = () => {
    switch (pasoActual) {
      case 1:
        return nuevaRifa.nombre && nuevaRifa.precio;
      case 2:
        return true; // Los elementos son opcionales
      case 3:
        return true; // Los premios son opcionales
      case 4:
        return terminosAceptados; // Debe aceptar términos para finalizar
      default:
        return false;
    }
  };

  const manejarAceptarTerminos = () => {
    setTerminosAceptados(true);
    setMostrarTerminos(false);
  };

  const manejarRechazarTerminos = () => {
    setMostrarTerminos(false);
  };

  const manejarCrearRifa = async () => {
    const rifaId = await agregarRifa();
    if (rifaId) {
      setRifaCreada(rifaId);
      setMostrarMensajeExito(true);
      
      // Auto-redirigir después de 3 segundos
      setTimeout(() => {
        window.location.href = `/gestionar/${rifaId}`;
      }, 3000);
    }
  };

  const renderPaso = () => {
    switch (pasoActual) {
      case 1:
        return (
          <div className="paso-contenido-modern">
            <div className="step-header-modern">
              <div className="step-icon-modern">📝</div>
              <div>
                <h2 className="step-title-modern">Información Básica</h2>
                <p className="step-description">Completa los datos principales de tu rifa</p>
              </div>
            </div>
            <div className="form-section-modern">
              <div className="form-group-modern">
                <label htmlFor="nombre-rifa">
                  <span className="label-text">Nombre de la Rifa *</span>
                  <span className="label-required">Requerido</span>
                </label>
                <input
                  id="nombre-rifa"
                  type="text"
                  placeholder="Ej: Rifa del iPhone 15 Pro Max"
                  value={nuevaRifa.nombre}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, nombre: e.target.value})}
                  className="input-modern"
                />
                <small className="input-help">Un nombre claro y atractivo aumentará las participaciones</small>
              </div>
              
              <div className="form-group-modern">
                <label htmlFor="descripcion-rifa">
                  <span className="label-text">Descripción</span>
                  <span className="label-optional">Opcional</span>
                </label>
                <textarea
                  id="descripcion-rifa"
                  placeholder="Describe tu rifa, los premios, cómo funciona el sorteo..."
                  value={nuevaRifa.descripcion}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, descripcion: e.target.value})}
                  className="textarea-modern"
                  rows="4"
                />
                <small className="input-help">Una buena descripción ayuda a los participantes a entender mejor tu rifa</small>
              </div>
            </div>
            <div className="form-section-modern">
              <div className="form-group-modern">
                <label htmlFor="tipo-rifa">
                  <span className="label-text">Tipo de Rifa *</span>
                </label>
                <select
                  id="tipo-rifa"
                  value={nuevaRifa.tipo}
                  onChange={(e) => manejarCambioTipo(e.target.value)}
                  className="select-modern"
                >
                  <option value="numeros">🎲 Números Personalizados</option>
                  <option value="baraja">🃏 Baraja (Lotería)</option>
                  <option value="abecedario">🔤 Abecedario</option>
                  <option value="animales">🐲 Animales del Zodiaco</option>
                  <option value="colores">🎨 Colores</option>
                  <option value="equipos">⚽ Equipos Deportivos</option>
                  <option value="emojis">😀 Emojis</option>
                </select>
                <div className="tipo-info-card">
                  <span className="info-icon">ℹ️</span>
                  <span className="info-text">{tiposRifas[nuevaRifa.tipo]?.descripcion}</span>
                </div>
              </div>
              
              <div className="form-group-modern">
                <label htmlFor="precio-rifa">
                  <span className="label-text">Precio por {tiposRifas[nuevaRifa.tipo]?.elementos || 'elemento'} *</span>
                </label>
                <div className="input-with-currency">
                  <span className="currency-symbol">$</span>
                  <input
                    id="precio-rifa"
                    type="number"
                    placeholder="0.00"
                    value={nuevaRifa.precio}
                    onChange={(e) => setNuevaRifa({...nuevaRifa, precio: e.target.value})}
                    className="input-modern"
                    min="0"
                    step="0.01"
                  />
                  <span className="currency-code">MXN</span>
                </div>
                <small className="input-help">Precio que pagará cada participante por {tiposRifas[nuevaRifa.tipo]?.elementos || 'elemento'}</small>
              </div>
            </div>
            <div className="form-section-modern">
              <div className="form-group-modern">
                <label htmlFor="visibilidad-rifa">
                  <span className="label-text">Visibilidad de la Rifa *</span>
                </label>
                <div className="visibility-options-modern">
                  <label className={`radio-option-modern ${!nuevaRifa.esPrivada ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="visibilidad"
                      value="publica"
                      checked={!nuevaRifa.esPrivada}
                      onChange={() => setNuevaRifa({...nuevaRifa, esPrivada: false})}
                    />
                    <span className="radio-content">
                      <span className="radio-icon">🌍</span>
                      <div>
                        <strong>Pública</strong>
                        <small>Visible para todos los usuarios</small>
                      </div>
                    </span>
                  </label>
                  <label className={`radio-option-modern ${nuevaRifa.esPrivada ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="visibilidad"
                      value="privada"
                      checked={nuevaRifa.esPrivada}
                      onChange={() => setNuevaRifa({...nuevaRifa, esPrivada: true})}
                    />
                    <span className="radio-content">
                      <span className="radio-icon">🔒</span>
                      <div>
                        <strong>Privada</strong>
                        <small>Solo visible para ti</small>
                      </div>
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="form-group-modern">
                <label htmlFor="fecha-fin">
                  <span className="label-text">Fecha de Finalización</span>
                  <span className="label-optional">Opcional</span>
                </label>
                <input
                  id="fecha-fin"
                  type="date"
                  value={nuevaRifa.fechaFin}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, fechaFin: e.target.value})}
                  className="input-modern"
                />
                <small className="input-help">La rifa se cerrará automáticamente en esta fecha</small>
              </div>
            </div>
            
            {/* Campos de Ubicación */}
            <div className="form-section-modern location-section">
              <div className="section-header-modern">
                <span className="section-icon">📍</span>
                <div>
                  <h3 className="section-title">Ubicación</h3>
                  <p className="section-description">Define el alcance geográfico de tu rifa</p>
                </div>
              </div>
              
              <div className="form-group-modern">
                <label htmlFor="pais-rifa">
                  <span className="label-text">País</span>
                  <span className="label-optional">Opcional</span>
                </label>
                <select
                  id="pais-rifa"
                  value={nuevaRifa.pais || ''}
                  onChange={(e) => {
                    const paisSeleccionado = e.target.value;
                    setNuevaRifa({
                      ...nuevaRifa, 
                      pais: paisSeleccionado,
                      estado: '',
                      alcance: paisSeleccionado ? 'nacional' : 'local'
                    });
                  }}
                  className="select-modern"
                >
                  <option value="">Selecciona un país</option>
                  {paises.map(pais => (
                    <option key={pais.id} value={pais.codigo}>
                      {pais.nombre_es || pais.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {nuevaRifa.pais && (
                <div className="form-group-modern">
                  <label htmlFor="estado-rifa">
                    <span className="label-text">Estado/Provincia</span>
                    <span className="label-optional">Opcional</span>
                  </label>
                  <select
                    id="estado-rifa"
                    value={nuevaRifa.estado || ''}
                    onChange={(e) => setNuevaRifa({...nuevaRifa, estado: e.target.value})}
                    disabled={cargandoEstados}
                    className="select-modern"
                  >
                    <option value="">Selecciona un estado</option>
                    {estados.map(estado => (
                      <option key={estado.id} value={estado.codigo}>
                        {estado.nombre_es || estado.nombre}
                      </option>
                    ))}
                  </select>
                  {cargandoEstados && <small className="input-help">Cargando estados...</small>}
                </div>
              )}

              <div className="form-group-modern">
                <label htmlFor="ciudad-rifa">
                  <span className="label-text">Ciudad</span>
                  <span className="label-optional">Opcional</span>
                </label>
                <input
                  id="ciudad-rifa"
                  type="text"
                  placeholder="Ej: Ciudad de México"
                  value={nuevaRifa.ciudad || ''}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, ciudad: e.target.value})}
                  className="input-modern"
                />
              </div>

              <div className="form-group-modern">
                <label htmlFor="alcance-rifa">
                  <span className="label-text">Alcance de la Rifa</span>
                </label>
                <select
                  id="alcance-rifa"
                  value={nuevaRifa.alcance || 'local'}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, alcance: e.target.value})}
                  className="select-modern"
                >
                  <option value="local">🏘️ Local (misma ciudad)</option>
                  <option value="nacional">🇲🇽 Nacional (mismo país)</option>
                  <option value="internacional">🌍 Internacional (cualquier país)</option>
                </select>
                <div className="tipo-info-card">
                  <span className="info-icon">ℹ️</span>
                  <span className="info-text">
                    {nuevaRifa.alcance === 'local' && 'La rifa es solo para participantes de tu ciudad'}
                    {nuevaRifa.alcance === 'nacional' && 'La rifa acepta participantes de todo el país'}
                    {nuevaRifa.alcance === 'internacional' && 'La rifa acepta participantes de cualquier país'}
                  </span>
                </div>
              </div>

              <div className="form-group-modern">
                <label className={`checkbox-modern ${nuevaRifa.manejaEnvio ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={nuevaRifa.manejaEnvio || false}
                    onChange={(e) => setNuevaRifa({...nuevaRifa, manejaEnvio: e.target.checked})}
                  />
                  <span className="checkbox-content-modern">
                    <span className="checkbox-icon">📦</span>
                    <div>
                      <strong>Manejo envío de premios</strong>
                      <small>Marca esta opción si puedes enviar premios a otros lugares</small>
                    </div>
                    {nuevaRifa.manejaEnvio && (
                      <span className="checkbox-checkmark">✓</span>
                    )}
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="paso-contenido-modern">
            <div className="step-header-modern">
              <div className="step-icon-modern">🎯</div>
              <div>
                <h2 className="step-title-modern">Configurar Elementos</h2>
                <p className="step-description">Personaliza los elementos de tu rifa</p>
              </div>
            </div>
            <div className="form-group">
              <label>Cantidad de {tiposRifas[nuevaRifa.tipo]?.elementos || 'elementos'}:</label>
              <input
                type="number"
                placeholder={`${tiposRifas[nuevaRifa.tipo]?.cantidadDefault || 100} (${tiposRifas[nuevaRifa.tipo]?.descripcion})`}
                value={nuevaRifa.cantidadNumeros}
                onChange={(e) => setNuevaRifa({...nuevaRifa, cantidadNumeros: parseInt(e.target.value) || 1})}
                min="1"
                max={nuevaRifa.tipo === 'abecedario' ? 26 : nuevaRifa.tipo === 'animales' ? 12 : nuevaRifa.tipo === 'colores' ? 1000 : nuevaRifa.tipo === 'equipos' ? 20 : nuevaRifa.tipo === 'emojis' ? 100 : 1000}
              />
              <small className="form-help">
                {nuevaRifa.tipo === 'baraja' 
                  ? 'Para baraja tradicional usa 54 cartas (baraja completa)'
                  : nuevaRifa.tipo === 'abecedario'
                  ? 'Máximo 26 letras (A-Z)'
                  : nuevaRifa.tipo === 'animales'
                  ? 'Máximo 12 animales del zodiaco chino'
                  : nuevaRifa.tipo === 'colores'
                  ? 'Define cuántos colores quieres rifar (sin límite)'
                  : nuevaRifa.tipo === 'equipos'
                  ? 'Máximo 20 equipos deportivos'
                  : nuevaRifa.tipo === 'emojis'
                  ? 'Máximo 100 emojis divertidos'
                  : 'Define cuántos elementos quieres rifar'
                }
              </small>
            </div>
            
            {/* Sección de elementos personalizados */}
            {nuevaRifa.tipo !== 'numeros' && (
              <div className="elementos-personalizados">
                <div className="elementos-header">
                  <h4>🎯 Personalizar {tiposRifas[nuevaRifa.tipo]?.elementos || 'elementos'}</h4>
                  <div className="elementos-actions">
                    <button type="button" className="btn-secondary" onClick={() => {
                      const elementosIniciales = generarElementosRifa(nuevaRifa.tipo, tiposRifas[nuevaRifa.tipo].cantidadDefault);
                      setNuevaRifa({
                        ...nuevaRifa,
                        elementosPersonalizados: elementosIniciales,
                        cantidadNumeros: elementosIniciales.length
                      });
                    }}>
                      🔄 Resetear
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => {
                      let nuevoElemento;
                      if (nuevaRifa.tipo === 'emojis') {
                        const emojisDisponibles = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'];
                        nuevoElemento = emojisDisponibles[Math.floor(Math.random() * emojisDisponibles.length)];
                      } else {
                        nuevoElemento = `Nuevo ${tiposRifas[nuevaRifa.tipo]?.elementos || 'elemento'}`;
                      }
                      setNuevaRifa({
                        ...nuevaRifa,
                        elementosPersonalizados: [...nuevaRifa.elementosPersonalizados, nuevoElemento],
                        cantidadNumeros: nuevaRifa.elementosPersonalizados.length + 1
                      });
                    }}>
                      <span className="btn-icon">✨</span>
                      <span>Agregar</span>
                    </button>
                    {nuevaRifa.tipo === 'colores' && (
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setMostrarSugerenciasColores(!mostrarSugerenciasColores)}
                      >
                        <span className="btn-icon">🎨</span>
                        <span>Colores Disponibles</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className={`elementos-grid ${nuevaRifa.tipo === 'emojis' ? 'emojis-grid' : ''} ${nuevaRifa.tipo === 'colores' ? 'colores-grid' : ''}`}>
                  {nuevaRifa.elementosPersonalizados.map((elemento, index) => (
                    <div key={index} className={`elemento-item ${nuevaRifa.tipo === 'emojis' ? 'emoji-item' : ''} ${nuevaRifa.tipo === 'colores' ? 'color-item' : ''}`}>
                      {nuevaRifa.tipo === 'colores' ? (
                        <>
                          <div 
                            className="color-preview" 
                            style={{ backgroundColor: obtenerColorPorNombre(elemento) }}
                          ></div>
                          <input
                            type="text"
                            value={elemento}
                            onChange={(e) => {
                              const nuevosElementos = [...nuevaRifa.elementosPersonalizados];
                              nuevosElementos[index] = e.target.value;
                              setNuevaRifa({
                                ...nuevaRifa,
                                elementosPersonalizados: nuevosElementos
                              });
                            }}
                            className="elemento-input color-input"
                            style={{ 
                              backgroundColor: obtenerColorPorNombre(elemento),
                              color: obtenerColorPorNombre(elemento) === '#FFFFFF' || obtenerColorPorNombre(elemento) === '#FFFFF0' ? '#000000' : '#FFFFFF'
                            }}
                            placeholder={`Color ${index + 1}`}
                            maxLength={50}
                          />
                        </>
                      ) : (
                        <input
                          type="text"
                          value={elemento}
                          onChange={(e) => {
                            const nuevosElementos = [...nuevaRifa.elementosPersonalizados];
                            nuevosElementos[index] = e.target.value;
                            setNuevaRifa({
                              ...nuevaRifa,
                              elementosPersonalizados: nuevosElementos
                            });
                          }}
                          className="elemento-input"
                          placeholder={nuevaRifa.tipo === 'emojis' ? '😀' : `${tiposRifas[nuevaRifa.tipo]?.elementos || 'elemento'} ${index + 1}`}
                          maxLength={nuevaRifa.tipo === 'emojis' ? 2 : 50}
                        />
                      )}
                      <button 
                        type="button" 
                        className="btn-eliminar-elemento"
                        onClick={() => {
                          const nuevosElementos = nuevaRifa.elementosPersonalizados.filter((_, i) => i !== index);
                          setNuevaRifa({
                            ...nuevaRifa,
                            elementosPersonalizados: nuevosElementos,
                            cantidadNumeros: nuevosElementos.length
                          });
                        }}
                        title="Eliminar elemento"
                      >
                        <span className="delete-icon">×</span>
                      </button>
                    </div>
                  ))}
                </div>
                <small className="elementos-help">
                  💡 Puedes editar, agregar o eliminar {tiposRifas[nuevaRifa.tipo]?.elementos || 'elementos'}. 
                  Los cambios se reflejarán automáticamente en la cantidad.
                </small>
                
                {nuevaRifa.tipo === 'colores' && mostrarSugerenciasColores && (
                  <div className="sugerencias-colores">
                    <h4>🎨 Colores Disponibles</h4>
                    <div className="colores-sugerencias-grid">
                      {(() => {
                        const coloresDisponibles = obtenerColoresDisponibles(nuevaRifa.elementosPersonalizados);
                        console.log('Colores en uso:', nuevaRifa.elementosPersonalizados);
                        console.log('Colores disponibles:', coloresDisponibles);
                        return coloresDisponibles.map((nombreColor, index) => (
                        <button
                          key={index}
                          type="button"
                          className="color-sugerencia"
                          onClick={() => {
                            if (nuevaRifa.elementosPersonalizados.length < nuevaRifa.cantidadNumeros) {
                              setNuevaRifa({
                                ...nuevaRifa,
                                elementosPersonalizados: [...nuevaRifa.elementosPersonalizados, nombreColor]
                              });
                            }
                          }}
                          disabled={nuevaRifa.elementosPersonalizados.length >= nuevaRifa.cantidadNumeros}
                        >
                          <div 
                            className="color-sugerencia-preview" 
                            style={{ backgroundColor: obtenerColorPorNombre(nombreColor) }}
                          ></div>
                          <span className="color-sugerencia-nombre">{nombreColor}</span>
                        </button>
                        ));
                      })()}
                    </div>
                    <small className="sugerencias-help">
                      💡 Haz clic en cualquier color para agregarlo a tu rifa
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="paso-contenido-modern">
            <div className="step-header-modern">
              <div className="step-icon-modern">🏆</div>
              <div>
                <h2 className="step-title-modern">Premios y Reglas</h2>
                <p className="step-description">Define los premios y reglas de tu rifa</p>
              </div>
            </div>
            <div className="premios-section">
              <div className="premios-header">
                <h4>🏆 Premios</h4>
                <button type="button" className="btn-secondary" onClick={agregarPremio}>
                  <span className="btn-icon">✨</span>
                  <span>Agregar Premio</span>
                </button>
              </div>
              {nuevaRifa.premios && nuevaRifa.premios.length > 0 ? (
                nuevaRifa.premios.map((premio, index) => {
                  // Función para obtener el texto del lugar
                  const obtenerTextoLugar = (pos) => {
                    if (!pos || pos <= 0) return `${index + 1}° lugar`;
                    const posNum = parseInt(pos);
                    if (posNum === 1) return '1er lugar';
                    if (posNum === 2) return '2do lugar';
                    if (posNum === 3) return '3er lugar';
                    return `${posNum}° lugar`;
                  };

                  const esPrimerPremio = index === 0;
                  const puedeEliminar = !esPrimerPremio && nuevaRifa.premios.length > 1;

                  return (
                    <div key={premio.id || index} className="premio-item">
                      <div className="premio-header">
                        <div className="premio-orden-badge">
                          {obtenerTextoLugar(premio.posicion || index + 1)}
                          {esPrimerPremio && (
                            <span className="premio-required-badge">Requerido</span>
                          )}
                        </div>
                        {puedeEliminar ? (
                          <button 
                            type="button" 
                            className="btn-eliminar-premio"
                            onClick={() => eliminarPremio(index)}
                            title="Eliminar premio"
                          >
                            <span className="delete-icon">🗑️</span>
                          </button>
                        ) : (
                          <div className="premio-locked-info" title="El primer premio es obligatorio y no puede eliminarse">
                            <span className="lock-icon">🔒</span>
                          </div>
                        )}
                      </div>
                    <div className="premio-info">
                      <div className="form-group-modern">
                        <label htmlFor={`premio-posicion-${index}`}>
                          <span className="label-text">Posición del Premio</span>
                        </label>
                        <input
                          id={`premio-posicion-${index}`}
                          type="number"
                          min="1"
                          placeholder="Ej: 1 (1er lugar), 2 (2do lugar), etc."
                          value={premio.posicion || index + 1}
                          onChange={(e) => {
                            const nuevaPosicion = parseInt(e.target.value) || index + 1;
                            actualizarPremio(index, 'posicion', nuevaPosicion);
                          }}
                          className="input-modern"
                          disabled={esPrimerPremio}
                        />
                        <small className="input-help">
                          {esPrimerPremio 
                            ? 'El primer premio siempre será el 1er lugar' 
                            : 'Establece el orden del premio (1 = 1er lugar, 2 = 2do lugar, etc.)'}
                        </small>
                      </div>
                      <div className="form-group-modern">
                        <label htmlFor={`premio-nombre-${index}`}>
                          <span className="label-text">Nombre del Premio {esPrimerPremio ? '*' : ''}</span>
                          {esPrimerPremio && <span className="label-required">Requerido</span>}
                        </label>
                        <input
                          id={`premio-nombre-${index}`}
                          type="text"
                          placeholder="Ej: PlayStation 5, iPhone 15, etc."
                          value={premio.nombre || ''}
                          onChange={(e) => actualizarPremio(index, 'nombre', e.target.value)}
                          className="input-modern"
                          required={esPrimerPremio}
                        />
                        {esPrimerPremio && (
                          <small className="input-help">El primer premio es obligatorio para la rifa</small>
                        )}
                      </div>
                      <div className="form-group-modern">
                        <label htmlFor={`premio-descripcion-${index}`}>
                          <span className="label-text">Descripción del Premio</span>
                          <span className="label-optional">Opcional</span>
                        </label>
                        <textarea
                          id={`premio-descripcion-${index}`}
                          placeholder="Descripción adicional del premio (opcional)"
                          value={premio.descripcion || ''}
                          onChange={(e) => actualizarPremio(index, 'descripcion', e.target.value)}
                          className="textarea-modern"
                          rows="3"
                        />
                      </div>
                    </div>

                    {/* Sección de Fotos del Premio Individual */}
                    <div className="premio-fotos-section">
                      <div className="section-header-modern">
                        <span className="section-icon">📸</span>
                        <div>
                          <h4 className="section-title">Fotos del Premio</h4>
                          <p className="section-description">Agrega imágenes de este premio específico</p>
                        </div>
                      </div>
                      
                      <div className="premio-fotos-grid">
                        {premio.fotos && premio.fotos.length > 0 ? (
                          premio.fotos.map((foto, fotoIndex) => (
                            <div key={fotoIndex} className="premio-foto-item-modern">
                              <div className="premio-foto-preview">
                                <img 
                                  src={foto.url || foto.url_foto} 
                                  alt={foto.descripcion || `Premio ${index + 1} - Foto ${fotoIndex + 1}`} 
                                />
                                <button
                                  type="button"
                                  className="btn-eliminar-foto-premio"
                                  onClick={() => {
                                    const nuevosPremios = [...nuevaRifa.premios];
                                    nuevosPremios[index].fotos = nuevosPremios[index].fotos.filter((_, i) => i !== fotoIndex);
                                    setNuevaRifa({...nuevaRifa, premios: nuevosPremios});
                                  }}
                                  title="Eliminar foto"
                                >
                                  <span className="delete-icon">×</span>
                                </button>
                                {foto.uploading && (
                                  <div className="foto-uploading-overlay">
                                    <div className="spinner-small"></div>
                                    <span>Subiendo...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-fotos-premio-message">
                            <p>No hay fotos agregadas para este premio</p>
                          </div>
                        )}
                      </div>

                      <div className="premio-foto-upload-controls">
                        <label className="file-upload-label-modern">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                let localUrl = null;
                                try {
                                  // Crear preview local
                                  localUrl = URL.createObjectURL(file);
                                  const nuevaFoto = { 
                                    url: localUrl, 
                                    url_foto: localUrl, 
                                    descripcion: '',
                                    uploading: true 
                                  };
                                  
                                  const nuevosPremios = [...nuevaRifa.premios];
                                  nuevosPremios[index] = {
                                    ...nuevosPremios[index],
                                    fotos: [...(nuevosPremios[index].fotos || []), nuevaFoto]
                                  };
                                  setNuevaRifa({...nuevaRifa, premios: nuevosPremios});
                                  
                                  // Subir imagen al servidor
                                  const response = await uploadService.uploadImage(file);
                                  
                                  // Actualizar con URL final - crear copia del array de fotos
                                  const fotosActualizadas = [...nuevosPremios[index].fotos];
                                  fotosActualizadas[fotosActualizadas.length - 1] = {
                                    ...nuevaFoto,
                                    url: response.url,
                                    url_foto: response.url,
                                    uploading: false
                                  };
                                  nuevosPremios[index] = {
                                    ...nuevosPremios[index],
                                    fotos: fotosActualizadas
                                  };
                                  setNuevaRifa({...nuevaRifa, premios: nuevosPremios});
                                  
                                  // Limpiar URL temporal
                                  if (localUrl) {
                                    URL.revokeObjectURL(localUrl);
                                  }
                                } catch (error) {
                                  console.error('Error subiendo imagen:', error);
                                  showError('Error al subir imagen', error.message);
                                  
                                  // Remover foto con error
                                  if (localUrl) {
                                    const nuevosPremios = [...nuevaRifa.premios];
                                    nuevosPremios[index].fotos = nuevosPremios[index].fotos.filter(f => f.url !== localUrl);
                                    setNuevaRifa({...nuevaRifa, premios: nuevosPremios});
                                    URL.revokeObjectURL(localUrl);
                                  }
                                }
                              }
                              e.target.value = '';
                            }}
                          />
                          <span className="file-upload-btn-modern">
                            <span className="btn-icon">📁</span>
                            <span>Subir Imagen</span>
                          </span>
                        </label>
                        <span className="upload-divider-modern">o</span>
                        <input
                          type="text"
                          placeholder="URL de la imagen (ej: https://ejemplo.com/imagen.jpg)"
                          className="input-modern"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              const nuevosPremios = [...nuevaRifa.premios];
                              if (!nuevosPremios[index].fotos) {
                                nuevosPremios[index].fotos = [];
                              }
                              nuevosPremios[index].fotos = [...nuevosPremios[index].fotos, {
                                url: e.target.value.trim(),
                                url_foto: e.target.value.trim(),
                                descripcion: ''
                              }];
                              setNuevaRifa({...nuevaRifa, premios: nuevosPremios});
                              e.target.value = '';
                            }
                          }}
                        />
                        <small className="input-help">Presiona Enter para agregar la URL</small>
                      </div>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="no-premios-message">
                  <p>No hay premios agregados. Se creará automáticamente el primer premio.</p>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Reglas de la Rifa (opcional):</label>
              <textarea
                placeholder="Describe las reglas, condiciones y términos de la rifa..."
                value={nuevaRifa.reglas}
                onChange={(e) => setNuevaRifa({...nuevaRifa, reglas: e.target.value})}
                rows="4"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="paso-contenido-modern">
            <div className="step-header-modern">
              <div className="step-icon-modern">🎲</div>
              <div>
                <h2 className="step-title-modern">Sorteo en Vivo y Términos</h2>
                <p className="step-description">Configura el sorteo y acepta los términos</p>
              </div>
            </div>
            
            {/* Especificaciones del Sorteo en Vivo */}
            <div className="sorteo-vivo-section">
              <h4>📺 Especificaciones del Sorteo en Vivo</h4>
              <p className="form-help">
                <strong>OBLIGATORIO:</strong> Todos los sorteos deben realizarse en vivo para garantizar transparencia.
              </p>
              
              <div className="form-group">
                <label>📅 Fecha y Hora del Sorteo</label>
                <input
                  type="datetime-local"
                  value={nuevaRifa.fechaSorteo || ''}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, fechaSorteo: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>📱 Plataforma de Transmisión</label>
                <select
                  value={nuevaRifa.plataformaTransmision || ''}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, plataformaTransmision: e.target.value})}
                  required
                >
                  <option value="">Selecciona una plataforma</option>
                  <option value="facebook">Facebook Live</option>
                  <option value="instagram">Instagram Live</option>
                  <option value="youtube">YouTube Live</option>
                  <option value="zoom">Zoom</option>
                  <option value="otra">Otra plataforma</option>
                </select>
              </div>

              {nuevaRifa.plataformaTransmision === 'otra' && (
                <div className="form-group">
                  <label>📝 Especificar Plataforma</label>
                  <input
                    type="text"
                    placeholder="Nombre de la plataforma"
                    value={nuevaRifa.otraPlataforma || ''}
                    onChange={(e) => setNuevaRifa({...nuevaRifa, otraPlataforma: e.target.value})}
                  />
                </div>
              )}

              <div className="form-group">
                <label>🔗 Enlace de Transmisión</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={nuevaRifa.enlaceTransmision || ''}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, enlaceTransmision: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>🎯 Método de Sorteo</label>
                <select
                  value={nuevaRifa.metodoSorteo || ''}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, metodoSorteo: e.target.value})}
                  required
                >
                  <option value="">Selecciona un método</option>
                  <option value="ruleta">Ruleta Digital</option>
                  <option value="bolas">Bolas Numeradas</option>
                  <option value="app">Aplicación de Sorteo</option>
                  <option value="otro">Otro método</option>
                </select>
              </div>

              <div className="form-group">
                <label>👥 Testigos (Mínimo 2)</label>
                <textarea
                  placeholder="Nombre y contacto de los testigos independientes..."
                  value={nuevaRifa.testigos || ''}
                  onChange={(e) => setNuevaRifa({...nuevaRifa, testigos: e.target.value})}
                  rows="3"
                />
              </div>
            </div>

            {/* Formas de Pago - Datos donde el creador RECIBE el dinero */}
            <div className="pagos-section">
              <h4>💳 Datos para Recibir Pagos</h4>
              <p className="section-description">
                Ingresa tus datos bancarios donde quieres recibir el dinero de las rifas. 
                Todos los pagos pasarán por SorteoHub y te transferiremos el monto menos la comisión de tu plan.
              </p>
              
              <div className="datos-bancarios-creador">
                <h5>🏦 Mis Datos Bancarios (Donde Recibiré el Dinero)</h5>
                <div className="form-group">
                  <label>CLABE (18 dígitos) *</label>
                  <input
                    type="text"
                    placeholder="CLABE (18 dígitos)"
                    value={nuevaRifa.formasPago.clabe || ''}
                    onChange={(e) => actualizarFormaPago('clabe', e.target.value)}
                    maxLength={18}
                  />
                  <small>CLABE interbancaria donde recibirás las transferencias</small>
                </div>
                <div className="form-group">
                  <label>Número de cuenta</label>
                  <input
                    type="text"
                    placeholder="Número de cuenta"
                    value={nuevaRifa.formasPago.numeroCuenta || ''}
                    onChange={(e) => actualizarFormaPago('numeroCuenta', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nombre del banco *</label>
                  <input
                    type="text"
                    placeholder="Ej: BBVA, Banorte, Santander"
                    value={nuevaRifa.formasPago.banco || ''}
                    onChange={(e) => actualizarFormaPago('banco', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nombre del titular *</label>
                  <input
                    type="text"
                    placeholder="Nombre completo del titular de la cuenta"
                    value={nuevaRifa.formasPago.nombreTitular || ''}
                    onChange={(e) => actualizarFormaPago('nombreTitular', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono de contacto</label>
                  <input
                    type="tel"
                    placeholder="Teléfono de contacto"
                    value={nuevaRifa.formasPago.telefono || ''}
                    onChange={(e) => actualizarFormaPago('telefono', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp (para notificaciones)</label>
                  <input
                    type="tel"
                    placeholder="WhatsApp"
                    value={nuevaRifa.formasPago.whatsapp || ''}
                    onChange={(e) => actualizarFormaPago('whatsapp', e.target.value)}
                  />
                </div>
                
                <div className="info-box">
                  <p>ℹ️ <strong>Importante:</strong> Los participantes podrán pagar con tarjeta (Stripe) o transferencia bancaria. 
                  El dinero llegará a tu cuenta bancaria después de que SorteoHub procese el pago y retenga la comisión de tu plan.</p>
                </div>
              </div>
            </div>

            {/* Términos y Condiciones */}
            <div className="terminos-section">
              <h4>📋 Términos y Condiciones</h4>
              <div className="terminos-resumen">
                <p><strong>✅ Confirmo que:</strong></p>
                <ul>
                  <li>Esta rifa es <strong>SIN FINES DE LUCRO</strong></li>
                  <li>Realizaré el sorteo en vivo según las especificaciones</li>
                  <li>Entregaré los premios a los ganadores</li>
                  <li>Mantendré transparencia en todo el proceso</li>
                  <li>Pagaré la comisión de plataforma (5%)</li>
                </ul>
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={terminosAceptados}
                    onChange={(e) => setTerminosAceptados(e.target.checked)}
                  />
                  He leído y acepto los términos y condiciones
                </label>
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMostrarTerminos(true)}
                  style={{marginTop: '0.5rem'}}
                >
                  📖 Leer Términos Completos
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="create-rifa-wizard-modern">
      {/* Header Moderno */}
      <div className="wizard-header-modern">
        <div className="header-content">
          <h1 className="wizard-title-modern">
            <span className="wizard-icon-modern">✨</span>
            Crear Nueva Rifa
          </h1>
          <p className="wizard-subtitle">Completa los pasos para crear tu rifa en minutos</p>
        </div>
        
        {/* Indicador de Pasos Mejorado */}
        <div className="wizard-steps-indicator">
          <div className={`wizard-step ${pasoActual >= 1 ? 'active' : ''} ${pasoActual > 1 ? 'completed' : ''}`}>
            <div className="step-circle">
              {pasoActual > 1 ? '✓' : '1'}
            </div>
            <span className="step-label">Información</span>
          </div>
          <div className={`wizard-step ${pasoActual >= 2 ? 'active' : ''} ${pasoActual > 2 ? 'completed' : ''}`}>
            <div className="step-circle">
              {pasoActual > 2 ? '✓' : '2'}
            </div>
            <span className="step-label">Elementos</span>
          </div>
          <div className={`wizard-step ${pasoActual >= 3 ? 'active' : ''} ${pasoActual > 3 ? 'completed' : ''}`}>
            <div className="step-circle">
              {pasoActual > 3 ? '✓' : '3'}
            </div>
            <span className="step-label">Premios</span>
          </div>
          <div className={`wizard-step ${pasoActual >= 4 ? 'active' : ''}`}>
            <div className="step-circle">
              {pasoActual === 4 ? '4' : ''}
            </div>
            <span className="step-label">Finalizar</span>
          </div>
        </div>
      </div>

      {/* Contenido del Paso */}
      <div className="wizard-content-modern">
        <div className="step-content-wrapper">
          {renderPaso()}
        </div>
      </div>

      {/* Acciones */}
      <div className="wizard-actions-modern">
        <button 
          type="button" 
          className="btn-wizard-back"
          onClick={pasoAnterior}
          disabled={pasoActual === 1}
        >
          <span className="btn-icon">←</span>
          <span>Anterior</span>
        </button>
        
        {pasoActual < totalPasos ? (
          <button 
            type="button" 
            className="btn-wizard-next"
            onClick={siguientePaso}
            disabled={!puedeContinuar()}
          >
            <span>Siguiente</span>
            <span className="btn-icon">→</span>
          </button>
        ) : (
          <div className="final-step-actions">
            <button 
              type="button" 
              className="btn-wizard-create"
              onClick={manejarCrearRifa}
              disabled={!puedeContinuar()}
            >
              <span className="btn-icon">🎯</span>
              <span>Crear Rifa</span>
            </button>
            {!puedeContinuar() && (
              <p className="terms-warning">
                ⚠️ Debes aceptar los términos y condiciones para continuar
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal de Términos y Condiciones */}
      {mostrarTerminos && (
        <TermsAndConditions
          onAccept={manejarAceptarTerminos}
          onDecline={manejarRechazarTerminos}
        />
      )}

      {/* Modal de Éxito */}
      {mostrarMensajeExito && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <div className="success-icon">🎉</div>
            <h2>¡Rifa Creada Exitosamente!</h2>
            <p>Tu rifa ha sido creada y está lista para compartir.</p>
            <div className="success-actions">
              <button 
                className="btn-primary"
                onClick={() => window.location.href = `/gestionar/${rifaCreada}`}
              >
                <span className="btn-icon">⚙️</span>
                <span>Gestionar Rifa</span>
              </button>
              <button 
                className="btn-secondary"
                onClick={() => window.location.href = '/'}
              >
                <span className="btn-icon">🏠</span>
                <span>Volver al Inicio</span>
              </button>
            </div>
            <small style={{color: '#64748b', marginTop: '1rem', display: 'block'}}>
              Redirigiendo automáticamente en 3 segundos...
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

// Función auxiliar para generar elementos (copiada del App.js)
const generarElementosRifa = (tipo, cantidad) => {
  switch (tipo) {
    case 'numeros':
      return Array.from({ length: cantidad }, (_, i) => i + 1);
    
    case 'baraja':
      const palos = ['♠', '♥', '♦', '♣'];
      const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const cartas = [];
      palos.forEach(palo => {
        valores.forEach(valor => {
          cartas.push(`${valor}${palo}`);
        });
      });
      cartas.push('🃏', '🂠');
      return cartas.slice(0, cantidad);
    
    case 'abecedario':
      return Array.from({ length: Math.min(cantidad, 26) }, (_, i) => 
        String.fromCharCode(65 + i)
      );
    
    case 'animales':
      const animales = ['🐭 Rata', '🐮 Buey', '🐯 Tigre', '🐰 Conejo', '🐲 Dragón', '🐍 Serpiente', 
                       '🐴 Caballo', '🐐 Cabra', '🐵 Mono', '🐔 Gallo', '🐶 Perro', '🐷 Cerdo'];
      return animales.slice(0, Math.min(cantidad, 12));
    
    case 'colores':
      // Generar colores simples para la cantidad solicitada
      const coloresBasicos = ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Morado', 'Naranja', 'Negro', 'Blanco', 'Marrón', 'Rosa'];
      return coloresBasicos.slice(0, Math.min(cantidad, coloresBasicos.length));
    
    case 'equipos':
      const equipos = ['🇲🇽 América', '🇲🇽 Chivas', '🇲🇽 Cruz Azul', '🇲🇽 Pumas', '🇲🇽 Tigres', 
                      '🇲🇽 Monterrey', '🇲🇽 Santos', '🇲🇽 Pachuca', '🇲🇽 Toluca', '🇲🇽 Atlas',
                      '🇪🇸 Real Madrid', '🇪🇸 Barcelona', '🇪🇸 Atlético', '🇮🇹 Juventus', '🇮🇹 Milan',
                      '🇩🇪 Bayern', '🇬🇧 Manchester United', '🇬🇧 Liverpool', '🇫🇷 PSG', '🇧🇷 Flamengo'];
      return equipos.slice(0, Math.min(cantidad, 20));
    
    case 'emojis':
      const emojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
        '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔',
        '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
        '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🪀',
        '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁',
        '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿',
        '📀', '🧮', '🎥', '📷', '📸', '📹', '🎬', '📺', '📻', '🎙️',
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'
      ];
      return emojis.slice(0, Math.min(cantidad, 100));
    
    case 'paises':
      const paises = [
        // América del Norte
        '🇺🇸 Estados Unidos', '🇨🇦 Canadá', '🇲🇽 México',
        // América Central y Caribe
        '🇬🇹 Guatemala', '🇧🇿 Belice', '🇸🇻 El Salvador', '🇭🇳 Honduras', 
        '🇳🇮 Nicaragua', '🇨🇷 Costa Rica', '🇵🇦 Panamá', '🇨🇺 Cuba',
        '🇯🇲 Jamaica', '🇭🇹 Haití', '🇩🇴 República Dominicana', '🇵🇷 Puerto Rico',
        // América del Sur
        '🇧🇷 Brasil', '🇦🇷 Argentina', '🇨🇱 Chile', '🇵🇪 Perú', '🇨🇴 Colombia',
        '🇻🇪 Venezuela', '🇪🇨 Ecuador', '🇧🇴 Bolivia', '🇵🇾 Paraguay', '🇺🇾 Uruguay',
        '🇬🇾 Guyana', '🇸🇷 Surinam', '🇬🇫 Guayana Francesa',
        // Europa
        '🇪🇸 España', '🇫🇷 Francia', '🇩🇪 Alemania', '🇮🇹 Italia', '🇬🇧 Reino Unido',
        '🇳🇱 Países Bajos', '🇧🇪 Bélgica', '🇨🇭 Suiza', '🇦🇹 Austria', '🇵🇱 Polonia',
        '🇷🇺 Rusia', '🇺🇦 Ucrania', '🇸🇪 Suecia', '🇳🇴 Noruega', '🇩🇰 Dinamarca',
        '🇫🇮 Finlandia', '🇮🇸 Islandia', '🇮🇪 Irlanda', '🇵🇹 Portugal', '🇬🇷 Grecia',
        // Asia
        '🇨🇳 China', '🇯🇵 Japón', '🇰🇷 Corea del Sur', '🇮🇳 India', '🇹🇭 Tailandia',
        '🇻🇳 Vietnam', '🇵🇭 Filipinas', '🇮🇩 Indonesia', '🇲🇾 Malasia', '🇸🇬 Singapur',
        '🇱🇰 Sri Lanka', '🇧🇩 Bangladesh', '🇵🇰 Pakistán', '🇦🇫 Afganistán', '🇮🇷 Irán',
        '🇮🇶 Irak', '🇸🇦 Arabia Saudí', '🇦🇪 Emiratos Árabes', '🇹🇷 Turquía', '🇮🇱 Israel',
        // África
        '🇪🇬 Egipto', '🇿🇦 Sudáfrica', '🇳🇬 Nigeria', '🇰🇪 Kenia', '🇪🇹 Etiopía',
        '🇲🇦 Marruecos', '🇩🇿 Argelia', '🇹🇳 Túnez', '🇱🇾 Libia', '🇸🇩 Sudán',
        '🇨🇩 República Democrática del Congo', '🇹🇿 Tanzania', '🇺🇬 Uganda', '🇬🇭 Ghana',
        '🇨🇮 Costa de Marfil', '🇸🇳 Senegal', '🇲🇱 Malí', '🇧🇫 Burkina Faso', '🇳🇪 Níger',
        // Oceanía
        '🇦🇺 Australia', '🇳🇿 Nueva Zelanda', '🇫🇯 Fiyi', '🇵🇬 Papúa Nueva Guinea',
        '🇳🇨 Nueva Caledonia', '🇻🇺 Vanuatu', '🇸🇧 Islas Salomón', '🇰🇮 Kiribati',
        '🇹🇻 Tuvalu', '🇳🇷 Nauru', '🇵🇼 Palaos', '🇫🇲 Micronesia', '🇲🇭 Islas Marshall'
      ];
      return paises.slice(0, Math.min(cantidad, 100));
    
    default:
      return Array.from({ length: cantidad }, (_, i) => i + 1);
  }
};

export default CreateRifaWizard;
