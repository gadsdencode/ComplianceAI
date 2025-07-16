import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { db } from "../db";

export async function runMigration() {
  console.log("Running migration: Adding category, starred, and status fields to user_documents table");
  
  await db.execute(sql`
    -- Add new columns to user_documents table
    ALTER TABLE user_documents 
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

    -- Add constraint for status field
    ALTER TABLE user_documents 
    ADD CONSTRAINT user_documents_status_check 
    CHECK (status IN ('draft', 'review', 'approved', 'archived'));

    -- Add index for faster filtering by category and status
    CREATE INDEX IF NOT EXISTS idx_user_documents_category ON user_documents(category);
    CREATE INDEX IF NOT EXISTS idx_user_documents_status ON user_documents(status);
    CREATE INDEX IF NOT EXISTS idx_user_documents_starred ON user_documents(starred);

    -- Add comment
    COMMENT ON COLUMN user_documents.category IS 'Document category for organization';
    COMMENT ON COLUMN user_documents.starred IS 'Whether the document is starred/favorited';
    COMMENT ON COLUMN user_documents.status IS 'Document workflow status';
  `);

  console.log("Migration completed: user_documents table updated with new fields");
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration().catch(console.error);
} 