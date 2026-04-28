/**
 * utils/dateHelpers.js
 * Funciones auxiliares para manejo de fechas
 */

/**
 * Suma o resta días a una fecha
 * @param {Date} date - Fecha inicial
 * @param {number} n - Número de días (positivo o negativo)
 * @returns {Date}
 */
export const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/**
 * Retorna el inicio de una unidad de tiempo (día, semana, mes)
 * @param {Date} date - Fecha
 * @param {string} unit - 'day' | 'week' | 'month'
 * @returns {Date}
 */
export const startOf = (date, unit) => {
  const d = new Date(date);
  
  if (unit === 'week') {
    const day = d.getDay(); // 0=Domingo
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Lunes
  }
  
  if (unit === 'month') {
    d.setDate(1);
  }
  
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Convierte una fecha a string YYYY-MM-DD
 * @param {Date} d
 * @returns {string}
 */
export const toDateStr = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Convierte hora y minutos a string HH:MM
 * @param {number} h - Horas (0-23)
 * @param {number} m - Minutos (0-59)
 * @returns {string}
 */
export const toTimeStr = (h, m = 0) => 
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

/**
 * Convierte string de tiempo (HH:MM) a decimal (horas.fracción)
 * @param {string} t - Formato HH:MM
 * @returns {number}
 */
export const timeToDec = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
};

/**
 * Convierte timestamp ISO a fecha legible
 * @param {string} dateStr - Fecha ISO o timestamp
 * @returns {Date}
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  // Normaliza si no tiene Z (común en TIMESTAMP columns)
  let normalized = dateStr;
  if (!normalized.includes('Z') && !normalized.includes('+')) {
    normalized = normalized.replace(' ', 'T') + 'Z';
  }
  return new Date(normalized);
};

/**
 * Obtiene el nombre del día de la semana
 * @param {Date} date
 * @param {string} locale - 'es-CO', 'en-US', etc
 * @param {string} format - 'long' | 'short' | 'narrow'
 * @returns {string}
 */
export const getDayName = (date, locale = 'es-CO', format = 'short') => {
  return new Intl.DateTimeFormat(locale, { weekday: format }).format(date);
};

/**
 * Obtiene el nombre del mes
 * @param {Date} date
 * @param {string} locale
 * @param {string} format - 'long' | 'short'
 * @returns {string}
 */
export const getMonthName = (date, locale = 'es-CO', format = 'long') => {
  return new Intl.DateTimeFormat(locale, { month: format }).format(date);
};
