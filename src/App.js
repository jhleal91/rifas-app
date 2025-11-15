import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RifasProvider, useRifas } from './contexts/RifasContext';
import { rifasService } from './services/api';
import LandingPage from './components/LandingPage';
import RafflePortal from './components/RafflePortal';
import RifaManagement from './components/RifaManagement';
import PublicRifaView from './components/PublicRifaView';
import ParticipateRaffle from './components/ParticipateRaffle';
import UserDashboard from './components/UserDashboard';
import ActiveRifas from './components/ActiveRifas';
import CreateRifaWizard from './components/CreateRifaWizard';
import ParticipantesPage from './components/ParticipantesPage';
import ProtectedRoute from './components/ProtectedRoute';
import ParticipanteView from './components/ParticipanteView';
import RifaPreview from './components/RifaPreview';
import Footer from './components/Footer';
import AdvertiserPortal from './components/AdvertiserPortal';
import NumeroCheckerPage from './components/NumeroCheckerPage';
import CreatorPlans from './components/CreatorPlans';
import NotificationToast from './components/NotificationToast';
import ConfirmDialog from './components/ConfirmDialog';
import BusinessProfile from './components/BusinessProfile';
import BusinessProfileModal from './components/BusinessProfileModal';
import ErrorBoundary from './components/ErrorBoundary';
import TerminosCondiciones from './components/TerminosCondiciones';
import PoliticaPrivacidad from './components/PoliticaPrivacidad';
import PoliticaCookies from './components/PoliticaCookies';
import AvisoLegal from './components/AvisoLegal';
import AllCuponesPage from './components/AllCuponesPage';
import CookieBanner from './components/CookieBanner';
import LanguageSwitcher from './components/LanguageSwitcher';
import './components/ErrorBoundary.css';

// Componente interno que usa useLocation dentro del Router
function LogoutRoute() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    logout();
    navigate('/landing', { replace: true });
  }, [logout, navigate]);
  return null;
}

