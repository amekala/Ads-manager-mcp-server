import express from "express";
import { registerRoutes } from "./routes";

// Simple logger function
const log = (message: string) => console.log(`[Ads-MCP] ${message}`);

const app = express();
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Add error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error for debugging
    console.error(err);

    // Send formatted error response
    res.status(status).json({ 
      error: message,
      statusCode: status
    });
  });

  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Ads Manager MCP server running on port ${port}`);
  });
})();

// Export MCP server and types for npm package
export { mcpServer } from "./mcp";
export * from "@shared/schema";