import { createAmpersendTreasurer } from "@ampersend_ai/ampersend-sdk/ampersend"
import { wrapWithAmpersend } from "@ampersend_ai/ampersend-sdk/x402"
import { wrapFetchWithPayment, x402Client } from "@x402/fetch"

async function main() {
  const smartAccountAddress = process.env.TS__EXAMPLES__X402_HTTP_CLIENT__SMART_ACCOUNT_ADDRESS as
    | `0x${string}`
    | undefined
  const sessionKey = process.env.TS__EXAMPLES__X402_HTTP_CLIENT__SESSION_KEY as `0x${string}` | undefined

  if (!smartAccountAddress) {
    console.error("TS__EXAMPLES__X402_HTTP_CLIENT__SMART_ACCOUNT_ADDRESS environment variable is required")
    process.exit(1)
  }
  if (!sessionKey) {
    console.error("TS__EXAMPLES__X402_HTTP_CLIENT__SESSION_KEY environment variable is required")
    process.exit(1)
  }

  // --- Standard x402 setup ---
  const client = new x402Client()

  // --- Ampersend treasurer with spend limits and monitoring ---
  const treasurer = createAmpersendTreasurer({
    apiUrl: "https://api.staging.ampersend.ai",
    walletConfig: {
      type: "smart-account",
      smartAccountAddress,
      sessionKeyPrivateKey: sessionKey,
      chainId: 84532, // Base Sepolia,
      validatorAddress: "0x000000000013fdB5234E4E3162a810F54d9f7E98" as `0x${string}`,
    },
  })
  wrapWithAmpersend(client, treasurer, ["base-sepolia"])

  // --- Make request ---
  const fetchWithPayment = wrapFetchWithPayment(fetch, client)
  const response = await fetchWithPayment("https://paid-api.example.com/resource")
  console.log("Response status:", response.status)
}

main().catch(console.error)
