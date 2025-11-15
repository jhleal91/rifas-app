import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword } from '../../utils/validation';

const LoginModal = ({ isOpen, onClose }) => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validar campos
    const emailValidation = validateEmail(loginData.email);
    const passwordValidation = validatePassword(loginData.password, 6);
    
    setLoginErrors({
      email: emailValidation.error,
      password: passwordValidation.error
    });
    
    if (!emailValidation.valid || !passwordValidation.valid) {
      return;
    }
    
    const result = await login(loginData);
    if (result.success) {
      onClose();
      setLoginData({ email: '', password: '' });
      setLoginErrors({ email: '', password: '' });
      // Redirigir según el rol
      if (result.user?.rol === 'admin') {
        navigate('/', { replace: true });
      } else {
        navigate('/portal', { replace: true });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Iniciar Sesión</h3>
          <button 
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleLogin} className="modal-form">
          {error && (
            <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) => {
                const value = e.target.value;
                setLoginData({...loginData, email: value});
                if (value) {
                  const validation = validateEmail(value);
                  setLoginErrors({...loginErrors, email: validation.error});
                } else {
                  setLoginErrors({...loginErrors, email: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validateEmail(e.target.value);
                setLoginErrors({...loginErrors, email: validation.error});
              }}
              required
              disabled={loading}
              className={loginErrors.email ? 'input-error' : ''}
            />
            {loginErrors.email && <span className="error-message">{loginErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => {
                const value = e.target.value;
                setLoginData({...loginData, password: value});
                if (value) {
                  const validation = validatePassword(value, 6);
                  setLoginErrors({...loginErrors, password: validation.error});
                } else {
                  setLoginErrors({...loginErrors, password: ''});
                }
              }}
              onBlur={(e) => {
                const validation = validatePassword(e.target.value, 6);
                setLoginErrors({...loginErrors, password: validation.error});
              }}
              required
              disabled={loading}
              className={loginErrors.password ? 'input-error' : ''}
            />
            {loginErrors.password && <span className="error-message">{loginErrors.password}</span>}
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <span className="btn-icon">🔑</span>
            <span>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</span>
          </button>
        </form>
        <p className="modal-footer">
          ¿No tienes cuenta? 
          <button 
            className="link-button"
            onClick={() => {
              onClose();
              // Disparar evento para que el padre muestre el modal de registro
              window.dispatchEvent(new CustomEvent('showRegisterModal'));
            }}
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;

