import type { ProviderAdapter, ToolDefinition } from "../types.js";
import { GatewayError } from "../../security/errors.js";

export function createManusAdapter(): ProviderAdapter {
  const endpoint = process.env.MANUS_MCP_URL;
  const token = process.env.MANUS_API_KEY;
  const tools: ToolDefinition[] = endpoint ? [{ name: "manus.status", description: "Check whether the configured Manus MCP endpoint is reachable.", inputSchema: { type: "object", properties: {} } }] : [];
  return {
    id: "manus",
    listTools: () => tools,
    async callTool(name) {
      if (!endpoint || name !== "manus.status") throw new GatewayError("PROVIDER_UNAVAILABLE", "Manus MCP endpoint is not configured.", 503);
      const response = await fetch(endpoint, { method: "GET", headers: token ? { authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new GatewayError("PROVIDER_UNAVAILABLE", "Manus MCP endpoint is unavailable.", 503);
      return { content: [{ type: "text", text: JSON.stringify({ reachable: true, status: response.status }) }] };
    },
    async healthCheck() { return endpoint ? { id: "manus", status: "available" } : { id: "manus", status: "unavailable", detail: "MANUS_MCP_URL not configured" }; },
  };
}
