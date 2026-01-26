/**
 * LangChain + x402 MCP Example with Ampersend Smart Account
 *
 * This example demonstrates using LangChain agents with x402-enabled MCP servers
 * and Ampersend for payment authorization with spend limits.
 *
 * See README.md for setup instructions.
 */

import { createAmpersendTreasurer } from "@ampersend_ai/ampersend-sdk/ampersend"
import { Client } from "@ampersend_ai/ampersend-sdk/mcp/client"
import { OWNABLE_VALIDATOR } from "@ampersend_ai/ampersend-sdk/smart-account"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { loadMcpTools } from "@langchain/mcp-adapters"
import { ChatOpenAI } from "@langchain/openai"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import type { Address, Hex } from "viem"

// Environment variables with defaults
const MCP_SERVER_URL =
  process.env.TS__EXAMPLES__LANGCHAIN_MCP__MCP_SERVER_URL ?? "https://subgraph-mcp.x402.staging.thegraph.com/mcp"
const SMART_ACCOUNT_ADDRESS = process.env.TS__EXAMPLES__LANGCHAIN_MCP__SMART_ACCOUNT_ADDRESS
const SESSION_KEY_PRIVATE_KEY = process.env.TS__EXAMPLES__LANGCHAIN_MCP__SESSION_KEY_PRIVATE_KEY
const AMPERSEND_API_URL =
  process.env.TS__EXAMPLES__LANGCHAIN_MCP__AMPERSEND_API_URL ?? "https://api.staging.ampersend.ai"
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const CHAIN_ID = parseInt(process.env.TS__EXAMPLES__LANGCHAIN_MCP__CHAIN_ID ?? "84532", 10) // Base Sepolia

if (!SMART_ACCOUNT_ADDRESS || !SESSION_KEY_PRIVATE_KEY || !OPENAI_API_KEY) {
  console.error("Missing required environment variables:")
  console.error(
    "  TS__EXAMPLES__LANGCHAIN_MCP__SMART_ACCOUNT_ADDRESS - Smart account address (from Ampersend dashboard)",
  )
  console.error(
    "  TS__EXAMPLES__LANGCHAIN_MCP__SESSION_KEY_PRIVATE_KEY - Session key private key (from Ampersend dashboard)",
  )
  console.error("  OPENAI_API_KEY - OpenAI API key")
  console.error("\nOptional (have defaults):")
  console.error(`  TS__EXAMPLES__LANGCHAIN_MCP__MCP_SERVER_URL - MCP server URL (default: ${MCP_SERVER_URL})`)
  console.error(`  TS__EXAMPLES__LANGCHAIN_MCP__AMPERSEND_API_URL - Ampersend API URL (default: ${AMPERSEND_API_URL})`)
  console.error(`  TS__EXAMPLES__LANGCHAIN_MCP__CHAIN_ID - Chain ID (default: ${CHAIN_ID})`)
  process.exit(1)
}

// Type assertions after check
const smartAccountAddress = SMART_ACCOUNT_ADDRESS as Address
const sessionKeyPrivateKey = SESSION_KEY_PRIVATE_KEY as Hex
const openaiKey: string = OPENAI_API_KEY

async function main() {
  // Setup Ampersend treasurer with smart account wallet
  const treasurer = createAmpersendTreasurer({
    apiUrl: AMPERSEND_API_URL,
    walletConfig: {
      type: "smart-account",
      smartAccountAddress,
      sessionKeyPrivateKey,
      chainId: CHAIN_ID,
      validatorAddress: OWNABLE_VALIDATOR,
    },
  })

  // Create X402 MCP client with payment support
  const client = new Client(
    { name: "langchain-mcp-example", version: "1.0.0" },
    {
      mcpOptions: { capabilities: { tools: {} } },
      treasurer,
    },
  )

  // Connect to MCP server
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL))
  await client.connect(transport as any)
  console.log(`Connected to MCP server: ${MCP_SERVER_URL}`)

  try {
    // Load MCP tools for LangChain
    const tools = await loadMcpTools("subgraph", client as any, {
      throwOnLoadError: true,
      prefixToolNameWithServerName: false,
    })

    console.log(`Loaded ${tools.length} tools from MCP server`)
    console.log("Available tools:", tools.map((t) => t.name).join(", "))

    // Create LangChain agent with OpenAI
    const model = new ChatOpenAI({
      apiKey: openaiKey,
      modelName: "gpt-4o-mini",
    })

    const agent = createReactAgent({ llm: model, tools })

    // Get query from command line or use default
    // Filter out '--' separator that pnpm may add, then join all args
    const args = process.argv.slice(2).filter((arg) => arg !== "--")
    const query = args.length > 0 ? args.join(" ") : "What subgraphs are available for Uniswap?"
    console.log(`\nQuery: ${query}`)
    console.log("Invoking agent...\n")

    const response = await agent.invoke({
      messages: [{ role: "user", content: query }],
    })

    console.log("Agent response:")
    console.log(response.messages[response.messages.length - 1].content)
  } finally {
    // Cleanup
    await client.close()
    console.log("\nDisconnected from MCP server")
  }
}

main().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
