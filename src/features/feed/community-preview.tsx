const feedCapabilities = ['Posts', 'Replies', 'Reactions', 'Media', 'Trending', 'Notifications'] as const;

export function CommunityPreview() {
  return (
    <section id="community" className="feed-shell" aria-labelledby="feed-title">
      <div className="section-heading">
        <p className="kicker">Community core</p>
        <h2 id="feed-title">A real feed model comes before viral chaos.</h2>
        <p>Post, reaction, profile, notification, and points tables are designed in Supabase migrations so the client never becomes the source of truth for rewards.</p>
      </div>
      <div className="feed-card-list">
        {feedCapabilities.map((item) => <span key={item}>{item}</span>)}
      </div>
    </section>
  );
}
