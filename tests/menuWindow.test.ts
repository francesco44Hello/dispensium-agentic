import { describe, it, expect } from 'vitest';
import { dayLabel, listDays, menuWindow, previousAction, toDateId } from '../utils/menuWindow';

describe('toDateId', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateId(new Date(2026, 9, 5))).toBe('2026-10-05');
  });
});

describe('menuWindow', () => {
  it('returns 7 days back, today, and 6 days forward: 14 days in order', () => {
    const days = menuWindow(new Date(2026, 9, 22));
    expect(days).toHaveLength(14);
    expect(days[0]).toBe('2026-10-15');
    expect(days[7]).toBe('2026-10-22');
    expect(days[13]).toBe('2026-10-28');
  });

  it('crosses month boundaries correctly', () => {
    const days = menuWindow(new Date(2026, 9, 3));
    expect(days[0]).toBe('2026-09-26');
    expect(days[7]).toBe('2026-10-03');
  });
});

describe('listDays', () => {
  it('starts at today and runs six days forward', () => {
    const days = listDays(new Date(2026, 9, 22));
    expect(days).toEqual(['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28']);
  });
});

describe('menuWindow earlier days', () => {
  it('reaches back as many days as asked, from today', () => {
    const days = menuWindow(new Date(2026, 9, 22), 14);
    expect(days).toHaveLength(21);
    expect(days[0]).toBe('2026-10-08');
    expect(days[14]).toBe('2026-10-22');
  });
});

describe('previousAction', () => {
  it('loads earlier days until two weeks back, then offers to hide them', () => {
    expect(previousAction(0)).toBe('load');
    expect(previousAction(7)).toBe('load');
    expect(previousAction(14)).toBe('hide');
  });
});

describe('dayLabel', () => {
  it('names the day in English by default and in the requested locale', () => {
    expect(dayLabel('2026-10-22')).toEqual({ dayName: 'Thu', dayNumber: 22 });
    expect(dayLabel('2026-10-22', 'it-IT')).toEqual({ dayName: 'gio', dayNumber: 22 });
  });
});
