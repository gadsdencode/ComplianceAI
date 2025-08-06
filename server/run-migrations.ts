import { runMigration as addUserDocumentsTable } from "./migrations/add-user-documents-table.js";
import { runMigration as addNotificationsTable } from "./migrations/add-notifications-table.js";
import { runMigration as addUserDocumentsFields } from "./migrations/add-user-documents-fields.js";
import { up as addCategoryToDocuments } from "./migrations/add-category-to-documents.js";
import { runMigration as addSessionTable } from "./migrations/add-session-table.js";

async function runAllMigrations() {
  console.log("🚀 Starting database migrations...");
  
  try {
    // Add new migrations here in sequence
    console.log("📋 Running user documents migration...");
    await addUserDocumentsTable();
    
    console.log("🔔 Running notifications migration...");
    await addNotificationsTable();
    
    console.log("📊 Running user documents fields migration...");
    await addUserDocumentsFields();
    
    console.log("📁 Running add category to documents migration...");
    await addCategoryToDocuments();
    
    console.log("🗂️ Running session table migration...");
    await addSessionTable();
    
    console.log("✅ All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Export the function so it can be run manually when needed
export { runAllMigrations };

// Only run migrations if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllMigrations()
    .then(() => {
      console.log("🎉 Migration process finished successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("💥 Error running migrations:", err);
      process.exit(1);
    });
} 