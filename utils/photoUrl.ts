import { sanitizeInput } from './sanitizeInput';

// Only Google profile pictures are accepted. Any other host would make every household member's browser load an arbitrary URL.
const GOOGLE_IMAGE_HOST = 'lh3.googleusercontent.com';
const MAX_PHOTO_URL_LENGTH = 300;

export function cleanPhotoUrl(raw: string | null | undefined): string {
  if (typeof raw !== 'string' || raw.length > MAX_PHOTO_URL_LENGTH) return '';
  try {
    const url = new URL(sanitizeInput(raw));
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
