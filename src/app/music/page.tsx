import { ModulePage } from '@/components/module-page';

export default function MusicPage() {
  return <ModulePage title="Music Rooms" kicker="New music energy" description="Social listening spaces for hosts, listeners, reactions, room chat, and discovery while respecting music licensing/API boundaries." capabilities={['Rooms', 'Hosts', 'Listeners', 'Now playing metadata', 'Reactions', 'Room chat']} />;
}
