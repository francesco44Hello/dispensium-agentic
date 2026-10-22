'use client';

import { useEffect, useState } from 'react';

// Returns the value once it has stopped changing for `delayMs`, so typing does not do work on every key.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
