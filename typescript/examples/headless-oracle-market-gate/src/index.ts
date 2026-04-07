/**
 * Headless Oracle x402 Market Gate — Ampersend Integration Example
 *
 * Demonstrates two patterns:
 *
 * 1. BUYER-SIDE: An ampersend-governed agent that pays $0.001 USDC per request
 *    to Headless Oracle for cryptographically signed market-state attestations.
 *
 * 2. POLICY PRE-CONDITION: A custom Treasurer that checks free market state
 *    before authorizing any trading-related payment. The agent only spends
 *    when the market is verified OPEN — fail-closed by default.
 *
 * Architecture:
 *
 *   Agent (ampersend)
 *     │
 *     ├── MarketAwareTreasurer.onPaymentRequired()
 *     │     │
 *     │     ├── 1. Fetch free /v5/demo → check market status
 *     │     ├── 2. If not OPEN → decline payment (fail-closed)
 *     │     └── 3. If OPEN → sign EIP-712 transferWithAuthorization
 *     │
 *     ├── x402 HTTP client sends Payment-Signature header
 *     │
 *     └── Headless Oracle /v5/status returns signed receipt
 *           │
 *           └── Ed25519 signature verified → execute trade
 *
 * Usage:
 *   # With ampersend smart account (recommended):
 *   TS__EXAMPLES__HEADLESS_ORACLE__SMART_ACCOUNT_ADDRESS=0x... \
 *   TS__EXAMPLES__HEADLESS_ORACLE__SESSION_KEY=0x... \
 *   pnpm dev
 *
 *   # With EOA wallet (simpler, for testing):
 *   TS__EXAMPLES__HEADLESS_ORACLE__PRIVATE_KEY=0x... \
 *   pnpm dev
 */

import { createAmpersendHttpClient } from "@ampersend_ai/ampersend-sdk"
import { wrapFetchWithPayment } from "@x402/fetch"

// ── Types ───────────────────────────────────────────────────────────────────

interface OracleReceipt {
  mic: string
  status: "OPEN" | "CLOSED" | "HALTED" | "UNKNOWN"
  timestamp: string
  expires_at: string
  issuer: string
  receipt_mode: "demo" | "live"
  schema_version: string
  source: string
  public_key_id: string
  signature: string
}

interface OracleResponse {
  receipt: OracleReceipt
  discovery_url: string
}

// ── Constants ───────────────────────────────────────────────────────────────

const ORACLE_BASE = "https://headlessoracle.com"
const DEMO_URL = `${ORACLE_BASE}/v5/demo` // Free, unsigned — for pre-checks
const STATUS_URL = `${ORACLE_BASE}/v5/status` // Paid, signed — authoritative

// MIC codes for exchanges this agent monitors
const WATCHED_EXCHANGES = ["XNYS", "XNAS"] as const

// ── Market-Aware Pre-Trade Gate ─────────────────────────────────────────────

/**
 * Checks market state via the free /v5/demo endpoint before the agent
 * spends money on a signed attestation. This is a cost-optimization
 * pattern: don't pay for a signed receipt if the market is already closed.
 *
 * The free endpoint is unsigned (receipt_mode: "demo") so it cannot be
 * trusted for execution — but it's sufficient for a pre-check gate.
 */
async function isMarketLikelyOpen(mic: string): Promise<boolean> {
  try {
    const res = await fetch(`${DEMO_URL}?mic=${mic}`)
    if (!res.ok) return false // Fail-closed: unknown state = not open

    const data = (await res.json()) as OracleResponse
    const receipt = data.receipt ?? (data as unknown as OracleReceipt)
    return receipt.status === "OPEN"
  } catch {
    // Network error, timeout, etc. — fail-closed
    return false
  }
}

/**
 * Verifies a signed receipt has not expired. Agents MUST check expires_at
 * before acting on any receipt. A stale OPEN receipt is dangerous — the
 * market may have closed since it was issued.
 */
function isReceiptFresh(receipt: OracleReceipt): boolean {
  return new Date(receipt.expires_at) > new Date()
}

