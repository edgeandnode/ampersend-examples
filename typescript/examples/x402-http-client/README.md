# x402 HTTP Client Example

Demonstrates using ampersend with the standard x402 fetch wrapper for HTTP API payments.

## Overview

This example shows how to add ampersend payment authorization to x402-protected HTTP APIs. It uses `createampersendHttpClient()` with spend limits and payment monitoring via the ampersend API.

## Installation

```bash
# From the ampersend-examples root
pnpm install

# Or install this package specifically
cd typescript/examples/x402-http-client
pnpm install
```

## Usage

Set your environment variables and run:

```bash
# Copy .env.example to .env at the repo root and fill in:
# TS__EXAMPLES__X402_HTTP_CLIENT__SMART_ACCOUNT_ADDRESS=0x...
# TS__EXAMPLES__X402_HTTP_CLIENT__SESSION_KEY=0x...

pnpm dev
```

Get your smart account address and session key from the ampersend dashboard.

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

- [ampersend SDK Documentation](https://github.com/edgeandnode/ampersend-sdk)
- [x402 Protocol](https://github.com/coinbase/x402)
