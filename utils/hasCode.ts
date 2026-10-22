// True when a thrown value carries a string `code`, as Firebase and the app's own errors do.
export function hasCode(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string';
}
