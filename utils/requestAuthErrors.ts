// Errors from checking a request's sign-in token. Shared so utils/importAuthError.ts can map them without importing services/.
export class AuthError extends Error {}
// Google's keys could not be loaded. Routes answer 503 rather than blaming the user's token.
export class KeysUnavailableError extends Error {}
