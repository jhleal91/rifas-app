import React, { useState } from 'react';
import { validateEmail, validateNombre, validateTelefono } from '../../utils/validation';
import { showSuccess, showError } from '../../utils/swal';

const ParticipantRegisterModal = ({ isOpen, onClose }) => {
  const [participantData, setParticipantData] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
  const [participantErrors, setParticipantErrors] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });

  const handleParticipantRegister = async (e) => {
    e.preventDefault();
    
    // Validar campos
    const nombreValidation = validateNombre(participantData.nombre, 2);
    const emailValidation = validateEmail(participantData.email);
    const telefonoValidation = validateTelefono(participantData.telefono, true);
    
    setParticipantErrors({
      nombre: nombreValidation.error,
      email: emailValidation.error,
      telefono: telefonoValidation.error
    });
    
    if (!nombreValidation.valid || !emailValidation.valid || !telefonoValidation.valid) {
      return;
    }
    
    try {
      // Crear usuario participante en el backend
      const response = await fetch('http://localhost:5001/api/participantes/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(participantData)
      });

      if (response.ok) {
        await showSuccess('¡Registro exitoso!', 'Ya puedes participar en las rifas.');
        onClose();
        setParticipantData({ nombre: '', email: '', telefono: '' });
        setParticipantErrors({ nombre: '', email: '', telefono: '' });
      } else {
        const errorData = await response.json();
        showError('Error al registrarse', errorData.error || 'Ocurrió un error al registrarse');
      }
    } catch (error) {
      console.error('Error registrando participante:', error);
      showError('Error de conexión', 'Error al conectarse con el servidor. Por favor, intenta nuevamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registro de Participante</h3>
          <button 
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleParticipantRegister} className="modal-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Nombre completo"
              value={participantData.nombre}
              onChange={(e) => {
                const value = e.target.value;
                setParticipantData({...participantData, nombre: value});
                if (value) {
                  const validation = validateNombre(value, 2);
                  setParticipantErrors({...participantErrors, nombre: validation.error});
                } else {
                  setParticipantErrors({...participantErrors, nombre: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validateNombre(e.target.value, 2);
                setParticipantErrors({...participantErrors, nombre: validation.error});
              }}
              required
              className={participantErrors.nombre ? 'input-error' : ''}
            />
            {participantErrors.nombre && <span className="error-message">{participantErrors.nombre}</span>}
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={participantData.email}
              onChange={(e) => {
                const value = e.target.value;
                setParticipantData({...participantData, email: value});
                if (value) {
                  const validation = validateEmail(value);
                  setParticipantErrors({...participantErrors, email: validation.error});
                } else {
                  setParticipantErrors({...participantErrors, email: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validateEmail(e.target.value);
                setParticipantErrors({...participantErrors, email: validation.error});
              }}
              required
              className={participantErrors.email ? 'input-error' : ''}
            />
            {participantErrors.email && <span className="error-message">{participantErrors.email}</span>}
          </div>
          <div className="form-group">
            <input
              type="tel"
              placeholder="Teléfono (ej: +52 55 1234 5678)"
              value={participantData.telefono}
              onChange={(e) => {
                const value = e.target.value;
                setParticipantData({...participantData, telefono: value});
                if (value) {
                  const validation = validateTelefono(value, true);
                  setParticipantErrors({...participantErrors, telefono: validation.error});
                } else {
                  setParticipantErrors({...participantErrors, telefono: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validateTelefono(e.target.value, true);
                setParticipantErrors({...participantErrors, telefono: validation.error});
              }}
              required
              className={participantErrors.telefono ? 'input-error' : ''}
            />
            {participantErrors.telefono && <span className="error-message">{participantErrors.telefono}</span>}
          </div>
          <div className="info-message">
            <p>📧 Con tu registro podrás participar en rifas y recibir notificaciones de tus participaciones.</p>
          </div>
          <button type="submit" className="btn-primary">
            <span className="btn-icon">👤</span>
            <span>Registrarse</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ParticipantRegisterModal;

