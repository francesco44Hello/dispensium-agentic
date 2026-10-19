// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { GroceryList } from '../components/groceries/GroceryList';
import { createGroceryService } from '../services/groceryService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';

const HID = 'hh-1';

afterEach(() => {
  cleanup();
});

function renderList(service = createGroceryService(createMemoryDataBackend().groceries)) {
  render(<GroceryList householdId={HID} uid="alice" service={service} />);
  return service;
}

const addItem = async (name: string) => {
  fireEvent.change(screen.getByPlaceholderText(/add a grocery item/i), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: /add item/i }));
};

describe('GroceryList', () => {
  it('shows the empty state for a new list', async () => {
    renderList();
    expect(await screen.findByText('Your list is empty.')).toBeTruthy();
  });

  it('adds an item and groups it under its category', async () => {
    renderList();
    await addItem('Whole milk');
    expect(await screen.findByRole('checkbox', { name: 'Whole milk' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /dairy/ })).toBeTruthy();
  });

  it('marks an item completed when its checkbox is clicked', async () => {
    renderList();
    await addItem('apple');
    const checkbox = (await screen.findByRole('checkbox', { name: 'apple' })) as HTMLInputElement;
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox.checked).toBe(true));
  });

  it('removes completed items when Grocery completed is pressed', async () => {
    renderList();
    await addItem('apple');
    await addItem('milk');
    fireEvent.click(await screen.findByRole('checkbox', { name: 'apple' }));

    fireEvent.click(screen.getByRole('button', { name: /grocery completed/i }));

    await waitFor(() => expect(screen.queryByRole('checkbox', { name: 'apple' })).toBeNull());
    expect(screen.getByRole('checkbox', { name: 'milk' })).toBeTruthy();
  });

  it('toggles an item when its name is clicked', async () => {
    renderList();
    await addItem('apple');
    const checkbox = (await screen.findByRole('checkbox', { name: 'apple' })) as HTMLInputElement;
    fireEvent.click(screen.getByText('apple'));
    await waitFor(() => expect(checkbox.checked).toBe(true));
  });

  it('keeps the Grocery completed button disabled until an item is completed', async () => {
    renderList();
    await addItem('apple');
    const button = await screen.findByRole('button', { name: /grocery completed/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText('apple'));
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
  });

  it('shows a validation message when the name contains only blocked characters', async () => {
    renderList();
    await addItem('<>{}');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/valid item name/i);
  });

  it('shows live updates from another list on the same household', async () => {
    const service = createGroceryService(createMemoryDataBackend().groceries);
    render(
      <>
        <GroceryList householdId={HID} uid="alice" service={service} />
        <GroceryList householdId={HID} uid="bob" service={service} />
      </>,
    );
    const [first] = screen.getAllByPlaceholderText(/add a grocery item/i);
    fireEvent.change(first, { target: { value: 'bread' } });
    fireEvent.click(screen.getAllByRole('button', { name: /add item/i })[0]);

    await waitFor(() => expect(screen.getAllByRole('checkbox', { name: 'bread' })).toHaveLength(2));
  });
});
