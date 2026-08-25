import { ModulePage } from '@/components/module-page';

export default function EventsPage() {
  return <ModulePage title="Events" kicker="Live experiences" description="Community events, live sessions, spaces, announcements, reminders, and participation tracking for BCH〽️ culture moments." capabilities={['Event pages', 'RSVPs', 'Reminders', 'Live sessions', 'Announcements', 'Participation history']} />;
}