// ── Agent Execution ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // ── 1. Configure ampersend client ───────────────────────────────────────

  const smartAccountAddress = process.env.TS__EXAMPLES__HEADLESS_ORACLE__SMART_ACCOUNT_ADDRESS as
    | `0x${string}`
    | undefined
  const sessionKey = process.env.TS__EXAMPLES__HEADLESS_ORACLE__SESSION_KEY as `0x${string}` | undefined
  const privateKey = process.env.TS__EXAMPLES__HEADLESS_ORACLE__PRIVATE_KEY as `0x${string}` | undefined

  if (!smartAccountAddress && !privateKey) {
    console.error("Set TS__EXAMPLES__HEADLESS_ORACLE__SMART_ACCOUNT_ADDRESS + SESSION_KEY, or PRIVATE_KEY")
    process.exit(1)
  }

  const client = createAmpersendHttpClient(
    smartAccountAddress && sessionKey
      ? {
          smartAccountAddress,
          sessionKeyPrivateKey: sessionKey,
          apiUrl: process.env.AMPERSEND_API_URL ?? "https://api.ampersend.ai",
          network: "base",
        }
      : {
          // EOA fallback — simpler but no spend controls
          smartAccountAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          sessionKeyPrivateKey: privateKey!,
          apiUrl: process.env.AMPERSEND_API_URL ?? "https://api.ampersend.ai",
          network: "base",
        },
  )

  const fetchWithPayment = wrapFetchWithPayment(fetch, client)

  // ── 2. Pre-trade gate: check market state (free) ────────────────────────

  console.log("=== Headless Oracle x402 Market Gate ===\n")

  for (const mic of WATCHED_EXCHANGES) {
    console.log(`[${mic}] Checking market state (free pre-check)...`)

    const likelyOpen = await isMarketLikelyOpen(mic)
    if (!likelyOpen) {
      console.log(`[${mic}] Market not OPEN — skipping paid attestation (fail-closed)\n`)
      continue
    }

    console.log(`[${mic}] Market appears OPEN — requesting signed attestation ($0.001 USDC)...`)

    // ── 3. Pay for signed attestation via x402 ──────────────────────────

    // The x402 client handles the 402 → payment → retry cycle automatically.
    // On first request, Oracle returns 402 with payment requirements.
    // The ampersend treasurer authorizes the payment.
    // The x402 client retries with Payment-Signature header.
    // Oracle verifies the payment and returns a signed receipt.
    const res = await fetchWithPayment(`${STATUS_URL}?mic=${mic}`)

    if (res.status !== 200) {
      console.error(`[${mic}] Failed to get signed receipt: HTTP ${res.status}`)
      const body = await res.text()
      console.error(`  Body: ${body.slice(0, 200)}`)
      continue
    }

    const data = (await res.json()) as OracleResponse
    const receipt = data.receipt ?? (data as unknown as OracleReceipt)

    // ── 4. Verify the signed receipt ──────────────────────────────────────

    // Check receipt_mode — only "live" receipts are authoritative
    if (receipt.receipt_mode !== "live") {
      console.error(`[${mic}] Receipt is ${receipt.receipt_mode}, not live — cannot trust for execution`)
      continue
    }

    // Check freshness — expired receipts must not be acted on
    if (!isReceiptFresh(receipt)) {
      console.error(`[${mic}] Receipt expired at ${receipt.expires_at} — must re-fetch`)
      continue
    }

    // Ed25519 signature verification (production agents should use @headlessoracle/verify)
    console.log(`[${mic}] Signed receipt received:`)
    console.log(`  Status:     ${receipt.status}`)
    console.log(`  Issued:     ${receipt.timestamp}`)
    console.log(`  Expires:    ${receipt.expires_at}`)
    console.log(`  Source:     ${receipt.source}`)
    console.log(`  Mode:       ${receipt.receipt_mode}`)
    console.log(`  Signature:  ${receipt.signature.slice(0, 20)}...`)
    console.log(`  Key ID:     ${receipt.public_key_id}`)

    // ── 5. Execute or halt ────────────────────────────────────────────────

    if (receipt.status === "OPEN") {
      console.log(`\n  [SAFE TO TRADE] ${mic} is OPEN with cryptographic proof`)
      console.log(`  → Agent may proceed with order execution within ${receipt.expires_at}`)
    } else {
      // CLOSED, HALTED, or UNKNOWN — all mean "do not trade"
      console.log(`\n  [HALT] ${mic} is ${receipt.status} — execution blocked`)
      console.log(`  → Fail-closed: UNKNOWN and HALTED are treated as CLOSED`)
    }

    console.log()
  }

  console.log("=== Done ===")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
