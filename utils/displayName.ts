import { sanitizeInput } from './sanitizeInput';

export const MAX_DISPLAY_NAME_LENGTH = 40;

// Names come from the user's form or their Google profile, so they go through the same sanitizer as other external text.
// Array.from counts characters, not UTF-16 units, so the cut never splits an emoji.
export function cleanDisplayName(raw: string | null | undefined): string {
  const characters = Array.from(sanitizeInput(raw ?? '').trim());
  return characters.slice(0, MAX_DISPLAY_NAME_LENGTH).join('').trim();
}
