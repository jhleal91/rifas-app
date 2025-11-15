import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdvertiserDashboard from './AdvertiserDashboard';
import SEO from './SEO';
import { validateEmail, validatePassword, validateNombre, validateTelefono } from '../utils/validation';
import './AdvertiserPortal.css';

const API_BASE = 'http://localhost:5001/api';

const AdvertiserPortal = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  const initialMode = (() => {
    try {
      const params = new URLSearchParams(location.search);
      const m = params.get('mode');
      return m === 'register' ? 'register' : 'login';
    } catch (_) { return 'login'; }
  })();

  const [mode, setMode] = useState(initialMode);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [advertiser, setAdvertiser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
  
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    categoria: ''
  });
  const [registerErrors, setRegisterErrors] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: ''
  });

  // Verificar si hay token al cargar
  useEffect(() => {
    const token = localStorage.getItem('advertiserToken');
    if (token) {
      checkAuth(token);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/advertisers/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdvertiser(data.advertiser);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('advertiserToken');
      }
    } catch (e) {
      localStorage.removeItem('advertiserToken');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validar campos
    const emailValidation = validateEmail(loginForm.email);
    const passwordValidation = validatePassword(loginForm.password, 6);
    
    setLoginErrors({
      email: emailValidation.error,
      password: passwordValidation.error
    });
    
    if (!emailValidation.valid || !passwordValidation.valid) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/advertisers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error en login');
      }

      if (!data.token) {
        throw new Error('No se recibió token de autenticación');
      }

      localStorage.setItem('advertiserToken', data.token);
      setAdvertiser(data.advertiser);
      setIsAuthenticated(true);
      setSuccess(t('advertiser.auth.successLogin'));
      setLoginForm({ email: '', password: '' });
      setLoginErrors({ email: '', password: '' });
      window.dispatchEvent(new Event('advertiserAuthChange'));
      
      // Si no tiene nombre_comercial configurado, mostrar modal de perfil después de un breve delay
      if (!data.advertiser.nombre_comercial) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('showBusinessProfileModal'));
        }, 1000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos
    const nombreValidation = validateNombre(registerForm.nombre, 2);
    const emailValidation = validateEmail(registerForm.email);
    const passwordValidation = validatePassword(registerForm.password, 8);
    const telefonoValidation = validateTelefono(registerForm.telefono, false);
    
    setRegisterErrors({
      nombre: nombreValidation.error,
      email: emailValidation.error,
      password: passwordValidation.error,
      telefono: telefonoValidation.error
    });
    
    if (!nombreValidation.valid || !emailValidation.valid || !passwordValidation.valid || !telefonoValidation.valid) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/advertisers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error en registro');
      }

      if (!data.token) {
        throw new Error('No se recibió token de autenticación');
      }

      localStorage.setItem('advertiserToken', data.token);
      setAdvertiser(data.advertiser);
      setIsAuthenticated(true);
      setSuccess(t('advertiser.auth.successRegister'));
      setRegisterForm({ nombre: '', email: '', telefono: '', password: '', categoria: '' });
      setRegisterErrors({ nombre: '', email: '', telefono: '', password: '' });
      window.dispatchEvent(new Event('advertiserAuthChange'));
      
      // Si no tiene nombre_comercial configurado, mostrar modal de perfil después de un breve delay
      if (!data.advertiser.nombre_comercial) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('showBusinessProfileModal'));
        }, 1000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('advertiserToken');
    setIsAuthenticated(false);
    setAdvertiser(null);
    setMode('login');
    window.dispatchEvent(new Event('advertiserAuthChange'));
  };

  // Si está autenticado, mostrar dashboard
  if (isAuthenticated && advertiser) {
    return <AdvertiserDashboard onLogout={handleLogout} />;
  }

  // Vista de login/register mejorada
  return (
    <div className="advertiser-portal-page">
      <SEO 
        title={`${t('advertiser.title')} - SorteoHub`}
        description="Promociona tu negocio frente a miles de participantes de rifas. Anuncia tus productos y servicios con segmentación precisa y reportes detallados."
        keywords="anunciantes, publicidad, marketing, promoción negocios, anuncios rifas"
      />
      
      {/* Hero Section - Explicación de qué es un Anunciante */}
      <section className="advertiser-hero">
        <div className="advertiser-hero-content">
          <div className="advertiser-hero-icon">📣</div>
          <h1 className="advertiser-hero-title">
            {t('advertiser.hero.title')} <span className="highlight-blue">{t('advertiser.hero.titleHighlight')}</span> {t('advertiser.hero.titleSuffix')}
          </h1>
          <p className="advertiser-hero-description">
            {t('advertiser.hero.description1')} <strong>{t('advertiser.hero.description1Bold')}</strong> {t('advertiser.hero.description2')}
            <br /><br />
            {t('advertiser.hero.description3')}
          </p>
        </div>
      </section>

      {/* Estadísticas destacadas - Inspirado en Spotify */}
      {/* <section className="advertiser-stats-showcase">
        <div className="advertiser-stats-container">
          <div className="advertiser-stats-header">
            <h2 className="advertiser-stats-title">Los números no mienten</h2>
            <p className="advertiser-stats-subtitle">
              Cuando los anuncios llegan a tu audiencia en el momento indicado, no interrumpen; atraen. 
              Es por eso que los anuncios en SorteoHub generan más interacción y conversión.
            </p>
          </div>
          
          <div className="advertiser-stats-grid">
            <div className="advertiser-stat-card">
              <div className="stat-number">93%</div>
              <div className="stat-description">
                de interacción se transfiere
              </div>
              <div className="stat-detail">
                Cuando las personas interactúan con rifas activas, eso se traduce en interacción con tu anuncio.
              </div>
            </div>
            
            <div className="advertiser-stat-card">
              <div className="stat-number">5x</div>
              <div className="stat-description">
                más permanencia del anuncio
              </div>
              <div className="stat-detail">
                Nuestros usuarios recuerdan los anuncios relevantes y los comparten con su comunidad.
              </div>
            </div>
            
            <div className="advertiser-stat-card">
              <div className="stat-number">+1000</div>
              <div className="stat-description">
                usuarios activos al mes
              </div>
              <div className="stat-detail">
                Desde rifas locales hasta nacionales, hay oportunidades para todos los negocios.
              </div>
            </div>
            
            <div className="advertiser-stat-card">
              <div className="stat-number">40%</div>
              <div className="stat-description">
                mejor desempeño
              </div>
              <div className="stat-detail">
                En comparación con otros canales, superamos los estándares del sector de publicidad digital.
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Beneficios destacados */}
      <section className="advertiser-benefits-showcase">
        <div className="advertiser-benefits-grid">
          <div className="advertiser-benefit-card">
            <div className="benefit-icon">🎯</div>
            <h3>{t('advertiser.benefits.preciseTargeting.title')}</h3>
            <p>{t('advertiser.benefits.preciseTargeting.description')}</p>
          </div>
          <div className="advertiser-benefit-card">
            <div className="benefit-icon">📊</div>
            <h3>{t('advertiser.benefits.measurableResults.title')}</h3>
            <p>{t('advertiser.benefits.measurableResults.description')}</p>
          </div>
          <div className="advertiser-benefit-card">
            <div className="benefit-icon">💰</div>
            <h3>{t('advertiser.benefits.flexiblePlans.title')}</h3>
            <p>{t('advertiser.benefits.flexiblePlans.description')}</p>
          </div>
          <div className="advertiser-benefit-card">
            <div className="benefit-icon">⚡</div>
            <h3>{t('advertiser.benefits.quickImplementation.title')}</h3>
            <p>{t('advertiser.benefits.quickImplementation.description')}</p>
          </div>
        </div>
      </section>

      {/* Sección de Login/Register */}
      <section className="advertiser-auth-section">
        <div className="advertiser-auth-container">
          <div className="advertiser-auth-header">
            <h2>{t('advertiser.auth.title')}</h2>
            <p>{t('advertiser.auth.subtitle')}</p>
          </div>

          <div className="portal-toggle">
            <button
              className={`toggle-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              <span className="toggle-icon">🔐</span>
              <span>{t('advertiser.auth.login')}</span>
            </button>
            <button
              className={`toggle-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            >
              <span className="toggle-icon">✨</span>
              <span>{t('advertiser.auth.register')}</span>
            </button>
          </div>

          {mode === 'login' ? (
            <form className="advertiser-form" onSubmit={handleLogin}>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}

              <div className="form-group">
                <label>{t('advertiser.auth.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLoginForm({...loginForm, email: value});
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
                  placeholder={t('advertiser.auth.emailPlaceholder')}
                  required
                  disabled={loading}
                  className={loginErrors.email ? 'input-error' : ''}
                />
                {loginErrors.email && <span className="error-message">{loginErrors.email}</span>}
              </div>

              <div className="form-group">
                <label>{t('advertiser.auth.password')}</label>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLoginForm({...loginForm, password: value});
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
                  placeholder={t('advertiser.auth.passwordPlaceholder')}
                  required
                  disabled={loading}
                  className={loginErrors.password ? 'input-error' : ''}
                />
                {loginErrors.password && <span className="error-message">{loginErrors.password}</span>}
              </div>

              <button type="submit" className="btn-advertiser-submit" disabled={loading}>
                {loading ? t('advertiser.auth.loginButtonLoading') : t('advertiser.auth.loginButton')}
              </button>

              <div className="form-footer">
                <p>{t('advertiser.auth.noAccount')} <button type="button" className="link-btn" onClick={() => setMode('register')}>{t('advertiser.auth.registerLink')}</button></p>
              </div>
            </form>
          ) : (
            <form className="advertiser-form" onSubmit={handleRegister}>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}

              <div className="form-group">
                <label>{t('advertiser.auth.businessNameLabel')}</label>
                <input
                  type="text"
                  name="nombre"
                  value={registerForm.nombre}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRegisterForm({...registerForm, nombre: value});
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
                  placeholder={t('advertiser.auth.businessNamePlaceholder')}
                  required
                  disabled={loading}
                  className={registerErrors.nombre ? 'input-error' : ''}
                />
                {registerErrors.nombre && <span className="error-message">{registerErrors.nombre}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('advertiser.auth.email')} *</label>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRegisterForm({...registerForm, email: value});
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
                    placeholder={t('advertiser.auth.emailPlaceholder')}
                    required
                    disabled={loading}
                    className={registerErrors.email ? 'input-error' : ''}
                  />
                  {registerErrors.email && <span className="error-message">{registerErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>{t('advertiser.auth.phone')}</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={registerForm.telefono}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRegisterForm({...registerForm, telefono: value});
                      if (value) {
                        const validation = validateTelefono(value, false);
                        setRegisterErrors({...registerErrors, telefono: validation.error});
                      } else {
                        setRegisterErrors({...registerErrors, telefono: ''});
                      }
                    }}
                    onBlur={(e) => {
                      const validation = validateTelefono(e.target.value, false);
                      setRegisterErrors({...registerErrors, telefono: validation.error});
                    }}
                    placeholder={t('advertiser.auth.phonePlaceholder')}
                    disabled={loading}
                    className={registerErrors.telefono ? 'input-error' : ''}
                  />
                  {registerErrors.telefono && <span className="error-message">{registerErrors.telefono}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('advertiser.auth.password')} *</label>
                  <input
                    type="password"
                    name="password"
                    value={registerForm.password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRegisterForm({...registerForm, password: value});
                      if (value) {
                        const validation = validatePassword(value, 8);
                        setRegisterErrors({...registerErrors, password: validation.error});
                      } else {
                        setRegisterErrors({...registerErrors, password: ''});
                      }
                    }}
                    onBlur={(e) => {
                      const validation = validatePassword(e.target.value, 8);
                      setRegisterErrors({...registerErrors, password: validation.error});
                    }}
                    placeholder={t('advertiser.auth.passwordMin')}
                    required
                    minLength="8"
                    disabled={loading}
                    className={registerErrors.password ? 'input-error' : ''}
                  />
                  {registerErrors.password && <span className="error-message">{registerErrors.password}</span>}
                </div>
                <div className="form-group">
                  <label>{t('advertiser.auth.categoryLabel')}</label>
                  <select
                    name="categoria"
                    value={registerForm.categoria}
                    onChange={(e) => setRegisterForm({...registerForm, categoria: e.target.value})}
                    disabled={loading}
                  >
                    <option value="">{t('advertiser.auth.categoryPlaceholder')}</option>
                    <option value="Electrónicos">{t('advertiser.auth.categories.electronics')}</option>
                    <option value="Restaurantes">{t('advertiser.auth.categories.restaurants')}</option>
                    <option value="Moda">{t('advertiser.auth.categories.fashion')}</option>
                    <option value="Servicios">{t('advertiser.auth.categories.services')}</option>
                    <option value="Entretenimiento">{t('advertiser.auth.categories.entertainment')}</option>
                    <option value="Otros">{t('advertiser.auth.categories.other')}</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-advertiser-submit" disabled={loading}>
                {loading ? t('advertiser.auth.registerButtonLoading') : t('advertiser.auth.registerButton')}
              </button>

              <div className="form-footer">
                <p>{t('advertiser.auth.haveAccount')} <button type="button" className="link-btn" onClick={() => setMode('login')}>{t('advertiser.auth.loginLink')}</button></p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* CTA Final */}
      {/* <section className="advertiser-cta-final">
        <div className="advertiser-cta-content">
          <h3>¿Listo para hacer crecer tu negocio?</h3>
          <p>Únete a cientos de anunciantes que ya confían en SorteoHub para promocionar sus productos y servicios</p>
          <div className="advertiser-cta-stats">
            <div className="cta-stat">
              <div className="cta-stat-number">1000+</div>
              <div className="cta-stat-label">Usuarios Activos</div>
            </div>
            <div className="cta-stat">
              <div className="cta-stat-number">50+</div>
              <div className="cta-stat-label">Anunciantes</div>
            </div>
            <div className="cta-stat">
              <div className="cta-stat-number">10K+</div>
              <div className="cta-stat-label">Impresiones Mensuales</div>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default AdvertiserPortal;
