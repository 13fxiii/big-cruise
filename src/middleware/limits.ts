import { GatewayError } from "../security/errors.js";

export async function withTimeout<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new GatewayError("PROVIDER_TIMEOUT", "Provider request timed out.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timer);
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
