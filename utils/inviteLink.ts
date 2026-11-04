import { isValidInviteCode, normalizeInviteCode } from './inviteCode';

// The shared invite link is /join/<code>. The sign-in pages carry the code as ?invite=<code>.
export function buildInviteLink(origin: string, code: string): string {
  return `${origin}/join/${code}`;
}

// Only a well-formed code is accepted, so the parameter can never point the app anywhere else.
export function inviteCodeFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get('invite');
  if (raw === null) return null;
  const code = normalizeInviteCode(raw);
  return isValidInviteCode(code) ? code : null;
}

// After signing in: back to the invite card when the person came from one, otherwise home.
export function afterSignInPath(search: string): string {
  const code = inviteCodeFromSearch(search);
  return code ? `/join/${code}` : '/';
}
