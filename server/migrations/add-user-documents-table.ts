import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { db } from "../db";

export async function runMigration() {
  console.log("Running migration: Creating user_documents table");
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_documents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(100) NOT NULL,
      file_size INTEGER NOT NULL,
      file_url TEXT NOT NULL,
      tags TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add index for faster queries when filtering by user
    CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);

    -- Add comment
    COMMENT ON TABLE user_documents IS 'Stores user-uploaded documents separate from compliance documents';
  `);

  console.log("Migration completed: user_documents table created");
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
} 