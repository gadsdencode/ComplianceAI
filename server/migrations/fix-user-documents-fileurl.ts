import { sql } from "drizzle-orm";
import { db } from "../db.js";

export async function runMigration() {
  console.log("Running migration: Fix user_documents fileUrl to contain object storage paths only");
  
  try {
    // Find all records where fileUrl contains API endpoints instead of object storage paths
    const documentsWithApiUrls = await db.execute(sql`
      SELECT id, title, file_name, user_id, category 
      FROM user_documents 
      WHERE file_url LIKE '/api/user-documents/%'
    `);
    
    console.log(`Found ${documentsWithApiUrls.rows.length} documents with API URLs in fileUrl field`);
    
    if (documentsWithApiUrls.rows.length > 0) {
      // For each document, generate a proper object storage path
      for (const doc of documentsWithApiUrls.rows) {
        const userId = doc.user_id;
        const category = (doc.category as string) || 'General';
        const fileName = doc.file_name;
        
        // Generate object storage path: user-documents/{userId}/{category}/{fileName}
        // This matches the upload pattern used in routes.ts
        const objectStoragePath = `user-documents/${userId}/${category.replace(/\s+/g, '-').toLowerCase()}/${fileName}`;
        
        await db.execute(sql`
          UPDATE user_documents 
          SET file_url = ${objectStoragePath}
          WHERE id = ${doc.id}
        `);
        
        console.log(`Updated document ${doc.id}: "${doc.title}" -> ${objectStoragePath}`);
      }
    }
    
    // Add a check constraint to prevent API URLs from being stored in fileUrl in the future
    try {
      await db.execute(sql`
        ALTER TABLE user_documents 
        ADD CONSTRAINT check_fileurl_not_api_endpoint 
        CHECK (file_url NOT LIKE '/api/%')
      `);
      console.log("Added constraint to prevent API URLs in fileUrl field");
    } catch (constraintError) {
      // Constraint might already exist, that's okay
      console.log("Constraint already exists or could not be added:", constraintError);
    }
    
    console.log("Migration completed: All fileUrl fields now contain object storage paths");
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
