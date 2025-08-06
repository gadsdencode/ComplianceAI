import { sql } from "drizzle-orm";
import { db } from "../db.js";

export async function runMigration() {
  console.log("Running migration: Adding category, starred, and status fields to user_documents table");
  
  try {
    // Add category column
    await db.execute(sql`
      ALTER TABLE user_documents 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General'
    `);

    // Add starred column  
    await db.execute(sql`
      ALTER TABLE user_documents 
      ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false
    `);

    // Add status column
    await db.execute(sql`
      ALTER TABLE user_documents 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'
    `);

    // Check if constraint already exists before adding it
    const constraintExists = await db.execute(sql`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'user_documents_status_check' 
      AND table_name = 'user_documents'
    `);

    if (constraintExists.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE user_documents 
        ADD CONSTRAINT user_documents_status_check 
        CHECK (status IN ('draft', 'review', 'approved', 'archived'))
      `);
    }

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_documents_category ON user_documents(category)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_documents_status ON user_documents(status)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_documents_starred ON user_documents(starred)
    `);

    // Add comments
    await db.execute(sql`
      COMMENT ON COLUMN user_documents.category IS 'Document category for organization'
    `);

    await db.execute(sql`
      COMMENT ON COLUMN user_documents.starred IS 'Whether the document is starred/favorited'
    `);

    await db.execute(sql`
      COMMENT ON COLUMN user_documents.status IS 'Document workflow status'
    `);

    console.log("Migration completed: user_documents table updated with new fields");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

 