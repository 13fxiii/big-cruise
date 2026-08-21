import type { ProviderAdapter } from "../types.js";
import { upstreamJson, textResult } from "../http.js";
import { GatewayError } from "../../security/errors.js";

export function createGeminiAdapter(timeoutMs = 30000): ProviderAdapter {
  const key = process.env.GEMINI_API_KEY;
  const tools = key ? [{ name: "gemini.generate", description: "Generate a response with Gemini.", inputSchema: { type: "object", properties: { input: { type: "string" }, model: { type: "string" } }, required: ["input"] } }] : [];
  return {
    id: "gemini",
    listTools: () => tools,
    async callTool(name, args) {
      if (!key || name !== "gemini.generate") throw new GatewayError("PROVIDER_UNAVAILABLE", "Gemini is not configured.", 503);
      const { input, model = "gemini-2.5-flash" } = args as { input?: string; model?: string };
      if (!input) throw new GatewayError("PROVIDER_VALIDATION_FAILED", "input is required.", 422);
      const data = await upstreamJson<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }>(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: input }] }] }),
      }, timeoutMs);
      const text = data.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").filter(Boolean).join("\n") ?? JSON.stringify(data);
      return textResult(text);
    },
    async healthCheck() { return key ? { id: "gemini", status: "available" } : { id: "gemini", status: "unavailable", detail: "API key not configured" }; },
  };
}
