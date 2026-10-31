export type HomeScreenPlatform = 'ios' | 'android' | 'other';

// iPadOS in desktop mode reports itself as a Mac, so it reads as 'other' and sees both sets of steps.
export function homeScreenPlatform(userAgent: string): HomeScreenPlatform {
  if (/iPhone|iPad|iPod/u.test(userAgent)) return 'ios';
  if (/Android/u.test(userAgent)) return 'android';
  return 'other';
}
