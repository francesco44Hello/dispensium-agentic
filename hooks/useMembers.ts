'use client';

import { useEffect, useState } from 'react';
import type { HouseholdService } from '../services/householdService';
import type { HouseholdMember } from '../types/household';

export function useMembers(householdId: string, service: HouseholdService): HouseholdMember[] | null {
  const [members, setMembers] = useState<{ householdId: string; list: HouseholdMember[] } | null>(null);

  useEffect(() => {
    return service.subscribeToMembers(householdId, (list) => setMembers({ householdId, list }));
  }, [householdId, service]);

  return members?.householdId === householdId ? members.list : null;
}
