import type { ProviderAdapter } from "../types.js";
import { upstreamJson, textResult } from "../http.js";
import { GatewayError } from "../../security/errors.js";

export function createXAdapter(timeoutMs = 30000): ProviderAdapter {
  const token = process.env.X_API_KEY;
  const tools = token ? [{ name: "x.search", description: "Search recent public posts on X.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }] : [];
  return {
    id: "x",
    listTools: () => tools,
    async callTool(name, args) {
      if (!token || name !== "x.search") throw new GatewayError("PROVIDER_UNAVAILABLE", "X is not configured.", 503);
      const query = (args as { query?: string })?.query;
      if (!query) throw new GatewayError("PROVIDER_VALIDATION_FAILED", "query is required.", 422);
      const data = await upstreamJson<unknown>(`https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=created_at,author_id`, {
        headers: { authorization: `Bearer ${token}` },
      }, timeoutMs);
      return textResult(JSON.stringify(data, null, 2));
    },
    async healthCheck() { return token ? { id: "x", status: "available" } : { id: "x", status: "unavailable", detail: "API credential not configured" }; },
  };
}
