import { Request, Response, NextFunction } from "express";

export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["authorization"];

  if (!apiKey || !apiKey.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Missing or invalid API key format. Expected: Bearer YOUR_API_KEY" });
  }

  // The API key is valid, proceed
  next();
}