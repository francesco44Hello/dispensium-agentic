const BLOCKED_CHARS = /[<>{}"]/g;

export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(BLOCKED_CHARS, '');
}
