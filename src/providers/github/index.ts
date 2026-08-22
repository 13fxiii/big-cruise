import type { ProviderAdapter } from "../types.js";
import { upstreamJson, textResult } from "../http.js";
import { GatewayError } from "../../security/errors.js";

export function createGitHubAdapter(timeoutMs = 30000): ProviderAdapter {
  const token = process.env.GITHUB_TOKEN;
  const tools = token ? [{ name: "github.search_repositories", description: "Search GitHub repositories.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }] : [];
  return {
    id: "github",
    listTools: () => tools,
    async callTool(name, args) {
      if (!token || name !== "github.search_repositories") throw new GatewayError("PROVIDER_UNAVAILABLE", "GitHub is not configured.", 503);
      const query = (args as { query?: string })?.query;
      if (!query) throw new GatewayError("PROVIDER_VALIDATION_FAILED", "query is required.", 422);
      const data = await upstreamJson<{ items?: Array<{ full_name: string; html_url: string; description?: string | null }> }>(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=10`, {
        headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
      }, timeoutMs);
      return textResult(JSON.stringify(data.items ?? [], null, 2));
    },
    async healthCheck() { return token ? { id: "github", status: "available" } : { id: "github", status: "unavailable", detail: "Token not configured" }; },
  };
}
