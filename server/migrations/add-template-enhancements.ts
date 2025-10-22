import { db } from "../db.js";
import { sql } from "drizzle-orm";

export async function runMigration() {
  try {
    console.log("📈 Adding enhanced fields to templates table...");
    
    // Add description column
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS description TEXT
    `);
    
    // Add tags column (array)
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS tags TEXT[]
    `);
    
    // Add variables column (array)
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS variables TEXT[]
    `);
    
    // Add estimated_time column
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS estimated_time VARCHAR(50)
    `);
    
    // Add compliance_standards column (array)
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS compliance_standards TEXT[]
    `);
    
    // Add version column
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1
    `);
    
    // Add is_active column
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);
    
    console.log("✅ Template enhancement fields added successfully");
  } catch (error) {
    console.error("❌ Failed to add template enhancement fields:", error);
    throw error;
  }
}