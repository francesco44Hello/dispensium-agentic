'use client';

import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { useLocale } from '../i18n/LocaleProvider';
import { GroceryList } from './GroceryList';

export function GroceryScreen() {
  const { user } = useAuth();
  const { status, householdId, error } = useHousehold();
  const { t } = useLocale();

  if (status === 'error') {
    return (
      <p role="alert">
        {t('household.loadErrorDetail', { error: error ?? t('error.unknownDetail') })}
      </p>
    );
  }
  if (status !== 'ready' || !householdId || !user) {
    return <p role="status">{t('grocery.loading')}</p>;
  }
  return <GroceryList householdId={householdId} uid={user.uid} />;
}
