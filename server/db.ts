import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";
import dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

if (!process.env.DATABASE_URL) {
  console.error("❌ FATAL ERROR: DATABASE_URL environment variable is not set!");
  console.error("   Please ensure the database is provisioned and DATABASE_URL is configured.");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("🔌 Initializing database connection...");

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}
