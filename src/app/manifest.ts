import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BIG CRUISE〽️',
    short_name: 'BCH〽️',
    description: 'Nigerian internet-culture community for entertainment, banter, games, music, events, and rewards.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#FFD400',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
    ]
  };
}
