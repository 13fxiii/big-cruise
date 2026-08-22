import { Client, SSEClientTransport } from "@modelcontextprotocol/client";
import type { ProviderAdapter, ToolResult } from "../types.js";
import { upstreamJson, textResult } from "../http.js";
import { GatewayError } from "../../security/errors.js";

const DEFAULT_FLUX_MCP_URL = "https://evalstate-flux1-schnell.hf.space/gradio_api/mcp/sse";

const fluxTool = {
  name: "huggingface.flux1_schnell_infer",
  description: "Generate an image with the Hugging Face FLUX.1 Schnell MCP Space.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: { type: "string" },
      seed: { type: "number", description: "Numeric value between 0 and 2147483647" },
      randomize_seed: { type: "boolean", default: true },
      width: { type: "number", minimum: 256, maximum: 2048, default: 1024 },
      height: { type: "number", minimum: 256, maximum: 2048, default: 1024 },
      num_inference_steps: { type: "number", minimum: 1, maximum: 50, default: 4 },
    },
    required: ["prompt"],
    additionalProperties: false,
  },
};

function serializeMcpResult(result: unknown): string {
  return JSON.stringify(result, (_key, value) => {
    if (value instanceof Uint8Array) return Buffer.from(value).toString("base64");
    return value;
  });
}

async function callFluxMcp(url: string, args: Record<string, unknown>, timeoutMs: number, signal?: AbortSignal): Promise<ToolResult> {
  const client = new Client({ name: "big-cruise-mcp-gateway", version: "0.1.0" });
  const transport = new SSEClientTransport(new URL(url));
  try {
    await client.connect(transport);
    const result = await client.callTool(
      {
        name: "flux1_schnell_infer",
        arguments: {
          prompt: args.prompt,
          seed: args.seed,
          randomize_seed: args.randomize_seed ?? true,
          width: args.width ?? 1024,
          height: args.height ?? 1024,
          num_inference_steps: args.num_inference_steps ?? 4,
        },
      },
      { signal: signal ?? AbortSignal.timeout(timeoutMs) },
    );
    return textResult(serializeMcpResult(result));
  } catch (error) {
    if (signal?.aborted) throw new GatewayError("PROVIDER_TIMEOUT", "Provider request timed out.", 504);
    throw new GatewayError(
      "PROVIDER_UPSTREAM_ERROR",
      `Hugging Face FLUX MCP request failed: ${error instanceof Error ? error.message : "unknown error"}`,
      502,
    );
  } finally {
    await client.close().catch(() => undefined);
  }
}

export function createHuggingFaceAdapter(timeoutMs = 30000): ProviderAdapter {
  const token = process.env.HUGGINGFACE_TOKEN;
  const fluxUrl = process.env.HUGGINGFACE_FLUX_MCP_URL ?? DEFAULT_FLUX_MCP_URL;
  const tools = [
    ...(token ? [
      { name: "huggingface.search_models", description: "Search Hugging Face models.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
      { name: "huggingface.search_datasets", description: "Search Hugging Face datasets.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
    ] : []),
    fluxTool,
  ];

  return {
    id: "huggingface",
    listTools: () => tools,
    async callTool(name, args, context) {
      if (name === fluxTool.name) {
        const input = (args ?? {}) as Record<string, unknown>;
        if (typeof input.prompt !== "string" || !input.prompt.trim()) {
          throw new GatewayError("PROVIDER_VALIDATION_FAILED", "prompt is required.", 422);
        }
        return callFluxMcp(fluxUrl, input, timeoutMs, context.signal);
      }

      if (!token || !tools.some((tool) => tool.name === name)) {
        throw new GatewayError("PROVIDER_UNAVAILABLE", "Hugging Face is not configured.", 503);
      }

      const query = (args as { query?: string })?.query;
      if (!query) throw new GatewayError("PROVIDER_VALIDATION_FAILED", "query is required.", 422);
      const kind = name.endsWith("models") ? "models" : "datasets";
      const data = await upstreamJson<unknown>(
        `https://huggingface.co/api/${kind}?search=${encodeURIComponent(query)}&limit=10`,
        { headers: { authorization: `Bearer ${token}` }, signal: context.signal },
        timeoutMs,
      );
      return textResult(JSON.stringify(data, null, 2));
    },
    async healthCheck() {
      try {
        const parsed = new URL(fluxUrl);
        return { id: "huggingface", status: "available", detail: `FLUX MCP configured at ${parsed.origin}` };
      } catch (error) {
        return { id: "huggingface", status: "unavailable", detail: `FLUX MCP URL is invalid: ${error instanceof Error ? error.message : "unknown error"}` };
      }
    },
  };
}
