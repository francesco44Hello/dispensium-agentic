// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const panel = vi.hoisted(() => ({ loads: 0 }));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('../components/dev/AuthTestPanel', () => {
  panel.loads += 1;
  return { AuthTestPanel: () => <div>mock auth panel</div> };
});

async function loadPage() {
  vi.resetModules();
  const mod = await import('../app/dev/auth/page');
  return mod.default;
}

describe('/dev/auth page', () => {
  beforeEach(() => {
    panel.loads = 0;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 404 and never loads the auth test panel in a production build', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const DevAuthPage = await loadPage();
    await expect((async () => DevAuthPage())()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(panel.loads).toBe(0);
  });

  it('renders the auth test panel outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const DevAuthPage = await loadPage();
    render(await DevAuthPage());
    expect(screen.getByText('mock auth panel')).toBeInTheDocument();
    expect(panel.loads).toBe(1);
  });
});
