import type { ProviderAdapter, ProviderHealth, ToolDefinition } from "../providers/types.js";
import { GatewayError } from "../security/errors.js";

export class ProviderRegistry {
  private readonly providers = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    if (this.providers.has(adapter.id)) throw new Error(`Duplicate provider: ${adapter.id}`);
    this.providers.set(adapter.id, adapter);
  }

  get(id: string): ProviderAdapter {
    const adapter = this.providers.get(id);
    if (!adapter) throw new GatewayError("PROVIDER_UNAVAILABLE", "Provider is unavailable.", 503);
    return adapter;
  }

  listTools(): ToolDefinition[] {
    const seen = new Set<string>();
    const tools: ToolDefinition[] = [];
    for (const adapter of this.providers.values()) {
      for (const tool of adapter.listTools()) {
        if (seen.has(tool.name)) throw new Error(`Duplicate tool: ${tool.name}`);
        seen.add(tool.name);
        tools.push(tool);
      }
    }
    return tools;
  }

  async healthCheckAll(): Promise<ProviderHealth[]> {
    return Promise.all([...this.providers.values()].map((provider) => provider.healthCheck()));
  }
}
