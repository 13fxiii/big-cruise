import { GatewayError } from "../security/errors.js";

export function validateOrigin(headers: Headers, allowedOrigins: string[]): void {
  const origin = headers.get("origin");
  if (!origin || !allowedOrigins.includes(origin)) {
    throw new GatewayError("AUTHORIZATION_FAILED", "Origin is not allowed.", 403);
  }
}
