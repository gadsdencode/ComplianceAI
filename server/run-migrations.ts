import { runMigration as addUserDocumentsTable } from "./migrations/add-user-documents-table.js";

async function runAllMigrations() {
  console.log("Starting database migrations...");
  
  try {
    // Add new migrations here in sequence
    await addUserDocumentsTable();
    
    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run all migrations when this script is executed directly
if (require.main === module) {
  runAllMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error running migrations:", err);
      process.exit(1);
    });
} 