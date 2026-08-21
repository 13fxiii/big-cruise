import { loadConfig } from "./config/env.js";
import { createProviderRegistry } from "./registry/providers.js";
import { createMcpHttpHandler } from "./server/http.js";

export function createGatewayServer(overrides?: Partial<ReturnType<typeof loadConfig>>) {
  const config = { ...loadConfig(), ...overrides };
  const registry = createProviderRegistry(config.requestTimeoutMs);
  const server = createMcpHttpHandler(config, registry);
  return {
    listen(port = config.port, host = "0.0.0.0") {
      return new Promise<{ port: number }>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          const address = server.address();
          if (!address || typeof address === "string") return reject(new Error("Unable to determine listening port"));
          resolve({ port: address.port });
        });
      });
    },
    close() {
      return new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}

if (process.env.NODE_ENV !== "test") {
  const gateway = createGatewayServer();
  gateway.listen().then(({ port }) => console.log(`BIG CRUISE MCP Gateway listening on ${port}`)).catch((error) => {
    console.error("Gateway startup failed", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  });
}
