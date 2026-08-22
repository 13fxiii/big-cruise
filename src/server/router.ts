import { ProviderRegistry } from "../registry/providers.js";
import type { RequestContext, ToolResult } from "../providers/types.js";
import { GatewayError } from "../security/errors.js";

export function resolveProviderId(toolName: string): string {
  const separator = toolName.indexOf(".");
  if (separator <= 0) throw new GatewayError("UNKNOWN_TOOL", "Unknown tool.", 404);
  return toolName.slice(0, separator);
}

export async function routeToolCall(
  registry: ProviderRegistry,
  toolName: string,
  args: unknown,
  context: RequestContext,
): Promise<ToolResult> {
  const providerId = resolveProviderId(toolName);
  const provider = registry.get(providerId);
  if (!provider.listTools().some((tool) => tool.name === toolName)) {
    throw new GatewayError("UNKNOWN_TOOL", "Unknown tool.", 404);
  }
  return provider.callTool(toolName, args, { ...context, providerId });
}
