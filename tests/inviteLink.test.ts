import { describe, it, expect } from 'vitest';
import { afterSignInPath, buildInviteLink, inviteCodeFromSearch } from '../utils/inviteLink';

describe('buildInviteLink', () => {
  it('builds the join link from the app address and the code', () => {
    expect(buildInviteLink('https://dispensium.app', 'ABCD2345')).toBe('https://dispensium.app/join/ABCD2345');
  });
});

describe('inviteCodeFromSearch', () => {
  it('reads a well-formed code from the invite parameter', () => {
    expect(inviteCodeFromSearch('?invite=ABCD2345')).toBe('ABCD2345');
  });

  it('ignores a missing or malformed invite parameter', () => {
    expect(inviteCodeFromSearch('')).toBeNull();
    expect(inviteCodeFromSearch('?invite=../admin')).toBeNull();
    // A zero is not in the code alphabet.
    expect(inviteCodeFromSearch('?invite=ABCD2340')).toBeNull();
  });
});

describe('afterSignInPath', () => {
  it('sends a person who came from an invite link back to the join card', () => {
    expect(afterSignInPath('?invite=ABCD2345')).toBe('/join/ABCD2345');
  });

  it('sends everyone else home', () => {
    expect(afterSignInPath('')).toBe('/');
    expect(afterSignInPath('?invite=bad')).toBe('/');
  });
});
