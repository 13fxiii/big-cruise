import type { ProviderAdapter, ToolDefinition } from "../types.js";
import { GatewayError } from "../../security/errors.js";

export function createGensparkAdapter(): ProviderAdapter {
  const endpoint = process.env.GENSPARK_WORKER_URL;
  const token = process.env.GENSPARK_WORKER_TOKEN;
  const tools: ToolDefinition[] = endpoint ? [
    { name: "genspark.generate_image", description: "Request image generation through the isolated Genspark worker.", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } },
    { name: "genspark.generate_video", description: "Request video generation through the isolated Genspark worker.", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } },
  ] : [];
  return {
    id: "genspark",
    listTools: () => tools,
    async callTool(name, args) {
      if (!endpoint || !tools.some((tool) => tool.name === name)) throw new GatewayError("PROVIDER_UNAVAILABLE", "Genspark worker is not configured.", 503);
      const response = await fetch(`${endpoint.replace(/\/$/, "")}/tool`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ tool: name, arguments: args }),
      });
      if (!response.ok) throw new GatewayError(response.status === 429 ? "PROVIDER_RATE_LIMIT" : "UPSTREAM_ERROR", "Genspark worker request failed.", response.status === 429 ? 429 : 502);
      const payload = await response.text();
      return { content: [{ type: "text", text: payload }] };
    },
    async healthCheck() { return endpoint && token ? { id: "genspark", status: "available" } : { id: "genspark", status: "unavailable", detail: "Isolated worker credentials not configured" }; },
  };
}
