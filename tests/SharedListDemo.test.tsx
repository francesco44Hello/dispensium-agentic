// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SharedListDemo } from '../components/landing/SharedListDemo';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderDemo() {
  return render(
    <LocaleProvider>
      <SharedListDemo />
    </LocaleProvider>,
  );
}

describe('SharedListDemo', () => {
  it('puts an item added on one phone on the other phone too', () => {
    renderDemo();
    expect(screen.queryAllByRole('checkbox', { name: 'Courgette' })).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Add Courgette' }));
    expect(screen.getAllByRole('checkbox', { name: 'Courgette' })).toHaveLength(2);
  });

  it('ticks an item on both phones when it is ticked on one', () => {
    renderDemo();
    fireEvent.click(screen.getByRole('button', { name: 'Add Courgette' }));

    const [mums, dads] = screen.getAllByRole('checkbox', { name: 'Courgette' });
    fireEvent.click(dads);
    expect(mums).toBeChecked();
    expect(dads).toBeChecked();
  });

  it('does not add the same item twice', () => {
    renderDemo();
    fireEvent.click(screen.getByRole('button', { name: 'Add Courgette' }));
    expect(screen.getByRole('button', { name: 'Add Courgette' })).toBeDisabled();
  });
});

describe('SharedListDemo labels', () => {
  it("names each phone after its owner, so it reads as one list seen twice", () => {
    renderDemo();
    expect(screen.getByRole('region', { name: "Mum's phone" })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: "Dad's phone" })).toBeInTheDocument();
  });
});
