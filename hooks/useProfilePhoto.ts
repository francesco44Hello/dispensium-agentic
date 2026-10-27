'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useHousehold } from './useHousehold';

// The picture to show for the signed-in user: the one saved on their household member record,
// otherwise their sign-in picture.
export function useProfilePhoto(): string | null {
  const { user } = useAuth();
  const { householdId, service } = useHousehold();
  const uid = user?.uid ?? null;
  const [memberPhoto, setMemberPhoto] = useState<{ householdId: string; photoUrl: string | null } | null>(null);

  useEffect(() => {
    if (!householdId || !uid) return;
    return service.subscribeToMembers(householdId, (members) => {
      const me = members.find((member) => member.uid === uid);
      setMemberPhoto({ householdId, photoUrl: me?.photoUrl ?? null });
    });
  }, [householdId, service, uid]);

  const fromMember = memberPhoto?.householdId === householdId ? memberPhoto.photoUrl : null;
  return fromMember || user?.photoURL || null;
}
