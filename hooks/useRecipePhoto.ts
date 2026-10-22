'use client';

import { useEffect, useState } from 'react';
import { recipeService } from '../services/dataClient';

// Turns a stored photo path into a local URL. Empty paths resolve to ''. The URL is released when the path changes
// or the component unmounts, including when the photo finishes loading after that.
export function useRecipePhoto(path: string): string {
  const [photo, setPhoto] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    if (!path) return;
    let active = true;
    let resolvedUrl = '';
    recipeService.photoUrl(path).then(
      (url) => {
        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }
        resolvedUrl = url;
        setPhoto({ path, url });
      },
      () => undefined,
    );
    return () => {
      active = false;
      if (resolvedUrl) URL.revokeObjectURL(resolvedUrl);
    };
  }, [path]);

  return photo?.path === path ? photo.url : '';
}
