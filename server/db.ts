import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";
import dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true; // Enable fetch-based queries for better reliability

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Ensure proper connection handling
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

export const db = drizzle({ 
  client: pool, 
  schema,
  // Enable logger for debugging (only in development)
  logger: process.env.NODE_ENV === 'development'
});
