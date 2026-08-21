import test from "node:test";
import assert from "node:assert/strict";
import { ProviderRegistry } from "../src/registry/providers.js";
import { routeToolCall } from "../src/server/router.js";
import { withTimeout, RateLimiter } from "../src/middleware/limits.js";

test("registers and routes a namespaced tool", async () => {
  const registry = new ProviderRegistry();
  const calls: string[] = [];
  registry.register({
    id: "github",
    listTools: () => [{ name: "github.read_file", description: "Read", inputSchema: { type: "object" } }],
    callTool: async (name) => { calls.push(name); return { content: [{ type: "text", text: "ok" }] }; },
    healthCheck: async () => ({ id: "github", status: "available" }),
  });
  await routeToolCall(registry, "github.read_file", {}, { requestId: "r1", providerId: "github", toolName: "github.read_file" });
  assert.deepEqual(calls, ["github.read_file"]);
});

test("rejects unknown tool", async () => {
  const registry = new ProviderRegistry();
  registry.register({ id: "github", listTools: () => [], callTool: async () => ({ content: [] }), healthCheck: async () => ({ id: "github", status: "available" }) });
  await assert.rejects(() => routeToolCall(registry, "github.missing", {}, { requestId: "r1", providerId: "github", toolName: "github.missing" }), /Unknown tool/);
});

test("translates timeout", async () => {
  await assert.rejects(() => withTimeout(new Promise((resolve) => setTimeout(resolve, 30)), 5), /Provider request timed out/);
});

test("enforces rate limit", () => {
  const limiter = new RateLimiter(2, 1000);
  limiter.check("client", "github");
  limiter.check("client", "github");
  assert.throws(() => limiter.check("client", "github"), /Rate limit exceeded/);
});
