// Utilidades de validación para formularios

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'El email es requerido' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'El email no tiene un formato válido' };
  }

  // Validar longitud
  if (email.length > 254) {
    return { valid: false, error: 'El email es demasiado largo (máximo 254 caracteres)' };
  }

  return { valid: true, error: '' };
};

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @param {number} minLength - Longitud mínima (default: 6)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password || password.trim() === '') {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `La contraseña debe tener al menos ${minLength} caracteres` };
  }

  if (password.length > 128) {
    return { valid: false, error: 'La contraseña es demasiado larga (máximo 128 caracteres)' };
  }

  return { valid: true, error: '' };
};

/**
 * Valida que dos contraseñas coincidan
 * @param {string} password - Contraseña
 * @param {string} confirmPassword - Confirmación de contraseña
 * @returns {object} - { valid: boolean, error: string }
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { valid: false, error: 'Por favor confirma tu contraseña' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Las contraseñas no coinciden' };
  }

  return { valid: true, error: '' };
};

/**
 * Valida un nombre
 * @param {string} nombre - Nombre a validar
 * @param {number} minLength - Longitud mínima (default: 2)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateNombre = (nombre, minLength = 2) => {
  if (!nombre || nombre.trim() === '') {
    return { valid: false, error: 'El nombre es requerido' };
  }

  if (nombre.trim().length < minLength) {
    return { valid: false, error: `El nombre debe tener al menos ${minLength} caracteres` };
  }

  if (nombre.length > 100) {
    return { valid: false, error: 'El nombre es demasiado largo (máximo 100 caracteres)' };
  }

  // Validar que solo contenga letras, espacios y algunos caracteres especiales
  const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  if (!nombreRegex.test(nombre.trim())) {
    return { valid: false, error: 'El nombre solo puede contener letras, espacios y guiones' };
  }

  return { valid: true, error: '' };
};

/**
 * Valida un teléfono (formato mexicano e internacional)
 * @param {string} telefono - Teléfono a validar
 * @param {boolean} required - Si es requerido (default: false)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateTelefono = (telefono, required = false) => {
  if (!telefono || telefono.trim() === '') {
    if (required) {
      return { valid: false, error: 'El teléfono es requerido' };
    }
    return { valid: true, error: '' }; // Opcional
  }

  // Validar longitud máxima (incluyendo espacios y caracteres especiales)
  if (telefono.length > 20) {
    return { valid: false, error: 'El teléfono es demasiado largo (máximo 20 caracteres)' };
  }

  // Remover espacios, guiones, paréntesis y puntos para validar
  const cleaned = telefono.replace(/[\s\-\(\)\.]/g, '');
  
  // Validar que solo contenga números y el símbolo + al inicio
  if (!/^\+?[0-9]+$/.test(cleaned)) {
    return { valid: false, error: 'El teléfono solo puede contener números y el símbolo + al inicio' };
  }

  // Validar longitud mínima (al menos 10 dígitos)
  const soloNumeros = cleaned.replace(/^\+/, '');
  if (soloNumeros.length < 10) {
    return { valid: false, error: 'El teléfono debe tener al menos 10 dígitos' };
  }

  // Validar longitud máxima (máximo 15 dígitos según estándar internacional)
  if (soloNumeros.length > 15) {
    return { valid: false, error: 'El teléfono no puede tener más de 15 dígitos' };
  }

  // Validar formato mexicano específico: +52 seguido de 10 dígitos, o solo 10 dígitos
  // Formato mexicano: +52 seguido de 10 dígitos que empiezan con 1-9
  const formatoMexicano = /^(\+52)?[1-9]\d{9}$/;
  
  // Si tiene código de país +52, validar formato mexicano
  if (cleaned.startsWith('+52')) {
    if (!formatoMexicano.test(cleaned)) {
      return { valid: false, error: 'El teléfono mexicano debe tener 10 dígitos después de +52 (ej: +52 55 1234 5678)' };
    }
  } else if (soloNumeros.length === 10) {
    // Si tiene 10 dígitos sin código de país, validar que empiece con 1-9
    if (!/^[1-9]\d{9}$/.test(soloNumeros)) {
      return { valid: false, error: 'El teléfono debe empezar con un dígito del 1 al 9 (ej: 55 1234 5678)' };
    }
  } else if (soloNumeros.length > 10) {
    // Si tiene más de 10 dígitos, debe tener código de país
    if (!cleaned.startsWith('+')) {
      return { valid: false, error: 'Los números internacionales deben incluir el código de país con + (ej: +52 55 1234 5678)' };
    }
  }

  return { valid: true, error: '' };
};

/**
 * Valida un número
 * @param {string|number} value - Valor a validar
 * @param {object} options - Opciones { min, max, required, integer }
 * @returns {object} - { valid: boolean, error: string, value: number }
 */
