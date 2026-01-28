"""Local Agent Orchestrator Example.

This example demonstrates using a local ADK agent to orchestrate multiple
remote A2A agents as tools. The local agent can delegate tasks to specialized
remote agents with automatic x402 payment handling.

Getting Started (Testnet):
    1. Create agent account at https://app.staging.ampersend.ai
    2. Fund with testnet USDC: https://faucet.circle.com/ (Base Sepolia)
    3. Get Google API key from https://aistudio.google.com/apikey
    4. Set environment variables:
        export EXAMPLES_A2A_BUYER__SMART_ACCOUNT_ADDRESS=0x...
        export EXAMPLES_A2A_BUYER__SESSION_KEY_PRIVATE_KEY=0x...
        export GOOGLE_API_KEY=...  # For Gemini model

    5. Run:
        uv --directory=python/examples run -- adk run src/examples/a2a/buyer/local_agent

Environment Variables:
    GOOGLE_API_KEY: Google API key for Gemini model (required)
        Get from: https://aistudio.google.com/apikey
    EXAMPLES_A2A_BUYER__SMART_ACCOUNT_ADDRESS: Agent smart account address (from dashboard)
    EXAMPLES_A2A_BUYER__SESSION_KEY_PRIVATE_KEY: Session key (from dashboard)
    EXAMPLES_A2A_BUYER__AMPERSEND_API_URL: Ampersend API URL
        Default: https://api.staging.ampersend.ai
    EXAMPLES_A2A_BUYER__AGENT_URL_1: First remote agent URL
        Default: https://subgraph-a2a.x402.staging.thegraph.com
    EXAMPLES_A2A_BUYER__AGENT_URL_2: Second remote agent URL (optional)

Example Usage:
    The orchestrator agent can delegate to remote agents:

    User: "Query Uniswap V3 data on Base"
    Orchestrator: Lists available agents, delegates to subgraph_agent
    Remote Agent: Processes query with automatic payment
    Orchestrator: Returns result to user

Features:
    - Automatic remote agent discovery
    - Per-agent conversation context management
    - Transparent x402 payment handling
    - Spend limits via Ampersend
"""

import os

from ampersend_sdk import create_ampersend_toolset
from google.adk import Agent

# Configure remote agents (defaults to staging)
_remote_agent_urls = [
    os.environ.get(
        "EXAMPLES_A2A_BUYER__AGENT_URL_1",
        "https://subgraph-a2a.x402.staging.thegraph.com",
    )
]

# Add second agent if configured
if agent_url_2 := os.environ.get("EXAMPLES_A2A_BUYER__AGENT_URL_2"):
    _remote_agent_urls.append(agent_url_2)

# Create remote agent toolset
toolset = create_ampersend_toolset(
    remote_agent_urls=_remote_agent_urls,
    smart_account_address=os.environ["EXAMPLES_A2A_BUYER__SMART_ACCOUNT_ADDRESS"],
    session_key_private_key=os.environ["EXAMPLES_A2A_BUYER__SESSION_KEY_PRIVATE_KEY"],
    api_url=os.environ.get(
        "EXAMPLES_A2A_BUYER__AMPERSEND_API_URL",
        "https://api.staging.ampersend.ai",
    ),
)

# Create local orchestrator agent
root_agent = Agent(
    name="orchestrator_agent",
    model="gemini-2.0-flash",
    description="An orchestrator agent that delegates tasks to specialized remote agents",
    instruction="""You are an orchestrator agent that can delegate tasks to specialized remote agents.

Your capabilities:
- Use 'x402_a2a_list_agents' to discover available remote agents
- Use 'x402_a2a_send_to_agent' to send requests to specific agents by name

When a user asks for something:
1. First, list the available agents to understand their capabilities
2. Determine which remote agent can best help with the user's request
3. Delegate the task to that agent using send_to_agent
4. Return the agent's response to the user

Payments for remote agent services are handled automatically. Each agent
maintains its own conversation context.""",
    tools=[toolset],
    before_agent_callback=toolset.get_before_agent_callback(),
)
