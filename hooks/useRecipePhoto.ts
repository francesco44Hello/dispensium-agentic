'use client';

import { useEffect, useState } from 'react';
import { recipeService } from '../services/dataClient';

// One fetch per photo path for the whole page, shared by every card and the detail view.
// Object URLs are kept until the page reloads, which keeps repeat views free. A failed fetch is dropped,
// so the next mount can retry it, but a single component never refetches on its own.
const urls = new Map<string, Promise<string>>();

function photoFor(path: string): Promise<string> {
  let pending = urls.get(path);
  if (!pending) {
    pending = recipeService.photoUrl(path);
    urls.set(path, pending);
    pending.catch(() => urls.delete(path));
  }
  return pending;
}

// Turns a stored photo path into a local URL. Empty paths resolve to ''.
export function useRecipePhoto(path: string): string {
  const [photo, setPhoto] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    if (!path) return;
    let active = true;
    photoFor(path).then(
      (url) => {
        if (active) setPhoto({ path, url });
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [path]);

  return photo?.path === path ? photo.url : '';
}
