#!/usr/bin/env node

const { spawn } = require('child_process');
const net = require('net');
const readline = require('readline');

// Create a session ID for tracking
const sessionId = Math.random().toString(36).substring(2, 15);
console.error(`Starting MCP server with session ID: ${sessionId}`);

// Create a server to handle MCP protocol
const server = net.createServer((socket) => {
  console.error('Client connected');
  
  // Prepare to read messages from the client
  const rl = readline.createInterface({
    input: socket,
    output: socket,
    terminal: false
  });
  
  // Handle messages from the client
  rl.on('line', (line) => {
    try {
      console.error(`Received line: ${line}`);
      const message = JSON.parse(line);
      
      // Process the message
      handleMessage(message, socket);
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
      
      socket.write(JSON.stringify(errorResponse) + '\n');
    }
  });
  
  // Handle client disconnection
  socket.on('close', () => {
    console.error('Client disconnected');
  });
  
  // Handle errors
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// Handle MCP protocol messages
function handleMessage(message, socket) {
  console.error(`Processing message: ${JSON.stringify(message)}`);
  
  if (message.method === 'initialize') {
    handleInitialize(message, socket);
  } else if (message.method === 'tools/list') {
    handleToolsList(message, socket);
  } else if (message.method === 'tools/call') {
    handleToolsCall(message, socket);
  } else {
    // Method not supported
    const response = {
      error: {
        code: -32601,
        message: `Method not found: ${message.method}`
      },
      jsonrpc: '2.0',
      id: message.id
    };
    
    socket.write(JSON.stringify(response) + '\n');
  }
}

// Handle initialize method
function handleInitialize(message, socket) {
  console.error(`Handling initialize for client ${message.id}`);
  
  const response = {
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
    id: message.id
  };
  
  socket.write(JSON.stringify(response) + '\n');
  console.error(`Initialize response sent to client ${message.id}`);
}

// Handle tools/list method
function handleToolsList(message, socket) {
  console.error(`Handling tools/list for client ${message.id}`);
  
  const response = {
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
    id: message.id
  };
  
  socket.write(JSON.stringify(response) + '\n');
  console.error(`Tools/list response sent to client ${message.id}`);
}

// Handle tools/call method
function handleToolsCall(message, socket) {
  const params = message.params;
  console.error(`Handling tools/call with params: ${JSON.stringify(params)}`);
  
  const response = {
    result: {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'This is a mock response from the MCP server',
            toolName: params.name,
            args: params.arguments
          }, null, 2)
        }
      ]
    },
    jsonrpc: '2.0',
    id: message.id
  };
  
  socket.write(JSON.stringify(response) + '\n');
  console.error(`Tools/call response sent to client ${message.id}`);
}

// Start the server
const PORT = process.env.MCP_PORT || 7891;
server.listen(PORT, '127.0.0.1', () => {
  console.error(`MCP server listening on port ${PORT}`);
  
  // Signal that we're ready - this allows Claude to connect to us
  console.log(JSON.stringify({
    port: PORT,
    protocol: 'mcp'
  }));
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Handle process exit
process.on('exit', () => {
  console.error('Process exiting, shutting down server');
  server.close();
});

// Handle signals
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down server');
  server.close(() => {
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Don't exit, try to keep the server running
}); 