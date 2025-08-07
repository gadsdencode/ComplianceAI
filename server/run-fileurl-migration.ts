#!/usr/bin/env node

/**
 * Script to run the fileUrl migration for user documents
 * This will fix existing records that have API endpoints stored instead of object storage paths
 */

import { runMigration } from './migrations/fix-user-documents-fileurl.js';

async function main() {
  console.log("🚀 Starting fileUrl migration for user documents...");
  
  try {
    await runMigration();
    console.log("✅ Migration completed successfully!");
    console.log("");
    console.log("📋 Summary of changes:");
    console.log("  - Fixed fileUrl fields to contain object storage paths only");
    console.log("  - Added constraint to prevent API URLs in fileUrl field");
    console.log("  - Object storage paths now follow pattern: user-documents/{userId}/{category}/{filename}");
    console.log("");
    console.log("🔄 Next steps:");
    console.log("  1. Restart your application to pick up the changes");
    console.log("  2. Test download functionality from the UI");
    console.log("  3. Verify that new uploads use the proper folder structure");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
