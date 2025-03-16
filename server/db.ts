import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { config } from 'dotenv';

// Load environment variables (for development override only)
config();

console.log('Initializing database connection...');
neonConfig.webSocketConstructor = ws;

// Hardcoded database credentials
const HARDCODED_DB_URL = "postgresql://neondb_owner:npg_WiCH5ywPK8ta@ep-lucky-hat-a4m2qapz.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Use environment variable if set (for development/testing), otherwise use hardcoded credentials
const dbUrl = process.env.DATABASE_URL || HARDCODED_DB_URL;

console.log(`Using database: ${dbUrl.substring(0, dbUrl.indexOf('@') + 1)}***`); // Log partial URL for security

export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle({ client: pool, schema });

console.log('Database connection initialized');