import { sql } from "drizzle-orm";
import { db } from "../db.js";

export async function runMigration() {
  console.log("🔄 Running migration: Creating session table");
  
  try {
    // Create session table as required by connect-pg-simple
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
    `);

    // Check if primary key constraint already exists
    const pkExists = await db.execute(sql`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'session_pkey' 
      AND table_name = 'session'
    `);

    if (pkExists.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      `);
    }

    // Create index for session expiration
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);

    console.log("✅ Migration completed: session table created successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
} 