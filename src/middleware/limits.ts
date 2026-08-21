import { GatewayError } from "../security/errors.js";

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new GatewayError("PROVIDER_TIMEOUT", "Provider request timed out.", 504)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  constructor(private readonly limit: number, private readonly windowMs = 60_000) {}

  check(clientKey: string, providerId: string): void {
    const key = `${clientKey}:${providerId}`;
    const now = Date.now();
    const current = (this.hits.get(key) ?? []).filter((time) => now - time < this.windowMs);
    if (current.length >= this.limit) throw new GatewayError("PROVIDER_RATE_LIMIT", "Rate limit exceeded.", 429);
    current.push(now);
    this.hits.set(key, current);
  }
}
