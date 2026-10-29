import type { MetadataRoute } from 'next';

// Home screen install: the name, colours and icons the phone shows for Dispensium.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dispensium',
    short_name: 'Dispensium',
    description: 'Household dispensary management',
    start_url: '/',
    display: 'standalone',
    background_color: '#B7B1F2',
    theme_color: '#2D3C59',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
