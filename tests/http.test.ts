import test from "node:test";
import assert from "node:assert/strict";
import { createGatewayServer } from "../src/index.js";
import type { GatewayConfig } from "../src/config/env.js";

const config: GatewayConfig = {
  port: 0,
  gatewaySecret: "test-secret",
  allowedOrigins: ["https://genspark.ai"],
  requestTimeoutMs: 1000,
  maxBodyBytes: 100000,
  rateLimitPerMinute: 10,
};

test("health endpoint works", async () => {
  const server = createGatewayServer(config);
  const address = await server.listen(0, "127.0.0.1");
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  assert.equal(response.status, 200);
  const body = await response.json() as { status: string };
  assert.equal(body.status, "ok");
  await server.close();
});

test("MCP endpoint rejects missing authentication", async () => {
  const server = createGatewayServer(config);
  const address = await server.listen(0, "127.0.0.1");
  const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
    method: "POST",
    headers: { origin: "https://genspark.ai", "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  assert.equal(response.status, 401);
  await server.close();
});

test("MCP endpoint rejects invalid origin", async () => {
  const server = createGatewayServer(config);
  const address = await server.listen(0, "127.0.0.1");
  const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
    method: "POST",
    headers: { origin: "https://evil.test", authorization: "Bearer test-secret", "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  assert.equal(response.status, 403);
  await server.close();
});
