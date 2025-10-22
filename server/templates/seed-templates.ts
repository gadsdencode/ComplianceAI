// Script to seed comprehensive professional templates into the database
import { db } from "../db.js";
import { templates } from "../../shared/schema.js";
import { documentTemplates } from "./template-library.js";
import { eq, sql } from "drizzle-orm";

export async function seedProfessionalTemplates(createdById: number = 1) {
  try {
    console.log("🌱 Starting to seed professional document templates...");
    
    // Count existing templates
    const existingCount = await db.select({ count: sql`count(*)` }).from(templates);
    const currentCount = parseInt(existingCount[0].count as string);
    console.log(`📊 Current templates in database: ${currentCount}`);
    
    let seededCount = 0;
    let updatedCount = 0;
    
    for (const template of documentTemplates) {
      try {
        // Check if template with this name already exists
        const existing = await db
          .select()
          .from(templates)
          .where(eq(templates.name, template.name));
        
        // Convert simple string variables to structured format
        const structuredVariables = (template.variables || []).map(varName => ({
          name: varName,
          type: 'text',
          required: true,
          description: '',
          placeholder: `Enter ${varName}`
        }));
        
        if (existing.length > 0) {
          // Update existing template with new enhanced content
          await db
            .update(templates)
            .set({
              description: template.description,
              content: template.content,
              category: template.category,
              tags: template.tags || [],
              variables: structuredVariables,
              estimatedTime: template.estimatedTime,
              complianceStandards: template.complianceStandards || [],
              isDefault: template.isDefault || false,
              isActive: true,
              updatedAt: new Date()
            })
            .where(eq(templates.name, template.name));
          
          updatedCount++;
          console.log(`✅ Updated template: ${template.name}`);
        } else {
          // Insert new template
          await db.insert(templates).values({
            name: template.name,
            description: template.description,
            content: template.content,
            category: template.category,
            tags: template.tags || [],
            variables: structuredVariables,
            estimatedTime: template.estimatedTime,
            complianceStandards: template.complianceStandards || [],
            version: 1,
            createdById,
            isDefault: template.isDefault || false,
            isActive: true
          });
          
          seededCount++;
          console.log(`✅ Seeded template: ${template.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing template "${template.name}":`, error);
      }
    }
    
    console.log(`
🎉 Template seeding completed!
   - New templates added: ${seededCount}
   - Existing templates updated: ${updatedCount}
   - Total templates available: ${currentCount + seededCount}
    `);
    
    return { seededCount, updatedCount };
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProfessionalTemplates()
    .then(() => {
      console.log("✅ Template seeding script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Template seeding script failed:", error);
      process.exit(1);
    });
}