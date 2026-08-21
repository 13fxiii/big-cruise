const SECRET_KEYS = new Set(["authorization", "apiKey", "apikey", "token", "access_token", "refresh_token", "password", "cookie", "set-cookie", "client_secret", "secret"]);

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!value || typeof value !== "object") return value;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = SECRET_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redactSecrets(entry);
  }
  return result;
}

export function logSafe(event: Record<string, unknown>): void {
  console.log(JSON.stringify(redactSecrets(event)));
}
