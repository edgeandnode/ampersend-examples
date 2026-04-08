# Headless Oracle x402 Market Gate

An ampersend-governed agent that pays for cryptographically signed market-state attestations via x402, using them as a pre-trade safety gate.

## What This Demonstrates

1. **x402 pay-per-request**: The agent pays $0.001 USDC on Base mainnet per signed market attestation
2. **Policy pre-condition**: Free market check gates the paid request — don't spend if the market is closed
3. **Fail-closed safety**: UNKNOWN, HALTED, and CLOSED all block execution. Only a verified, fresh, signed `OPEN` receipt authorizes trading

## How It Works

```
Agent (ampersend)
  │
  ├── 1. Free pre-check: GET /v5/demo?mic=XNYS
  │     → Market OPEN? Continue. Otherwise skip (save $0.001).
  │
  ├── 2. Paid attestation: GET /v5/status?mic=XNYS
  │     → 402 → ampersend treasurer authorizes → Payment-Signature header
  │     → 200 with Ed25519-signed receipt
  │
  └── 3. Verify receipt: receipt_mode=live, not expired, status=OPEN
        → Safe to execute trade
```

## Setup

```bash
# With ampersend smart account (recommended)
export TS__EXAMPLES__HEADLESS_ORACLE__SMART_ACCOUNT_ADDRESS=0x...
export TS__EXAMPLES__HEADLESS_ORACLE__SESSION_KEY=0x...

# Or with EOA wallet (simpler, for testing)
export TS__EXAMPLES__HEADLESS_ORACLE__PRIVATE_KEY=0x...

pnpm install
pnpm dev
```

## Headless Oracle

[Headless Oracle](https://headlessoracle.com) is a signed market-state oracle covering 28 global exchanges. It provides Ed25519-signed attestations that autonomous agents can verify without trusting the operator.

- **MCP endpoint**: `https://headlessoracle.com/mcp` (protocol `2024-11-05`)
- **x402 discovery**: `https://headlessoracle.com/.well-known/x402.json`
- **Verification SDK**: `npm install @headlessoracle/verify`
- **Price**: $0.001 USDC per signed receipt on Base mainnet

### Key Safety Rules

1. **UNKNOWN = CLOSED**: Any status that isn't explicitly OPEN means halt
2. **Check `expires_at`**: A 60-second-old OPEN receipt may no longer be true
3. **Verify `receipt_mode`**: Only `"live"` receipts are authoritative. `"demo"` receipts are free but unsigned
4. **Verify signature**: Production agents should verify the Ed25519 signature using `@headlessoracle/verify`
