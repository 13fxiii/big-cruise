import type { DailyTheme } from '@/config/themes';

export function ThemeBadge({ theme }: Readonly<{ theme: DailyTheme }>) {
  return (
    <aside className="theme-badge" aria-label={`Daily theme: ${theme.name}`}>
      <span>{theme.day}</span>
      <strong>{theme.name}</strong>
    </aside>
  );
}
