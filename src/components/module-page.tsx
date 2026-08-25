type ModulePageProps = {
  title: string;
  kicker: string;
  description: string;
  capabilities: string[];
};

export function ModulePage({ title, kicker, description, capabilities }: Readonly<ModulePageProps>) {
  return (
    <main className="page-stack module-page">
      <section className="hero-copy">
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="lede">{description}</p>
      </section>
      <section className="module-grid" aria-label={`${title} capabilities`}>
        {capabilities.map((capability) => (
          <article className="module-card" key={capability}>
            <h3>{capability}</h3>
            <p>Designed as a real module boundary so this area can ship incrementally without polluting the rest of BCH〽️.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
