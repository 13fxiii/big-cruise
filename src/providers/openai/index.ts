import type { ProviderAdapter } from "../types.js";
import { upstreamJson, textResult } from "../http.js";
import { GatewayError } from "../../security/errors.js";

export function createOpenAIAdapter(timeoutMs = 30000): ProviderAdapter {
  const key = process.env.OPENAI_API_KEY;
  const tools = key ? [{ name: "openai.generate", description: "Generate a response with OpenAI.", inputSchema: { type: "object", properties: { input: { type: "string" }, model: { type: "string" } }, required: ["input"] } }] : [];
  return {
    id: "openai",
    listTools: () => tools,
    async callTool(name, args) {
      if (!key || name !== "openai.generate") throw new GatewayError("PROVIDER_UNAVAILABLE", "OpenAI is not configured.", 503);
      const input = (args as { input?: string; model?: string })?.input;
      if (!input) throw new GatewayError("PROVIDER_VALIDATION_FAILED", "input is required.", 422);
      const data = await upstreamJson<{ output?: Array<{ content?: Array<{ text?: string }> }> }>("https://api.openai.com/v1/responses", {
        method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: (args as { model?: string }).model ?? "gpt-5", input }),
      }, timeoutMs);
      const text = data.output?.flatMap((item) => item.content ?? []).map((part) => part.text ?? "").filter(Boolean).join("\n") ?? JSON.stringify(data);
      return textResult(text);
    },
    async healthCheck() { return key ? { id: "openai", status: "available" } : { id: "openai", status: "unavailable", detail: "API key not configured" }; },
  };
}
