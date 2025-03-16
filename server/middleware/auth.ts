import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { apiKeys, users } from "@shared/schema";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("Missing or invalid API key format");
    return res.status(401).json({ error: "Missing or invalid API key format. Expected: Bearer YOUR_API_KEY" });
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log(`Authenticating API key: ${apiKey.substring(0, 4)}***`);

  try {
    // Query the database to verify the API key
    console.log("Checking API key against database");
    const keyRecord = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.keyValue, apiKey))
      .limit(1);

    if (!keyRecord || keyRecord.length === 0) {
      console.log("API key verification failed: Key not found");
      return res.status(401).json({ error: "Invalid API key" });
    }

    const apiKeyData = keyRecord[0];
    
    if (!apiKeyData.isActive) {
      console.log("API key verification failed: Key is inactive");
      return res.status(401).json({ error: "API key is inactive" });
    }

    // Get user data
    const userData = await db.select()
      .from(users)
      .where(eq(users.id, apiKeyData.userId))
      .limit(1);

    if (!userData || userData.length === 0) {
      console.log("API key verification failed: User not found");
      return res.status(401).json({ error: "User not found" });
    }

    // Store user info in request for later use
    console.log(`API key verified successfully for user: ${userData[0].email}`);
    req.user = { 
      id: userData[0].id,
      email: userData[0].email,
      role: userData[0].role
    };

    // Update lastUsed timestamp and request count
    await db.update(apiKeys)
      .set({ 
        lastUsed: new Date(),
        requestCount: (apiKeyData.requestCount || 0) + 1
      })
      .where(eq(apiKeys.id, apiKeyData.id));

    next();
  } catch (error) {
    console.error("Error validating API key:", error);
    return res.status(500).json({ error: "Server error during authentication" });
  }
}