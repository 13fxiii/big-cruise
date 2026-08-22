import Link from 'next/link';
import Image from 'next/image';
import { AuthStatusCard } from '@/features/auth/auth-status-card';
import { CommunityPreview } from '@/features/feed/community-preview';
import { PlatformRail } from '@/components/platform-rail';
import { getDailyTheme } from '@/config/themes';

export default function HomePage() {
  const theme = getDailyTheme();

  return (
    <main className="page-stack">
      <section className="hero-section" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="kicker">BCH〽️ is in {theme.name} mode today</p>
          <h1 id="home-title">Nigerian internet culture, but built like a real product.</h1>
          <p className="lede">Banter, memes, games, music rooms, events, achievements, and rewards — with X-powered identity and Supabase-ready architecture.</p>
          <div className="hero-actions" aria-label="Primary actions">
            <a className="button button-primary" href="/api/auth/x/start">Continue with X</a>
            <Link className="button button-secondary" href="#community">Explore BCH</Link>
          </div>
        </div>
        <div className="brand-card" aria-label="Official BIG CRUISE logo">
          <Image className="official-logo" src="/assets/big-cruise-logo-official.png" alt="Official BIG CRUISE logo" width={1024} height={1024} priority sizes="(max-width: 768px) 82vw, 420px" />
          <span>Official logo stays fixed. The app catches the daily cruise.</span>
        </div>
      </section>

      <AuthStatusCard />
      <CommunityPreview />
      <PlatformRail />
    </main>
  );
}
