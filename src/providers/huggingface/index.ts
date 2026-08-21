import type { ProviderAdapter } from "../types.js";
import { upstreamJson, textResult } from "../http.js";
import { GatewayError } from "../../security/errors.js";

export function createHuggingFaceAdapter(timeoutMs = 30000): ProviderAdapter {
  const token = process.env.HUGGINGFACE_TOKEN;
  const tools = token ? [
    { name: "huggingface.search_models", description: "Search Hugging Face models.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
    { name: "huggingface.search_datasets", description: "Search Hugging Face datasets.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  ] : [];
  return {
    id: "huggingface",
    listTools: () => tools,
    async callTool(name, args) {
      if (!token || !tools.some((tool) => tool.name === name)) throw new GatewayError("PROVIDER_UNAVAILABLE", "Hugging Face is not configured.", 503);
      const query = (args as { query?: string })?.query;
      if (!query) throw new GatewayError("PROVIDER_VALIDATION_FAILED", "query is required.", 422);
      const kind = name.endsWith("models") ? "models" : "datasets";
      const data = await upstreamJson<unknown>(`https://huggingface.co/api/${kind}?search=${encodeURIComponent(query)}&limit=10`, { headers: { authorization: `Bearer ${token}` } }, timeoutMs);
      return textResult(JSON.stringify(data, null, 2));
    },
    async healthCheck() { return token ? { id: "huggingface", status: "available" } : { id: "huggingface", status: "unavailable", detail: "Token not configured" }; },
  };
}
