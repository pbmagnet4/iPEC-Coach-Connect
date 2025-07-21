#!/bin/bash
# Setup script to export environment variables for MCP servers
# Source this file before running Claude: source ./setup-mcp-env.sh

# Load variables from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Add any additional API keys needed for MCP servers
# export OPENAI_API_KEY="your-key-here"
# export ANTHROPIC_API_KEY="your-key-here"
# export GITHUB_PERSONAL_ACCESS_TOKEN="your-token-here"

echo "Environment variables loaded for MCP servers"