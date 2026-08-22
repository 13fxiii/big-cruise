import { ModulePage } from '@/components/module-page';

export default function FeedPage() {
  return <ModulePage title="Community Feed" kicker="Banter engine" description="The feed is the BCH〽️ social core: posts, replies, reactions, media, profiles, trending content, and notifications backed by server-owned data." capabilities={['Posts', 'Replies', 'Reactions', 'Media attachments', 'Trending index', 'Realtime notifications']} />;
}
