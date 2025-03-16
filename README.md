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

## Local Development

### Prerequisites
```bash
# Required environment variables
DATABASE_URL=your_postgresql_database_url
```

### Local Testing Steps

1. Clone and install dependencies:
```bash
git clone https://github.com/amekala/Ads-mcp-server.git
cd amazon-ads-mcp
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Test the endpoints:
```bash
# Test health endpoint
curl http://localhost:5000/health
# Expected: {"status":"ok"}

# Test root endpoint  
curl http://localhost:5000/
# Expected: {"status":"ok","name":"Amazon Ads MCP Server","version":"1.0.0"}

# Test MCP endpoint (requires API key)
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:5000/mcp/sse
# Expected: SSE stream connection
```

4. Configure Claude Desktop for local testing:
```json
{
  "globalShortcut": "",
  "mcpServers": {
    "amazon-ads": {
      "name": "Amazon Ads Assistant",
      "version": "1.0.0", 
      "description": "MCP Server for Amazon Advertising",
      "command": "curl",
      "args": [
        "-N",
        "--no-buffer",
        "--max-time", "0",
        "-H", "Accept: text/event-stream",
        "-H", "Cache-Control: no-cache",
        "-H", "Connection: keep-alive",
        "-H", "Authorization: Bearer YOUR_API_KEY",
        "http://localhost:5000/mcp/sse"
      ]
    }
  }
}
```

## Production Setup

The MCP server is deployed at: `https://mcp-server-sync-abhilashreddi.replit.app`

For production use, update your Claude Desktop config to use:
```json
{
  "globalShortcut": "",
  "mcpServers": {
    "amazon-ads": {
      "name": "Amazon Ads Assistant",
      "version": "1.0.0",
      "description": "MCP Server for Amazon Advertising",
      "command": "curl",
      "args": [
        "-N", 
        "--no-buffer",
        "--max-time", "0",
        "-H", "Accept: text/event-stream",
        "-H", "Cache-Control: no-cache",
        "-H", "Connection: keep-alive",
        "-H", "Authorization: Bearer YOUR_API_KEY",
        "https://mcp-server-sync-abhilashreddi.replit.app/mcp/sse"
      ]
    }
  }
}
```

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

## Example MCP Queries

Here are some example queries you can try with Claude Desktop:

```
# Database Schema
Show me the database schema

# Campaign Analysis  
What's the performance of campaign ABC123?
How is campaign XYZ performing this month?

# Ad Group Metrics
Show metrics for ad group G123
What's the ROI for ad group XYZ?

# Budget Optimization
Give me budget recommendations for profile P456
Which campaigns should increase their budget?

# Performance Trends
Show performance trends for profile P789 over the last 30 days
What are the impression trends for my campaigns?
```

## Security & Database Access

The MCP server handles all database connections internally using secure PostgreSQL credentials. These credentials are:
- Set via DATABASE_URL environment variable
- Never exposed to clients
- Managed through the Neon serverless driver
- Protected by row-level security

## License

MIT

## Author

Abhilash Mekala