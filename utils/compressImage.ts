import { fitWithin, MAX_SIDE, OUTPUT_QUALITY, OUTPUT_TYPE } from './recipeImage';

// Runs in the browser: resizes the photo and re-encodes it as WebP, so each stored photo stays small.
export async function compressImage(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_SIDE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available in this browser.');
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, OUTPUT_TYPE, OUTPUT_QUALITY));
    if (!blob) throw new Error('The photo could not be compressed.');
    return blob;
  } finally {
    bitmap.close();
  }
}
