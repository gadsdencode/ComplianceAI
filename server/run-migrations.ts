import { runMigration as addUserDocumentsTable } from "./migrations/add-user-documents-table.js";
import { runMigration as addNotificationsTable } from "./migrations/add-notifications-table.js";

async function runAllMigrations() {
  console.log("🚀 Starting database migrations...");
  
  try {
    // Add new migrations here in sequence
    console.log("📋 Running user documents migration...");
    await addUserDocumentsTable();
    
    console.log("🔔 Running notifications migration...");
    await addNotificationsTable();
    
    console.log("✅ All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migrations immediately
runAllMigrations()
  .then(() => {
    console.log("🎉 Migration process finished successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("💥 Error running migrations:", err);
    process.exit(1);
  }); 