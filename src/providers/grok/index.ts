import type { ProviderAdapter } from "../types.js";
import { upstreamJson, textResult } from "../http.js";
import { GatewayError } from "../../security/errors.js";

export function createGrokAdapter(timeoutMs = 30000): ProviderAdapter {
  const key = process.env.GROK_API_KEY;
  const tools = key ? [{ name: "grok.generate", description: "Generate a response with Grok.", inputSchema: { type: "object", properties: { input: { type: "string" }, model: { type: "string" } }, required: ["input"] } }] : [];
  return {
    id: "grok",
    listTools: () => tools,
    async callTool(name, args) {
      if (!key || name !== "grok.generate") throw new GatewayError("PROVIDER_UNAVAILABLE", "Grok is not configured.", 503);
      const { input, model = process.env.GROK_MODEL ?? "grok-4" } = args as { input?: string; model?: string };
      if (!input) throw new GatewayError("PROVIDER_VALIDATION_FAILED", "input is required.", 422);
      const data = await upstreamJson<{ choices?: Array<{ message?: { content?: string } }> }>("https://api.x.ai/v1/chat/completions", {
        method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: input }] }),
      }, timeoutMs);
      return textResult(data.choices?.[0]?.message?.content ?? JSON.stringify(data));
    },
    async healthCheck() { return key ? { id: "grok", status: "available" } : { id: "grok", status: "unavailable", detail: "API key not configured" }; },
  };
}
