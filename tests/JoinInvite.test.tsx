// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const { auth } = vi.hoisted(() => ({ auth: { current: { status: 'loading', user: null } as unknown } }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => auth.current }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

import { JoinInvite } from '../components/household/JoinInvite';

afterEach(() => {
  cleanup();
  auth.current = { status: 'loading', user: null };
});

describe('JoinInvite', () => {
  it('shows nothing while the sign-in check is still running', () => {
    const { container } = render(<JoinInvite code="ABCD2345" />);
    expect(container.textContent).toBe('');
  });

  it('asks a signed-out person to log in or sign up with the invite', () => {
    auth.current = { status: 'unauthenticated', user: null };
    render(<JoinInvite code="ABCD2345" />);
    expect(screen.getByRole('link', { name: /log in/i }).getAttribute('href')).toBe('/login?invite=ABCD2345');
  });
});
