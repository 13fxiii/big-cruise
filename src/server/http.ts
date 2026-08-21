import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import * as z from "zod";
import type { GatewayConfig } from "../config/env.js";
import { authenticateBearer } from "./auth.js";
import { validateOrigin } from "./origin.js";
import { assertToolAllowed } from "../security/permissions.js";
import { safeGatewayError } from "../security/errors.js";
import { ProviderRegistry } from "../registry/providers.js";
import { routeToolCall } from "./router.js";
import { RateLimiter, withTimeout } from "../middleware/limits.js";

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function clientKey(headers: Headers): string {
  const token = headers.get("authorization") ?? "anonymous";
  return createHash("sha256").update(token).digest("hex");
}

function healthResponse(registry: ProviderRegistry): Promise<Response> {
  return registry.healthCheckAll().then((providers) => new Response(JSON.stringify({ status: "ok", providers }), { status: 200, headers: jsonHeaders }));
}

export function createMcpHttpHandler(config: GatewayConfig, registry: ProviderRegistry) {
  const limiter = new RateLimiter(config.rateLimitPerMinute);
  const allowedTools = (process.env.ALLOWED_TOOLS ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  const effectiveAllowedTools = allowedTools.length ? allowedTools : registry.listTools().map((tool) => tool.name);

  const handler = createMcpHandler(({ requestInfo }) => {
    const server = new McpServer({ name: "BIG CRUISE AI NETWORK", version: "0.1.0" }, { capabilities: { tools: {} } });
    const requestHeaders = requestInfo ? new Headers(requestInfo.headers) : new Headers();
    const callerKey = clientKey(requestHeaders);
    for (const tool of registry.listTools()) {
      server.registerTool(
        tool.name,
        { description: tool.description, inputSchema: z.record(z.string(), z.unknown()) },
        async (args) => {
          const requestId = randomUUID();
          try {
            assertToolAllowed(tool.name, effectiveAllowedTools);
            const providerId = tool.name.split(".", 1)[0];
            limiter.check(callerKey, providerId);
            return await withTimeout(
              routeToolCall(registry, tool.name, args, { requestId, providerId, toolName: tool.name, clientKey: callerKey }),
              config.requestTimeoutMs,
            );
          } catch (error) {
            const safe = safeGatewayError(error);
            return { content: [{ type: "text", text: `${safe.code}: ${safe.message}` }], isError: true };
          }
        },
      );
    }
    return server;
  });

  const nodeHandler = toNodeHandler(handler);

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url?.split("?", 1)[0] === "/health" && req.method === "GET") {
      const response = await healthResponse(registry);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
      return;
    }
    if (req.url?.split("?", 1)[0] !== "/mcp") {
      res.writeHead(404, jsonHeaders);
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    try {
      authenticateBearer(headers, config.gatewaySecret);
      validateOrigin(headers, config.allowedOrigins);
      const contentLength = Number(req.headers["content-length"] ?? 0);
      if (contentLength > config.maxBodyBytes) {
        res.writeHead(413, jsonHeaders);
        res.end(JSON.stringify({ error: "Request body too large" }));
        return;
      }
      await nodeHandler(req, res);
    } catch (error) {
      const safe = safeGatewayError(error);
      res.writeHead(safe.httpStatus, jsonHeaders);
      res.end(JSON.stringify({ error: safe.code, message: safe.message }));
    }
  });
}