export const validateNumber = (value, options = {}) => {
  const { min, max, required = false, integer = false } = options;

  if (!value && value !== 0) {
    if (required) {
      return { valid: false, error: 'Este campo es requerido', value: null };
    }
    return { valid: true, error: '', value: null };
  }

  // Convertir a número
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return { valid: false, error: 'Debe ser un número válido', value: null };
  }

  if (integer && !Number.isInteger(numValue)) {
    return { valid: false, error: 'Debe ser un número entero', value: null };
  }

  if (min !== undefined && numValue < min) {
    return { valid: false, error: `El valor mínimo es ${min}`, value: numValue };
  }

  if (max !== undefined && numValue > max) {
    return { valid: false, error: `El valor máximo es ${max}`, value: numValue };
  }

  return { valid: true, error: '', value: numValue };
};

/**
 * Valida una fecha
 * @param {string} fecha - Fecha a validar
 * @param {object} options - Opciones { minDate, maxDate, required }
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateDate = (fecha, options = {}) => {
  const { minDate, maxDate, required = false } = options;

  if (!fecha || fecha.trim() === '') {
    if (required) {
      return { valid: false, error: 'La fecha es requerida' };
    }
    return { valid: true, error: '' };
  }

  const date = new Date(fecha);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'La fecha no es válida' };
  }

  if (minDate) {
    const min = new Date(minDate);
    if (date < min) {
      return { valid: false, error: `La fecha debe ser posterior a ${min.toLocaleDateString()}` };
    }
  }

  if (maxDate) {
    const max = new Date(maxDate);
    if (date > max) {
      return { valid: false, error: `La fecha debe ser anterior a ${max.toLocaleDateString()}` };
    }
  }

  return { valid: true, error: '' };
};

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @param {boolean} required - Si es requerido (default: false)
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateURL = (url, required = false) => {
  if (!url || url.trim() === '') {
    if (required) {
      return { valid: false, error: 'La URL es requerida' };
    }
    return { valid: true, error: '' };
  }

  try {
    new URL(url);
    return { valid: true, error: '' };
  } catch (e) {
    return { valid: false, error: 'La URL no tiene un formato válido (ej: https://ejemplo.com)' };
  }
};

/**
 * Valida un texto con longitud mínima/máxima
 * @param {string} text - Texto a validar
 * @param {object} options - Opciones { minLength, maxLength, required }
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateText = (text, options = {}) => {
  const { minLength, maxLength, required = false } = options;

  if (!text || text.trim() === '') {
    if (required) {
      return { valid: false, error: 'Este campo es requerido' };
    }
    return { valid: true, error: '' };
  }

  if (minLength && text.trim().length < minLength) {
    return { valid: false, error: `Debe tener al menos ${minLength} caracteres` };
  }

  if (maxLength && text.length > maxLength) {
    return { valid: false, error: `Debe tener máximo ${maxLength} caracteres` };
  }

  return { valid: true, error: '' };
};

/**
 * Valida un formulario completo
 * @param {object} formData - Datos del formulario
 * @param {object} rules - Reglas de validación { fieldName: { validator, options } }
 * @returns {object} - { valid: boolean, errors: object }
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];
    
    if (rule.validator) {
      const result = rule.validator(value, rule.options || {});
      if (!result.valid) {
        errors[field] = result.error;
        isValid = false;
      }
    }
  });

  return { valid: isValid, errors };
};

