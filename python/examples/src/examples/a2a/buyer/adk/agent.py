"""A2A Buyer Example with x402 Payment Support.

This example demonstrates connecting directly to a remote A2A agent
with automatic x402 payment handling via ampersend.

Getting Started (Testnet):
    1. Create agent account at https://app.staging.ampersend.ai
    2. Fund with testnet USDC: https://faucet.circle.com/ (Base Sepolia)
    3. Set environment variables:
        export EXAMPLES_A2A_BUYER__SMART_ACCOUNT_ADDRESS=0x...
        export EXAMPLES_A2A_BUYER__SESSION_KEY_PRIVATE_KEY=0x...

    4. Run:
        uv --directory=python/examples run -- adk run src/examples/a2a/buyer/adk

Environment Variables:
    EXAMPLES_A2A_BUYER__SMART_ACCOUNT_ADDRESS: Agent smart account address (from dashboard)
    EXAMPLES_A2A_BUYER__SESSION_KEY_PRIVATE_KEY: Session key (from dashboard)
    EXAMPLES_A2A_BUYER__AMPERSEND_API_URL: ampersend API URL
        Default: https://api.staging.ampersend.ai
    EXAMPLES_A2A_BUYER__SELLER_AGENT_URL: Remote agent URL
        Default: https://subgraph-a2a.x402.staging.thegraph.com
"""

import os

from ampersend_sdk import create_ampersend_treasurer
from ampersend_sdk.a2a.client import X402RemoteA2aAgent
from google.adk.agents.remote_a2a_agent import AGENT_CARD_WELL_KNOWN_PATH

# Create treasurer
_treasurer = create_ampersend_treasurer(
    smart_account_address=os.environ["EXAMPLES_A2A_BUYER__SMART_ACCOUNT_ADDRESS"],
    session_key_private_key=os.environ["EXAMPLES_A2A_BUYER__SESSION_KEY_PRIVATE_KEY"],
    api_url=os.environ.get(
        "EXAMPLES_A2A_BUYER__AMPERSEND_API_URL",
        "https://api.staging.ampersend.ai",
    ),
)

# Get seller agent URL (defaults to staging)
_agent_url = os.environ.get(
    "EXAMPLES_A2A_BUYER__SELLER_AGENT_URL",
    "https://subgraph-a2a.x402.staging.thegraph.com",
)

root_agent = X402RemoteA2aAgent(
    treasurer=_treasurer,
    name="a2a_buyer_agent",
    agent_card=f"{_agent_url}{AGENT_CARD_WELL_KNOWN_PATH}",
)
