import { GatewayError } from "../security/errors.js";

export async function upstreamJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
  try {
    const response = await fetch(url, { ...init, signal });
    const text = await response.text();
    let body: unknown = undefined;
    try { body = text ? JSON.parse(text) : undefined; } catch { body = undefined; }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new GatewayError("PROVIDER_AUTH_FAILED", "Provider authentication failed.", 502);
      if (response.status === 429) throw new GatewayError("PROVIDER_RATE_LIMIT", "Provider rate limit reached.", 429);
      if (response.status >= 400 && response.status < 500) throw new GatewayError("PROVIDER_VALIDATION_FAILED", "Provider rejected the request.", 422);
      throw new GatewayError("UPSTREAM_ERROR", "Provider service failed.", 502);
    }
    return body as T;
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new GatewayError("PROVIDER_TIMEOUT", "Provider request timed out.", 504);
    throw new GatewayError("PROVIDER_UNAVAILABLE", "Provider is unavailable.", 503);
  }
}

export function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}
