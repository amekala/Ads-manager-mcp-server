# Amazon Ads MCP Server

An MCP server that provides access to Amazon Advertising data through standardized resources and tools.

## Overview

This MCP server connects to your Amazon Advertising data and enables natural language interactions through Claude Desktop. It provides:

- Campaign performance analysis
- Ad group management
- Metrics tracking and visualization
- AI-powered recommendations

## Production Setup

The MCP server is deployed at: `https://mcp-server-sync-abhilashreddi.replit.app`

### Claude Desktop Configuration

1. Create a `claude-desktop-config.json`:
```json
{
  "name": "Amazon Ads Assistant",
  "version": "1.0.0",
  "description": "MCP configuration for Amazon Advertising data analysis",
  "mcp": {
    "endpoint": "https://mcp-server-sync-abhilashreddi.replit.app/mcp",
    "transport": "sse",
    "headers": {
      "Authorization": "Bearer YOUR_AMAZON_ADS_API_TOKEN"
    }
  }
}
```

2. Replace `YOUR_AMAZON_ADS_API_TOKEN` with your token from the Amazon Ads web application

### Verifying the Setup

1. Test server health:
```bash
curl https://mcp-server-sync-abhilashreddi.replit.app/
# Expected response:
# {"status":"ok","name":"Amazon Ads MCP Server","version":"1.0.0"}
```

2. Test with Claude Desktop:
- Load your config file in Claude Desktop
- Try commands like:
  ```
  Show me the database schema
  Analyze performance for campaign XYZ
  Get budget recommendations for profile ABC
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

### Example MCP Queries

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

These queries demonstrate the natural language capabilities enabled by the MCP server. The server handles translating these queries into appropriate database operations while maintaining security.


## Security & Database Access

The MCP server handles all database connections internally using secure PostgreSQL credentials. These credentials are:
- Configured during deployment
- Never exposed to clients
- Managed through the Neon serverless driver
- Protected by row-level security

Clients interact with the data only through the MCP tools, ensuring secure and controlled access to the advertising data.

## Troubleshooting

If you encounter issues:

1. Verify the server is running:
```bash
curl https://mcp-server-sync-abhilashreddi.replit.app/health
# Expected: {"status":"ok"}
```

2. Check Claude Desktop connection:
- Ensure your API token is correctly set in the config
- Verify the endpoint URL matches exactly
- Check for any error messages in Claude Desktop

## Support

For issues with:
- MCP server access: Check server status and your network connection
- Data queries: Verify your API token and permissions
- Claude Desktop: Ensure your config file is properly formatted