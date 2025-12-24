import { users, documents, documentVersions, signatures, auditTrail, complianceDeadlines, templates, userDocuments, notifications } from "../shared/schema.js";
import type { 
  User, InsertUser, Document, InsertDocument, DocumentVersion, InsertDocumentVersion,
  Signature, InsertSignature, AuditTrail, InsertAuditTrail, 
  ComplianceDeadline, InsertComplianceDeadline, Template, InsertTemplate,
  UserDocument, InsertUserDocument, Notification, InsertNotification
} from "../shared/schema.js";
import session from "express-session";
import { eq, gt, desc, asc, and, sql, like, or, ilike } from "drizzle-orm";
import { db } from "./db.js";
import connectPg from "connect-pg-simple";
import { pool } from "./db.js";

const PostgresSessionStore = connectPg(session);

// Detect Replit environment
const isReplitEnvironment = !!(
  process.env.REPL_ID || 
  process.env.REPLIT_DB_URL || 
  process.env.REPLIT_DEPLOYMENT || 
  process.env.REPLIT_DOMAINS
);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  listDocuments(options?: {
    createdById?: number;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Document[]>;
  countDocuments(options?: {
    createdById?: number;
    status?: string;
  }): Promise<number>;
  searchDocuments(options: {
    searchQuery: string;
    createdById?: number;
    limit?: number;
  }): Promise<Document[]>;
  updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | undefined>;
  
  // Document versions
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  getDocumentVersions(documentId: number): Promise<DocumentVersion[]>;
  
  // Signatures
  createSignature(signature: InsertSignature): Promise<Signature>;
  getDocumentSignatures(documentId: number): Promise<Signature[]>;
  
  // Audit trail
  createAuditRecord(record: InsertAuditTrail): Promise<AuditTrail>;
  getDocumentAuditTrail(documentId: number): Promise<AuditTrail[]>;
  
  // Compliance deadlines
  createComplianceDeadline(deadline: InsertComplianceDeadline): Promise<ComplianceDeadline>;
  listComplianceDeadlines(options?: {
    assigneeId?: number;
    status?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ComplianceDeadline[]>;
  updateComplianceDeadline(id: number, data: Partial<InsertComplianceDeadline>): Promise<ComplianceDeadline | undefined>;
  getComplianceDeadline(id: number): Promise<ComplianceDeadline | undefined>;
  
  // Templates
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplate(id: number): Promise<Template | undefined>;
  listTemplates(): Promise<Template[]>;
  updateTemplate(id: number, data: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<void>;
  
  // User Documents Repository
  getUserDocuments(userId: number): Promise<UserDocument[]>;
  getUserDocument(id: number): Promise<UserDocument | undefined>;
  createUserDocument(document: InsertUserDocument): Promise<UserDocument>;
  updateUserDocument(id: number, data: Partial<InsertUserDocument>): Promise<UserDocument | undefined>;
  deleteUserDocument(id: number): Promise<void>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number, options?: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  getNotificationCounts(userId: number): Promise<{ total: number; unread: number }>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Use memory store for Replit environment to avoid PostgreSQL session table issues
    if (isReplitEnvironment) {
      console.log("🔄 Using memory session store for Replit environment");
      this.sessionStore = new session.MemoryStore();
    } else {
      console.log("🔄 Using PostgreSQL session store for local development");
      this.sessionStore = new PostgresSessionStore({ 
        pool, 
        createTableIfMissing: false  // Disable automatic table creation to prevent NeonDB errors
      });
    }
    
    // Initialize default templates asynchronously and don't block startup
    this.initDefaultTemplates().catch(error => {
      console.warn("Failed to initialize default templates:", error);
      // Don't throw error to prevent app startup failure
    });
  }
  
  private async initDefaultTemplates() {
    try {
      // Import and seed professional templates
      const { seedProfessionalTemplates } = await import("./templates/seed-templates.js");
      
      // Check if there are any templates
      const existingTemplates = await db.select({ count: sql`count(*)` }).from(templates);
      const templateCount = parseInt(existingTemplates[0].count as string);
      
      // Create admin user if it doesn't exist
      let adminId = 1;
      const adminUser = await this.getUserByUsername("admin@compliance.ai");
      if (!adminUser) {
        const admin = await this.createUser({
          username: "admin@compliance.ai",
          password: "$2b$10$zreNJHPZ4WEGkSVFX/l98eThME7E6gZl/lQPLiCnQnCY3s.x3EvFi", // hashed "admin123"
          name: "System Admin",
          email: "admin@compliance.ai",
          role: "admin"
        });
        adminId = admin.id;
      }
      
      // Seed comprehensive professional templates if we have less than 5
      if (templateCount < 5) {
        console.log("📚 Initializing comprehensive professional templates...");
        await seedProfessionalTemplates(adminId);
      } else {
        console.log(`✅ Templates already initialized (${templateCount} templates found)`);
      }
    } catch (error) {
      console.error("Error initializing default templates:", error);
      // Don't re-throw to prevent app startup failure
    }
  }
  
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Document management
  async createDocument(document: InsertDocument): Promise<Document> {
    // Insert document
    const [newDocument] = await db
      .insert(documents)
      .values(document as any)
      .returning();
    
    // Create initial version
    await this.createDocumentVersion({
      documentId: newDocument.id,
      version: 1,
      content: document.content,
      createdById: document.createdById || 0
    });
    
    return newDocument;
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }
  
  async listDocuments(options: {
    createdById?: number;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<Document[]> {
    const baseQuery = db.select().from(documents);
    type QueryType = typeof baseQuery;
    
    let query = baseQuery;
    
    // Apply filters
    const filters = [];
    if (options.createdById !== undefined) {
      filters.push(eq(documents.createdById, options.createdById));
    }
    
    if (options.status !== undefined) {
      filters.push(eq(documents.status, options.status as "draft" | "pending_approval" | "active" | "expired" | "archived"));
    }
    
    if (filters.length > 0) {
      query = query.where(and(...filters)) as QueryType;
    }
    
    // Apply sorting
    const sortBy = options.sortBy || 'updatedAt';
    const sortOrder = options.sortOrder || 'desc';
    
    if (sortBy === 'updatedAt') {
      query = query.orderBy(sortOrder === 'desc' ? desc(documents.updatedAt) : asc(documents.updatedAt)) as QueryType;
    } else if (sortBy === 'createdAt') {
      query = query.orderBy(sortOrder === 'desc' ? desc(documents.createdAt) : asc(documents.createdAt)) as QueryType;
    } else if (sortBy === 'title') {
      query = query.orderBy(sortOrder === 'desc' ? desc(documents.title) : asc(documents.title)) as QueryType;
    } else {
      // Default to updatedAt desc
      query = query.orderBy(desc(documents.updatedAt)) as QueryType;
    }
    
    // Apply pagination
    if (options.limit !== undefined) {
      query = query.limit(options.limit) as QueryType;
    }
    
    if (options.offset !== undefined) {
      query = query.offset(options.offset) as QueryType;
    }
    
    return await query;
  }

  async countDocuments(options: {
    createdById?: number;
    status?: string;
  } = {}): Promise<number> {
    const filters = [];
    
    if (options.createdById !== undefined) {
      filters.push(eq(documents.createdById, options.createdById));
    }
    
    if (options.status !== undefined) {
      filters.push(eq(documents.status, options.status as "draft" | "pending_approval" | "active" | "expired" | "archived"));
    }
    
    let query = db.select({ count: sql<number>`count(*)` }).from(documents);
    
    if (filters.length > 0) {
      query = query.where(and(...filters)) as typeof query;
    }
    
    const result = await query;
    return Number(result[0]?.count || 0);
  }
  
  async searchDocuments(options: {
    searchQuery: string;
    createdById?: number;
    limit?: number;
  }): Promise<Document[]> {
    const { searchQuery, createdById, limit = 10 } = options;
    
    const baseQuery = db.select().from(documents);
    type QueryType = typeof baseQuery;
    
    let query = baseQuery;
    
    // Apply filters
    const filters = [];
    
    // User filter
    if (createdById !== undefined) {
      filters.push(eq(documents.createdById, createdById));
    }
    
    // Search filter - search in title and content (case-insensitive)
    const searchPattern = `%${searchQuery}%`;
    
    filters.push(
      or(
        ilike(documents.title, searchPattern),
        ilike(documents.content, searchPattern),
        ilike(documents.category || '', searchPattern)
      )!
    );
    
    if (filters.length > 0) {
      query = query.where(and(...filters)) as QueryType;
    }
    
    // Order by relevance (title matches first, then content matches)
    query = query.orderBy(
      desc(documents.updatedAt) // Most recent first as secondary sort
    ) as QueryType;
    
    // Apply limit
    query = query.limit(limit) as QueryType;
    
    const results = await query;
    
    return results;
  }
  
  async updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | undefined> {
    // Use explicit transaction to ensure the update is properly committed
    return await db.transaction(async (tx) => {
      // Get the current document
      const [document] = await tx
        .select()
        .from(documents)
        .where(eq(documents.id, id));
      
      if (!document) {
        throw new Error(`Document ${id} not found`);
      }
      
      // If content is changing, create a new version
      if (data.content && data.content !== document.content) {
        const newVersion = document.version + 1;
        
        // Create a version record for the new content
        await tx
          .insert(documentVersions)
          .values({
            documentId: id,
            version: newVersion,
            content: data.content,
            createdById: data.createdById || document.createdById
          });
        
        data.version = newVersion;
      }
      
      // Update the document with a new updatedAt timestamp
      const [updatedDocument] = await tx
        .update(documents)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(documents.id, id))
        .returning();
      
      if (!updatedDocument) {
        throw new Error(`Document ${id} update failed`);
      }
      
      // Verify the update was applied correctly
      if (data.category && updatedDocument.category !== data.category) {
        throw new Error(`Category update failed: expected ${data.category}, got ${updatedDocument.category}`);
      }
      
      return updatedDocument;
    });
  }
  
  // Document versions
  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const [newVersion] = await db
      .insert(documentVersions)
      .values(version)
      .returning();
    return newVersion;
  }
  
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.version));
  }
  
  // Signatures
  async createSignature(signature: InsertSignature): Promise<Signature> {
    const [newSignature] = await db
      .insert(signatures)
      .values(signature)
      .returning();
    return newSignature;
  }
  
  async getDocumentSignatures(documentId: number): Promise<Signature[]> {
    return await db
      .select()
      .from(signatures)
      .where(eq(signatures.documentId, documentId));
  }
  
  // Audit trail
  async createAuditRecord(record: InsertAuditTrail): Promise<AuditTrail> {
    const [newRecord] = await db
      .insert(auditTrail)
      .values(record)
      .returning();
    return newRecord;
  }
  
  async getDocumentAuditTrail(documentId: number): Promise<AuditTrail[]> {
    return await db
      .select()
      .from(auditTrail)
      .where(eq(auditTrail.documentId, documentId))
      .orderBy(desc(auditTrail.timestamp));
  }
  
  // Compliance deadlines
  async createComplianceDeadline(deadline: InsertComplianceDeadline): Promise<ComplianceDeadline> {
    // Ensure assigneeId is a valid number or null before sending to DB
    const sanitizedDeadline = { ...deadline };
    
    if ('assigneeId' in sanitizedDeadline) {
      if (sanitizedDeadline.assigneeId === undefined || 
          (typeof sanitizedDeadline.assigneeId === 'number' && isNaN(sanitizedDeadline.assigneeId))) {
        sanitizedDeadline.assigneeId = null;
      }
    }
    
    // Extra safety for any other ID fields
    Object.keys(sanitizedDeadline).forEach(key => {
      if (key.toLowerCase().includes('id') && key !== 'id' && key !== 'documentId') {
        const value = (sanitizedDeadline as any)[key];
        if (value !== null && typeof value === 'number' && isNaN(value)) {
          (sanitizedDeadline as any)[key] = null;
        }
      }
    });
    
    const [newDeadline] = await db
      .insert(complianceDeadlines)
      .values(sanitizedDeadline)
      .returning();
    return newDeadline;
  }
  
  async listComplianceDeadlines(options: {
    assigneeId?: number;
    status?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<ComplianceDeadline[]> {
    const baseQuery = db.select().from(complianceDeadlines);
    type QueryType = typeof baseQuery;
    
    let query = baseQuery;
    
    // Apply filters
    const filters = [];
    if (options.assigneeId !== undefined) {
      filters.push(eq(complianceDeadlines.assigneeId, options.assigneeId));
    }
    
    if (options.status !== undefined) {
      filters.push(eq(complianceDeadlines.status, options.status as "not_started" | "in_progress" | "completed" | "overdue"));
    }
    
    if (options.upcoming === true) {
      filters.push(gt(complianceDeadlines.deadline, new Date()));
    }
    
    if (filters.length > 0) {
      query = query.where(and(...filters)) as QueryType;
    }
    
    // Apply sorting by deadline
    query = query.orderBy(asc(complianceDeadlines.deadline)) as QueryType;
    
    // Apply pagination
    if (options.limit !== undefined) {
      query = query.limit(options.limit) as QueryType;
    }
    
    if (options.offset !== undefined) {
      query = query.offset(options.offset) as QueryType;
    }
    
    return await query;
  }
  
  async updateComplianceDeadline(id: number, data: Partial<InsertComplianceDeadline>): Promise<ComplianceDeadline | undefined> {
    // Extra protection for assigneeId and other ID fields
    const sanitizedData = { ...data };
    
    if ('assigneeId' in sanitizedData) {
      if (sanitizedData.assigneeId === undefined || 
          (typeof sanitizedData.assigneeId === 'number' && isNaN(sanitizedData.assigneeId))) {
        sanitizedData.assigneeId = null;
      }
    }
    
    // Extra safety for any other ID fields
    Object.keys(sanitizedData).forEach(key => {
      if (key.toLowerCase().includes('id') && key !== 'id' && key !== 'documentId') {
        const value = (sanitizedData as any)[key];
        if (value !== null && typeof value === 'number' && isNaN(value)) {
          (sanitizedData as any)[key] = null;
        }
      }
    });
    
    const [updatedDeadline] = await db
      .update(complianceDeadlines)
      .set(sanitizedData)
      .where(eq(complianceDeadlines.id, id))
      .returning();
    return updatedDeadline;
  }
  
  async getComplianceDeadline(id: number): Promise<ComplianceDeadline | undefined> {
    const [deadline] = await db
      .select()
      .from(complianceDeadlines)
      .where(eq(complianceDeadlines.id, id));
    return deadline;
  }
  
  // Templates
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db
      .insert(templates)
      .values({
        ...template,
        updatedAt: new Date()
      })
      .returning();
    return newTemplate;
  }
  
  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id));
    return template;
  }
  
  async listTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async updateTemplate(id: number, data: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [updatedTemplate] = await db
      .update(templates)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(templates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteTemplate(id: number): Promise<void> {
    await db
      .delete(templates)
      .where(eq(templates.id, id));
  }

  // User Documents Repository - using database
  async getUserDocuments(userId: number): Promise<UserDocument[]> {
    return await db
      .select()
      .from(userDocuments)
      .where(
        and(
          eq(userDocuments.userId, userId),
          eq(userDocuments.isFolderPlaceholder, false)
        )
      )
      .orderBy(desc(userDocuments.updatedAt));
  }
  
  async getUserDocument(id: number): Promise<UserDocument | undefined> {
    const [document] = await db
      .select()
      .from(userDocuments)
      .where(eq(userDocuments.id, id));
    return document;
  }
  
  async createUserDocument(document: InsertUserDocument): Promise<UserDocument> {
    const [newDocument] = await db
      .insert(userDocuments)
      .values({
        ...document,
        updatedAt: new Date()
      })
      .returning();
    return newDocument;
  }
  
  async updateUserDocument(id: number, data: Partial<InsertUserDocument>): Promise<UserDocument | undefined> {
    // Use explicit transaction to ensure the update is properly committed
    return await db.transaction(async (tx) => {
      // Get the current document
      const [currentDocument] = await tx
        .select()
        .from(userDocuments)
        .where(eq(userDocuments.id, id));
      
      if (!currentDocument) {
        throw new Error(`Document ${id} not found`);
      }
      
      // Perform the update
      const [updatedDocument] = await tx
        .update(userDocuments)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(userDocuments.id, id))
        .returning();
      
      if (!updatedDocument) {
        throw new Error(`Document ${id} update failed`);
      }
      
      // Verify the update was applied correctly
      if (data.category && updatedDocument.category !== data.category) {
        throw new Error(`Category update failed: expected ${data.category}, got ${updatedDocument.category}`);
      }
      
      return updatedDocument;
    });
  }
  
  async deleteUserDocument(id: number): Promise<void> {
    await db
      .delete(userDocuments)
      .where(eq(userDocuments.id, id));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: number, options: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Notification[]> {
    const baseQuery = db.select().from(notifications);
    type QueryType = typeof baseQuery;

    // Build filters array
    const filters = [eq(notifications.userId, userId)];

    if (options.isRead !== undefined) {
      filters.push(eq(notifications.isRead, options.isRead));
    }

    // Apply all filters with and()
    let query = baseQuery.where(and(...filters)) as QueryType;

    if (options.limit !== undefined) {
      query = query.limit(options.limit) as QueryType;
    }

    if (options.offset !== undefined) {
      query = query.offset(options.offset) as QueryType;
    }

    return await query.orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
  }

  async getNotificationCounts(userId: number): Promise<{ total: number; unread: number }> {
    const [counts] = await db
      .select({
        total: sql`count(*)`,
        unread: sql`count(*) filter (where is_read = false)`
      })
      .from(notifications)
      .where(eq(notifications.userId, userId));
    return {
      total: parseInt(counts.total as string),
      unread: parseInt(counts.unread as string)
    };
  }
}

// Export a singleton instance of the storage class
export const storage = new DatabaseStorage();
