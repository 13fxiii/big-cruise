# BIG CRUISE MCP Gateway Specification

## Goal

Build a secure remote MCP gateway that gives Genspark AI one Streamable HTTP MCP connection to a controlled set of BIG CRUISE AI and automation providers. The gateway must use provider adapters so individual integrations can evolve independently and new MCPs can be added without redesigning the gateway.

## Scope

Initial provider integrations:

1. X MCP
2. GitHub MCP
3. Hugging Face MCP
4. Genspark MCP
5. Manus AI MCP
6. Grok MCP/API adapter
7. OpenAI/ChatGPT API adapter
8. Gemini API adapter
9. Claude API adapter

The gateway is the orchestration layer. It does not expose provider credentials to Genspark.

## Architecture

```text
Genspark AI
    |
    | Streamable HTTP
    v
BIG CRUISE MCP Gateway
    |
    +-- authentication
    +-- Origin validation
    +-- MCP request routing
    +-- tool registry
    +-- permissions
    +-- rate limits
    +-- provider health checks
    |
    +-- X adapter
    +-- GitHub adapter
    +-- Hugging Face adapter
    +-- Genspark adapter
    +-- Manus adapter
    +-- Grok adapter
    +-- OpenAI adapter
    +-- Gemini adapter
    +-- Claude adapter
```

## Transport

Use MCP Streamable HTTP as the primary remote transport. The public MCP endpoint is `/mcp`.

The implementation must follow the active MCP transport requirements for POST-based JSON-RPC communication, protocol-version handling, request headers, authentication, and Origin validation. Legacy HTTP+SSE may be added only as a compatibility layer if a specific client requires it; it is not the primary transport.

## Technology

- TypeScript
- Node.js
- Official MCP TypeScript SDK
- Streamable HTTP
- HTTPS in production
- Railway deployment
- GitHub source control

## Public Interface

```text
https://<gateway-domain>/mcp
```

Genspark configuration should use:

```text
Server Name: BIG CRUISE AI NETWORK
Server Type: Streamable HTTP
Server URL: https://<gateway-domain>/mcp
```

The gateway authentication header is:

```json
{
  "Authorization": "Bearer <gateway-secret>"
}
```

The gateway secret is never committed to source control.

## Tool Namespaces

Provider tools must use stable namespaces to prevent collisions:

```text
x.*
github.*
huggingface.*
genspark.*
manus.*
grok.*
openai.*
gemini.*
claude.*
```

Examples:

```text
x.search
x.post
x.get_profile

github.search_repositories
github.create_issue
github.read_file

huggingface.search_models
huggingface.search_datasets

genspark.generate_image
genspark.generate_video

manus.create_task
manus.get_task

grok.generate
grok.analyze

openai.generate
openai.analyze

gemini.generate
gemini.analyze

claude.generate
claude.analyze
```

The exact tool list is determined by the capabilities actually available from each provider integration. Unsupported operations must return structured MCP errors rather than fabricated capabilities.

## Provider Adapter Contract

Every remote provider adapter must implement a common interface conceptually equivalent to:

```ts
interface ProviderAdapter {
  id: string;
  listTools(): ToolDefinition[];
  callTool(name: string, args: unknown, context: RequestContext): Promise<ToolResult>;
  healthCheck(): Promise<ProviderHealth>;
}
```

Adapters own provider-specific authentication, request formatting, response normalization, timeout behavior, and error translation.

## Genspark Adapter

The supplied `stockvalue/genspark-mcp` project is primarily a local stdio/macOS browser-session MCP. It must not be treated as an already-available cloud HTTP service.

The gateway must isolate Genspark-specific functionality behind an adapter/worker boundary. Any local browser-session component must run separately from the public gateway and must never expose browser cookies, passwords, MFA data, or profile state through the MCP interface.

Reference repository:

https://github.com/stockvalue/genspark-mcp

## Authentication and Secrets

Genspark authenticates to the gateway with a gateway bearer token. Provider credentials remain server-side.

