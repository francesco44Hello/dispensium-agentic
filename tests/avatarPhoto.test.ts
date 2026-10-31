import { describe, it, expect } from 'vitest';
import { cleanPhotoUrl } from '../utils/photoUrl';
import { AVATAR_CHOICES, AVATAR_PHOTOS } from '../constants/avatars';

describe('built-in avatars', () => {
  it('offers twelve peep pictures in the profile picker', () => {
    expect(AVATAR_CHOICES).toEqual(
      Array.from({ length: 12 }, (_, index) => `/avatars/peep-${String(index + 1).padStart(2, '0')}.svg`),
    );
  });

  it('still accepts the four original avatars, so existing members keep their picture', () => {
    expect(AVATAR_PHOTOS).toHaveLength(16);
    expect(AVATAR_PHOTOS).toEqual(expect.arrayContaining([
      '/avatars/avatar-1.svg',
      '/avatars/avatar-2.svg',
      '/avatars/avatar-3.svg',
      '/avatars/avatar-4.svg',
    ]));
  });

  it('keeps a peep avatar path', () => {
    expect(cleanPhotoUrl('/avatars/peep-03.svg')).toBe('/avatars/peep-03.svg');
  });

  it('rejects a peep number that does not exist, or a suffix on a real one', () => {
    for (const path of ['/avatars/peep-00.svg', '/avatars/peep-1.svg', '/avatars/peep-13.svg', '/avatars/peep-03.svg?x', '/avatars/peep-03.svg.html']) {
      expect(cleanPhotoUrl(path)).toBe('');
    }
  });

  it('keeps a bundled avatar path', () => {
    expect(cleanPhotoUrl('/avatars/avatar-2.svg')).toBe('/avatars/avatar-2.svg');
  });

  it('rejects other local paths and protocol-relative links', () => {
    expect(cleanPhotoUrl('/avatars/avatar-9.svg')).toBe('');
    expect(cleanPhotoUrl('/avatars/../secret.svg')).toBe('');
    expect(cleanPhotoUrl('//evil.example/avatars/avatar-1.svg')).toBe('');
  });
});