function AppWithRouter() {
  const { t } = useTranslation();
  const { user, logout, isAdmin, loading } = useAuth();
  const { myRifas, rifas: publicRifas, createRifa } = useRifas();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [advertiser, setAdvertiser] = useState(null);
  const [showBusinessProfileModal, setShowBusinessProfileModal] = useState(false);
  const [nuevaRifa, setNuevaRifa] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    fechaFin: '',
    tipo: 'numeros', // 'numeros' o 'lotería'
    cantidadNumeros: 100,
    elementosPersonalizados: [], // Para elementos editables
    premios: [],
    reglas: '',
    fotosPremios: [],
    formasPago: {
      transferencia: false,
      clabe: '',
      banco: '',
      numeroCuenta: '',
      nombreTitular: '',
      telefono: '',
      whatsapp: ''
    },
    esPrivada: false, // true = privada (solo admin), false = pública (todos pueden ver)
    creadorId: null, // ID del usuario que creó la rifa
    // Campos de ubicación
    pais: '',
    estado: '',
    ciudad: '',
    manejaEnvio: false,
    alcance: 'local' // 'local', 'nacional', 'internacional'
  });

  // Función para cerrar sesión
  const handleLogout = () => {
    logout();
    navigate('/landing', { replace: true });
  };

  // Funciones para manejar menús
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // Verificar si hay un anunciante autenticado
  useEffect(() => {
    const checkAdvertiser = async () => {
      const token = localStorage.getItem('advertiserToken');
      if (token && token !== 'null' && token !== 'undefined') {
        // Intentar obtener información del anunciante desde el token
        try {
          // Decodificar el token para obtener el advertiserId
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.advertiserId) {
            // Hacer fetch para obtener info del anunciante
            const res = await fetch(`http://localhost:5001/api/advertisers/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.advertiser) {
                setAdvertiser(data.advertiser);
              }
            } else {
              // Si falla, limpiar token inválido
              localStorage.removeItem('advertiserToken');
              setAdvertiser(null);
            }
          }
        } catch (e) {
          // Token inválido
          localStorage.removeItem('advertiserToken');
          setAdvertiser(null);
        }
      } else {
        setAdvertiser(null);
      }
    };
    
    checkAdvertiser();
    
    // Escuchar cambios en localStorage (cuando se loguea/desloguea)
    const handleStorageChange = () => {
      checkAdvertiser();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // También escuchar evento personalizado para cambios en la misma ventana
    window.addEventListener('advertiserAuthChange', handleStorageChange);
    
    // También verificar periódicamente (cada 30 segundos)
    const interval = setInterval(checkAdvertiser, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('advertiserAuthChange', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Función para cerrar sesión de anunciante
  const handleAdvertiserLogout = () => {
    localStorage.removeItem('advertiserToken');
    setAdvertiser(null);
    // Disparar evento para sincronizar
    window.dispatchEvent(new Event('advertiserAuthChange'));
    navigate('/', { replace: true });
  };

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verificar si el click fue fuera del dropdown de usuario
      const userDropdown = document.querySelector('.user-dropdown');
      const userMenuBtn = document.querySelector('.user-menu-btn');
      
      if (isUserMenuOpen && userDropdown && userMenuBtn) {
        if (!userDropdown.contains(event.target) && !userMenuBtn.contains(event.target)) {
          setIsUserMenuOpen(false);
        }
      }

      // Verificar si el click fue fuera del menú móvil
      const mobileMenu = document.querySelector('.mobile-menu');
      const hamburgerBtn = document.querySelector('.hamburger-btn');
      
      if (isMenuOpen && mobileMenu && hamburgerBtn) {
        if (!mobileMenu.contains(event.target) && !hamburgerBtn.contains(event.target)) {
          setIsMenuOpen(false);
        }
      }
    };

    // Agregar el event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Limpiar el event listener al desmontar
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isMenuOpen]);

  // Definir tipos de rifas disponibles
  const tiposRifas = {
    numeros: {
      nombre: 'Números',
      descripcion: 'Rifa tradicional por números',
      elementos: 'numeros',
      cantidadDefault: 100
    },
    baraja: {
      nombre: 'Baraja (Lotería)',
      descripcion: 'Rifa por cartas de la baraja',
      elementos: 'cartas',
      cantidadDefault: 54
    },
    abecedario: {
      nombre: 'Abecedario',
      descripcion: 'Rifa por letras del abecedario',
      elementos: 'letras',
      cantidadDefault: 26
    },
    animales: {
      nombre: 'Animales del Zodiaco',
      descripcion: 'Rifa por animales del zodiaco chino',
      elementos: 'animales',
      cantidadDefault: 12
    },
    colores: {
      nombre: 'Colores',
      descripcion: 'Rifa por colores',
      elementos: 'colores',
      cantidadDefault: 10
    },
    equipos: {
      nombre: 'Equipos Deportivos',
      descripcion: 'Rifa por equipos de fútbol',
      elementos: 'equipos',
      cantidadDefault: 20
    },
    emojis: {
      nombre: 'Emojis',
      descripcion: 'Rifa por emojis divertidos',
      elementos: 'emojis',
      cantidadDefault: 30
    },
    paises: {
      nombre: 'Países del Mundo',
      descripcion: 'Rifa con países de diferentes continentes',
      elementos: 'paises',
      cantidadDefault: 50
    }
  };

  // Generar elementos según el tipo de rifa
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
        cartas.push('🃏', '🂠'); // Jokers
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
        const colores = ['🔴 Rojo', '🔵 Azul', '🟢 Verde', '🟡 Amarillo', '🟣 Morado', '🟠 Naranja', 
                        '⚫ Negro', '⚪ Blanco', '🟤 Marrón', '🩷 Rosa'];
        return colores.slice(0, Math.min(cantidad, 10));
      
      case 'equipos':
        const equipos = ['🇲🇽 América', '🇲🇽 Chivas', '🇲🇽 Cruz Azul', '🇲🇽 Pumas', '🇲🇽 Tigres', 
                        '🇲🇽 Monterrey', '🇲🇽 Santos', '🇲🇽 Pachuca', '🇲🇽 Toluca', '🇲🇽 Atlas',
                        '🇪🇸 Real Madrid', '🇪🇸 Barcelona', '🇪🇸 Atlético', '🇮🇹 Juventus', '🇮🇹 Milan',
                        '🇩🇪 Bayern', '🇬🇧 Manchester United', '🇬🇧 Liverpool', '🇫🇷 PSG', '🇧🇷 Flamengo'];
        return equipos.slice(0, Math.min(cantidad, 20));
      
      case 'emojis':
        const emojis = [
          // Caras y emociones
          '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
          '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
          '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
          // Animales
          '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
          '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔',
          // Comida
          '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
          '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
          // Actividades
          '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🪀',
          '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁',
          // Objetos
          '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿',
          '📀', '🧮', '🎥', '📷', '📸', '📹', '🎬', '📺', '📻', '🎙️',
          // Símbolos y misceláneos
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

  const agregarRifa = async () => {
    if (nuevaRifa.nombre && nuevaRifa.precio) {
      try {
        // Extraer todas las fotos de todos los premios con información del premio
        const todasLasFotos = [];
        if (nuevaRifa.premios && nuevaRifa.premios.length > 0) {
          nuevaRifa.premios.forEach((premio, premioIndex) => {
            console.log(`🔍 Debug - Premio ${premioIndex}:`, { 
              nombre: premio.nombre, 
              tieneFotos: !!premio.fotos, 
              cantidadFotos: premio.fotos?.length || 0,
              fotos: premio.fotos 
            });
            if (premio.fotos && premio.fotos.length > 0) {
              premio.fotos.forEach((foto, fotoIndex) => {
                // Solo agregar fotos que tengan URL válida (no localUrl temporal)
                const urlFinal = foto.url || foto.url_foto || '';
                // Filtrar URLs temporales (blob:)
                if (urlFinal && !urlFinal.startsWith('blob:') && (urlFinal.startsWith('http') || urlFinal.startsWith('/'))) {
                  todasLasFotos.push({
                    url: urlFinal,
                    url_foto: urlFinal,
                    descripcion: foto.descripcion || '',
                    orden: todasLasFotos.length,
                    premioIndex: premioIndex, // Índice del premio (temporal, se usará para obtener el ID después)
                    premioNombre: premio.nombre || `Premio ${premioIndex + 1}`, // Nombre del premio para mostrar
                    fotoIndex: fotoIndex // Índice de la foto dentro del premio
                  });
                  console.log(`🔍 Debug - Foto ${fotoIndex} del Premio ${premioIndex + 1} agregada:`, urlFinal);
                } else {
                  console.warn(`⚠️ Foto ${fotoIndex} omitida (URL inválida o temporal):`, urlFinal);
                }
              });
            }
          });
        }

        const rifaData = {
          ...nuevaRifa,
          cantidadElementos: nuevaRifa.cantidadNumeros, // Mapear cantidadNumeros a cantidadElementos
          elementosPersonalizados: nuevaRifa.tipo === 'numeros' 
            ? generarElementosRifa(nuevaRifa.tipo, nuevaRifa.cantidadNumeros)
            : nuevaRifa.elementosPersonalizados,
          premios: nuevaRifa.premios || [],
          fotosPremios: todasLasFotos.length > 0 ? todasLasFotos : (nuevaRifa.fotosPremios || []),
          formasPago: nuevaRifa.formasPago || {}
        };

        console.log('🔍 Debug - Datos de la rifa a crear:', rifaData);
        console.log('🔍 Debug - Premios con fotos:', nuevaRifa.premios?.map(p => ({ nombre: p.nombre, fotos: p.fotos?.length || 0 })));
        console.log('🔍 Debug - Fotos extraídas:', todasLasFotos);
        console.log('🔍 Debug - Token actual:', localStorage.getItem('token'));

        // Usar el contexto de rifas en lugar del servicio directo
        const response = await createRifa(rifaData);
        
        if (response.success) {
          // Limpiar formulario
          setNuevaRifa({ 
            nombre: '', 
            descripcion: '', 
            precio: '', 
            fechaFin: '',
            tipo: 'numeros',
            cantidadNumeros: 100,
            premios: [],
            reglas: '',
            fotosPremios: [],
            formasPago: {
              transferencia: false,
              clabe: '',
              banco: '',
              numeroCuenta: '',
              nombreTitular: '',
              telefono: '',
              whatsapp: ''
            },
            esPrivada: false,
            creadorId: null,
            // Campos de ubicación reseteados
            pais: '',
            estado: '',
            ciudad: '',
            manejaEnvio: false,
            alcance: 'local'
          });
          return response.rifa.id;
        }
        return null;
      } catch (error) {
        console.error('Error creando rifa:', error);
        return null;
      }
    }
    return null;
  };

  // Manejar cambio de tipo de rifa
  const manejarCambioTipo = (nuevoTipo) => {
    const tipoInfo = tiposRifas[nuevoTipo];
    const elementosIniciales = generarElementosRifa(nuevoTipo, tipoInfo.cantidadDefault);
    
    setNuevaRifa({
      ...nuevaRifa,
      tipo: nuevoTipo,
      cantidadNumeros: tipoInfo.cantidadDefault,
      elementosPersonalizados: elementosIniciales
    });
  };

  // Manejar elementos personalizados
  const actualizarElemento = (index, nuevoValor) => {
    const nuevosElementos = [...nuevaRifa.elementosPersonalizados];
    nuevosElementos[index] = nuevoValor;
    setNuevaRifa({
        ...nuevaRifa,
      elementosPersonalizados: nuevosElementos
    });
  };

  const agregarElemento = () => {
    let nuevoElemento;
    if (nuevaRifa.tipo === 'emojis') {
      // Agregar un emoji aleatorio de la lista
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
  };

  const eliminarElemento = (index) => {
    const nuevosElementos = nuevaRifa.elementosPersonalizados.filter((_, i) => i !== index);
    setNuevaRifa({
      ...nuevaRifa,
      elementosPersonalizados: nuevosElementos,
      cantidadNumeros: nuevosElementos.length
    });
  };

  const resetearElementos = () => {
    const elementosIniciales = generarElementosRifa(nuevaRifa.tipo, tiposRifas[nuevaRifa.tipo].cantidadDefault);
    setNuevaRifa({
      ...nuevaRifa,
      elementosPersonalizados: elementosIniciales,
      cantidadNumeros: elementosIniciales.length
    });
  };

  const agregarPremio = () => {
    const nuevoPremio = {
      id: Date.now(),
      nombre: '',
      descripcion: '',
      posicion: nuevaRifa.premios.length + 1,
      fotos: []
    };
    setNuevaRifa({
      ...nuevaRifa,
      premios: [...nuevaRifa.premios, nuevoPremio]
    });
  };

  const actualizarPremio = (index, campo, valor) => {
    const nuevosPremios = [...nuevaRifa.premios];
    nuevosPremios[index] = { ...nuevosPremios[index], [campo]: valor };
    setNuevaRifa({
      ...nuevaRifa,
      premios: nuevosPremios
    });
  };

  const eliminarPremio = (index) => {
    setNuevaRifa({
      ...nuevaRifa,
      premios: nuevaRifa.premios.filter((_, i) => i !== index)
    });
  };

  const manejarFotosPremios = (event) => {
    const archivos = Array.from(event.target.files);
    const fotos = archivos.map(archivo => ({
      id: Date.now() + Math.random(),
      nombre: archivo.name,
      archivo: archivo,
      url: URL.createObjectURL(archivo)
    }));
    setNuevaRifa({
      ...nuevaRifa,
      fotosPremios: [...nuevaRifa.fotosPremios, ...fotos]
    });
  };

  const eliminarFoto = (id) => {
    setNuevaRifa({
      ...nuevaRifa,
      fotosPremios: nuevaRifa.fotosPremios.filter(foto => foto.id !== id)
    });
  };

  const actualizarFormaPago = (campo, valor) => {
    setNuevaRifa({
      ...nuevaRifa,
      formasPago: {
        ...nuevaRifa.formasPago,
        [campo]: valor
      }
    });
  };

  // Nota: No hacemos early-return para permitir acceso a rutas públicas como /portal y /public/:id

  // Botón temporal para limpiar localStorage y ver landing page
  const clearStorageAndReload = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="App">
        {/* Top Navigation Bar */}
        <nav className="top-nav">
          <div className="top-nav-container">
            {/* Logo Section */}
            <div className="nav-logo">
              <span className="logo-icon">🎫</span>
              <div className="logo-text">
                <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SorteoHub</h1>
              </div>
            </div>

            {/* Hamburger Menu Button - Solo móvil */}
            <button className="hamburger-btn" onClick={toggleMenu}>
              <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
              <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
              <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
            </button>

            {/* Language Switcher */}
            <div className="nav-language desktop-only">
              <LanguageSwitcher />
            </div>

            {/* Navigation Links - Desktop */}
            <div className="nav-links desktop-only">
              {isAdmin ? (
                <>
                  <Link 
                    to="/" 
                    className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
                    onClick={closeMenus}
                  >
                    <span className="nav-icon">🏠</span>
                    <span>{t('nav.home')}</span>
                  </Link>
                  <Link 
                    to="/gestionar" 
                    className={`nav-item ${location.pathname === '/gestionar' ? 'active' : ''}`}
                    onClick={closeMenus}
                  >
                    <span className="nav-icon">⚙️</span>
                    <span>{t('nav.createRaffle')}</span>
                  </Link>
                </>
              ) : advertiser ? (
                <>
                  <Link 
                    to="/portal" 
                    className={`nav-item ${location.pathname === '/portal' ? 'active' : ''}`}
                    onClick={closeMenus}
                  >
                    <span className="nav-icon">🎟️</span>
                    <span>{t('nav.viewRaffles')}</span>
                  </Link>
                  <Link 
                    to="/consulta-ganadores" 
                    className={`nav-item ${location.pathname === '/consulta-ganadores' ? 'active' : ''}`}
                    onClick={closeMenus}
                  >
                    <span className="nav-icon">🔎</span>
                    <span>{t('nav.checkWinners')}</span>
                  </Link>
                  <Link 
                    to="/anunciantes" 
                    className={`nav-item ${location.pathname === '/anunciantes' ? 'active' : ''}`}
                    onClick={closeMenus}
                  >
                    <span className="nav-icon">📊</span>
                    <span>{t('nav.myPortal')}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/portal" 
                    className={`nav-item ${location.pathname === '/portal' ? 'active' : ''}`}
                    onClick={closeMenus}
                  >
                    <span className="nav-icon">🎟️</span>
                    <span>{t('nav.viewRaffles')}</span>
                  </Link>
                  <Link 
                    to="/consulta-ganadores" 
                    className={`nav-item ${location.pathname === '/consulta-ganadores' ? 'active' : ''}`}
                    onClick={closeMenus}
                  >
                    <span className="nav-icon">🔎</span>
                    <span>{t('nav.checkWinners')}</span>
                  </Link>
                  <Link 
                    to="/anunciantes" 
                    className={`nav-item ${location.pathname === '/anunciantes' ? 'active' : ''}`}
                    onClick={closeMenus}
                  >
                    <span className="nav-icon">📣</span>
                    <span>{t('nav.forAdvertisers')}</span>
                  </Link>
                </>
              )}
            </div>

            {/* User Section */}
            <div className="nav-user">
              {user ? (
                <>
                  <button className="user-menu-btn" onClick={toggleUserMenu}>
                    <span className="user-avatar">👤</span>
                    <span className="user-name-mobile">{user.nombre}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="user-dropdown">
                      <div className="user-info">
                        <span className="user-name">{t('nav.hello')}, {user.nombre}!</span>
                        <span className="user-role">
                          {user.rol === 'admin' ? t('nav.admin') : t('nav.guest')}
                        </span>
                      </div>
                      <Link to="/salir" className="logout-btn">
                        <span className="logout-icon">🚪</span>
                        <span>{t('nav.logout')}</span>
                      </Link>
                    </div>
                  )}
                </>
              ) : advertiser ? (
                <>
                  <button className="user-menu-btn" onClick={toggleUserMenu}>
                    <span className="user-avatar">📣</span>
                    <span className="user-name-mobile">{advertiser.nombre_comercial || advertiser.nombre}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="user-dropdown">
                      <div className="user-info">
                        <span className="user-name">{t('nav.hello')}, {advertiser.nombre_comercial || advertiser.nombre}!</span>
                        <span className="user-role">{t('nav.advertiser')}</span>
                      </div>
                      <Link 
                        to="/anunciantes" 
                        className="menu-item-btn"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <span style={{ marginRight: '0.5rem' }}>📊</span>
                        <span>{t('nav.myPortal')}</span>
                      </Link>
                      <button 
                        onClick={() => {
                          setShowBusinessProfileModal(true);
                          setIsUserMenuOpen(false);
                        }} 
                        className="menu-item-btn"
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1rem', color: '#1e293b', fontWeight: 500 }}
                      >
                        <span style={{ marginRight: '0.5rem' }}>⚙️</span>
                        <span>{t('nav.settings')}</span>
                      </button>
                      <button onClick={handleAdvertiserLogout} className="logout-btn" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <span className="logout-icon">🚪</span>
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="guest-actions">
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="mobile-menu-overlay" onClick={closeMenus}>
              <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-menu-header">
                  <h3>{t('nav.menu')}</h3>
                  <button className="close-menu-btn" onClick={closeMenus}>✕</button>
                </div>
                <div className="mobile-menu-links">
                  {isAdmin ? (
                    <>
                      <Link 
                        to="/" 
                        className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span className="nav-icon">🏠</span>
                        <span>{t('nav.home')}</span>
                      </Link>
                      <Link 
                        to="/gestionar" 
                        className={`mobile-nav-item ${location.pathname === '/gestionar' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span className="nav-icon">⚙️</span>
                        <span>{t('nav.createRaffle')}</span>
                      </Link>
                    </>
                  ) : advertiser ? (
                    <>
                      <Link 
                        to="/portal" 
                        className={`mobile-nav-item ${location.pathname === '/portal' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span className="nav-icon">🎟️</span>
                        <span>{t('nav.viewRaffles')}</span>
                      </Link>
                      <Link 
                        to="/consulta-ganadores" 
                        className={`mobile-nav-item ${location.pathname === '/consulta-ganadores' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span className="nav-icon">🔎</span>
                        <span>{t('nav.checkWinners')}</span>
                      </Link>
                      <Link 
                        to="/anunciantes" 
                        className={`mobile-nav-item ${location.pathname === '/anunciantes' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span className="nav-icon">📊</span>
                        <span>{t('nav.myPortal')}</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/portal" 
                        className={`mobile-nav-item ${location.pathname === '/portal' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span className="nav-icon">🎟️</span>
                        <span>{t('nav.viewRaffles')}</span>
                      </Link>
                      <Link 
                        to="/consulta-ganadores" 
                        className={`mobile-nav-item ${location.pathname === '/consulta-ganadores' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span className="nav-icon">🔎</span>
                        <span>{t('nav.checkWinners')}</span>
                      </Link>
                      <Link 
                        to="/anunciantes" 
                        className={`mobile-nav-item ${location.pathname === '/anunciantes' ? 'active' : ''}`}
                        onClick={closeMenus}
                      >
                        <span className="nav-icon">📣</span>
                        <span>{t('nav.forAdvertisers')}</span>
                      </Link>
                    </>
                  )}
                  {user && (
                    <div className="mobile-user-section">
                      <div className="mobile-user-info">
                        <span className="mobile-user-name">{t('nav.hello')}, {user.nombre}!</span>
                        <span className="mobile-user-role">
                          {user.rol === 'admin' ? t('nav.admin') : t('nav.guest')}
                        </span>
                      </div>
                      <Link to="/salir" className="mobile-logout-btn">
                        <span className="logout-icon">🚪</span>
                        <span>{t('nav.logout')}</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Business Profile Modal */}
        {advertiser && (
          <BusinessProfileModal 
            isOpen={showBusinessProfileModal}
            onClose={() => setShowBusinessProfileModal(false)}
            advertiserId={advertiser.id}
          />
        )}

        <Routes>
          <Route path="/anunciantes" element={<AdvertiserPortal />} />
          <Route path="/anunciantes/registro" element={<AdvertiserPortal />} />
          <Route path="/negocio/:id" element={<BusinessProfile />} />
          <Route path="/" element={
            <main className="App-main">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner">⏳</div>
                  <p>{t('common.loading')}</p>
                </div>
              ) : isAdmin ? (
                <UserDashboard />
              ) : (
                <Navigate to="/landing" replace />
              )}
            </main>
          } />
          <Route path="/landing" element={
            <main className="App-main">
              <LandingPage />
              <Footer />
            </main>
          } />
          <Route path="/salir" element={<LogoutRoute />} />
          <Route path="/gestionar" element={
            <ProtectedRoute requireAdmin={true}>
              <main className="App-main">
                <CreateRifaWizard
                  nuevaRifa={nuevaRifa}
                  setNuevaRifa={setNuevaRifa}
                  tiposRifas={tiposRifas}
                  manejarCambioTipo={manejarCambioTipo}
                  agregarRifa={agregarRifa}
                  agregarPremio={agregarPremio}
                  actualizarPremio={actualizarPremio}
                  eliminarPremio={eliminarPremio}
                  manejarFotosPremios={manejarFotosPremios}
                  eliminarFoto={eliminarFoto}
                  actualizarFormaPago={actualizarFormaPago}
                />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/gestionar/:id" element={
            <ProtectedRoute requireAdmin={true}>
              <RifaManagement rifas={myRifas} setRifas={() => {}} />
            </ProtectedRoute>
          } />
          <Route path="/participantes/:id" element={
            <ProtectedRoute requireAdmin={true}>
              <ParticipantesPage />
            </ProtectedRoute>
          } />
          <Route path="/public/:id" element={<PublicRifaView rifas={publicRifas} />} />
          <Route path="/portal" element={<RafflePortal />} />
          <Route path="/consulta-ganadores" element={<NumeroCheckerPage />} />
          <Route path="/planes" element={<CreatorPlans />} />
          <Route path="/cupones" element={<AllCuponesPage />} />
          <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
          <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/politica-cookies" element={<PoliticaCookies />} />
          <Route path="/aviso-legal" element={<AvisoLegal />} />
          <Route path="/preview/:id" element={<RifaPreview />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requireAdmin={true}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/participar/:id" element={<ParticipateRaffle rifas={publicRifas} setRifas={() => {}} />} />
          <Route path="/participante/:rifaId/:participanteId" element={<ParticipanteView />} />
        </Routes>
    </div>
  );
}

// Componente principal que envuelve todo con los providers
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RifasProvider>
          <Router>
            <AppWithRouter />
          </Router>
          <NotificationToast />
          <ConfirmDialog />
          <CookieBanner />
        </RifasProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
