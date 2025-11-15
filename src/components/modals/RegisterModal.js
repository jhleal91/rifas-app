import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validatePassword, validatePasswordMatch, validateNombre } from '../../utils/validation';

const RegisterModal = ({ isOpen, onClose }) => {
  const { register } = useAuth();
  const [registerData, setRegisterData] = useState({ 
    nombre: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [registerErrors, setRegisterErrors] = useState({ 
    nombre: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos
    const nombreValidation = validateNombre(registerData.nombre, 2);
    const emailValidation = validateEmail(registerData.email);
    const passwordValidation = validatePassword(registerData.password, 6);
    const passwordMatchValidation = validatePasswordMatch(registerData.password, registerData.confirmPassword);
    
    setRegisterErrors({
      nombre: nombreValidation.error,
      email: emailValidation.error,
      password: passwordValidation.error,
      confirmPassword: passwordMatchValidation.error
    });
    
    if (!nombreValidation.valid || !emailValidation.valid || !passwordValidation.valid || !passwordMatchValidation.valid) {
      return;
    }
    
    const result = await register({
      nombre: registerData.nombre,
      email: registerData.email,
      password: registerData.password,
      telefono: ''
    });
    
    if (result.success) {
      onClose();
      setRegisterData({ nombre: '', email: '', password: '', confirmPassword: '' });
      setRegisterErrors({ nombre: '', email: '', password: '', confirmPassword: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Crear Cuenta</h3>
          <button 
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleRegister} className="modal-form">
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              type="text"
              value={registerData.nombre}
              onChange={(e) => {
                const value = e.target.value;
                setRegisterData({...registerData, nombre: value});
                if (value) {
                  const validation = validateNombre(value, 2);
                  setRegisterErrors({...registerErrors, nombre: validation.error});
                } else {
                  setRegisterErrors({...registerErrors, nombre: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validateNombre(e.target.value, 2);
                setRegisterErrors({...registerErrors, nombre: validation.error});
              }}
              required
              className={registerErrors.nombre ? 'input-error' : ''}
            />
            {registerErrors.nombre && <span className="error-message">{registerErrors.nombre}</span>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={registerData.email}
              onChange={(e) => {
                const value = e.target.value;
                setRegisterData({...registerData, email: value});
                if (value) {
                  const validation = validateEmail(value);
                  setRegisterErrors({...registerErrors, email: validation.error});
                } else {
                  setRegisterErrors({...registerErrors, email: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validateEmail(e.target.value);
                setRegisterErrors({...registerErrors, email: validation.error});
              }}
              required
              className={registerErrors.email ? 'input-error' : ''}
            />
            {registerErrors.email && <span className="error-message">{registerErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={registerData.password}
              onChange={(e) => {
                const value = e.target.value;
                setRegisterData({...registerData, password: value});
                if (value) {
                  const validation = validatePassword(value, 6);
                  setRegisterErrors({...registerErrors, password: validation.error});
                  // Validar también confirmación si ya hay valor
                  if (registerData.confirmPassword) {
                    const matchValidation = validatePasswordMatch(value, registerData.confirmPassword);
                    setRegisterErrors({...registerErrors, password: validation.error, confirmPassword: matchValidation.error});
                  }
                } else {
                  setRegisterErrors({...registerErrors, password: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validatePassword(e.target.value, 6);
                setRegisterErrors({...registerErrors, password: validation.error});
              }}
              required
              className={registerErrors.password ? 'input-error' : ''}
            />
            {registerErrors.password && <span className="error-message">{registerErrors.password}</span>}
          </div>
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={registerData.confirmPassword}
              onChange={(e) => {
                const value = e.target.value;
                setRegisterData({...registerData, confirmPassword: value});
                if (value && registerData.password) {
                  const validation = validatePasswordMatch(registerData.password, value);
                  setRegisterErrors({...registerErrors, confirmPassword: validation.error});
                } else {
                  setRegisterErrors({...registerErrors, confirmPassword: ''});
                }
              }}
              onBlur={(e) => {
                if (registerData.password) {
                  const validation = validatePasswordMatch(registerData.password, e.target.value);
                  setRegisterErrors({...registerErrors, confirmPassword: validation.error});
                }
              }}
              required
              className={registerErrors.confirmPassword ? 'input-error' : ''}
            />
            {registerErrors.confirmPassword && <span className="error-message">{registerErrors.confirmPassword}</span>}
          </div>
          <button type="submit" className="btn-primary">
            <span className="btn-icon">🚀</span>
            <span>Crear Cuenta</span>
          </button>
        </form>
        <p className="modal-footer">
          ¿Ya tienes cuenta? 
          <button 
            className="link-button"
            onClick={() => {
              onClose();
              // Disparar evento para que el padre muestre el modal de login
              window.dispatchEvent(new CustomEvent('showLoginModal'));
            }}
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterModal;

