import { sql } from "drizzle-orm";
import { db } from "../db.js";

export async function up() {
  try {
    // First check if the column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      AND column_name = 'category'
    `);
    
    if (result.rows.length === 0) {
      // Column doesn't exist, so add it
      await db.execute(sql`
        ALTER TABLE documents 
        ADD COLUMN category VARCHAR(100) DEFAULT 'Compliance'
      `);
      
      // Update existing documents to have the default category
      await db.execute(sql`
        UPDATE documents 
        SET category = 'Compliance' 
        WHERE category IS NULL
      `);
      
      console.log("✅ Added category column to documents table");
    } else {
      console.log("✅ Category column already exists in documents table");
    }
  } catch (error) {
    console.error("❌ Error adding category column:", error);
    throw error;
  }
}

export async function down() {
  try {
    // Check if the column exists before trying to drop it
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      AND column_name = 'category'
    `);
    
    if (result.rows.length > 0) {
      await db.execute(sql`
        ALTER TABLE documents 
        DROP COLUMN category
      `);
      console.log("✅ Removed category column from documents table");
    } else {
      console.log("✅ Category column doesn't exist in documents table");
    }
  } catch (error) {
    console.error("❌ Error removing category column:", error);
    throw error;
  }
} 