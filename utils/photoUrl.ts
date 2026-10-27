import { sanitizeInput } from './sanitizeInput';
import { AVATAR_PHOTOS } from '../constants/avatars';

// Only Google profile pictures and the bundled avatars are accepted. Any other host would make every household member's browser load an arbitrary URL.
const GOOGLE_IMAGE_HOST = 'lh3.googleusercontent.com';
const MAX_PHOTO_URL_LENGTH = 300;

export function cleanPhotoUrl(raw: string | null | undefined): string {
  if (typeof raw !== 'string' || raw.length > MAX_PHOTO_URL_LENGTH) return '';
  const clean = sanitizeInput(raw);
  // A bundled avatar is matched by its exact path, so it never loads from another host.
  if (AVATAR_PHOTOS.includes(clean)) return clean;
  try {
    const url = new URL(clean);
    // A user or port before the host is refused, matching the rules, which only accept the bare host.
    const bare = url.username === '' && url.password === '' && url.port === '';
    // The rules need a picture path after the host, and they check the normalised link, so check its length too.
    const hasPath = url.pathname.length > 1;
    const normalised = url.toString();
    const fits = normalised.length <= MAX_PHOTO_URL_LENGTH;
    return url.protocol === 'https:' && url.hostname === GOOGLE_IMAGE_HOST && bare && hasPath && fits ? normalised : '';
  } catch {
    return '';
  }
}
