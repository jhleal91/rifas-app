import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { showSuccess, showError, showWarning, showConfirm, showDangerConfirm } from '../utils/swal';
import { API_BASE } from '../config/api';

const RifaManagement = ({ rifas, setRifas }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [rifa, setRifa] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [nuevoParticipante, setNuevoParticipante] = useState({
    nombre: '',
    telefono: '',
    email: '',
    numeros: []
  });
  const [numerosSeleccionados, setNumerosSeleccionados] = useState([]);
  const [mostrarModalVenta, setMostrarModalVenta] = useState(false);
  const [tipoVenta, setTipoVenta] = useState('individual'); // 'individual' o 'multiple'
  const [participantesVenta, setParticipantesVenta] = useState([]);
  const [mismoNombre, setMismoNombre] = useState(false);
  const [mostrarFormaPago, setMostrarFormaPago] = useState(false);
  const [formaPago, setFormaPago] = useState({
    banco: '',
    clabe: '',
    numero_cuenta: '',
    nombre_titular: '',
    telefono: '',
    whatsapp: '',
    otros_detalles: ''
  });
  const [numeroGanador, setNumeroGanador] = useState('');
  const [resultadoPublicado, setResultadoPublicado] = useState(false);

  // Función para obtener elementos disponibles basado en la estructura del backend
  const obtenerElementosDisponibles = (rifa) => {
    if (!rifa) return [];
    
    // Si tiene elementos_personalizados, usarlos
    if (rifa.elementos_personalizados && Array.isArray(rifa.elementos_personalizados)) {
      return rifa.elementos_personalizados;
    }
    
    // Si es tipo numeros y no tiene elementos_personalizados, generar números
    if (rifa.tipo === 'numeros') {
      const cantidad = rifa.cantidad_elementos || 100;
      return Array.from({ length: cantidad }, (_, i) => (i + 1).toString());
    }
    
    // Fallback: array vacío
    return [];
  };

  useEffect(() => {
    if (id) {
      // Cargar datos completos desde el backend
      cargarDatosRifa();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Efecto separado para generar QR cuando la rifa esté cargada
  useEffect(() => {
    if (rifa && rifa.id) {
      generarQR(rifa.id);
    }
  }, [rifa]);

  const generarQR = async (rifaId) => {
    try {
      const url = `${window.location.origin}/public/${rifaId}`;
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCode(qrCodeDataURL);
    } catch (err) {
      console.error('Error generando QR:', err);
    }
  };

  const seleccionarNumero = (numero) => {
    if (numerosSeleccionados.includes(numero)) {
      setNumerosSeleccionados(numerosSeleccionados.filter(n => n !== numero));
    } else {
      setNumerosSeleccionados([...numerosSeleccionados, numero]);
    }
  };

  const venderNumeros = () => {
    if (numerosSeleccionados.length === 0) {
      showWarning(t('rifaManagement.alerts.selectNumbers.title'), t('rifaManagement.alerts.selectNumbers.message'));
      return;
    }
    
    // Si hay datos en los campos, hacer venta directa
    if (nuevoParticipante.nombre.trim()) {
      venderDirecto();
      return;
    }
    
    // Si no hay datos, abrir modal para elegir tipo de venta
    setMismoNombre(false);
    
    // Inicializar participantes según el tipo de venta actual
    if (tipoVenta === 'multiple') {
      const nuevosParticipantes = numerosSeleccionados.map((numero, index) => ({
        id: `temp_${index}`,
        nombre: '',
        telefono: '',
        numeros: [numero]
      }));
      setParticipantesVenta(nuevosParticipantes);
    } else {
      // Venta individual - un participante con todos los números
      setParticipantesVenta([{
        id: 'temp_0',
        nombre: '',
        telefono: '',
        numeros: numerosSeleccionados
      }]);
    }
    
    setMostrarModalVenta(true);
  };

  // Función para venta directa (sin modal)
  const venderDirecto = async () => {
    if (!nuevoParticipante.nombre.trim()) {
      showWarning(t('rifaManagement.alerts.nameRequired.title'), t('rifaManagement.alerts.nameRequired.message'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const participanteData = {
        nombre: nuevoParticipante.nombre,
        telefono: nuevoParticipante.telefono || '',
        email: nuevoParticipante.email || '',
        numerosSeleccionados: numerosSeleccionados
      };

      // Usar el nuevo endpoint de venta directa para administradores
      const response = await fetch(`${API_BASE}/participantes/${rifa.id}/vender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(participanteData)
      });

      const result = await response.json();
      
      if (response.ok && result.message) {
        // Limpiar formulario
        setNuevoParticipante({ nombre: '', telefono: '', email: '', numeros: [] });
        setNumerosSeleccionados([]);
        
        // Recargar datos desde el backend
        await recargarDatosRifa();
        
        const total = parseFloat(rifa.precio) * numerosSeleccionados.length;
        await showSuccess(
          t('rifaManagement.alerts.directSaleSuccess.title'),
          t('rifaManagement.alerts.directSaleSuccess.message', { count: numerosSeleccionados.length, total: total.toFixed(2) })
        );
      } else {
        showError(t('rifaManagement.alerts.saleError.title'), result.error || t('rifaManagement.alerts.saleError.unknown'));
      }
    } catch (error) {
      console.error('Error vendiendo números:', error);
      showError(t('rifaManagement.alerts.saleError.title'), t('rifaManagement.alerts.saleError.message'));
    }
  };

  // Funciones para el modal de venta
  const actualizarParticipante = (index, campo, valor) => {
    const nuevosParticipantes = [...participantesVenta];
    nuevosParticipantes[index][campo] = valor;
    setParticipantesVenta(nuevosParticipantes);
  };

  const aplicarMismoNombre = (nombre) => {
    const nuevosParticipantes = participantesVenta.map(p => ({
      ...p,
      nombre: nombre
    }));
    setParticipantesVenta(nuevosParticipantes);
  };

  const cambiarTipoVenta = (nuevoTipo) => {
    setTipoVenta(nuevoTipo);
    setMismoNombre(false);
    
    // Reorganizar participantes según el nuevo tipo
    if (nuevoTipo === 'multiple') {
      const nuevosParticipantes = numerosSeleccionados.map((numero, index) => ({
        id: `temp_${index}`,
        nombre: '',
        telefono: '',
        numeros: [numero]
      }));
      setParticipantesVenta(nuevosParticipantes);
    } else {
      // Venta individual - un participante con todos los números
      setParticipantesVenta([{
        id: 'temp_0',
        nombre: '',
        telefono: '',
        numeros: numerosSeleccionados
      }]);
    }
  };

  // Función para cargar datos de la rifa desde el backend (carga inicial)
  const cargarDatosRifa = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/rifas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const rifaActualizada = result.rifa;
        console.log(JSON.stringify(rifaActualizada));
        
        // Usar los números vendidos y reservados que ya vienen del backend
        const rifaCompleta = {
          ...rifaActualizada,
          // Usar los arrays que ya vienen del backend
          numerosReservados: rifaActualizada.numerosReservados || [],
          numerosVendidos: rifaActualizada.numerosVendidos || [],
          participantes: rifaActualizada.participantes || [],
          // Usar elementos disponibles del backend
          numerosDisponibles: obtenerElementosDisponibles(rifaActualizada),
          // Mapear estadísticas numéricas del backend
          totalElementosReservados: parseInt(rifaActualizada.estadisticas?.elementos_reservados || 0),
          totalElementosVendidos: parseInt(rifaActualizada.estadisticas?.elementos_vendidos || 0),
          totalParticipantes: parseInt(rifaActualizada.estadisticas?.total_participantes || 0),
          totalRecaudado: parseFloat(rifaActualizada.estadisticas?.total_recaudado || 0)
        };
        
        console.log('RifaManagement - Datos cargados:', {
          elementos_personalizados: rifaCompleta.elementos_personalizados,
          numerosVendidos: rifaCompleta.numerosVendidos,
          numerosReservados: rifaCompleta.numerosReservados,
          participantes: rifaCompleta.participantes
        });
        
        setRifa(rifaCompleta);
        setNumeroGanador(rifaActualizada.numero_ganador || '');
        setResultadoPublicado(!!rifaActualizada.resultado_publicado);
        
        // Cargar formas de pago si existen
        const formasPagoArray = Array.isArray(rifaActualizada.formasPago) 
          ? rifaActualizada.formasPago 
          : (rifaActualizada.formasPago ? [rifaActualizada.formasPago] : []);
        const formaPagoExistente = formasPagoArray.find(fp => fp.tipo_pago === 'transferencia') || formasPagoArray[0];
        
        if (formaPagoExistente) {
          setFormaPago({
            banco: formaPagoExistente.banco || '',
            clabe: formaPagoExistente.clabe || '',
            numero_cuenta: formaPagoExistente.numero_cuenta || '',
            nombre_titular: formaPagoExistente.nombre_titular || '',
            telefono: formaPagoExistente.telefono || '',
            whatsapp: formaPagoExistente.whatsapp || '',
            otros_detalles: formaPagoExistente.otros_detalles || ''
          });
        }
        
        // También actualizar en la lista de rifas
        const rifasActualizadas = rifas.map(r => 
          r.id === id ? rifaCompleta : r
        );
        setRifas(rifasActualizadas);
      } else {
        console.error('Error cargando rifa:', response.status, response.statusText);
        setRifa(null);
      }
    } catch (error) {
      console.error('Error cargando datos de la rifa:', error);
      setRifa(null);
    }
  };

  // Función para recargar datos de la rifa desde el backend (actualización)
  const recargarDatosRifa = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/rifas/${rifa.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const rifaActualizada = result.rifa;
        
        // Usar los números vendidos y reservados que ya vienen del backend
        const rifaCompleta = {
          ...rifaActualizada,
          // Usar los arrays que ya vienen del backend
          numerosReservados: rifaActualizada.numerosReservados || [],
          numerosVendidos: rifaActualizada.numerosVendidos || [],
          participantes: rifaActualizada.participantes || [],
          // Usar elementos disponibles del backend
          numerosDisponibles: obtenerElementosDisponibles(rifaActualizada),
          // Mapear estadísticas numéricas del backend
          totalElementosReservados: parseInt(rifaActualizada.estadisticas?.elementos_reservados || 0),
          totalElementosVendidos: parseInt(rifaActualizada.estadisticas?.elementos_vendidos || 0),
          totalParticipantes: parseInt(rifaActualizada.estadisticas?.total_participantes || 0),
          totalRecaudado: parseFloat(rifaActualizada.estadisticas?.total_recaudado || 0)
        };
        
        setRifa(rifaCompleta);
        
        // También actualizar en la lista de rifas
        const rifasActualizadas = rifas.map(r => 
          r.id === rifa.id ? rifaCompleta : r
        );
        setRifas(rifasActualizadas);
        
        // Retornar la rifa actualizada para poder usar sus valores
        return rifaCompleta;
      }
    } catch (error) {
      console.error('Error recargando datos de la rifa:', error);
      return null;
    }
  };

  const procesarVenta = async () => {
    // Validar que todos los participantes tengan nombre
    const participantesSinNombre = participantesVenta.filter(p => !p.nombre.trim());
    if (participantesSinNombre.length > 0) {
      showWarning(t('rifaManagement.alerts.nameRequired.title'), t('rifaManagement.alerts.nameRequired.allRequired'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let ventasExitosas = 0;

      // Procesar cada participante
      for (const participante of participantesVenta) {
        const participanteData = {
          nombre: participante.nombre,
          telefono: participante.telefono || '',
          numerosSeleccionados: participante.numeros,
          estado: 'confirmado'
        };

        const response = await fetch(`${API_BASE}/participantes/${rifa.id}/vender`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(participanteData)
        });

        const result = await response.json();

        if (response.ok && result.message) {
          ventasExitosas++;
        } else {
          console.error('Error vendiendo para', participante.nombre, result.error);
        }
      }

      if (ventasExitosas > 0) {
        setNumerosSeleccionados([]);
        setMostrarModalVenta(false);
        
        // Recargar datos desde el backend para obtener información actualizada
        await recargarDatosRifa();
        
        await showSuccess(
          t('rifaManagement.alerts.directSaleSuccess.title'),
          t('rifaManagement.alerts.directSaleSuccess.multipleParticipants', { count: ventasExitosas })
        );
      } else {
        showError(t('rifaManagement.alerts.saleError.title'), t('rifaManagement.alerts.saleError.noneProcessed'));
      }
    } catch (error) {
      console.error('Error procesando venta:', error);
      showError(t('rifaManagement.alerts.saleError.title'), t('rifaManagement.alerts.saleError.message'));
    }
  };

  const descargarQR = () => {
    const link = document.createElement('a');
    link.download = `qr-rifa-${rifa.nombre}.png`;
    link.href = qrCode;
    link.click();
  };

  // Función para guardar formas de pago
  const guardarFormaPago = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Preparar los datos a enviar
      const datosFormaPago = {
        tipo_pago: 'transferencia',
        banco: formaPago.banco || null,
        clabe: formaPago.clabe || null,
        numero_cuenta: formaPago.numero_cuenta || null,
        nombre_titular: formaPago.nombre_titular || null,
        telefono: formaPago.telefono || null,
        whatsapp: formaPago.whatsapp || null,
        otros_detalles: formaPago.otros_detalles || null
      };
      
      console.log('📤 Enviando formas de pago:', datosFormaPago);
      console.log('📤 Estado actual de formaPago:', formaPago);
      
      const response = await fetch(`${API_BASE}/rifas/${rifa.id}/formas-pago`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosFormaPago)
      });

      if (response.ok) {
        await response.json();
        await showSuccess(t('rifaManagement.alerts.paymentSaved.title'), t('rifaManagement.alerts.paymentSaved.message'));
        setMostrarFormaPago(false);
        await recargarDatosRifa();
      } else {
        const errorData = await response.json();
        showError(t('rifaManagement.alerts.paymentError.title'), errorData.error || t('rifaManagement.alerts.paymentError.unknown'));
      }
    } catch (error) {
      console.error('Error guardando formas de pago:', error);
      showError(t('rifaManagement.alerts.paymentError.title'), t('rifaManagement.alerts.paymentError.message'));
    }
  };

  // Función para confirmar venta
  const confirmarVenta = async (participanteId) => {
    const confirmed = await showConfirm(
      t('rifaManagement.alerts.confirmSale.title'),
      t('rifaManagement.alerts.confirmSale.message'),
      {
        confirmText: t('rifaManagement.alerts.confirmSale.confirm'),
        cancelText: t('rifaManagement.alerts.confirmSale.cancel'),
        icon: 'question',
        confirmColor: '#10b981'
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/participantes/${rifa.id}/confirmar-venta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ participanteId })
      });

      const result = await response.json();
      
      if (response.ok && result.message) {
        // Recargar datos desde el backend
        await recargarDatosRifa();
        await showSuccess(t('rifaManagement.alerts.saleConfirmed.title'), t('rifaManagement.alerts.saleConfirmed.message'));
      } else {
        showError(t('rifaManagement.alerts.confirmError.title'), result.error || t('rifaManagement.alerts.confirmError.unknown'));
      }
    } catch (error) {
      console.error('Error confirmando venta:', error);
      showError(t('rifaManagement.alerts.confirmError.title'), t('rifaManagement.alerts.confirmError.message'));
    }
  };

  const guardarResultado = async () => {
    if (!rifa) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/rifas/${rifa.id}/resultado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ numero_ganador: numeroGanador || null, resultado_publicado: resultadoPublicado })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      await showSuccess(t('rifaManagement.alerts.resultUpdated.title'), t('rifaManagement.alerts.resultUpdated.message'));
      await recargarDatosRifa();
    } catch (e) {
      console.error('Error guardando resultado:', e);
      showError(t('rifaManagement.alerts.resultError.title'), t('rifaManagement.alerts.resultError.message'));
    }
  };

  const rechazarPago = (participanteId) => {
    if (!rifa.participantes || !Array.isArray(rifa.participantes)) return;
    
    const participante = rifa.participantes.find(p => p.id === participanteId);
    if (!participante) return;

    const rifaActualizada = {
      ...rifa,
      participantes: rifa.participantes.filter(p => p.id !== participanteId),
      numerosReservados: (rifa.numerosReservados || []).filter(
        numero => !participante.numerosSeleccionados.includes(numero)
      )
    };

    const rifasActualizadas = rifas.map(r => 
      r.id === rifa.id ? rifaActualizada : r
    );

    setRifas(rifasActualizadas);
    setRifa(rifaActualizada);
  };

  const eliminarRifa = async () => {
    if (!rifa) return;

    // Confirmar eliminación (baja lógica)
    const confirmed = await showDangerConfirm(
      t('rifaManagement.alerts.deleteRifa.title'),
      t('rifaManagement.alerts.deleteRifa.message', { name: rifa.nombre }),
      {
        confirmText: t('rifaManagement.alerts.deleteRifa.confirm'),
        cancelText: t('rifaManagement.alerts.deleteRifa.cancel')
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError(t('rifaManagement.alerts.deleteError.title'), t('rifaManagement.alerts.deleteError.sessionExpired'));
        navigate('/');
        return;
      }

      const res = await fetch(`${API_BASE}/rifas/${rifa.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          showError(t('rifaManagement.alerts.deleteError.noPermissions'), t('rifaManagement.alerts.deleteError.noPermissionsMessage'));
        } else if (res.status === 404) {
          showError(t('rifaManagement.alerts.deleteError.notFound'), t('rifaManagement.alerts.deleteError.notFoundMessage'));
        } else {
          showError(t('rifaManagement.alerts.deleteError.title'), data.error || t('rifaManagement.alerts.deleteError.message'));
        }
        return;
      }

      // Mostrar mensaje de éxito
      await showSuccess(t('rifaManagement.alerts.deleteSuccess.title'), t('rifaManagement.alerts.deleteSuccess.message'));

      // Redirigir al dashboard (el contexto se actualizará automáticamente)
      navigate('/');
    } catch (error) {
      console.error('Error eliminando rifa:', error);
      showError(t('rifaManagement.alerts.deleteError.title'), t('rifaManagement.alerts.deleteError.message'));
    }
  };

  if (!rifa) {
    return (
      <div className="management-container rifa-management">
        <div className="header-top">
          <Link to="/" className="btn-back-to-rifas">
            {t('rifaManagement.notFound.backToDashboard')}
          </Link>
        </div>
        <h2>{t('rifaManagement.notFound.title')}</h2>
        <Link to="/" className="btn-primary">{t('rifaManagement.notFound.backToHome')}</Link>
      </div>
    );
  }

  return (
    <div className="management-container rifa-management">
      <div className="header-top">
        <Link to="/" className="btn-back-to-rifas">
          {t('rifaManagement.notFound.backToDashboard')}
        </Link>
      </div>
      <div className="management-header">
        <h2>{t('rifaManagement.header.title')} {rifa.nombre}</h2>
        <div className="header-actions">
          <button onClick={recargarDatosRifa} className="btn-secondary">
            {t('rifaManagement.header.updateData')}
          </button>
          <button onClick={eliminarRifa} className="btn-danger">
            {t('rifaManagement.header.deleteRifa')}
          </button>
          <Link to="/" className="btn-secondary">{t('rifaManagement.header.back')}</Link>
        </div>
      </div>

      <div className="management-content">
        <div className="qr-section">
          <h3>{t('rifaManagement.share.title')}</h3>
          <div className="qr-container">
            {qrCode && (
              <>
                <img src={qrCode} alt="QR Code" className="qr-image" />
                <p className="qr-url">{window.location.origin}/public/{rifa.id}</p>
                <button onClick={descargarQR} className="btn-primary">
                  {t('rifaManagement.share.downloadQR')}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="venta-section">
          <h3>{t('rifaManagement.sell.title')}</h3>
          <div className="venta-form">
            <div className="form-group">
              <label>{t('rifaManagement.sell.participantName')}</label>
              <input
                type="text"
                placeholder={t('rifaManagement.sell.participantNamePlaceholder')}
                value={nuevoParticipante.nombre}
                onChange={(e) => setNuevoParticipante({...nuevoParticipante, nombre: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>{t('rifaManagement.sell.phone')}</label>
              <input
                type="tel"
                placeholder={t('rifaManagement.sell.phonePlaceholder')}
                value={nuevoParticipante.telefono}
                onChange={(e) => setNuevoParticipante({...nuevoParticipante, telefono: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>{t('rifaManagement.sell.email')}</label>
              <input
                type="email"
                placeholder={t('rifaManagement.sell.emailPlaceholder')}
                value={nuevoParticipante.email}
                onChange={(e) => setNuevoParticipante({...nuevoParticipante, email: e.target.value})}
              />
            </div>
            
            <div className="numeros-seleccion">
              <h4>{t('rifaManagement.sell.selectedNumbers')} {numerosSeleccionados.length}</h4>
              <div className="numeros-grid">
                {rifa.elementos_personalizados.map(numero => {
                  // Convertir número a string para comparación
                  const numeroStr = String(numero);
                  const vendido = rifa.numerosVendidos.includes(numeroStr);
                  const reservado = (rifa.numerosReservados || []).includes(numeroStr);
                  const disponible = !vendido && !reservado;
                  
                  // Debug: log para los primeros números
                  if (numero <= 10) {
                    console.log(`Número ${numero} (${numeroStr}): vendido=${vendido}, reservado=${reservado}, disponible=${disponible}`);
                  }
                  
                  return (
                    <button
                      key={numero}
                      className={`numero-btn ${numerosSeleccionados.includes(numero) ? 'seleccionado' : 
                        vendido ? 'vendido' : 
                        reservado ? 'reservado' : 'disponible'}`}
                      onClick={() => disponible && seleccionarNumero(numero)}
                      disabled={!disponible}
                      title={vendido ? t('rifaManagement.sell.numberStates.sold') : reservado ? t('rifaManagement.sell.numberStates.reserved') : t('rifaManagement.sell.numberStates.available')}
                    >
                      {numero}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="venta-buttons">
              <button 
                onClick={venderNumeros} 
                className="btn-primary"
                disabled={numerosSeleccionados.length === 0}
              >
                {t('rifaManagement.sell.sellNumbers')} (${rifa.precio * numerosSeleccionados.length})
              </button>
              
              <button 
                onClick={() => {
                  setTipoVenta('multiple');
                  venderNumeros();
                }}
                className="btn-secondary"
                disabled={numerosSeleccionados.length === 0}
              >
                {t('rifaManagement.sell.multipleSale')}
              </button>
            </div>
          </div>
        </div>

        <div className="estadisticas-section">
          <h3>{t('rifaManagement.stats.title')}</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>{t('rifaManagement.stats.totalNumbers')}</h4>
              <p>{rifa.cantidad_elementos || rifa.numerosDisponibles.length}</p>
            </div>
            <div className="stat-card">
              <h4>{t('rifaManagement.stats.sold')}</h4>
              <p>{rifa.totalElementosVendidos || 0}</p>
            </div>
            <div className="stat-card">
              <h4>{t('rifaManagement.stats.available')}</h4>
              <p>{rifa.estadisticas?.elementos_disponibles || 
                rifa.elementos_personalizados.filter(n => 
                  !rifa.numerosVendidos.includes(String(n)) && 
                  !(rifa.numerosReservados || []).includes(String(n))
                ).length}</p>
            </div>
            <div className="stat-card">
              <h4>{t('rifaManagement.stats.reserved')}</h4>
              <p>{rifa.totalElementosReservados || 0}</p>
            </div>
            <div className="stat-card">
              <h4>{t('rifaManagement.stats.participants')}</h4>
              <p>{rifa.totalParticipantes || (rifa.participantes ? rifa.participantes.length : 0)}</p>
            </div>
            <div className="stat-card">
              <h4>{t('rifaManagement.stats.collected')}</h4>
              <p>${rifa.totalRecaudado || 0}</p>
            </div>
          </div>
        </div>

        {/* Resultado de la rifa */}
        <div className="formas-pago-management" style={{ marginTop: '1.5rem' }}>
          <div className="formas-pago-header">
            <h3>{t('rifaManagement.result.title')}</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('rifaManagement.result.winnerNumber')}</label>
              <input
                type="text"
                placeholder={t('rifaManagement.result.winnerNumberPlaceholder')}
                value={numeroGanador}
                onChange={(e) => setNumeroGanador(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={resultadoPublicado}
                  onChange={(e) => setResultadoPublicado(e.target.checked)}
                />
                <span>{t('rifaManagement.result.publishResult')}</span>
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={guardarResultado}>
              {t('rifaManagement.result.saveResult')}
            </button>
          </div>
          {rifa.numero_ganador && (
            <div className="pago-info-card" style={{ marginTop: '1rem' }}>
              <div className="pago-info-grid">
                <div className="pago-info-item">
                  <span className="pago-info-label">{t('rifaManagement.result.published')}</span>
                  <span className="pago-info-value">{rifa.resultado_publicado ? t('rifaManagement.result.yes') : t('rifaManagement.result.no')}</span>
                </div>
                <div className="pago-info-item">
                  <span className="pago-info-label">{t('rifaManagement.result.currentNumber')}</span>
                  <span className="pago-info-value">{rifa.numero_ganador}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección de Premios */}
        {rifa.premios && rifa.premios.length > 0 && (
          <div className="premios-management">
            <h3>{t('rifaManagement.prizes.title')}</h3>
            <div className="premios-list">
              {rifa.premios.map((premio, index) => (
                <div key={premio.id} className="premio-management">
                  <div className="premio-posicion">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div className="premio-info">
                    <h4>{premio.nombre}</h4>
                    {premio.descripcion && <p>{premio.descripcion}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección de Fotos */}
        <div className="fotos-management">
          <h3>{t('rifaManagement.photos.title')}</h3>
          {rifa.fotosPremios && rifa.fotosPremios.length > 0 ? (
            <div className="fotos-management-grid">
              {rifa.fotosPremios.map((foto, index) => (
                <div key={foto.id || index} className="foto-management">
                  <img src={foto.url || foto.url_foto} alt={foto.descripcion || t('rifaManagement.prizes.title')} />
                  {foto.descripcion && (
                    <div className="foto-description">{foto.descripcion}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-fotos-message">
              <p>{t('rifaManagement.photos.noPhotos')}</p>
              <small>{t('rifaManagement.photos.noPhotosHelp')}</small>
            </div>
          )}
        </div>

        {/* Sección de Reglas */}
        {rifa.reglas && (
          <div className="reglas-management">
            <h3>{t('rifaManagement.rules.title')}</h3>
            <div className="reglas-content">
              <p>{rifa.reglas}</p>
            </div>
          </div>
        )}

        {/* Sección de Formas de Pago */}
        <div className="formas-pago-management">
          <div className="formas-pago-header">
            <h3>{t('rifaManagement.payment.title')}</h3>
            <button 
              onClick={() => setMostrarFormaPago(!mostrarFormaPago)}
              className="btn-secondary"
            >
              {mostrarFormaPago ? t('rifaManagement.payment.cancel') : t('rifaManagement.payment.edit')}
            </button>
          </div>

          {(() => {
            const formasPagoArray = Array.isArray(rifa.formasPago) 
              ? rifa.formasPago 
              : (rifa.formasPago ? [rifa.formasPago] : []);
            const formaPagoExistente = formasPagoArray.find(fp => fp.tipo_pago === 'transferencia') || formasPagoArray[0];

            if (mostrarFormaPago) {
              return (
                <div className="forma-pago-edit">
                  <h4>{t('rifaManagement.payment.bankData')}</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>{t('rifaManagement.payment.bank')}</label>
                      <input
                        type="text"
                        placeholder={t('rifaManagement.payment.bankPlaceholder')}
                        value={formaPago.banco}
                        onChange={(e) => setFormaPago({...formaPago, banco: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('rifaManagement.payment.clabe')}</label>
                      <input
                        type="text"
                        placeholder={t('rifaManagement.payment.clabePlaceholder')}
                        maxLength="18"
                        value={formaPago.clabe}
                        onChange={(e) => setFormaPago({...formaPago, clabe: e.target.value.replace(/[^0-9]/g, '')})}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('rifaManagement.payment.accountNumber')}</label>
                      <input
                        type="text"
                        placeholder={t('rifaManagement.payment.accountNumberPlaceholder')}
                        value={formaPago.numero_cuenta}
                        onChange={(e) => setFormaPago({...formaPago, numero_cuenta: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('rifaManagement.payment.holderName')}</label>
                      <input
                        type="text"
                        placeholder={t('rifaManagement.payment.holderNamePlaceholder')}
                        value={formaPago.nombre_titular}
                        onChange={(e) => setFormaPago({...formaPago, nombre_titular: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('rifaManagement.payment.phone')}</label>
                      <input
                        type="tel"
                        placeholder={t('rifaManagement.payment.phonePlaceholder')}
                        value={formaPago.telefono}
                        onChange={(e) => setFormaPago({...formaPago, telefono: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('rifaManagement.payment.whatsapp')}</label>
                      <input
                        type="tel"
                        placeholder={t('rifaManagement.payment.whatsappPlaceholder')}
                        value={formaPago.whatsapp}
                        onChange={(e) => setFormaPago({...formaPago, whatsapp: e.target.value})}
                      />
                      <small>{t('rifaManagement.payment.whatsappHelp')}</small>
                    </div>
                    <div className="form-group full-width">
                      <label>{t('rifaManagement.payment.otherDetails')}</label>
                      <textarea
                        placeholder={t('rifaManagement.payment.otherDetailsPlaceholder')}
                        value={formaPago.otros_detalles}
                        onChange={(e) => setFormaPago({...formaPago, otros_detalles: e.target.value})}
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button 
                      onClick={guardarFormaPago}
                      className="btn-primary"
                      disabled={!formaPago.banco || !formaPago.clabe || !formaPago.numero_cuenta || !formaPago.nombre_titular}
                    >
                      {t('rifaManagement.payment.save')}
                    </button>
                    <button 
                      onClick={() => setMostrarFormaPago(false)}
                      className="btn-secondary"
                    >
                      {t('rifaManagement.payment.cancelButton')}
                    </button>
                  </div>
                </div>
              );
            } else if (formaPagoExistente) {
              return (
                <div className="forma-pago-display">
                  <div className="pago-info-card">
                    <h4>{t('rifaManagement.payment.bankData')}</h4>
                    <div className="pago-info-grid">
                      <div className="pago-info-item">
                        <span className="pago-info-label">{t('publicRifaView.payment.bank')}</span>
                        <span className="pago-info-value">{formaPagoExistente.banco || t('rifaManagement.payment.notSpecified')}</span>
                      </div>
                      <div className="pago-info-item">
                        <span className="pago-info-label">{t('publicRifaView.payment.clabe')}</span>
                        <span className="pago-info-value">{formaPagoExistente.clabe || t('rifaManagement.payment.notSpecified')}</span>
                      </div>
                      <div className="pago-info-item">
                        <span className="pago-info-label">{t('publicRifaView.payment.accountNumber')}</span>
                        <span className="pago-info-value">{formaPagoExistente.numero_cuenta || t('rifaManagement.payment.notSpecified')}</span>
                      </div>
                      <div className="pago-info-item">
                        <span className="pago-info-label">{t('publicRifaView.payment.holder')}</span>
                        <span className="pago-info-value">{formaPagoExistente.nombre_titular || t('rifaManagement.payment.notSpecified')}</span>
                      </div>
                      {formaPagoExistente.telefono && (
                        <div className="pago-info-item">
                          <span className="pago-info-label">{t('publicRifaView.payment.phone')}</span>
                          <span className="pago-info-value">{formaPagoExistente.telefono}</span>
                        </div>
                      )}
                      {formaPagoExistente.whatsapp && (
                        <div className="pago-info-item">
                          <span className="pago-info-label">{t('publicRifaView.payment.whatsapp')}</span>
                          <span className="pago-info-value">{formaPagoExistente.whatsapp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="forma-pago-empty">
                  <p>{t('rifaManagement.payment.notConfigured')}</p>
                  <p>{t('rifaManagement.payment.notConfiguredHelp')}</p>
                </div>
              );
            }
          })()}
        </div>

        <div className="participantes-section">
          <div className="participantes-header">
            <div className="participantes-title">
              <h3>{t('rifaManagement.participants.title')}</h3>
              {rifa.participantes && rifa.participantes.length > 0 && (
                <div className="participantes-stats">
                  <span className="stat-pendientes">
                    ⏳ {rifa.participantes.filter(p => !p.estado || p.estado === 'pendiente').length} {t('rifaManagement.participants.pending')}
                  </span>
                  <span className="stat-confirmados">
                    ✅ {rifa.participantes.filter(p => p.estado === 'confirmado').length} {t('rifaManagement.participants.confirmed')}
                  </span>
                </div>
              )}
            </div>
            {rifa.participantes && rifa.participantes.length > 0 && (
              <div className="participantes-controls">
                <Link 
                  to={`/participantes/${rifa.id}`}
                  className="btn-secondary"
                >
                  {t('rifaManagement.participants.viewAll')}
                </Link>
              </div>
            )}
          </div>
          
          {(!rifa.participantes || rifa.participantes.length === 0) ? (
            <p>{t('rifaManagement.participants.none')}</p>
          ) : (() => {
            const participantesPendientes = rifa.participantes.filter(p => !p.estado || p.estado === 'pendiente');
            return participantesPendientes.length === 0 ? (
              <p className="no-participantes-message">
                {t('rifaManagement.participants.noPending')}
              </p>
            ) : (
              <div className="participantes-list">
                {participantesPendientes.map(participante => (
                <div key={participante.id} className="participante-card">
                  <div className="participante-header">
                    <h4>{participante.nombre}</h4>
                    <span className={`estado-participante ${participante.estado || 'pendiente'}`}>
                      {participante.estado === 'confirmado' ? t('rifaManagement.participants.status.confirmed') : t('rifaManagement.participants.status.pending')}
                    </span>
                  </div>
                  
                  <div className="participante-info">
                    {participante.telefono && <p>{t('rifaManagement.participants.phone')} {participante.telefono}</p>}
                    <p>{t('rifaManagement.participants.numbers')} {participante.numeros_seleccionados ? participante.numeros_seleccionados.join(', ') : t('rifaManagement.participants.notSpecified')}</p>
                    <p>{t('rifaManagement.participants.total')} ${participante.total_pagado || '0'}</p>
                    <p>{t('rifaManagement.participants.date')} {new Date(participante.fecha_participacion).toLocaleDateString()}</p>
                  </div>

                  {(!participante.estado || participante.estado === 'pendiente') && (
                    <div className="participante-actions">
                      <button 
                        className="btn-validar"
                        onClick={() => confirmarVenta(participante.id)}
                        title={t('rifaManagement.participants.actions.confirmSaleTitle')}
                      >
                        {t('rifaManagement.participants.actions.confirmSale')}
                      </button>
                      <button 
                        className="btn-rechazar"
                        onClick={() => rechazarPago(participante.id)}
                        title={t('rifaManagement.participants.actions.rejectTitle')}
                      >
                        {t('rifaManagement.participants.actions.reject')}
                      </button>
                    </div>
                  )}
                </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal de Venta */}
      {mostrarModalVenta && (
        <div className="modal-overlay">
          <div className="modal-content venta-modal">
            <div className="modal-header">
              <h2>{t('rifaManagement.saleModal.title')}</h2>
              <button 
                className="modal-close"
                onClick={() => setMostrarModalVenta(false)}
              >
                {t('rifaManagement.saleModal.close')}
              </button>
            </div>

            <div className="modal-body">
              {/* Tipo de Venta */}
              <div className="form-group">
                <label>{t('rifaManagement.saleModal.saleType')}</label>
                <div className="tipo-venta-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tipoVenta"
                      value="individual"
                      checked={tipoVenta === 'individual'}
                      onChange={(e) => cambiarTipoVenta(e.target.value)}
                    />
                    <span>{t('rifaManagement.saleModal.individual', { count: numerosSeleccionados.length })}</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tipoVenta"
                      value="multiple"
                      checked={tipoVenta === 'multiple'}
                      onChange={(e) => cambiarTipoVenta(e.target.value)}
                    />
                    <span>{t('rifaManagement.saleModal.multiple', { count: numerosSeleccionados.length })}</span>
                  </label>
                </div>
              </div>

              {/* Opción de mismo nombre para venta múltiple */}
              {tipoVenta === 'multiple' && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={mismoNombre}
                      onChange={(e) => setMismoNombre(e.target.checked)}
                    />
                    <span>{t('rifaManagement.saleModal.sameName')}</span>
                  </label>
                </div>
              )}

              {/* Campo de nombre global para venta múltiple con mismo nombre */}
              {tipoVenta === 'multiple' && mismoNombre && (
                <div className="form-group">
                  <label>{t('rifaManagement.saleModal.nameForAll')}</label>
                  <input
                    type="text"
                    placeholder={t('rifaManagement.saleModal.nameForAllPlaceholder')}
                    onChange={(e) => aplicarMismoNombre(e.target.value)}
                  />
                </div>
              )}

              {/* Lista de participantes */}
              <div className="participantes-venta">
                <h3>{t('rifaManagement.saleModal.participantsList', { count: participantesVenta.length })}</h3>
                {participantesVenta.map((participante, index) => (
                  <div key={participante.id} className="participante-venta">
                    <div className="participante-header">
                      <span className="participante-numero">#{index + 1}</span>
                      <span className="participante-numeros">
                        {t('rifaManagement.saleModal.participantNumber')} {participante.numeros.join(', ')}
                      </span>
                      <span className="participante-precio">
                        ${parseFloat(rifa.precio) * participante.numeros.length}
                      </span>
                    </div>
                    
                    {!(tipoVenta === 'multiple' && mismoNombre) && (
                      <div className="participante-form">
                        <input
                          type="text"
                          placeholder={t('rifaManagement.saleModal.participantName')}
                          value={participante.nombre}
                          onChange={(e) => actualizarParticipante(index, 'nombre', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder={t('rifaManagement.saleModal.participantPhone')}
                          value={participante.telefono}
                          onChange={(e) => actualizarParticipante(index, 'telefono', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Resumen de la venta */}
              <div className="resumen-venta">
                <h3>{t('rifaManagement.saleModal.summary.title')}</h3>
                <div className="resumen-stats">
                  <div className="stat">
                    <span>{t('rifaManagement.saleModal.summary.totalParticipants')}</span>
                    <span>{participantesVenta.length}</span>
                  </div>
                  <div className="stat">
                    <span>{t('rifaManagement.saleModal.summary.totalNumbers')}</span>
                    <span>{numerosSeleccionados.length}</span>
                  </div>
                  <div className="stat total">
                    <span>{t('rifaManagement.saleModal.summary.totalToCharge')}</span>
                    <span>${parseFloat(rifa.precio) * numerosSeleccionados.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setMostrarModalVenta(false)}
              >
                {t('rifaManagement.saleModal.cancel')}
              </button>
              <button 
                className="btn-primary"
                onClick={procesarVenta}
              >
                {t('rifaManagement.saleModal.processSale')} (${parseFloat(rifa.precio) * numerosSeleccionados.length})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RifaManagement;
// Force refresh Sat Oct 25 21:50:47 CST 2025
