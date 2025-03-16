#!/usr/bin/env node

const https = require('https');
const EventSource = require('eventsource');

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
  
  // Start handling MCP protocol
  handleMcpProtocol();
});

// Handle MCP protocol
function handleMcpProtocol() {
  // Start listening for client messages on stdin
  process.stdin.on('data', async (chunk) => {
    const message = chunk.toString().trim();
    if (!message) return;
    
    try {
      console.error(`Received message: ${message}`);
      const request = JSON.parse(message);
      
      // Handle different methods
      let response;
      
      if (request.method === 'initialize') {
        response = handleInitialize(request);
      } else if (request.method === 'tools/list') {
        response = handleToolsList(request);
      } else if (request.method === 'tools/call') {
        response = handleToolsCall(request);
      } else {
        response = {
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          },
          jsonrpc: '2.0',
          id: request.id
        };
      }
      
      // Send response
      console.log(JSON.stringify(response));
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Send error response
      const errorResponse = {
        error: {
          code: -32700,
          message: 'Parse error'
        },
        jsonrpc: '2.0',
        id: null
      };
      
      console.log(JSON.stringify(errorResponse));
    }
  });
  
  // Notify that we're ready
  console.error('MCP Proxy ready to receive messages');
}

// Handle initialize method
function handleInitialize(request) {
  console.error('Handling initialize method');
  
  return {
    result: {
      serverInfo: {
        name: 'Amazon Ads Manager',
        version: '1.0.4',
        vendor: 'Custom'
      },
      capabilities: {
        resources: ['schema', 'metrics', 'campaigns', 'adGroups'],
        tools: ['analyzeCampaignPerformance', 'analyzeAdGroupPerformance', 'optimizeBudget', 'query']
      }
    },
    jsonrpc: '2.0',
    id: request.id
  };
}

// Handle tools/list method
function handleToolsList(request) {
  console.error('Handling tools/list method');
  
  return {
    result: {
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
    },
    jsonrpc: '2.0',
    id: request.id
  };
}

// Handle tools/call method
function handleToolsCall(request) {
  const params = request.params;
  console.error(`Handling tools/call method with params: ${JSON.stringify(params)}`);
  
  return {
    result: {
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
    },
    jsonrpc: '2.0',
    id: request.id
  };
}

// Handle process shutdown
process.on('SIGINT', () => {
  console.error('Shutting down SSE proxy');
  eventSource.close();
  process.exit(0);
}); 