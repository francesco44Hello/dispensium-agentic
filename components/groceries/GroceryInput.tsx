'use client';

import { useState, type FormEvent } from 'react';
import { MdOutlineAddCircleOutline } from 'react-icons/md';
import { useLocale } from '../i18n/LocaleProvider';
import styles from './GroceryInput.module.css';

type GroceryInputProps = {
  onAdd: (name: string) => void;
};

export function GroceryInput({ onAdd }: GroceryInputProps) {
  const [value, setValue] = useState('');
  const { t } = useLocale();

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
        placeholder={t('grocery.placeholder')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit" className={styles.submit} aria-label={t('grocery.add')}>
        <MdOutlineAddCircleOutline aria-hidden="true" />
      </button>
    </form>
  );
}
