# BIG CRUISE MCP Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure Streamable HTTP MCP gateway in the `big-cruise` repository so Genspark can reach a controlled set of provider adapters through one authenticated `/mcp` endpoint.

**Architecture:** A small TypeScript/Node.js service owns MCP transport, authentication, Origin validation, routing, permissions, rate limiting, health reporting, and safe error translation. Provider adapters implement a common contract and remain isolated from the transport layer; local browser-session Genspark functionality is represented by an explicitly isolated adapter boundary rather than exposed directly to the public gateway.

**Tech Stack:** TypeScript, Node.js, official MCP TypeScript SDK, Streamable HTTP, Node built-in test runner, Docker, Railway.

**Spec:** `docs/superpowers/specs/bc-mcp.md`

## Global Constraints

- Use MCP Streamable HTTP as the primary remote transport and expose `/mcp`.
- Production endpoint must use HTTPS.
- Authenticate every protected MCP request with the gateway bearer secret.
- Validate Origin before processing MCP requests.
- Validate active MCP protocol/version headers.
- Never expose or log provider credentials, cookies, browser profiles, passwords, MFA material, or authorization headers.
- Apply request-size, timeout, per-provider, and per-client rate limits.
- Unsupported provider operations must return structured MCP errors rather than fabricated capabilities.
- Integration tests must not require live provider credentials.
- Genspark browser-session functionality must stay behind a separate worker/adapter boundary and off the public network unless an authenticated worker protocol is explicitly implemented.
- Adding a provider must not require changes to core transport, authentication, routing, or existing adapters.

---

## Repository Map

Create the gateway as a focused service in the existing repository without altering the existing BIG CRUISE product code:

- Create: `src/server/http.ts` — HTTP server and MCP transport entrypoint.
- Create: `src/server/auth.ts` — bearer-token verification.
- Create: `src/server/origin.ts` — Origin allowlist validation.
- Create: `src/server/router.ts` — namespace/tool routing.
- Create: `src/registry/providers.ts` — provider registration and health aggregation.
- Create: `src/registry/tools.ts` — stable tool definitions and lookup.
- Create: `src/providers/types.ts` — shared adapter interfaces and result/error types.
- Create: `src/providers/x/index.ts` — X adapter boundary.
- Create: `src/providers/github/index.ts` — GitHub adapter boundary.
- Create: `src/providers/huggingface/index.ts` — Hugging Face adapter boundary.
- Create: `src/providers/genspark/index.ts` — isolated Genspark worker boundary.
- Create: `src/providers/manus/index.ts` — Manus adapter boundary.
- Create: `src/providers/grok/index.ts` — xAI/Grok adapter boundary.
- Create: `src/providers/openai/index.ts` — OpenAI adapter boundary.
- Create: `src/providers/gemini/index.ts` — Gemini adapter boundary.
- Create: `src/providers/claude/index.ts` — Anthropic/Claude adapter boundary.
- Create: `src/security/errors.ts` — safe structured gateway errors.
- Create: `src/security/permissions.ts` — explicit tool permissions.
- Create: `src/middleware/limits.ts` — request limits, timeout, and rate limiting.
- Create: `src/config/env.ts` — validated environment configuration.
- Create: `src/index.ts` — service bootstrap.
- Create: `tests/security.test.ts` — authentication, Origin, redaction, permission tests.
- Create: `tests/router.test.ts` — registration and namespace routing tests.
- Create: `tests/providers.test.ts` — adapter contract and error translation tests.
- Create: `tests/http.test.ts` — `/mcp` and `/health` behavior tests.
- Create: `.env.example` — non-secret configuration names only.
- Create: `Dockerfile` — production container.
- Create: `package.json` — gateway dependencies/scripts.
- Create: `tsconfig.json` — strict TypeScript configuration.
- Modify: `README.md` — gateway setup, provider configuration, local testing, and Genspark connection instructions.

---

