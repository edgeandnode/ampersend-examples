# x402 HTTP Client Example

Demonstrates using Ampersend with the standard x402 fetch wrapper for HTTP API payments.

## Overview

This example shows how to add Ampersend payment authorization to x402-protected HTTP APIs. It uses the same `@x402/fetch` wrapper as the official x402 SDK, with minimal additions for Ampersend integration.

**Compare with the [official x402-v2 fetch example](https://github.com/coinbase/x402/tree/main/examples/typescript/clients/fetch) to see the minimal setup difference.**

## Installation

```bash
# From the ampersend-examples root
pnpm install

# Or install this package specifically
cd typescript/examples/x402-http-client
pnpm install
```

## Usage

Set your private key and run:

```bash
PRIVATE_KEY=0x... pnpm dev
```

## How It Works

The example demonstrates the core Ampersend pattern for HTTP payments:

```typescript
import { x402Client, wrapFetchWithPayment } from "@x402/fetch"
import { AccountWallet, NaiveTreasurer } from "@ampersend_ai/ampersend-sdk"
import { wrapWithAmpersend } from "@ampersend_ai/ampersend-sdk/x402"

// --- Standard x402 setup (same as official example) ---
const client = new x402Client()

// --- Ampersend additions (replaces registerExactEvmScheme) ---
const wallet = AccountWallet.fromPrivateKey(privateKey)
const treasurer = new NaiveTreasurer(wallet)  // Decides whether to pay
wrapWithAmpersend(client, treasurer, ["base", "base-sepolia"])

// --- Use it (identical to official example) ---
const fetchWithPayment = wrapFetchWithPayment(fetch, client)
const response = await fetchWithPayment("https://paid-api.example.com/resource")
```

## Comparison with x402-v2

| x402-v2 Official | Ampersend | Purpose |
|------------------|-----------|---------|
| `privateKeyToAccount(key)` | `AccountWallet.fromPrivateKey(key)` | Wallet creation |
| `registerExactEvmScheme(client, { signer })` | `wrapWithAmpersend(client, treasurer, networks)` | Payment registration |
| - | `new NaiveTreasurer(wallet)` | Payment authorization |

The key difference: Ampersend uses a **Treasurer** pattern that allows sophisticated payment policies (budgets, approvals, limits) instead of auto-signing everything.

## Development

```bash
pnpm build        # Build TypeScript
pnpm dev          # Run with tsx
pnpm lint         # Run ESLint
pnpm format       # Check formatting
```

## Project Structure

```
src/
└── index.ts    # Main example demonstrating HTTP payment flow
```

## Learn More

- [HTTP x402 Adapter Documentation](https://github.com/edgeandnode/ampersend-sdk/tree/main/typescript/packages/ampersend-sdk/src/x402/http)
- [Ampersend SDK Documentation](https://github.com/edgeandnode/ampersend-sdk)
- [x402 Protocol](https://github.com/coinbase/x402)
