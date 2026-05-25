import { describe, it, expect } from 'vitest';
import {
  addDays,
  startOf,
  toDateStr,
  toTimeStr,
  timeToDec,
  parseDate
} from './dateHelpers';

describe('dateHelpers.js utils', () => {
  describe('addDays', () => {
    it('adds positive days to a date', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(6);
    });

    it('subtracts days from a date with negative value', () => {
      const date = new Date('2023-01-10T12:00:00Z');
      const result = addDays(date, -2);
      expect(result.getDate()).toBe(8);
    });
  });

  describe('startOf', () => {
    it('returns the start of the week (Monday)', () => {
      const date = new Date('2023-10-18T12:00:00Z'); // Wednesday
      const result = startOf(date, 'week');
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(0);
    });

    it('returns the start of the month', () => {
      const date = new Date('2023-10-18T12:00:00Z');
      const result = startOf(date, 'month');
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(9); // 0-indexed, 9 = Oct
    });
  });

  describe('toDateStr', () => {
    it('formats a date to YYYY-MM-DD string', () => {
      const date = new Date('2023-05-05T12:00:00Z');
      // note: it formats local time, so if timezone shifts it could be 04. We'll use absolute logic based on local to mock
      // Since it's dependent on timezone, let's just create local date
      const localDate = new Date(2023, 4, 5); // May 5th 2023
      expect(toDateStr(localDate)).toBe('2023-05-05');
    });
  });

  describe('toTimeStr', () => {
    it('formats hours and minutes to HH:MM', () => {
      expect(toTimeStr(9, 5)).toBe('09:05');
      expect(toTimeStr(14, 30)).toBe('14:30');
    });
  });

  describe('timeToDec', () => {
    it('converts HH:MM string to decimal hours', () => {
      expect(timeToDec('09:30')).toBe(9.5);
      expect(timeToDec('14:45')).toBe(14.75);
    });
  });

  describe('parseDate', () => {
    it('parses valid ISO string to Date', () => {
      const result = parseDate('2023-10-15T12:00:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2023-10-15T12:00:00.000Z');
    });

    it('adds Z to date missing timezone info', () => {
      const result = parseDate('2023-10-15 12:00:00');
      expect(result.toISOString()).toBe('2023-10-15T12:00:00.000Z');
    });
  });
});
