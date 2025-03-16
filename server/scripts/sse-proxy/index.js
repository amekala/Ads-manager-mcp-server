#!/usr/bin/env node

const https = require('https');
const { EventSource } = require('eventsource');
const { JSONRPCServer } = require('@modelcontextprotocol/sdk');

// Initialize MCP server
const server = new JSONRPCServer();

// Create a session ID for tracking
const sessionId = Math.random().toString(36).substring(2, 15);
console.error(`Starting SSE proxy with session ID: ${sessionId}`);

// Connect to the SSE endpoint
const url = 'https://mcp-server-sync-abhilashreddi.replit.app/mcp/sse';
const headers = {
  'Accept': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Authorization': 'mDT3YY27XvHYeqvthyWenpI8WE78Ljxf'
};

const eventSource = new EventSource(url, { headers });

eventSource.onopen = () => {
  console.error('Connected to SSE endpoint');
};

eventSource.onerror = (err) => {
  console.error('SSE connection error:', err);
};

// Handle 'endpoint' event from SSE
eventSource.addEventListener('endpoint', (event) => {
  console.error(`Received endpoint: ${event.data}`);
  
  // Parse and handle the endpoint
  const endpoint = event.data;
  
  // Register methods with the MCP server
  registerMethods(endpoint);
});

// Register MCP methods
function registerMethods(endpoint) {
  // Register initialize method
  server.method('initialize', async (params) => {
    console.error('Received initialize request with params:', JSON.stringify(params));
    return {
      serverInfo: {
        name: 'Amazon Ads Manager',
        version: '1.0.4',
        vendor: 'Custom'
      },
      capabilities: {
        resources: ['schema', 'metrics', 'campaigns', 'adGroups'],
        tools: ['analyzeCampaignPerformance', 'analyzeAdGroupPerformance', 'optimizeBudget', 'query']
      }
    };
  });

  // Register tools/list method
  server.method('tools/list', async () => {
    return {
      tools: [
        {
          name: 'analyzeCampaignPerformance',
          description: 'Analyze campaign metrics and performance',
          parameters: {
            type: 'object',
            properties: {
              campaignId: {
                type: 'string',
                description: 'Campaign ID to analyze'
              },
              dateRange: {
                type: 'string',
                description: 'Date range for analysis (e.g., "30d", "7d", "yesterday")'
              }
            },
            required: ['campaignId']
          }
        },
        {
          name: 'query',
          description: 'Run custom SQL queries against the database',
          parameters: {
            type: 'object',
            properties: {
              sql: {
                type: 'string',
                description: 'SQL query to execute'
              }
            },
            required: ['sql']
          }
        }
      ]
    };
  });

  // Forward tool call requests to the original API
  server.method('tools/call', async (params) => {
    console.error(`Received tools/call with params: ${JSON.stringify(params)}`);
    
    try {
      // Here you would typically forward the request to the actual API
      // For now, we'll return a mock response
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'This is a mock response from the SSE proxy',
              toolName: params.name,
              args: params.arguments
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error('Error in tools/call:', error);
      throw error;
    }
  });

  // Start listening for client messages
  process.stdin.on('data', async (chunk) => {
    const message = chunk.toString().trim();
    if (!message) return;
    
    try {
      console.error(`Received message: ${message}`);
      const response = await server.receive(message);
      if (response) {
        console.log(response);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Notify that we're ready
  console.error('MCP Proxy ready to receive messages');
}

// Handle process shutdown
process.on('SIGINT', () => {
  console.error('Shutting down SSE proxy');
  eventSource.close();
  process.exit(0);
}); 