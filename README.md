# BIG CRUISE〽️

Premium, mobile-first Nigerian internet-culture community platform plus the BIG CRUISE AI Network MCP gateway.

## MCP Gateway

The gateway exposes one authenticated remote MCP endpoint for Genspark and routes calls to configured provider adapters.

- MCP endpoint: `https://<railway-domain>/mcp`
- Health: `https://<railway-domain>/health`
- Transport: MCP Streamable HTTP
- Authentication: `Authorization: Bearer <GATEWAY_SECRET>`
- Production: HTTPS only

### Providers

The gateway contains isolated adapters for X, GitHub, Hugging Face, Genspark, Manus, Grok, OpenAI, Gemini, and Claude. A provider exposes tools only when its required configuration is present; unsupported capabilities are not fabricated.

Genspark browser-session functionality is intentionally isolated behind `GENSPARK_WORKER_URL` and `GENSPARK_WORKER_TOKEN`. The public gateway never receives or exposes Genspark cookies, passwords, MFA data, or browser profile state.

### Local setup

```bash
cp .env.example .env
npm install
npm test
npm run build
npm start
```

Required production values include `GATEWAY_SECRET` and `ALLOWED_ORIGINS`. Provider credentials are supplied only through environment/secret management.

### Genspark connection

In Genspark's MCP server form:

```text
Server Name: BIG CRUISE AI NETWORK
Server Type: Streamable HTTP
Server URL: https://<railway-domain>/mcp
Request Header JSON: {"Authorization":"Bearer <gateway-secret>"}
```

### Security

Never commit API keys, OAuth secrets, cookies, browser profiles, passwords, or MFA material. Authorization headers and request bodies are not logged by default. The gateway validates Origin, authentication, request size, permissions, rate limits, and MCP protocol handling before tool execution.

See `docs/superpowers/specs/bc-mcp.md` and `docs/superpowers/plans/2026-08-21-big-cruise-mcp-gateway.md` for the binding specification and implementation plan.