### Task 1: Scaffold the isolated TypeScript gateway

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`
- Create: `.env.example`
- Create: `tests/http.test.ts`

**Interfaces:**
- Produces the executable `start` and `test` scripts used by all later tasks.
- `src/index.ts` exports `createGatewayServer(config)` for testable bootstrap.

- [ ] **Step 1: Write the failing bootstrap test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createGatewayServer } from "../src/index.js";

test("gateway bootstrap exposes a health endpoint", async () => {
  const server = await createGatewayServer({
    gatewaySecret: "test-secret",
    allowedOrigins: ["https://example.test"],
  });
  const address = await server.listen(0);
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  assert.equal(response.status, 200);
  await server.close();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --test-name-pattern="gateway bootstrap exposes a health endpoint"`
Expected: FAIL because the project has no gateway bootstrap yet.

- [ ] **Step 3: Add minimal project scaffolding**

`package.json` must define:

```json
{
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "node --test --import tsx tests/**/*.test.ts"
  }
}
```

Use the official MCP TypeScript SDK, `tsx`, and a small Node HTTP framework/adapter only if required by the SDK transport. Keep dependencies minimal.

- [ ] **Step 4: Add strict TypeScript configuration**

`tsconfig.json` must enable strict mode, NodeNext module resolution, declaration-free production compilation, and `dist` output.

- [ ] **Step 5: Add `.env.example`**

Include only names such as `PORT`, `GATEWAY_SECRET`, `ALLOWED_ORIGINS`, `REQUEST_TIMEOUT_MS`, `MAX_BODY_BYTES`, and provider credential names. Put no real values in the file.

- [ ] **Step 6: Implement the minimal health bootstrap**

Implement `createGatewayServer()` with a `/health` response of JSON `{ "status": "ok" }` and a closeable HTTP server.

- [ ] **Step 7: Run the focused test and verify it passes**

Run: `npm test -- --test-name-pattern="gateway bootstrap exposes a health endpoint"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json src/index.ts tests/http.test.ts .env.example
git commit -m "feat: scaffold MCP gateway service"
```

---

### Task 2: Define configuration, safe errors, authentication, Origin validation, and permissions

**Files:**
- Create: `src/config/env.ts`
- Create: `src/security/errors.ts`
- Create: `src/server/auth.ts`
- Create: `src/server/origin.ts`
- Create: `src/security/permissions.ts`
- Create: `tests/security.test.ts`

**Interfaces:**
- `loadConfig(env: NodeJS.ProcessEnv): GatewayConfig`.
- `authenticateBearer(headers, expectedSecret): AuthResult`.
- `validateOrigin(origin, allowedOrigins): boolean`.
- `isToolAllowed(toolName, policy): boolean`.
- `GatewayError` carries `code`, safe `message`, and optional HTTP status.

- [ ] **Step 1: Write failing security tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { authenticateBearer } from "../src/server/auth.js";
import { validateOrigin } from "../src/server/origin.js";
import { isToolAllowed } from "../src/security/permissions.js";

test("rejects missing bearer token", () => {
  assert.equal(authenticateBearer(new Headers(), "secret").ok, false);
});

test("accepts the exact bearer token", () => {
  const headers = new Headers({ authorization: "Bearer secret" });
  assert.equal(authenticateBearer(headers, "secret").ok, true);
});

test("rejects an unapproved origin", () => {
  assert.equal(validateOrigin("https://evil.test", ["https://genspark.ai"]), false);
});

