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
  const registry = createProviderRegistry(1000);
  assert.deepEqual(registry.listTools(), []);
});
