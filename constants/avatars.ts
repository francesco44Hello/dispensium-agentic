// Built-in avatars, shipped in public/avatars. They are same-origin paths, so they need no host check.
// The profile picker offers the peeps. The original four stay valid, so members who picked one keep their picture.
export const AVATAR_CHOICES: readonly string[] = [
  '/avatars/peep-01.svg',
  '/avatars/peep-02.svg',
  '/avatars/peep-03.svg',
  '/avatars/peep-04.svg',
  '/avatars/peep-05.svg',
  '/avatars/peep-06.svg',
  '/avatars/peep-07.svg',
  '/avatars/peep-08.svg',
  '/avatars/peep-09.svg',
  '/avatars/peep-10.svg',
  '/avatars/peep-11.svg',
  '/avatars/peep-12.svg',
];

const ORIGINAL_AVATARS: readonly string[] = [
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
  '/avatars/avatar-4.svg',
];

// Every bundled avatar a saved photo may point to, the picker's choices and the originals.
export const AVATAR_PHOTOS: readonly string[] = [...AVATAR_CHOICES, ...ORIGINAL_AVATARS];
