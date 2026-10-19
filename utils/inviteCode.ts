// 32 unambiguous characters: no I, O, 0 or 1.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);

export function generateInviteCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return code;
}

export function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, '');
}

export function isValidInviteCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}
