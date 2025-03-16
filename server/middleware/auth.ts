import { Request, Response, NextFunction } from "express";

export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];
  
  if (!process.env.MCP_API_KEY) {
    console.warn("Warning: MCP_API_KEY environment variable not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (!apiKey || apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }

  next();
}
