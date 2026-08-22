import Link from 'next/link';
import type { Route } from 'next';

export function MobileNav({ items }: Readonly<{ items: readonly (readonly [Route, string])[] }>) {
  return (
    <nav className="mobile-nav" aria-label="Mobile primary navigation">
      {items.slice(0, 5).map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
    </nav>
  );
}
