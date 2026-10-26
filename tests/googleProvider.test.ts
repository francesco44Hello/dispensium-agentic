import { describe, it, expect } from 'vitest';
import { createGoogleProvider } from '../services/authBackends/googleProvider';

describe('createGoogleProvider', () => {
  it('always shows the account chooser, so the user picks an account every time', () => {
    expect(createGoogleProvider().getCustomParameters()).toMatchObject({ prompt: 'select_account' });
  });
});
