// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MenuListView } from '../components/menu/MenuListView';

afterEach(cleanup);

describe('MenuListView earlier days', () => {
  it('offers a button that loads earlier days', () => {
    const onPrevious = vi.fn();
    render(<MenuListView days={['2026-10-22']} menu={{}} recipes={[]} previous="load" onPrevious={onPrevious} />);
    fireEvent.click(screen.getByRole('button', { name: 'Load previous days' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('offers to hide the earlier days once two weeks are loaded', () => {
    const onPrevious = vi.fn();
    render(<MenuListView days={['2026-10-22']} menu={{}} recipes={[]} previous="hide" onPrevious={onPrevious} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide previous days' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });
});
