/**
 * utils/formatters.js
 * Funciones para formatear valores
 */

/**
 * Formatea moneda colombiana
 * @param {number} n - Cantidad
 * @returns {string} - Formato COP
 */
export const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0);

// Alias común
export const fmt = formatCOP;

/**
 * Formatea fecha a locale
 * @param {Date} date
 * @param {string} locale - 'es-CO', 'en-US', etc
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export const formatDate = (date, locale = 'es-CO', options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
};

/**
 * Formatea fecha y hora
 * @param {Date} date
 * @param {string} locale
 * @returns {string}
 */
export const formatDateTime = (date, locale = 'es-CO') => {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Formatea solo tiempo
 * @param {Date} date
 * @param {string} locale
 * @returns {string} - HH:MM AM/PM
 */
export const formatTime = (date, locale = 'es-CO') => {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Trunca texto con ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitaliza primera letra
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Formatea nombre completo
 * @param {string} nombre
 * @param {string} apellido
 * @returns {string}
 */
export const formatFullName = (nombre = '', apellido = '') => {
  return `${capitalize(nombre)} ${capitalize(apellido)}`.trim();
};

/**
 * Formatea cédula/documento
 * @param {string} cedula
 * @returns {string}
 */
export const formatCedula = (cedula) => {
  if (!cedula) return '';
  // Ejemplo: 1234567890 -> 1.234.567.890
  return cedula.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Formatea teléfono
 * @param {string} phone
 * @returns {string}
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  // Colombia: +57 XXXXXXXXXX
  if (cleaned.startsWith('57')) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  return phone;
};

/**
 * Bytes a formato legible
 * @param {number} bytes
 * @returns {string}
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Porcentaje
 * @param {number} value
 * @param {number} total
 * @param {number} decimals
 * @returns {string}
 */
export const formatPercent = (value, total, decimals = 0) => {
  if (!total) return '0%';
  return ((value / total) * 100).toFixed(decimals) + '%';
};
