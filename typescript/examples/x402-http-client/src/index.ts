import { x402Client, wrapFetchWithPayment } from "@x402/fetch"
import { AccountWallet, NaiveTreasurer } from "@ampersend_ai/ampersend-sdk"
import { wrapWithAmpersend } from "@ampersend_ai/ampersend-sdk/x402"

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`
  if (!privateKey) {
    console.error("PRIVATE_KEY environment variable is required")
    process.exit(1)
  }

  // --- Standard x402 setup (same as official example) ---
  const client = new x402Client()

  // --- Ampersend additions (replaces registerExactEvmScheme) ---
  const wallet = AccountWallet.fromPrivateKey(privateKey)
  const treasurer = new NaiveTreasurer(wallet) // Decides whether to pay
  wrapWithAmpersend(client, treasurer, ["base", "base-sepolia"])

  // --- Use it (identical to official example) ---
  const fetchWithPayment = wrapFetchWithPayment(fetch, client)
  const response = await fetchWithPayment("https://paid-api.example.com/resource")
  console.log("Response status:", response.status)
}

main().catch(console.error)
