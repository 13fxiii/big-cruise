export interface RequestContext {
  requestId: string;
  providerId: string;
  toolName: string;
  clientKey?: string;
  signal?: AbortSignal;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export interface ProviderHealth {
  id: string;
  status: "available" | "degraded" | "unavailable";
  detail?: string;
}

export interface ProviderAdapter {
  id: string;
  listTools(): ToolDefinition[];
  callTool(name: string, args: unknown, context: RequestContext): Promise<ToolResult>;
  healthCheck(): Promise<ProviderHealth>;
}
