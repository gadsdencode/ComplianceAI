import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

// Configure Neon for better connection handling
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with proper timeout and connection settings for Neon
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 seconds as recommended by Neon
  idleTimeoutMillis: 30000, // 30 seconds 
  max: 20, // Reasonable max connections for Neon
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle({ client: pool, schema });
