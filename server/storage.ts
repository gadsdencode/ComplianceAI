import { users, documents, documentVersions, signatures, auditTrail, complianceDeadlines, templates, userDocuments } from "@shared/schema";
import type { 
  User, InsertUser, Document, InsertDocument, DocumentVersion, InsertDocumentVersion,
  Signature, InsertSignature, AuditTrail, InsertAuditTrail, 
  ComplianceDeadline, InsertComplianceDeadline, Template, InsertTemplate,
  UserDocument, InsertUserDocument
} from "@shared/schema";
import session from "express-session";
import { eq, gt, desc, asc, and, sql } from "drizzle-orm";
import { db } from "./db";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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
  
  // User Documents Repository
  getUserDocuments(userId: number): Promise<UserDocument[]>;
  getUserDocument(id: number): Promise<UserDocument | undefined>;
  createUserDocument(document: InsertUserDocument): Promise<UserDocument>;
  deleteUserDocument(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Initialize default templates
    this.initDefaultTemplates();
  }
  
  private async initDefaultTemplates() {
    // Check if there are any templates
    const existingTemplates = await db.select({ count: sql`count(*)` }).from(templates);
    if (parseInt(existingTemplates[0].count as string) > 0) {
      return; // Already have templates
    }
    
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
    
    // Add default templates
    await this.createTemplate({
      name: "GDPR Compliance",
      content: "# GDPR Compliance Statement\n\nThis document outlines how [Company Name] complies with GDPR regulations...",
      category: "Privacy",
      createdById: adminId,
      isDefault: true
    });

    await this.createTemplate({
      name: "ISO 27001",
      content: "# ISO 27001 Information Security Policy\n\n[Company Name] is committed to information security...",
      category: "Security",
      createdById: adminId,
      isDefault: true
    });

    await this.createTemplate({
      name: "PCI DSS",
      content: "# PCI DSS Compliance Statement\n\n[Company Name] adheres to the Payment Card Industry Data Security Standard...",
      category: "Financial",
      createdById: adminId,
      isDefault: true
    });

    await this.createTemplate({
      name: "SOC 2",
      content: "# SOC 2 Compliance Statement\n\n[Company Name] follows the Trust Services Criteria...",
      category: "Security",
      createdById: adminId,
      isDefault: true
    });
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
      .values(document)
      .returning();
    
    // Create initial version
    await this.createDocumentVersion({
      documentId: newDocument.id,
      version: 1,
      content: document.content,
      createdById: document.createdById
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
    query = query.orderBy(desc(documents.updatedAt)) as QueryType;
    
    // Apply pagination
    if (options.limit !== undefined) {
      query = query.limit(options.limit) as QueryType;
    }
    
    if (options.offset !== undefined) {
      query = query.offset(options.offset) as QueryType;
    }
    
    return await query;
  }
  
  async updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | undefined> {
    // Get the current document
    const document = await this.getDocument(id);
    if (!document) return undefined;
    
    // If content is changing, create a new version
    if (data.content && data.content !== document.content) {
      const newVersion = document.version + 1;
      
      // Create a version record for the new content
      await this.createDocumentVersion({
        documentId: id,
        version: newVersion,
        content: data.content,
        createdById: data.createdById || document.createdById
      });
      
      data.version = newVersion;
    }
    
    // Update the document with a new updatedAt timestamp
    const [updatedDocument] = await db
      .update(documents)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();
      
    return updatedDocument;
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

  // User Documents Repository - using database
  async getUserDocuments(userId: number): Promise<UserDocument[]> {
    return await db
      .select()
      .from(userDocuments)
      .where(eq(userDocuments.userId, userId))
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
  
  async deleteUserDocument(id: number): Promise<void> {
    await db
      .delete(userDocuments)
      .where(eq(userDocuments.id, id));
  }
}

// Export a singleton instance of the storage class
export const storage = new DatabaseStorage();
