import { GatewayError } from "../security/errors.js";

export function authenticateBearer(headers: Headers, expectedSecret: string): void {
  const value = headers.get("authorization");
  if (!value?.startsWith("Bearer ") || value.slice(7) !== expectedSecret) {
    throw new GatewayError("AUTHENTICATION_FAILED", "Authentication required.", 401);
  }
}
