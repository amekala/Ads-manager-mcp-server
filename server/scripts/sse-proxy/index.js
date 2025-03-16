#!/usr/bin/env node

const net = require('net');
const readline = require('readline');

// Create a session ID for tracking
const sessionId = Math.random().toString(36).substring(2, 15);
console.error(`Starting MCP server with session ID: ${sessionId}`);

// Try multiple ports in case of conflicts
let currentPort = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 7891;
const maxPortAttempts = 10;

// Create server
function createServer(port) {
  // Create a server to handle MCP protocol
  const server = net.createServer((socket) => {
    console.error('Client connected');
    
    // Set TCP keepalive to help detect dead connections
    socket.setKeepAlive(true, 15000);
    
    // Increase socket timeout to prevent early disconnections
    socket.setTimeout(60000);
    
    // Add connection tracking
    const clientId = `client-${Math.random().toString(36).substring(2, 10)}`;
    console.error(`New connection established: ${clientId}`);
    
    // Prepare to read messages from the client
    const rl = readline.createInterface({
      input: socket,
      output: socket,
      terminal: false
    });
    
    // Set up heartbeat interval to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (socket.writable) {
        try {
          // Send a notification as heartbeat
          const heartbeat = {
            jsonrpc: "2.0",
            method: "notifications/heartbeat",
            params: {
              timestamp: new Date().toISOString()
            }
          };
          socket.write(JSON.stringify(heartbeat) + '\n');
          console.error(`Sent heartbeat to ${clientId}`);
        } catch (err) {
          console.error(`Failed to send heartbeat to ${clientId}:`, err);
        }
      } else {
        console.error(`Socket not writable for ${clientId}, clearing heartbeat`);
        clearInterval(heartbeatInterval);
      }
    }, 20000); // Heartbeat every 20 seconds
    
    // Handle messages from the client
    rl.on('line', (line) => {
      try {
        if (!line.trim()) return;
        
        console.error(`Received line from ${clientId}: ${line}`);
        const message = JSON.parse(line);
        
        // Process the message
        handleMessage(message, socket);
      } catch (error) {
        console.error(`Error processing message from ${clientId}:`, error);
        
        // Send error response
        const errorResponse = {
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: 'Parse error'
          },
          id: null
        };
        
        try {
          socket.write(JSON.stringify(errorResponse) + '\n');
        } catch (err) {
          console.error(`Failed to send error response to ${clientId}:`, err);
        }
      }
    });
    
    // Handle client disconnection
    socket.on('close', () => {
      console.error(`Client ${clientId} disconnected`);
      clearInterval(heartbeatInterval);
      rl.close();
    });
    
    // Handle errors
    socket.on('error', (err) => {
      console.error(`Socket error for ${clientId}:`, err);
      clearInterval(heartbeatInterval);
    });
    
    // Handle socket timeout
    socket.on('timeout', () => {
      console.error(`Socket timeout for ${clientId}`);
      // Don't close the socket, just log the timeout
    });
  });

  return server;
}

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
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: `Method not found: ${message.method}`
      },
      id: message.id
    };
    
    socket.write(JSON.stringify(response) + '\n');
  }
}

// Handle initialize method
function handleInitialize(message, socket) {
  console.error(`Handling initialize for client ${message.id}`);
  
  const response = {
    jsonrpc: "2.0",
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
    id: message.id
  };
  
  socket.write(JSON.stringify(response) + '\n');
  console.error(`Initialize response sent to client ${message.id}`);
}

// Handle tools/list method
function handleToolsList(message, socket) {
  console.error(`Handling tools/list for client ${message.id}`);
  
  const response = {
    jsonrpc: "2.0",
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
    id: message.id
  };
  
  socket.write(JSON.stringify(response) + '\n');
  console.error(`Tools/list response sent to client ${message.id}`);
}

