// The weekly menu runs from earlier days up to six days after today. The earlier part grows on request.
const DAYS_FORWARD = 6;
export const PREVIOUS_STEP_DAYS = 7;
// Earlier days can be loaded up to two weeks back; after that the control hides them again.
export const MAX_PREVIOUS_DAYS = 14;

export type PreviousAction = 'load' | 'hide';

export function previousAction(daysBack: number): PreviousAction {
  return daysBack >= MAX_PREVIOUS_DAYS ? 'hide' : 'load';
}

// Date ids use the local calendar, so a day is the same day for the person looking at it.
export function toDateId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayOffset(today: Date, offset: number): string {
  return toDateId(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
}

// The days the calendar can show: `daysBack` before today, today, then six days forward.
export function menuWindow(today: Date, daysBack = PREVIOUS_STEP_DAYS): string[] {
  const days: string[] = [];
  for (let offset = -daysBack; offset <= DAYS_FORWARD; offset++) days.push(dayOffset(today, offset));
  return days;
}

// The list view starts at today, and can reach back further on request.
export function listDays(today: Date, daysBack = 0): string[] {
  const days: string[] = [];
  for (let offset = -daysBack; offset <= DAYS_FORWARD; offset++) days.push(dayOffset(today, offset));
  return days;
}

// Day ids are local dates, so they are parsed as local dates too (new Date('2026-10-22') would be UTC).
export function parseDateId(id: string): Date {
  const [year, month, day] = id.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function dayLabel(id: string): { dayName: string; dayNumber: number } {
  const date = parseDateId(id);
  return { dayName: date.toLocaleDateString('en-US', { weekday: 'short' }), dayNumber: date.getDate() };
}
