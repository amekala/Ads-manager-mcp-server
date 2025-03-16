# Amazon Ads MCP Server

An MCP server that provides access to Amazon Advertising data through standardized resources and tools.

## Overview

This MCP server connects to your Amazon Advertising data and enables natural language interactions through Claude Desktop. It provides:

- Campaign performance analysis
- Ad group management
- Metrics tracking and visualization
- AI-powered recommendations

## Installation

```bash
npm install amazon-ads-mcp
```

## Configuration

1. Deploy the MCP server:
```bash
npm start
```

2. Configure Claude Desktop:
   - Copy `claude-desktop-config.example.json` to `claude-desktop-config.json`
   - Replace the placeholder token with your Amazon Ads API token
   - Update the endpoint URL to point to your deployed server

## Available MCP Tools

### Data Access
- `getCampaignPerformance`: Analyze campaign metrics
- `getAdGroupMetrics`: Review ad group performance
- `getAdvertisingProfile`: Access profile information

### Analysis
- `analyzeTrends`: Get performance trends and insights
- `optimizeBudget`: Receive budget allocation recommendations
- `forecastPerformance`: Project future metrics

### Schema & Query
- `schema`: Inspect available data structures
- `query`: Execute custom data queries

## Security

The MCP server handles database connections internally. Users only need to configure their Claude Desktop with their Amazon Ads API token.

## Database Access

Database credentials are managed securely by the MCP server deployment. Clients interact with the data through MCP tools without direct database access.