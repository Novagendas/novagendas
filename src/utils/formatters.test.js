import { describe, it, expect } from 'vitest';
import {
  formatCOP,
  formatDate,
  formatDateTime,
  formatTime,
  truncate,
  capitalize,
  formatFullName,
  formatCedula,
  formatPhone,
  formatBytes,
  formatPercent
} from './formatters';

describe('formatters.js utils', () => {
  describe('formatCOP', () => {
    it('formats a number to COP currency string', () => {
      const result = formatCOP(1500000);
      expect(result).toMatch(/\$\s*1\.500\.000/);
    });

    it('returns formatted 0 if no value or falsy value is passed', () => {
      expect(formatCOP(0)).toMatch(/\$\s*0/);
      expect(formatCOP(null)).toMatch(/\$\s*0/);
    });
  });

  describe('formatDate', () => {
    it('formats a date correctly in es-CO by default', () => {
      const date = new Date('2023-10-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('15 de octubre de 2023');
    });
  });

  describe('truncate', () => {
    it('truncates string longer than max length and adds ellipsis', () => {
      const result = truncate('Hello world', 5);
      expect(result).toBe('Hello...');
    });

    it('returns original string if shorter or equal to max length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('returns original if string is empty or falsy', () => {
      expect(truncate('')).toBe('');
      expect(truncate(null)).toBe(null);
    });
  });

  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('WORLD');
    });

    it('handles empty strings gracefully', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('formatFullName', () => {
    it('combines and capitalizes first and last name', () => {
      expect(formatFullName('juan', 'perez')).toBe('Juan Perez');
    });

    it('handles missing last name', () => {
      expect(formatFullName('juan')).toBe('Juan');
    });
  });

  describe('formatCedula', () => {
    it('formats a number string adding dots as thousands separators', () => {
      expect(formatCedula('1234567890')).toBe('1.234.567.890');
    });

    it('returns empty string if no input provided', () => {
      expect(formatCedula('')).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('formats 10 digit phone with spaces', () => {
      expect(formatPhone('3101234567')).toBe('310 123 4567');
    });

    it('adds plus to phones starting with 57', () => {
      expect(formatPhone('573101234567')).toBe('+573101234567');
    });
    
    it('returns original string if formatting rules dont apply', () => {
      expect(formatPhone('12345')).toBe('12345');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes into readable string', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('formatPercent', () => {
    it('formats fraction as percentage', () => {
      expect(formatPercent(50, 100)).toBe('50%');
      expect(formatPercent(1, 3, 2)).toBe('33.33%');
    });

    it('returns 0% if total is falsy', () => {
      expect(formatPercent(50, 0)).toBe('0%');
    });
  });
});
