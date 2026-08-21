export type GatewayErrorCode =
  | "AUTHENTICATION_FAILED"
  | "AUTHORIZATION_FAILED"
  | "INVALID_REQUEST"
  | "UNKNOWN_TOOL"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_AUTH_FAILED"
  | "PROVIDER_VALIDATION_FAILED"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export class GatewayError extends Error {
  constructor(
    public readonly code: GatewayErrorCode,
    message: string,
    public readonly httpStatus = 500,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

export function safeGatewayError(error: unknown): GatewayError {
  if (error instanceof GatewayError) return error;
  return new GatewayError("INTERNAL_ERROR", "The gateway could not complete the request.", 500);
}
