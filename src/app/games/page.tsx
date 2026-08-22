import { ModulePage } from '@/components/module-page';

export default function GamesPage() {
  return <ModulePage title="Games" kicker="Play architecture" description="A modular games area prepared for Ludo, UNO, Werewolf, Chess, Draw It Out, Codenames, word games, karaoke, Truth or Dare, and quizzes." capabilities={['Game registry', 'Invites', 'Rooms', 'Scores', 'Achievements', 'Anti-cheat boundaries']} />;
}
