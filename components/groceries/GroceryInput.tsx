'use client';

import { useState, type FormEvent } from 'react';
import { MdOutlineAddCircleOutline } from 'react-icons/md';
import styles from './GroceryInput.module.css';

type GroceryInputProps = {
  onAdd: (name: string) => void;
};

export function GroceryInput({ onAdd }: GroceryInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = value.trim();
    if (!name) return;
    onAdd(name);
    setValue('');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles.input}
        placeholder="Add a grocery item (e.g., apple)…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit" className={styles.submit} aria-label="Add item">
        <MdOutlineAddCircleOutline aria-hidden="true" />
      </button>
    </form>
  );
}
