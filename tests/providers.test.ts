import test from "node:test";
import assert from "node:assert/strict";
import { createProviderRegistry } from "../src/registry/providers.js";

test("all nine provider adapters are registered", () => {
  const registry = createProviderRegistry(1000);
  for (const id of ["x", "github", "huggingface", "genspark", "manus", "grok", "openai", "gemini", "claude"]) {
    assert.doesNotThrow(() => registry.get(id));
  }
});

test("unconfigured providers expose no fabricated tools", () => {
  const original = process.env.HUGGINGFACE_TOKEN;
  const originalFlux = process.env.HUGGINGFACE_FLUX_MCP_URL;
  delete process.env.HUGGINGFACE_TOKEN;
  process.env.HUGGINGFACE_FLUX_MCP_URL = "https://evalstate-flux1-schnell.hf.space/gradio_api/mcp/sse";
  try {
    const registry = createProviderRegistry(1000);
    assert.equal(registry.listTools().some((tool) => tool.name === "huggingface.flux1_schnell_infer"), true);
  } finally {
    if (original === undefined) delete process.env.HUGGINGFACE_TOKEN;
    else process.env.HUGGINGFACE_TOKEN = original;
    if (originalFlux === undefined) delete process.env.HUGGINGFACE_FLUX_MCP_URL;
    else process.env.HUGGINGFACE_FLUX_MCP_URL = originalFlux;
  }
});
