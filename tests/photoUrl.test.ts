import { describe, it, expect } from 'vitest';
import { cleanPhotoUrl } from '../utils/photoUrl';

describe('cleanPhotoUrl', () => {
  it('keeps a Google profile picture link', () => {
    const url = 'https://lh3.googleusercontent.com/a/ACg8ocK=s96-c';
    expect(cleanPhotoUrl(url)).toBe(url);
  });

  it('rejects other hosts, so the app never loads images from arbitrary sites', () => {
    expect(cleanPhotoUrl('https://tracker.example.com/pixel.png')).toBe('');
    expect(cleanPhotoUrl('https://lh3.googleusercontent.com.evil.example/a.png')).toBe('');
  });

  it('rejects plain http and non-URL text', () => {
    expect(cleanPhotoUrl('http://lh3.googleusercontent.com/a/x')).toBe('');
    expect(cleanPhotoUrl('javascript:alert(1)')).toBe('');
    expect(cleanPhotoUrl(null)).toBe('');
  });

  it('strips blocked characters before reading the link', () => {
    expect(cleanPhotoUrl('https://lh3.googleusercontent.com/a/<x>')).toBe('https://lh3.googleusercontent.com/a/x');
  });

  it('rejects a link with a user or port in front of the host, which the rules would refuse', () => {
    expect(cleanPhotoUrl('https://user@lh3.googleusercontent.com/a/x')).toBe('');
    expect(cleanPhotoUrl('https://lh3.googleusercontent.com:8443/a/x')).toBe('');
  });

  it('rejects a bare host with no picture path', () => {
    expect(cleanPhotoUrl('https://lh3.googleusercontent.com')).toBe('');
    expect(cleanPhotoUrl('https://lh3.googleusercontent.com/')).toBe('');
  });

  it('rejects a link that grows past 300 characters once its spaces are encoded', () => {
    expect(cleanPhotoUrl('https://lh3.googleusercontent.com/' + ' '.repeat(100))).toBe('');
  });

  it('rejects links longer than 300 characters', () => {
    expect(cleanPhotoUrl('https://lh3.googleusercontent.com/' + 'a'.repeat(300))).toBe('');
  });
});
