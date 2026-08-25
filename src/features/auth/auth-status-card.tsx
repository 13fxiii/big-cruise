export function AuthStatusCard() {
  const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'X_CLIENT_ID', 'X_CLIENT_SECRET'];

  return (
    <section className="status-card" aria-labelledby="auth-title">
      <div>
        <p className="kicker">Auth architecture</p>
        <h2 id="auth-title">X OAuth first. No random email/password side quest.</h2>
        <p>OAuth secrets stay server-side. Supabase stores the BCH user identity, profile mapping, achievements, and points with Row Level Security.</p>
      </div>
      <ul aria-label="Required environment variables">
        {requiredEnv.map((name) => <li key={name}><code>{name}</code></li>)}
      </ul>
    </section>
  );
}
