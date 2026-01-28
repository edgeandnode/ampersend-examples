"""LangChain + x402 A2A Example.

This example demonstrates using LangChain agents with x402-enabled A2A agents
and ampersend for payment authorization with spend limits.

Getting Started (Testnet):
    1. Create agent account at https://app.staging.ampersend.ai
    2. Fund with testnet USDC: https://faucet.circle.com/ (Base Sepolia)
    3. Set environment variables:
        export EXAMPLES_LANGCHAIN_A2A_BUYER__SMART_ACCOUNT_ADDRESS=0x...
        export EXAMPLES_LANGCHAIN_A2A_BUYER__SESSION_KEY_PRIVATE_KEY=0x...
        export OPENAI_API_KEY=...

    4. Run:
        uv --directory=python/examples run python -m examples.a2a.buyer.langchain.agent

Environment Variables:
    EXAMPLES_LANGCHAIN_A2A_BUYER__SMART_ACCOUNT_ADDRESS: Agent smart account address (from dashboard)
    EXAMPLES_LANGCHAIN_A2A_BUYER__SESSION_KEY_PRIVATE_KEY: Session key (from dashboard)
    EXAMPLES_LANGCHAIN_A2A_BUYER__AMPERSEND_API_URL: ampersend API URL
        Default: https://api.staging.ampersend.ai
    EXAMPLES_LANGCHAIN_A2A_BUYER__SELLER_URL: Remote A2A agent URL
        Default: https://subgraph-a2a.x402.staging.thegraph.com
    OPENAI_API_KEY: OpenAI API key
"""

import asyncio
import os
import sys

from langchain.agents import create_agent
from langchain_ampersend import A2AToolkit, create_ampersend_treasurer
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

SMART_ACCOUNT_ADDRESS = os.environ.get(
    "EXAMPLES_LANGCHAIN_A2A_BUYER__SMART_ACCOUNT_ADDRESS"
)
SESSION_KEY = os.environ.get("EXAMPLES_LANGCHAIN_A2A_BUYER__SESSION_KEY_PRIVATE_KEY")
AMPERSEND_API_URL = os.environ.get(
    "EXAMPLES_LANGCHAIN_A2A_BUYER__AMPERSEND_API_URL",
    "https://api.staging.ampersend.ai",
)
SELLER_URL = os.environ.get(
    "EXAMPLES_LANGCHAIN_A2A_BUYER__SELLER_URL",
    "https://subgraph-a2a.x402.staging.thegraph.com",
)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")


async def main() -> None:
    """Run the LangChain A2A example."""
    if not SMART_ACCOUNT_ADDRESS or not SESSION_KEY or not OPENAI_API_KEY:
        print("Missing required environment variables:")
        print(
            "  EXAMPLES_LANGCHAIN_A2A_BUYER__SMART_ACCOUNT_ADDRESS - Smart account address"
        )
        print(
            "  EXAMPLES_LANGCHAIN_A2A_BUYER__SESSION_KEY_PRIVATE_KEY - Session key private key"
        )
        print("  OPENAI_API_KEY - OpenAI API key")
        sys.exit(1)

    # Create treasurer
    treasurer = create_ampersend_treasurer(
        smart_account_address=SMART_ACCOUNT_ADDRESS,
        session_key_private_key=SESSION_KEY,
        api_url=AMPERSEND_API_URL,
    )

    # Create toolkit and initialize
    toolkit = A2AToolkit(remote_agent_url=SELLER_URL, treasurer=treasurer)
    await toolkit.initialize()
    print(f"Connected to A2A agent: {SELLER_URL}")
    print(f"Loaded {len(toolkit.get_tools())} tools")

    # Create LangChain agent with OpenAI
    model = ChatOpenAI(model="gpt-4o-mini", api_key=SecretStr(OPENAI_API_KEY))
    agent = create_agent(model, toolkit.get_tools())  # type: ignore[var-annotated]

    # Get query from CLI or use default
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What can you do?"
    print(f"\nQuery: {query}")
    print("Invoking agent...\n")

    # Run agent
    response = await agent.ainvoke({"messages": [{"role": "user", "content": query}]})

    # Print response
    print("Agent response:")
    print(response["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(main())
