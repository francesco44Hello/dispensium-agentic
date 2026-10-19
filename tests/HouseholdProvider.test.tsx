// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { AuthProvider } from '../components/auth/AuthProvider';
import { HouseholdProvider } from '../components/household/HouseholdProvider';
import { useHousehold } from '../hooks/useHousehold';
import { createAuthService } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';
import { createHouseholdService, HouseholdError } from '../services/householdService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';

afterEach(() => {
  cleanup();
});

function Status() {
  const { status, householdId, error } = useHousehold();
  return (
    <>
      <p data-testid="household">{`${status}:${householdId ?? 'none'}`}</p>
      <p data-testid="household-error">{error ?? ''}</p>
    </>
  );
}

function renderWith(householdService: ReturnType<typeof createHouseholdService>, authService = createAuthService(createMockAuthBackend())) {
  render(
    <AuthProvider service={authService}>
      <HouseholdProvider service={householdService}>
        <Status />
      </HouseholdProvider>
    </AuthProvider>,
  );
  return authService;
}

describe('HouseholdProvider', () => {
  it('stays idle while signed out', async () => {
    renderWith(createHouseholdService(createMemoryDataBackend().households));
    await waitFor(() => expect(screen.getByTestId('household').textContent).toBe('idle:none'));
  });

  it('creates the default household after sign-in and becomes ready', async () => {
    const auth = createAuthService(createMockAuthBackend());
    await auth.signUp('alice@example.com', 'secret123');
    renderWith(createHouseholdService(createMemoryDataBackend().households), auth);

    await waitFor(() => expect(screen.getByTestId('household').textContent).toMatch(/^ready:hh-\d+$/));
  });

  it('ensures the household only once', async () => {
    const auth = createAuthService(createMockAuthBackend());
    await auth.signUp('alice@example.com', 'secret123');
    const household = createHouseholdService(createMemoryDataBackend().households);
    const spy = vi.spyOn(household, 'ensureDefaultHousehold');

    renderWith(household, auth);

    await waitFor(() => expect(screen.getByTestId('household').textContent).toMatch(/^ready:/));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('reports an error when the household cannot be ensured', async () => {
    const auth = createAuthService(createMockAuthBackend());
    await auth.signUp('alice@example.com', 'secret123');
    const household = createHouseholdService(createMemoryDataBackend().households);
    vi.spyOn(household, 'ensureDefaultHousehold').mockRejectedValueOnce(new HouseholdError('unknown'));

    renderWith(household, auth);

    await waitFor(() => expect(screen.getByTestId('household').textContent).toBe('error:none'));
    expect(screen.getByTestId('household-error').textContent).toBe('unknown');
  });
});
