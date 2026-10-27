import { describe, it, expect } from 'vitest';
import { createAuthService } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';

describe('updateDisplayName', () => {
  it('saves a cleaned name on the signed-in account', async () => {
    const service = createAuthService(createMockAuthBackend());
    await service.signUp('alice@example.com', 'secret1', 'Alice');
    const updated = await service.updateDisplayName('  Ann <3  ');
    expect(updated.displayName).toBe('Ann 3');
  });

  it('refuses an empty name', async () => {
    const service = createAuthService(createMockAuthBackend());
    await service.signUp('alice@example.com', 'secret1', 'Alice');
    await expect(service.updateDisplayName('   ')).rejects.toMatchObject({ code: 'name-required' });
  });
});
