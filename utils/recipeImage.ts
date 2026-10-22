// Recipe photos are compressed in the browser before upload, so storage stays cheap.
// Stored photos are WebP (uploads also accept JPEG and PNG). Sizes match storage.rules: 1 MB at most.
export const OUTPUT_TYPE = 'image/webp';
export const OUTPUT_QUALITY = 0.8;
export const MAX_SIDE = 1200;
export const MAX_PHOTO_BYTES = 1024 * 1024;

const ALLOWED_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

export function isAllowedImageType(type: string): boolean {
  return ALLOWED_TYPES.includes(type);
}

// Scales the photo so its longest side fits the limit. Small photos are never enlarged.
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
