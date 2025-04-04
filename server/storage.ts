import { users, documents, documentVersions, signatures, auditTrail, complianceDeadlines, templates } from "@shared/schema";
import type { 
  User, InsertUser, Document, InsertDocument, DocumentVersion, InsertDocumentVersion,
  Signature, InsertSignature, AuditTrail, InsertAuditTrail, 
  ComplianceDeadline, InsertComplianceDeadline, Template, InsertTemplate 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  
  // Templates
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplate(id: number): Promise<Template | undefined>;
  listTemplates(): Promise<Template[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private documentVersions: Map<number, DocumentVersion[]>;
  private signatures: Map<number, Signature>;
  private auditRecords: Map<number, AuditTrail>;
  private complianceDeadlines: Map<number, ComplianceDeadline>;
  private templates: Map<number, Template>;
  
  // Counters for IDs
  private userIdCounter: number;
  private documentIdCounter: number;
  private versionIdCounter: number;
  private signatureIdCounter: number;
  private auditIdCounter: number;
  private deadlineIdCounter: number;
  private templateIdCounter: number;
  
  // Session store
  sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.documentVersions = new Map();
    this.signatures = new Map();
    this.auditRecords = new Map();
    this.complianceDeadlines = new Map();
    this.templates = new Map();
    
    this.userIdCounter = 1;
    this.documentIdCounter = 1;
    this.versionIdCounter = 1;
    this.signatureIdCounter = 1;
    this.auditIdCounter = 1;
    this.deadlineIdCounter = 1;
    this.templateIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });

    // Add default templates
    this.createTemplate({
      name: "GDPR Compliance",
      content: "# GDPR Compliance Statement\n\nThis document outlines how [Company Name] complies with GDPR regulations...",
      category: "Privacy",
      createdById: 1,
      isDefault: true
    });

    this.createTemplate({
      name: "ISO 27001",
      content: "# ISO 27001 Information Security Policy\n\n[Company Name] is committed to information security...",
      category: "Security",
      createdById: 1,
      isDefault: true
    });

    this.createTemplate({
      name: "PCI DSS",
      content: "# PCI DSS Compliance Statement\n\n[Company Name] adheres to the Payment Card Industry Data Security Standard...",
      category: "Financial",
      createdById: 1,
      isDefault: true
    });

    this.createTemplate({
      name: "SOC 2",
      content: "# SOC 2 Compliance Statement\n\n[Company Name] follows the Trust Services Criteria...",
      category: "Security",
      createdById: 1,
      isDefault: true
    });
  }
  
  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const newUser: User = { ...user, id, createdAt };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Document management
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const createdAt = new Date();
    const updatedAt = createdAt;
    const newDocument: Document = { ...document, id, createdAt, updatedAt };
    this.documents.set(id, newDocument);
    
    // Also create initial version
    await this.createDocumentVersion({
      documentId: id,
      version: 1,
      content: document.content,
      createdById: document.createdById
    });
    
    return newDocument;
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async listDocuments(options: {
    createdById?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Document[]> {
    let docs = Array.from(this.documents.values());
    
    if (options.createdById !== undefined) {
      docs = docs.filter(doc => doc.createdById === options.createdById);
    }
    
    if (options.status !== undefined) {
      docs = docs.filter(doc => doc.status === options.status);
    }
    
    // Sort by updated date, newest first
    docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    // Handle pagination
    const offset = options.offset || 0;
    const limit = options.limit || docs.length;
    
    return docs.slice(offset, offset + limit);
  }
  
  async updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    // If content is changing, increment version and store old version
    if (data.content && data.content !== document.content) {
      const newVersion = document.version + 1;
      
      // Create a version record for the current content before updating
      await this.createDocumentVersion({
        documentId: id,
        version: newVersion,
        content: data.content,
        createdById: data.createdById || document.createdById
      });
      
      data.version = newVersion;
    }
    
    const updatedDocument: Document = { 
      ...document, 
      ...data, 
      updatedAt: new Date() 
    };
    
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  // Document versions
  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const id = this.versionIdCounter++;
    const createdAt = new Date();
    const newVersion: DocumentVersion = { ...version, id, createdAt };
    
    // Store in a version map where document ID is the key and value is an array of versions
    if (!this.documentVersions.has(version.documentId)) {
      this.documentVersions.set(version.documentId, []);
    }
    
    const versions = this.documentVersions.get(version.documentId)!;
    versions.push(newVersion);
    
    return newVersion;
  }
  
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return this.documentVersions.get(documentId) || [];
  }
  
  // Signatures
  async createSignature(signature: InsertSignature): Promise<Signature> {
    const id = this.signatureIdCounter++;
    const createdAt = new Date();
    const newSignature: Signature = { ...signature, id, createdAt };
    this.signatures.set(id, newSignature);
    return newSignature;
  }
  
  async getDocumentSignatures(documentId: number): Promise<Signature[]> {
    return Array.from(this.signatures.values())
      .filter(sig => sig.documentId === documentId);
  }
  
  // Audit trail
  async createAuditRecord(record: InsertAuditTrail): Promise<AuditTrail> {
    const id = this.auditIdCounter++;
    const timestamp = new Date();
    const newRecord: AuditTrail = { ...record, id, timestamp };
    this.auditRecords.set(id, newRecord);
    return newRecord;
  }
  
  async getDocumentAuditTrail(documentId: number): Promise<AuditTrail[]> {
    return Array.from(this.auditRecords.values())
      .filter(record => record.documentId === documentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // Compliance deadlines
  async createComplianceDeadline(deadline: InsertComplianceDeadline): Promise<ComplianceDeadline> {
    const id = this.deadlineIdCounter++;
    const createdAt = new Date();
    const newDeadline: ComplianceDeadline = { ...deadline, id, createdAt };
    this.complianceDeadlines.set(id, newDeadline);
    return newDeadline;
  }
  
  async listComplianceDeadlines(options: {
    assigneeId?: number;
    status?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<ComplianceDeadline[]> {
    let deadlines = Array.from(this.complianceDeadlines.values());
    
    if (options.assigneeId !== undefined) {
      deadlines = deadlines.filter(d => d.assigneeId === options.assigneeId);
    }
    
    if (options.status !== undefined) {
      deadlines = deadlines.filter(d => d.status === options.status);
    }
    
    if (options.upcoming === true) {
      const now = new Date();
      deadlines = deadlines.filter(d => d.deadline > now);
    }
    
    // Sort by deadline
    deadlines.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
    
    // Handle pagination
    const offset = options.offset || 0;
    const limit = options.limit || deadlines.length;
    
    return deadlines.slice(offset, offset + limit);
  }
  
  async updateComplianceDeadline(id: number, data: Partial<InsertComplianceDeadline>): Promise<ComplianceDeadline | undefined> {
    const deadline = this.complianceDeadlines.get(id);
    if (!deadline) return undefined;
    
    const updatedDeadline: ComplianceDeadline = { ...deadline, ...data };
    this.complianceDeadlines.set(id, updatedDeadline);
    return updatedDeadline;
  }
  
  // Templates
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const id = this.templateIdCounter++;
    const createdAt = new Date();
    const updatedAt = createdAt;
    const newTemplate: Template = { ...template, id, createdAt, updatedAt };
    this.templates.set(id, newTemplate);
    return newTemplate;
  }
  
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }
  
  async listTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }
}

// Export a singleton instance of the storage class
export const storage = new MemStorage();
