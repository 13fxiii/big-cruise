const modules = [
  ['BCH ID', 'QR-backed identity, profile, achievements, status, and points.'],
  ['Games', 'Modular game registry for Ludo, UNO, Werewolf, Chess, quizzes, and more.'],
  ['Music', 'Social listening rooms with hosts, listeners, reactions, and chat architecture.'],
  ['Events', 'Live sessions, spaces, announcements, reminders, and participation tracking.'],
  ['Merch', 'Products, variants, inventory concepts, carts, and checkout integration seams.'],
  ['Notifications', 'Realtime-ready stream for mentions, replies, achievements, invites, and system news.']
] as const;

export function PlatformRail() {
  return (
    <section className="module-grid" aria-labelledby="platform-title">
      <div className="section-heading">
        <p className="kicker">Production foundation</p>
        <h2 id="platform-title">Built in phases, not fake feature soup.</h2>
      </div>
      {modules.map(([title, body]) => (
        <article className="module-card" key={title}>
          <h3>{title}</h3>
          <p>{body}</p>
        </article>
      ))}
    </section>
  );
}
