import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { mcpServer } from "./mcp";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Add root endpoint for status check
  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      name: "Amazon Ads MCP Server",
      version: "1.0.0"
    });
  });

  // Add simple health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Setup SSE endpoint for MCP
  app.get("/mcp/sse", async (req, res) => {
    const transport = new SSEServerTransport("/mcp/messages", res);
    await mcpServer.connect(transport);
  });

  // Setup endpoint for receiving MCP messages
  app.post("/mcp/messages", express.json(), async (req, res) => {
    try {
      const result = await mcpServer.receive(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: (error as Error).message
      });
    }
  });

  return httpServer;
}