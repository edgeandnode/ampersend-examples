# LangChain + x402 MCP Example

Example showing how to use LangChain agents with x402-enabled MCP servers and Ampersend smart accounts for payment authorization with spend limits.

## Prerequisites

- OpenAI API key
- Ampersend agent account (smart account + session key)

## Getting Started (Testnet)

1. **Create agent account** at https://app.staging.ampersend.ai
2. **Fund with testnet USDC**: https://faucet.circle.com/ (Base Sepolia)
3. **Set environment variables**:
   ```bash
   export TS__EXAMPLES__LANGCHAIN_MCP__SMART_ACCOUNT_ADDRESS=0x...  # From dashboard
   export TS__EXAMPLES__LANGCHAIN_MCP__SESSION_KEY_PRIVATE_KEY=0x...  # From dashboard
   export OPENAI_API_KEY=...
   ```
4. **Install dependencies**:
   ```bash
   pnpm install
   ```
5. **Run**:
   ```bash
   pnpm dev
   ```

## Environment Variables

### Required

| Variable                                               | Description                                        |
| ------------------------------------------------------ | -------------------------------------------------- |
| `TS__EXAMPLES__LANGCHAIN_MCP__SMART_ACCOUNT_ADDRESS`   | Smart account address (from Ampersend dashboard)   |
| `TS__EXAMPLES__LANGCHAIN_MCP__SESSION_KEY_PRIVATE_KEY` | Session key private key (from Ampersend dashboard) |
| `OPENAI_API_KEY`                                       | Your OpenAI API key                                |

### Optional (have defaults)

| Variable                                         | Default                                              | Description       |
| ------------------------------------------------ | ---------------------------------------------------- | ----------------- |
| `TS__EXAMPLES__LANGCHAIN_MCP__MCP_SERVER_URL`    | `https://subgraph-mcp.x402.staging.thegraph.com/mcp` | MCP server URL    |
| `TS__EXAMPLES__LANGCHAIN_MCP__AMPERSEND_API_URL` | `https://api.staging.ampersend.ai`                   | Ampersend API URL |

## Run

Run with default query (asks about Uniswap subgraphs):

```bash
pnpm dev
```

Or provide your own query:

```bash
pnpm dev "What subgraphs are available?"
pnpm dev "Query the Uniswap v3 subgraph for recent swaps"
```

## How it Works

1. Creates an Ampersend MCP client with spend limits
2. Connects to the Subgraph MCP server
3. Loads MCP tools into LangChain with `loadMcpTools()`
4. Creates LangChain ReAct agent with OpenAI (gpt-4o-mini)
5. Agent automatically handles x402 payments when calling tools (authorized via Ampersend)
