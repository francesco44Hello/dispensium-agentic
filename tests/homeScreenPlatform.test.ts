import { describe, it, expect } from 'vitest';
import { homeScreenPlatform } from '../utils/homeScreenPlatform';

describe('homeScreenPlatform', () => {
  it.each([
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1', 'ios'],
    ['iPad', 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1', 'ios'],
    ['Android Chrome', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36', 'android'],
    ['Windows desktop', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36', 'other'],
    ['Mac desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 'other'],
    ['empty', '', 'other'],
  ])('reads %s as %s', (_name, userAgent, platform) => {
    expect(homeScreenPlatform(userAgent)).toBe(platform);
  });
});
