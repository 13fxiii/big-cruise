import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { getDailyTheme, themeCssVariables } from '@/config/themes';

export const metadata: Metadata = {
  title: 'BIG CRUISE〽️ | BCH〽️',
  description: 'A mobile-first Nigerian internet-culture community platform for banter, games, music, events, rewards, and creativity.',
  manifest: '/manifest.webmanifest',
  applicationName: 'BIG CRUISE〽️',
  appleWebApp: { capable: true, title: 'BIG CRUISE〽️', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon.svg' }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050505'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = getDailyTheme();

  return (
    <html lang="en" style={themeCssVariables(theme)} data-theme={theme.key}>
      <body>
        <ServiceWorkerRegister />
        <AppShell theme={theme}>{children}</AppShell>
      </body>
    </html>
  );
}
