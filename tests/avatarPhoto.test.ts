import { describe, it, expect } from 'vitest';
import { cleanPhotoUrl } from '../utils/photoUrl';
import { AVATAR_PHOTOS } from '../constants/avatars';

describe('built-in avatars', () => {
  it('lists four bundled avatar pictures', () => {
    expect(AVATAR_PHOTOS).toEqual([
      '/avatars/avatar-1.svg',
      '/avatars/avatar-2.svg',
      '/avatars/avatar-3.svg',
      '/avatars/avatar-4.svg',
    ]);
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