Examples of server-side secrets include:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
GROK_API_KEY
X credentials/tokens
MANUS credentials
provider-specific credentials
```

Secrets must be supplied through deployment secret management/environment configuration and must not be logged or committed.

The gateway must never return provider API keys, OAuth client secrets, cookies, browser profiles, passwords, or MFA material to MCP clients.

## Security Requirements

- HTTPS-only production endpoint.
- Validate the request Origin before processing MCP requests.
- Authenticate every protected MCP request.
- Validate MCP protocol/version headers according to the active specification.
- Apply request-size and timeout limits.
- Apply per-provider and per-client rate limits.
- Do not log authorization headers or secret values.
- Normalize provider errors into safe structured MCP errors.
- Avoid returning upstream stack traces or credential-bearing error payloads.
- Restrict tools by explicit provider/tool permissions.
- Keep local browser-session integrations off the public network unless a separate authenticated worker protocol is explicitly implemented.

## Request Flow

```text
1. Genspark sends MCP request to /mcp.
2. Gateway validates HTTPS, Origin, authentication, and protocol headers.
3. MCP router resolves the tool namespace.
4. Permission layer checks whether the caller may invoke the tool.
5. Provider adapter receives normalized arguments and request context.
6. Adapter calls the provider.
7. Provider response is normalized into an MCP ToolResult.
8. Gateway returns the result to Genspark.
```

## Error Handling

Errors must be deterministic and machine-readable. At minimum distinguish:

- authentication failure
- authorization failure
- invalid MCP request
- unknown tool
- provider unavailable
- provider timeout
- provider rate limit
- provider authentication failure
- provider validation failure
- upstream service error
- gateway internal error

Upstream errors must not leak secrets or internal infrastructure details.

## Health and Observability

The service must expose a non-MCP health endpoint suitable for Railway health checks, for example:

```text
/health
```

Health output should identify gateway status and provider availability without exposing credentials or sensitive request data.

Logs should include request correlation identifiers, provider/tool identifiers, duration, and safe status information. Request bodies and authorization headers must not be logged by default.

## Repository Structure

```text
big-cruise/
├── docs/
│   └── superpowers/
│       └── specs/
│           └── bc-mcp.md
├── src/
│   ├── server/
│   │   ├── http.ts
│   │   ├── auth.ts
│   │   ├── origin.ts
│   │   └── router.ts
│   ├── registry/
│   │   ├── providers.ts
│   │   └── tools.ts
│   ├── providers/
│   │   ├── x/
│   │   ├── github/
│   │   ├── huggingface/
│   │   ├── genspark/
│   │   ├── manus/
│   │   ├── grok/
│   │   ├── openai/
│   │   ├── gemini/
│   │   └── claude/
│   ├── security/
│   ├── middleware/
│   └── config/
├── tests/
├── .env.example
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## Testing Requirements

The implementation must use test-driven development for core gateway behavior.

Required automated coverage includes:

- tool registration and namespace routing
- authentication acceptance/rejection
- Origin validation
- malformed MCP request handling
- unknown tool handling
- provider timeout translation
- provider error translation
- permission enforcement
- secret redaction in logs/errors
- health endpoint behavior
- adapter contract behavior using mocked upstreams

Integration tests must not require real provider credentials. Live provider checks should be opt-in and run only in a separately configured environment.

## Deployment

Initial deployment target: Railway from the BIG CRUISE GitHub repository.

Production topology:

```text
GitHub
  |
  v
Railway
  |
  v
BIG CRUISE MCP Gateway
  |
  +-- remote provider APIs/MCP servers
  +-- optional isolated Genspark local worker
```

The production service must use environment/secret configuration for all credentials.

## Extensibility

Adding a provider must require only:

1. a provider adapter;
2. provider registration;
3. provider credentials/configuration;
4. adapter tests;
5. documentation of its exposed tools.

Adding a provider must not require changes to the core MCP transport, authentication, routing, or existing provider adapters unless a new protocol capability genuinely requires it.

## Acceptance Criteria

The first implementation is acceptable when:

1. A remote MCP client can connect to `/mcp` using Streamable HTTP.
2. Authentication rejects missing/invalid gateway credentials.
3. Origin validation is enforced.
4. Tool routing correctly resolves provider namespaces.
5. Provider adapters are isolated behind a common contract.
6. No provider secret is exposed to the MCP client.
7. `/health` reports gateway/provider status safely.
8. Automated tests cover the security and routing requirements above.
9. The project builds successfully.
10. The gateway can be deployed to Railway using environment secrets.

## Reference Links

- MCP specification: https://modelcontextprotocol.io/
- MCP Streamable HTTP transport: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/transports/streamable-http.mdx
- MCP TypeScript SDK: https://ts.sdk.modelcontextprotocol.io/server
- Genspark MCP: https://github.com/stockvalue/genspark-mcp
- Railway: https://railway.com/
- OpenAI Platform: https://platform.openai.com/
- Google AI Studio: https://aistudio.google.com/
- Anthropic Console: https://console.anthropic.com/
- xAI Console: https://console.x.ai/
- Manus: https://manus.im/
- Hugging Face: https://huggingface.co/
- GitHub: https://github.com/

## Status

Architecture approved by the project owner. This document is the binding specification for the implementation plan and implementation work.