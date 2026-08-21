import type { ProviderAdapter } from "../types.js";
import { upstreamJson, textResult } from "../http.js";
import { GatewayError } from "../../security/errors.js";

export function createClaudeAdapter(timeoutMs = 30000): ProviderAdapter {
  const key = process.env.ANTHROPIC_API_KEY;
  const tools = key ? [{ name: "claude.generate", description: "Generate a response with Claude.", inputSchema: { type: "object", properties: { input: { type: "string" }, model: { type: "string" } }, required: ["input"] } }] : [];
  return {
    id: "claude",
    listTools: () => tools,
    async callTool(name, args) {
      if (!key || name !== "claude.generate") throw new GatewayError("PROVIDER_UNAVAILABLE", "Claude is not configured.", 503);
      const { input, model = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514" } = args as { input?: string; model?: string };
      if (!input) throw new GatewayError("PROVIDER_VALIDATION_FAILED", "input is required.", 422);
      const data = await upstreamJson<{ content?: Array<{ type?: string; text?: string }> }>("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model, max_tokens: 2048, messages: [{ role: "user", content: input }] }),
      }, timeoutMs);
      return textResult(data.content?.map((part) => part.text ?? "").filter(Boolean).join("\n") ?? JSON.stringify(data));
    },
    async healthCheck() { return key ? { id: "claude", status: "available" } : { id: "claude", status: "unavailable", detail: "API key not configured" }; },
  };
}
