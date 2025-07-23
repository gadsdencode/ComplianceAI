import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { db } from "../db.js";

export async function runMigration() {
  console.log("🔄 Running migration: Creating notifications table");
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('document_update', 'deadline_reminder', 'approval_request', 'system_notification', 'user_document_upload')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        is_read BOOLEAN NOT NULL DEFAULT false,
        related_id INTEGER,
        related_type VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Add indexes for faster queries
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

      -- Add comment
      COMMENT ON TABLE notifications IS 'Stores user notifications for various system events';
    `);

    console.log("✅ Migration completed: notifications table created successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
} 