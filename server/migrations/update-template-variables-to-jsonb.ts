import { db } from "../db.js";
import { sql } from "drizzle-orm";

export async function runMigration() {
  try {
    console.log("🔄 Converting template variables to JSONB for rich metadata...");
    
    // First, drop the old TEXT[] column
    await db.execute(sql`
      ALTER TABLE templates 
      DROP COLUMN IF EXISTS variables
    `);
    
    // Add new JSONB column for variables with metadata
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN variables JSONB DEFAULT '[]'::jsonb
    `);
    
    console.log("✅ Template variables column converted to JSONB successfully");
  } catch (error) {
    console.error("❌ Failed to convert template variables to JSONB:", error);
    throw error;
  }
}