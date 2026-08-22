import { GatewayError } from "./errors.js";

export function assertToolAllowed(toolName: string, allowedTools: string[]): void {
  if (!allowedTools.includes(toolName)) {
    throw new GatewayError("AUTHORIZATION_FAILED", "Tool is not permitted.", 403);
  }
}