// Handle tools/call method
function handleToolsCall(message, socket) {
  const params = message.params;
  console.error(`Handling tools/call with params: ${JSON.stringify(params)}`);
  
  // Track active requests
  const requestId = message.id;
  const toolName = params.name;
  
  // Set timeout for tool execution (30 seconds)
  const timeoutMs = 25000;
  const timeoutId = setTimeout(() => {
    console.error(`Request ${requestId} timed out for tool ${toolName}`);
    
    // Send timeout error response
    const errorResponse = {
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "Request timed out"
      },
      id: requestId
    };
    
    try {
      socket.write(JSON.stringify(errorResponse) + '\n');
    } catch (err) {
      console.error(`Error sending timeout response: ${err.message}`);
    }
  }, timeoutMs);
  
  try {
    // Process the tool call (simulated async operation)
    processToolCall(params)
      .then(result => {
        // Clear timeout as request completed successfully
        clearTimeout(timeoutId);
        
        // Only send response if socket is still writable
        if (socket.writable) {
          const response = {
            jsonrpc: "2.0",
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            },
            id: requestId
          };
          
          socket.write(JSON.stringify(response) + '\n');
          console.error(`Tools/call response sent to client ${requestId}`);
        } else {
          console.error(`Socket closed, cannot send response for ${requestId}`);
        }
      })
      .catch(err => {
        // Clear timeout as request completed (with error)
        clearTimeout(timeoutId);
        
        console.error(`Error processing tool call: ${err.message}`);
        
        // Only send error if socket is still writable
        if (socket.writable) {
          const errorResponse = {
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: `Error executing tool: ${err.message}`
            },
            id: requestId
          };
          
          socket.write(JSON.stringify(errorResponse) + '\n');
        } else {
          console.error(`Socket closed, cannot send error for ${requestId}`);
        }
      });
  } catch (err) {
    // Clear timeout as request failed immediately
    clearTimeout(timeoutId);
    
    console.error(`Failed to process tool call: ${err.message}`);
    
    // Send immediate error response
    if (socket.writable) {
      const errorResponse = {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: `Internal error: ${err.message}`
        },
        id: requestId
      };
      
      socket.write(JSON.stringify(errorResponse) + '\n');
    }
  }
}

// Process tool call - returns a promise that resolves with the tool result
async function processToolCall(params) {
  // Simulate some processing time (1-3 seconds)
  const processingTime = Math.floor(Math.random() * 2000) + 1000;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate mock response based on tool name
      if (params.name === 'analyzeCampaignPerformance') {
        resolve({
          message: 'Campaign analysis complete',
          toolName: params.name,
          campaignId: params.arguments.campaignId || 'unknown',
          metrics: {
            impressions: Math.floor(Math.random() * 10000),
            clicks: Math.floor(Math.random() * 500),
            conversions: Math.floor(Math.random() * 50),
            ctr: (Math.random() * 5).toFixed(2) + '%',
            cpc: '$' + (Math.random() * 2).toFixed(2)
          }
        });
      } else if (params.name === 'query') {
        resolve({
          message: 'Query executed successfully',
          toolName: params.name,
          query: params.arguments.sql || 'unknown query',
          rows: Math.floor(Math.random() * 100),
          sampleData: [
            { id: 1, name: 'Sample Campaign 1', status: 'ACTIVE' },
            { id: 2, name: 'Sample Campaign 2', status: 'PAUSED' }
          ]
        });
      } else {
        resolve({
          message: 'Tool executed successfully',
          toolName: params.name,
          args: params.arguments
        });
      }
    }, processingTime);
  });
}

// Start the server with port fallback logic
function startServer(attempt = 0) {
  if (attempt >= maxPortAttempts) {
    console.error(`Failed to start server after ${maxPortAttempts} attempts.`);
    process.exit(1);
    return;
  }

  const port = currentPort + attempt;
  const server = createServer(port);

  server.on('error', (err) => {
    console.error(`Server error on port ${port}:`, err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is in use, trying next port...`);
      startServer(attempt + 1);
    } else {
      // For other errors, log and try to recover
      console.error(`Unexpected server error: ${err.message}`);
      // Try to restart after a short delay
      setTimeout(() => {
        console.error('Attempting to restart server...');
        startServer(attempt);
      }, 5000);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.error(`MCP server listening on port ${port}`);
    
    // Output the port information to stdout for Claude to connect
    console.log(JSON.stringify({
      jsonrpc: "2.0",
      result: {
        port: port,
        protocol: 'mcp'
      },
      id: "startup"
    }));
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

  process.on('SIGTERM', () => {
    console.error('Received SIGTERM, shutting down server');
    server.close(() => {
      process.exit(0);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // Don't exit, try to keep the server running
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
    // Don't exit, try to keep the server running
  });

  return server;
}

// Add a periodic status check to help debug connection issues
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.error(`[STATUS] Memory usage: RSS=${Math.round(memoryUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memoryUsage.heapUsed / 1024 / 1024)}/${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
  console.error(`[STATUS] Server uptime: ${Math.floor(process.uptime())} seconds`);
}, 60000);

// Start the server
startServer(); 