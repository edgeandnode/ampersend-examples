# LangChain + x402 A2A Example

This example demonstrates using LangChain agents with x402-enabled A2A agents and Ampersend for payment authorization
with spend limits.

## Prerequisites

- Ampersend smart account (create at https://app.staging.ampersend.ai)
- Testnet USDC (get from https://faucet.circle.com/ for Base Sepolia)
- OpenAI API key

## Setup

Install dependencies:

```bash
uv sync
```

## Environment Variables

- `EXAMPLES_LANGCHAIN_A2A_BUYER__SMART_ACCOUNT_ADDRESS`: Smart account address (from Ampersend dashboard)
- `EXAMPLES_LANGCHAIN_A2A_BUYER__SESSION_KEY_PRIVATE_KEY`: Session key private key (from dashboard)
- `EXAMPLES_LANGCHAIN_A2A_BUYER__AMPERSEND_API_URL`: Ampersend API URL (defaults to staging)
- `EXAMPLES_LANGCHAIN_A2A_BUYER__SELLER_URL`: Remote A2A agent URL (defaults to staging)
- `OPENAI_API_KEY`: Your OpenAI API key

## Run

Run with default demo query:

```bash
uv --directory=python/examples run python -m examples.a2a.buyer.langchain.agent
```

Or provide your own query:

```bash
uv --directory=python/examples run python -m examples.a2a.buyer.langchain.agent "What subgraphs are available?"
uv --directory=python/examples run python -m examples.a2a.buyer.langchain.agent "Query the Uniswap subgraph for recent swaps"
```

## How it works

1. Creates an Ampersend treasurer with spend limits
2. Connects `A2AToolkit` to remote A2A agent
3. Loads A2A tools into LangChain with `toolkit.get_tools()`
4. Creates LangChain agent with OpenAI
5. Agent automatically handles x402 payments when calling remote agent
