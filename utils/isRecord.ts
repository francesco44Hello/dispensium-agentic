// Narrows an unknown JSON value to a plain object, so its fields can be read without a cast.
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
