export interface GatewayConfig {
  port: number;
  gatewaySecret: string;
  allowedOrigins: string[];
  requestTimeoutMs: number;
  maxBodyBytes: number;
  rateLimitPerMinute: number;
}

const integer = (value: string | undefined, fallback: number) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`Invalid positive integer configuration: ${value}`);
  return parsed;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const gatewaySecret = env.GATEWAY_SECRET?.trim();
  if (!gatewaySecret) throw new Error("GATEWAY_SECRET is required");

  const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    port: integer(env.PORT, 3000),
    gatewaySecret,
    allowedOrigins,
    requestTimeoutMs: integer(env.REQUEST_TIMEOUT_MS, 30000),
    maxBodyBytes: integer(env.MAX_BODY_BYTES, 1048576),
    rateLimitPerMinute: integer(env.RATE_LIMIT_PER_MINUTE, 60),
  };
}