test("allows only explicitly registered tools", () => {
  assert.equal(isToolAllowed("github.read_file", ["github.read_file"]), true);
  assert.equal(isToolAllowed("github.delete_repository", ["github.read_file"]), false);
});
```

- [ ] **Step 2: Run security tests and verify failure**

Run: `npm test -- tests/security.test.ts`
Expected: FAIL because the security modules do not exist.

- [ ] **Step 3: Implement exact bearer authentication**

Accept only `Authorization: Bearer <configured-secret>`. Missing, malformed, or non-matching credentials return `{ ok: false, reason: "unauthorized" }`. Never include the received token in an error.

- [ ] **Step 4: Implement strict Origin validation**

If an Origin header exists, require an exact match against `ALLOWED_ORIGINS`. If the deployment is configured to require Origin, reject missing Origin as well. Return only a boolean; never echo the Origin in errors.

- [ ] **Step 5: Implement explicit tool permissions**

Use an allowlist of fully qualified tool names. Do not infer permissions from namespace prefixes.

- [ ] **Step 6: Implement safe error types**

Map gateway failures to stable codes: `AUTHENTICATION_FAILED`, `AUTHORIZATION_FAILED`, `INVALID_REQUEST`, `UNKNOWN_TOOL`, `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`, `PROVIDER_RATE_LIMIT`, `PROVIDER_AUTH_FAILED`, `PROVIDER_VALIDATION_FAILED`, `UPSTREAM_ERROR`, `INTERNAL_ERROR`.

- [ ] **Step 7: Run tests and verify pass**

Run: `npm test -- tests/security.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/config/env.ts src/security/errors.ts src/server/auth.ts src/server/origin.ts src/security/permissions.ts tests/security.test.ts
git commit -m "feat: add gateway security primitives"
```

---

### Task 3: Build the provider adapter contract and registry

**Files:**
- Create: `src/providers/types.ts`
- Create: `src/registry/providers.ts`
- Create: `src/registry/tools.ts`
- Create: `tests/router.test.ts`

**Interfaces:**

```ts
export interface RequestContext {
  requestId: string;
  providerId: string;
  toolName: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export interface ProviderHealth {
  id: string;
  status: "available" | "degraded" | "unavailable";
}

export interface ProviderAdapter {
  id: string;
  listTools(): ToolDefinition[];
  callTool(name: string, args: unknown, context: RequestContext): Promise<ToolResult>;
  healthCheck(): Promise<ProviderHealth>;
}
```

`ProviderRegistry` exposes `register(adapter)`, `get(providerId)`, `listTools()`, and `healthCheckAll()`.

- [ ] **Step 1: Write failing registration/routing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { ProviderRegistry } from "../src/registry/providers.js";

const adapter = {
  id: "github",
  listTools: () => [{ name: "github.read_file", description: "Read a file", inputSchema: { type: "object" } }],
  callTool: async () => ({ content: [{ type: "text", text: "ok" }] }),
  healthCheck: async () => ({ id: "github", status: "available" as const }),
};

test("registers and resolves a provider tool", () => {
  const registry = new ProviderRegistry();
  registry.register(adapter);
  assert.equal(registry.get("github"), adapter);
  assert.equal(registry.listTools()[0].name, "github.read_file");
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/router.test.ts`
Expected: FAIL because the registry does not exist.

- [ ] **Step 3: Implement the adapter contract and registry**

Reject duplicate provider IDs and duplicate fully qualified tool names. Derive no capabilities that an adapter did not return.

- [ ] **Step 4: Implement namespace extraction**

Add `resolveProviderId(toolName: string): string | null` that returns the segment before the first `.` only when the name contains exactly the expected provider prefix shape.

- [ ] **Step 5: Run tests and verify pass**

Run: `npm test -- tests/router.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/providers/types.ts src/registry/providers.ts src/registry/tools.ts tests/router.test.ts
git commit -m "feat: add provider adapter registry"
```

---

### Task 4: Add routing, request limits, timeouts, and rate limiting

**Files:**
- Create: `src/server/router.ts`
- Create: `src/middleware/limits.ts`
- Modify: `tests/router.test.ts`
- Modify: `tests/security.test.ts`

**Interfaces:**
- `routeToolCall(registry, toolName, args, context): Promise<ToolResult>`.
- `withTimeout(promise, timeoutMs): Promise<ToolResult>`.
- `RateLimiter.check(clientKey, providerId): RateLimitDecision`.

- [ ] **Step 1: Write failing routing tests**

```ts
test("routes github.read_file to the github adapter", async () => {
  const calls: string[] = [];
  const registry = new ProviderRegistry();
  registry.register({
    id: "github",
    listTools: () => [{ name: "github.read_file", description: "Read", inputSchema: { type: "object" } }],
    callTool: async (name) => {
      calls.push(name);
      return { content: [{ type: "text", text: "ok" }] };
    },
    healthCheck: async () => ({ id: "github", status: "available" }),
  });
  await routeToolCall(registry, "github.read_file", {}, { requestId: "r1", providerId: "github", toolName: "github.read_file" });
  assert.deepEqual(calls, ["github.read_file"]);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/router.test.ts`
Expected: FAIL because the router is not implemented.

- [ ] **Step 3: Implement namespace routing**

Resolve the provider from the tool namespace, ensure the tool exists in that adapter's `listTools()`, then call the adapter. Unknown namespaces and tools must throw the stable `UNKNOWN_TOOL` error.

- [ ] **Step 4: Write timeout and rate-limit tests**

```ts
test("translates a provider timeout", async () => {
  await assert.rejects(
    () => withTimeout(new Promise((resolve) => setTimeout(resolve, 50)), 5),
    (error: Error) => error.message === "PROVIDER_TIMEOUT",
  );
});
```

Add a test proving a third request is rejected when a limiter is configured for two requests per window.

- [ ] **Step 5: Implement bounded request controls**

Reject bodies above `MAX_BODY_BYTES`, enforce `REQUEST_TIMEOUT_MS`, and use an in-memory limiter keyed by authenticated client plus provider. Keep the limiter interface replaceable so distributed storage can be added later without changing routing.

- [ ] **Step 6: Run tests and verify pass**

Run: `npm test -- tests/router.test.ts tests/security.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server/router.ts src/middleware/limits.ts tests/router.test.ts tests/security.test.ts
git commit -m "feat: add MCP routing and request controls"
```

---

### Task 5: Integrate the official MCP Streamable HTTP transport

**Files:**
- Modify: `src/server/http.ts`
- Modify: `src/index.ts`
- Modify: `tests/http.test.ts`

**Interfaces:**
- `createMcpHttpHandler(dependencies)` handles POST `/mcp` requests.
- The handler delegates MCP JSON-RPC/tool execution to the registry/router and applies authentication, Origin, protocol-header, size, timeout, permission, and error policies before execution.

- [ ] **Step 1: Write failing HTTP tests**

```ts
test("rejects an unauthenticated MCP POST", async () => {
  const server = await createGatewayServer({ gatewaySecret: "secret", allowedOrigins: ["https://genspark.ai"] });
  const address = await server.listen(0);
  const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://genspark.ai" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  assert.equal(response.status, 401);
  await server.close();
});
```

Add tests for invalid Origin, missing active protocol-version headers, unknown tool, and a valid authenticated `tools/list` request.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/http.test.ts`
Expected: FAIL because the Streamable HTTP handler is not implemented.

- [ ] **Step 3: Implement the MCP transport with the official SDK**

Use the official MCP TypeScript SDK's current Streamable HTTP server transport. Expose one `/mcp` endpoint and handle POST JSON-RPC requests. Do not implement deprecated HTTP+SSE as the primary path.

- [ ] **Step 4: Validate active protocol headers before dispatch**

Require the current protocol/version and MCP method/name request headers required by the active Streamable HTTP specification, while returning a deterministic invalid-request error for missing or malformed values.

- [ ] **Step 5: Connect `tools/list` to the provider registry**

Return only tools registered by enabled adapters. Tool names must retain their provider namespace.

- [ ] **Step 6: Connect `tools/call` to permissions and router**

Check explicit permission first, then route the call. Never pass gateway secrets or provider credentials into tool arguments or tool results.

- [ ] **Step 7: Implement safe HTTP error mapping**

Map auth to 401, authorization to 403, invalid request to 400, rate limit to 429, and internal/upstream failures to safe 5xx responses without stack traces.

- [ ] **Step 8: Run tests and verify pass**

Run: `npm test -- tests/http.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/server/http.ts src/index.ts tests/http.test.ts
git commit -m "feat: add Streamable HTTP MCP endpoint"
```

---

### Task 6: Implement provider adapter boundaries for all nine integrations

**Files:**
- Create: `src/providers/x/index.ts`
- Create: `src/providers/github/index.ts`
- Create: `src/providers/huggingface/index.ts`
- Create: `src/providers/genspark/index.ts`
- Create: `src/providers/manus/index.ts`
- Create: `src/providers/grok/index.ts`
- Create: `src/providers/openai/index.ts`
- Create: `src/providers/gemini/index.ts`
- Create: `src/providers/claude/index.ts`
- Create: `tests/providers.test.ts`
- Modify: `src/registry/providers.ts`

**Interfaces:**
- Every adapter implements `ProviderAdapter` from `src/providers/types.ts`.
- Every adapter returns only capabilities actually configured and supported.
- Each adapter translates upstream failures into the shared safe error categories.

- [ ] **Step 1: Write failing adapter contract tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createProviderAdapters } from "../src/registry/providers.js";

test("all nine provider adapters satisfy the common contract", () => {
  for (const adapter of createProviderAdapters()) {
    assert.equal(typeof adapter.id, "string");
    assert.equal(typeof adapter.listTools, "function");
    assert.equal(typeof adapter.callTool, "function");
    assert.equal(typeof adapter.healthCheck, "function");
    assert.ok(adapter.listTools().every((tool) => tool.name.startsWith(`${adapter.id}.`)));
  }
});
```

Add tests that a timeout maps to `PROVIDER_TIMEOUT`, upstream 429 maps to `PROVIDER_RATE_LIMIT`, and upstream authentication failure maps to `PROVIDER_AUTH_FAILED`.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/providers.test.ts`
Expected: FAIL because provider factories/adapters are not implemented.

- [ ] **Step 3: Implement nine adapter shells with honest capability discovery**

The first pass must not invent provider operations. Each adapter reads its credential/configuration and exposes only the tools for which a concrete upstream client implementation exists. If a provider is not configured, `healthCheck()` returns `unavailable` and its tools are not registered.

- [ ] **Step 4: Implement X and GitHub adapters**

Use their configured remote APIs/MCP interfaces behind the adapter contract. Keep provider-specific auth and request formatting inside the adapter. Do not expose raw provider credentials through tool schemas.

- [ ] **Step 5: Implement Hugging Face adapter**

Expose only supported model/dataset operations backed by configured Hugging Face APIs. Normalize upstream errors into shared gateway errors.

- [ ] **Step 6: Implement Genspark boundary**

Represent the supplied `stockvalue/genspark-mcp` functionality as a worker client boundary. The public gateway must not read browser cookies, local profiles, passwords, or MFA state. Until an authenticated worker transport exists, the adapter must report unavailable rather than pretending the local MCP is remotely callable.

- [ ] **Step 7: Implement Manus adapter**

Use only documented/configured Manus capabilities. Keep authentication server-side and expose concrete operations only after the upstream API contract is verified.

- [ ] **Step 8: Implement Grok, OpenAI, Gemini, and Claude adapters**

Use their server-side API credentials and provider SDK/HTTP clients. Expose normalized generation/analyze tools only where the current provider API supports the operation. Do not claim that an API adapter is an MCP server; it is an adapter that presents supported provider API operations through MCP.

- [ ] **Step 9: Implement adapter health checks**

Health checks must be bounded, non-destructive, and must not log secrets. Prefer configuration/auth validation or lightweight metadata endpoints over paid generation calls.

- [ ] **Step 10: Register configured adapters**

`createProviderAdapters()` returns the nine adapter instances, and registry initialization includes only adapters that are enabled/configured.

- [ ] **Step 11: Run provider tests and verify pass**

Run: `npm test -- tests/providers.test.ts`
Expected: PASS with no live provider credentials required.

- [ ] **Step 12: Commit**

```bash
git add src/providers src/registry/providers.ts tests/providers.test.ts
git commit -m "feat: add provider adapter boundaries"
```

---

### Task 7: Add observability, health aggregation, redaction, and deployment packaging

**Files:**
- Create: `src/middleware/logging.ts`
- Create: `Dockerfile`
- Modify: `src/registry/providers.ts`
- Modify: `src/server/http.ts`
- Modify: `tests/http.test.ts`
- Modify: `tests/security.test.ts`
- Modify: `README.md`

**Interfaces:**
- `redactSecrets(value: unknown): unknown` recursively removes known secret fields.
- `getGatewayHealth(registry): Promise<GatewayHealth>` returns gateway and provider statuses.

- [ ] **Step 1: Write failing redaction and health tests**

```ts
test("redacts authorization and provider secret fields", () => {
  const safe = redactSecrets({ authorization: "Bearer secret", apiKey: "secret", nested: { token: "secret" } });
  assert.equal(JSON.stringify(safe).includes("secret"), false);
});

test("health reports configured provider states without credentials", async () => {
  const health = await getGatewayHealth(registry);
  assert.equal(health.status, "ok");
  assert.equal(JSON.stringify(health).includes("secret"), false);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/http.test.ts tests/security.test.ts`
Expected: FAIL because redaction and aggregated health are not implemented.

- [ ] **Step 3: Implement structured safe logging**

Log only request ID, provider, tool, duration, status, and error code. Never log request bodies, Authorization headers, provider secrets, cookies, or upstream raw error payloads.

- [ ] **Step 4: Implement aggregated `/health`**

Return gateway status plus provider status values. Do not return credential presence, token fragments, filesystem paths, browser profile details, or upstream response bodies.

- [ ] **Step 5: Add Dockerfile**

Use a production Node image, install production dependencies, compile TypeScript, run as a non-root user, and start `node dist/index.js`.

- [ ] **Step 6: Update README**

Document local setup, `.env` configuration, `npm test`, `npm run build`, Docker usage, Railway deployment, security rules, provider enablement, and Genspark's MCP fields using the final `/mcp` endpoint.

- [ ] **Step 7: Run tests and verify pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/middleware/logging.ts src/registry/providers.ts src/server/http.ts tests/http.test.ts tests/security.test.ts Dockerfile README.md
git commit -m "feat: add health observability and deployment packaging"
```

---

### Task 8: Final verification and Railway readiness

**Files:**
- Modify: `README.md` only if verification discovers documentation drift.
- Verify: all gateway source, tests, Dockerfile, and environment configuration.

**Interfaces:**
- No new public interfaces. This task verifies the acceptance criteria in `bc-mcp.md`.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: TypeScript compilation succeeds with zero errors.

- [ ] **Step 3: Verify no secret literals are committed**

Run a repository search for `sk-`, `AIza`, `xai-`, `Bearer `, `ANTHROPIC_API_KEY=`, and other provider credential patterns. Expected: only documentation examples/placeholders such as `<gateway-secret>` and `.env.example` variable names remain.

- [ ] **Step 4: Verify the public surface**

Confirm `/health` is unauthenticated only if Railway health checks require it; confirm `/mcp` is protected; confirm invalid Origin and invalid/missing bearer credentials are rejected; confirm unknown tools are rejected.

- [ ] **Step 5: Verify Docker build**

Run: `docker build -t big-cruise-mcp-gateway .`
Expected: image builds successfully.

- [ ] **Step 6: Verify production environment contract**

Confirm all provider credentials are supplied through Railway environment/secret configuration and none are required in source control. Confirm `PORT`, `GATEWAY_SECRET`, `ALLOWED_ORIGINS`, request limits, and provider enablement are documented.

- [ ] **Step 7: Perform final acceptance check**

Verify every acceptance criterion in `docs/superpowers/specs/bc-mcp.md` is satisfied: remote Streamable HTTP connection, auth rejection, Origin enforcement, namespace routing, common adapter contract, secret isolation, safe health, automated security/routing tests, successful build, and Railway deployment readiness.

- [ ] **Step 8: Commit verification-only documentation fixes**

```bash
git add README.md
git commit -m "docs: finalize MCP gateway deployment guidance"
```

Only create this commit if README changes were actually required; otherwise leave the tree unchanged after verification.

---

## Self-Review Checklist

- **Spec coverage:** Tasks 1–8 cover transport, auth, Origin validation, protocol headers, routing, permissions, rate limits, provider contract, all nine provider boundaries, Genspark isolation, errors, health, observability, tests, Docker, Railway, and extensibility.
- **No fabricated provider capabilities:** provider adapters are required to expose only capabilities backed by verified upstream contracts/configuration.
- **No secret leakage:** auth, logs, health, tool results, and errors explicitly exclude credentials and browser-session material.
- **Type consistency:** all adapters implement `ProviderAdapter`; router consumes `ProviderRegistry`; HTTP transport consumes router/permissions; health consumes the same registry.
- **TDD:** every implementation task begins with a failing test and ends with a passing test and commit.
- **Deployment:** Docker and Railway configuration are included without committing secrets.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-21-big-cruise-mcp-gateway.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh worker per task and review between tasks.

**2. Inline Execution** — execute the tasks in this session using the executing-plans workflow with checkpoints.
