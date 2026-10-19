'use client';

import { useContext } from 'react';
import { HouseholdContext, type HouseholdContextValue } from '../components/household/HouseholdProvider';

export function useHousehold(): HouseholdContextValue {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('useHousehold must be used inside <HouseholdProvider>');
  return context;
}
