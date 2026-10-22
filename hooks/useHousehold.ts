'use client';

import { useContext } from 'react';
import { HouseholdContext } from '../components/household/HouseholdProvider';
import type { HouseholdContextValue } from '../types/household';

export function useHousehold(): HouseholdContextValue {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('useHousehold must be used inside <HouseholdProvider>');
  return context;
}
