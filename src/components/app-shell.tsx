import Link from 'next/link';
import type { Route } from 'next';
import type { DailyTheme } from '@/config/themes';
import { MobileNav } from './mobile-nav';
import { ThemeBadge } from './theme-badge';

const navItems = [
  ['/', 'Home'],
  ['/feed', 'Feed'],
  ['/games', 'Games'],
  ['/music', 'Music'],
  ['/events', 'Events'],
  ['/merch', 'Merch']
] as const satisfies readonly (readonly [Route, string])[];

export function AppShell({ children, theme }: Readonly<{ children: React.ReactNode; theme: DailyTheme }>) {
  return (
    <>
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="BIG CRUISE home">BIG CRUISE〽️</Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <ThemeBadge theme={theme} />
      </header>
      {children}
      <MobileNav items={navItems} />
    </>
  );
}
