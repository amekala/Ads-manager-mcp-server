# Amazon Ads Manager MCP Server

A Model Context Protocol (MCP) server for managing and analyzing Amazon Advertising data. This server provides a standardized interface for LLMs to interact with your advertising data through the Claude Desktop App.

## Features

- **Database Integration**: Pre-configured connection to a secure PostgreSQL database
- **API Key Authentication**: Secure access through API key validation
- **Real-time Analytics**: Access to campaign metrics and performance data
- **Natural Language Interface**: Query your advertising data using natural language

## Installation

```bash
npm install ads-manager-mcp
```

## Quick Start

1. Install the Claude Desktop App
2. Create a configuration file `claude-desktop-config.json`:

```json
{
  "name": "Amazon Ads Manager",
  "version": "1.0.4",
  "description": "Connect to your Amazon Advertising data and analyze campaign performance",
  "mcpServers": {
    "ads-manager": {
      "name": "Ads Manager MCP Server",
      "version": "1.0.4",
      "description": "MCP Server for Amazon Advertising data analysis",
      "transport": "sse",
      "endpoint": "https://mcp-server-sync-abhilashreddi.replit.app/mcp/sse",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

3. Replace `YOUR_API_KEY_HERE` with your API key
4. Start using the Claude Desktop App to analyze your advertising data

## Available Resources

- **Schema**: View database structure and table definitions
- **Metrics**: Access advertising performance metrics
- **Campaigns**: View campaign configurations and settings
- **Ad Groups**: Access ad group details and settings

## Available Tools

- **analyzeCampaignPerformance**: Analyze campaign metrics and performance
- **analyzeAdGroupPerformance**: Get detailed ad group performance analysis
- **optimizeBudget**: Get budget optimization recommendations
- **query**: Run custom SQL queries against the database

## Example Queries

```plaintext
"Show me the structure of all tables in the database"
"Analyze the performance of campaign ABC123 for the last 30 days"
"What are the key metrics for ad group XYZ789?"
"Give me budget recommendations for all campaigns in profile P123"
```

## API Authentication

The server uses API key authentication. Each request must include an Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

## Database Connection

The server maintains a connection to a PostgreSQL database. No additional configuration is required as the connection details are pre-configured in the package.

## Development

To run the server locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build the package
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.