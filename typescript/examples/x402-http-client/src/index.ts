import { createAmpersendHttpClient } from "@ampersend_ai/ampersend-sdk"
import { wrapFetchWithPayment } from "@x402/fetch"

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

  // Create x402 client with ampersend payment support
  const client = createAmpersendHttpClient({
    smartAccountAddress,
    sessionKeyPrivateKey: sessionKey,
    apiUrl: "https://api.staging.ampersend.ai",
    network: "base-sepolia",
  })

  // Make request with automatic payment handling
  const fetchWithPayment = wrapFetchWithPayment(fetch, client)
  const response = await fetchWithPayment("https://paid-api.example.com/resource")
  console.log("Response status:", response.status)
}

main().catch(console.error)
