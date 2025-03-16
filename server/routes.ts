import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { mcpServer } from "./mcp";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { validateApiKey } from "./middleware/auth";

// Helper function to handle async middleware
const asyncMiddleware = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Add error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error in request:', err);
    res.status(500).json({ error: err.message });
  });

  // Add root endpoint for status check
  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      name: "Amazon Ads MCP Server",
      version: "1.0.4"
    });
  });

  // Add simple health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Enable CORS for MCP endpoints
  app.use("/mcp", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
      return res.status(204).end();
    }
    next();
  });

  // Setup SSE endpoint for MCP with API key validation and longer timeout
  app.get("/mcp/sse", asyncMiddleware(validateApiKey), async (req, res) => {
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Set a longer timeout for the connection
    req.socket.setTimeout(0);
    res.socket?.setTimeout(0);
    req.socket.setNoDelay(true);
    req.socket.setKeepAlive(true);

    const transport = new SSEServerTransport("/mcp/messages", res);
    await mcpServer.connect(transport);
  });

  // Setup endpoint for receiving MCP messages with API key validation
  app.post("/mcp/messages", asyncMiddleware(validateApiKey), express.json(), async (req, res) => {
    try {
      // Create a temporary transport to handle the message
      const tempTransport = new SSEServerTransport("/mcp/messages", res);
      
      // Use the transport's handleMessage method
      await tempTransport.handleMessage(req.body);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error handling MCP message:', error);
      res.status(500).json({
        error: (error as Error).message
      });
    }
  });

  return httpServer;
}