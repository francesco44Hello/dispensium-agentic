// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { GroceryList } from '../components/groceries/GroceryList';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { createGroceryService } from '../services/groceryService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  window.localStorage.setItem('dispensium-locale', 'it');
});

describe('GroceryList in Italian', () => {
  it('shows the list text, the category name and the empty state in Italian', async () => {
    const service = createGroceryService(createMemoryDataBackend().groceries);
    render(
      <LocaleProvider>
        <GroceryList householdId="hh-1" uid="alice" service={service} />
      </LocaleProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Cosa manca?' })).toBeTruthy();
    expect(screen.getByText('La lista è vuota.')).toBeTruthy();
    expect(screen.getByPlaceholderText('Aggiungi un prodotto (es. mela)…')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Aggiungi un prodotto (es. mela)…'), { target: { value: 'Whole milk' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));
    expect(await screen.findByRole('heading', { name: /latticini/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Spesa completata' })).toBeTruthy();
  });
});
