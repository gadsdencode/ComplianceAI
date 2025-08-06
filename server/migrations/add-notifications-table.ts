import { sql } from "drizzle-orm";
import { db } from "../db.js";

export async function runMigration() {
  console.log("🔄 Running migration: Creating notifications table");
  
  try {
    // Create table without inline constraints first
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        is_read BOOLEAN NOT NULL DEFAULT false,
        related_id INTEGER,
        related_type VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Check if type constraint already exists
    const typeConstraintExists = await db.execute(sql`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'notifications_type_check' 
      AND table_name = 'notifications'
    `);

    if (typeConstraintExists.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_type_check 
        CHECK (type IN ('document_update', 'deadline_reminder', 'approval_request', 'system_notification', 'user_document_upload'))
      `);
    }

    // Check if priority constraint already exists
    const priorityConstraintExists = await db.execute(sql`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'notifications_priority_check' 
      AND table_name = 'notifications'
    `);

    if (priorityConstraintExists.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_priority_check 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
      `);
    }

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)
    `);

    await db.execute(sql`
      COMMENT ON TABLE notifications IS 'Stores user notifications for various system events'
    `);

    console.log("✅ Migration completed: notifications table created successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
} 