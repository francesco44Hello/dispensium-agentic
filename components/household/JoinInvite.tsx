'use client';

import { useAuth } from '../../hooks/useAuth';
import { InvitePrompt } from './InvitePrompt';

// Reads the signed-in person and hands them to the join card. Waits for the auth check first.
export function JoinInvite({ code }: { code: string }) {
  const { status, user } = useAuth();
  if (status === 'loading') return null;

  const signedIn =
    status === 'authenticated' && user
      ? { uid: user.uid, displayName: user.displayName, photoUrl: user.photoURL }
      : null;
  return <InvitePrompt code={code} user={signedIn} />;
}
