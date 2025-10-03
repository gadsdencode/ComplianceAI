import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth, requireRole } from "./auth.js";
import { db } from "./db.js";
import { sql } from "drizzle-orm";
import { 
  insertDocumentSchema, insertSignatureSchema, 
  insertComplianceDeadlineSchema, insertTemplateSchema 
} from "../shared/schema.js";
import { aiService } from "./ai-service.js";
import OpenAI from "openai";
import { Client } from "@replit/object-storage";
import dotenv from "dotenv";
// @ts-ignore: multer has no types in tsconfig
import multer from 'multer';
// @ts-ignore: mime-types has no types in tsconfig
import mime from 'mime-types';
import fs from 'fs';
import path from 'path';

// Initialize environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Replit Object Storage configuration
const REPLIT_OBJECT_STORAGE_BUCKET_ID = process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID || 'replit-objstore-98b6b970-0937-4dd6-9dc9-d33d8ec62826';

const upload = multer();

// Environment detection for Replit Object Storage
// Check multiple possible indicators for Replit environment
const isReplitEnvironment = !!(
  process.env.REPL_ID || 
  process.env.REPLIT_DB_URL || 
  process.env.REPLIT_DEPLOYMENT || 
  process.env.REPLIT_DOMAINS ||
  process.env.FORCE_REPLIT_STORAGE === 'true'
);

console.log('🔍 Environment Detection:');
console.log('  REPL_ID:', !!process.env.REPL_ID);
console.log('  REPLIT_DB_URL:', !!process.env.REPLIT_DB_URL);
console.log('  REPLIT_DEPLOYMENT:', !!process.env.REPLIT_DEPLOYMENT);
console.log('  REPLIT_DOMAINS:', !!process.env.REPLIT_DOMAINS);
console.log('  FORCE_REPLIT_STORAGE:', process.env.FORCE_REPLIT_STORAGE);
console.log('  isReplitEnvironment:', isReplitEnvironment);

// Create a single Replit Object Storage client instance
let objectClient: Client | null = null;

if (isReplitEnvironment) {
  // Use real Replit Object Storage in Replit environment
  console.log(`🚀 Using real Replit Object Storage with bucket: ${REPLIT_OBJECT_STORAGE_BUCKET_ID}`);
  objectClient = new Client({
    bucketId: REPLIT_OBJECT_STORAGE_BUCKET_ID
  });
} else {
  // Create a development-compatible mock for local development
  console.log("⚠️  Running in development mode - using mock object storage");
  console.log("   Note: File uploads will work but won't persist between restarts");
  
  class DevelopmentObjectClient {
    private storage: Map<string, Buffer> = new Map();
    
    async uploadFromBytes(objectName: string, data: Buffer): Promise<{ ok: boolean; error?: any }> {
      this.storage.set(objectName, data);
      console.log(`📁 Mock upload: ${objectName} (${data.length} bytes)`);
      console.log(`📁 Total files in storage: ${this.storage.size}`);
      console.log(`📁 Storage keys:`, Array.from(this.storage.keys()));
      return { ok: true };
    }
    
    async exists(objectName: string): Promise<{ ok: boolean; value: boolean; error?: any }> {
      const exists = this.storage.has(objectName);
      console.log(`🔍 Mock exists check: ${objectName} = ${exists}`);
      return { ok: true, value: exists };
    }
    
    async delete(objectName: string): Promise<{ ok: boolean; error?: any }> {
      const existed = this.storage.delete(objectName);
      console.log(`🗑️ Mock delete: ${objectName} (existed: ${existed})`);
      return { ok: true };
    }
    
    async list(options: { prefix: string }): Promise<{ ok: boolean; value: any[]; error?: any }> {
      const results = Array.from(this.storage.keys())
        .filter(key => key.startsWith(options.prefix))
        .map(name => ({ name }));
      console.log(`📋 Mock list: ${options.prefix}* = ${results.length} files`);
      return { ok: true, value: results };
    }
    
    downloadAsStream(objectName: string): any {
      const data = this.storage.get(objectName) || Buffer.from('');
      console.log(`⬇️ Mock download stream: ${objectName} (${data.length} bytes)`);
      console.log(`⬇️ Storage has file: ${this.storage.has(objectName)}`);
      console.log(`⬇️ Available files:`, Array.from(this.storage.keys()));
      
      const { Readable } = require('stream');
      const stream = new Readable({
        read() {
          // Stream implementation that actually works
        }
      });
      
      // Push data in chunks for better streaming behavior
      if (data.length > 0) {
        const chunkSize = 64 * 1024; // 64KB chunks
        let offset = 0;
        while (offset < data.length) {
          const chunk = data.slice(offset, offset + chunkSize);
          stream.push(chunk);
          offset += chunkSize;
        }
      }
      stream.push(null); // End the stream
      return stream;
    }
    
    async downloadAsBytes(objectName: string): Promise<{ ok: boolean; value: Uint8Array; error?: any }> {
      const data = this.storage.get(objectName);
      console.log(`⬇️ Mock download bytes: ${objectName} (${data?.length || 0} bytes)`);
      console.log(`⬇️ Storage has file: ${this.storage.has(objectName)}`);
      
      if (!data) {
        return { ok: false, value: new Uint8Array(0), error: 'File not found' };
      }
      
      return { ok: true, value: new Uint8Array(data) };
    }
  }
  
  objectClient = new DevelopmentObjectClient() as any;
}

// --- Manual import search configuration and helpers ---
const MANUAL_IMPORT_PREFIXES: string[] = (process.env.MANUAL_IMPORT_PREFIXES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('📁 Manual import prefixes (env):', MANUAL_IMPORT_PREFIXES.length > 0 ? MANUAL_IMPORT_PREFIXES : '[using defaults]');

function normalizeNamePart(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\.[^.]+$/,'') // drop extension
    .replace(/[^a-z0-9]+/g, '');
}

function getExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

async function listAllObjectNames(storage: any, prefix: string): Promise<{ name: string; size?: number }[]> {
  const out: { name: string; size?: number }[] = [];
  let cursor: string | undefined = undefined;
  let guard = 0;
  while (guard++ < 200) {
    const opts: any = { prefix };
    if (cursor) opts.cursor = cursor;
    const res = await storage.list(opts);
    if (!res || res.ok === false) break;
    const value = res.value;
    const items: any[] = Array.isArray(value) ? value : (value?.objects ?? value?.items ?? []);
    for (const item of items) {
      const name: string = item?.name ?? item?.key ?? '';
      if (!name) continue;
      const size: number | undefined = item?.size ?? item?.contentLength ?? item?.bytes;
      out.push({ name, size });
    }
    cursor = value?.cursor || value?.next || value?.nextToken || undefined;
    if (!cursor) break;
  }
  return out;
}

function chooseBestMatch(
  targetFileName: string,
  targetSize: number | undefined,
  candidates: { name: string; size?: number }[]
): string | null {
  const wantedExt = getExt(targetFileName);
  const wantedBase = normalizeNamePart(targetFileName);
  let best: { name: string; score: number } | null = null;
  for (const c of candidates) {
    const fileOnly = c.name.split('/').pop() || c.name;
    const extOk = getExt(fileOnly) === wantedExt || wantedExt === '';
    if (!extOk) continue;
    const baseNorm = normalizeNamePart(fileOnly);
    let score = 0;
    if (baseNorm === wantedBase) score += 5;
    // variant: collapse separators only
    const collaps = (s: string) => s.toLowerCase().replace(/[_\s-]+/g, '');
    if (collaps(fileOnly).endsWith(collaps(targetFileName))) score += 3;
    if (typeof targetSize === 'number' && typeof c.size === 'number' && c.size > 0) {
      const diff = Math.abs(c.size - targetSize) / c.size;
      if (diff <= 0.02) score += 4; else if (diff <= 0.1) score += 1;
    }
    if (!best || score > best.score) best = { name: c.name, score };
  }
  return best ? best.name : null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Health check endpoint for deployment
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "ComplianceAI API"
    });
  });

  // Environment info endpoint for debugging
  app.get("/api/environment", (req: Request, res: Response) => {
    const envInfo = {
      isReplitEnvironment,
      nodeEnv: process.env.NODE_ENV,
      bucketId: REPLIT_OBJECT_STORAGE_BUCKET_ID,
      detectedVariables: {
        REPL_ID: !!process.env.REPL_ID,
        REPLIT_DB_URL: !!process.env.REPLIT_DB_URL,
        REPLIT_DEPLOYMENT: !!process.env.REPLIT_DEPLOYMENT,
        REPLIT_DOMAINS: !!process.env.REPLIT_DOMAINS,
        FORCE_REPLIT_STORAGE: process.env.FORCE_REPLIT_STORAGE,
        REPLIT_OBJECT_STORAGE_BUCKET_ID: !!process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID
      },
      storageMode: isReplitEnvironment ? 'real-object-storage' : 'mock-development-storage'
    };
    res.json(envInfo);
  });
  
  // Documents API
  app.get("/api/documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const options: any = {};
      
      // Filter by user if not admin or compliance officer
      if (req.user.role === "employee") {
        options.createdById = req.user.id;
      }
      
      if (req.query.status) {
        options.status = req.query.status as string;
      }
      
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit as string);
      }
      
      if (req.query.offset) {
        options.offset = parseInt(req.query.offset as string);
      }
      
      const documents = await storage.listDocuments(options);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving documents", error: error.message });
    }
  });

  // Recent documents endpoint
  app.get("/api/documents/recent", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const options: any = {
        limit: 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };
      
      // Filter by user if not admin or compliance officer
      if (req.user.role === "employee") {
        options.createdById = req.user.id;
      }
      
      const documents = await storage.listDocuments(options);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving recent documents", error: error.message });
    }
  });

  // Starred documents endpoint (placeholder - would need starred field in database)
  app.get("/api/documents/starred", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // For now, return empty array since we don't have starred functionality
      // In a real implementation, you'd filter by starred field
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving starred documents", error: error.message });
    }
  });
  
  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has access to the document
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving document", error: error.message });
    }
  });
  
  app.post("/api/documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized - You must be logged in to create documents" });
    }
    
    try {
      console.log("Document creation request body:", JSON.stringify(req.body));
      console.log("Current user:", req.user ? JSON.stringify({ id: req.user.id, role: req.user.role }) : "No user in session");
      
      // Explicitly set the createdById before validation, so it will be included in the validation
      const documentWithUser = {
        ...req.body,
        createdById: req.user.id
      };
      
      const validation = insertDocumentSchema.safeParse(documentWithUser);
      if (!validation.success) {
        console.error("Document validation failed:", validation.error.format());
        return res.status(400).json({ 
          message: "Invalid document data", 
          errors: validation.error.format(), 
          details: "The document schema validation failed. Make sure all required fields are provided."
        });
      }
      
      // The validation succeeded, we can proceed with the validated data
      const documentData = validation.data;
      
      console.log("Processed document data:", JSON.stringify(documentData));
      
      const document = await storage.createDocument(documentData);
      
      // Create audit trail record
      await storage.createAuditRecord({
        documentId: document.id,
        userId: req.user.id,
        action: "DOCUMENT_CREATED",
        details: `Document "${document.title}" created`,
        ipAddress: req.ip
      });
      
      // Create notification for admins and compliance officers about new document
      if (req.user.role === "employee") {
        const users = await storage.listUsers();
        const adminUsers = users.filter(user => 
          user.role === "admin" || user.role === "compliance_officer"
        );
        
        for (const adminUser of adminUsers) {
          await storage.createNotification({
            userId: adminUser.id,
            title: "New Document Created",
            message: `Document "${document.title}" has been created by ${req.user.name}`,
            type: "document_update",
            priority: "medium",
            relatedId: document.id,
            relatedType: "document"
          });
        }
      }
      
      res.status(201).json(document);
    } catch (error: any) {
      console.error("Error creating document:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: "Error creating document", 
        error: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      });
    }
  });
  
  app.put("/api/documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check permissions
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Include current user as updater
      const updateData = { ...req.body, createdById: req.user.id };
      
      const updatedDocument = await storage.updateDocument(parseInt(req.params.id), updateData);
      
      // Create audit trail record
      await storage.createAuditRecord({
        documentId: document.id,
        userId: req.user.id,
        action: "DOCUMENT_UPDATED",
        details: `Document "${document.title}" updated`,
        ipAddress: req.ip
      });
      
      res.json(updatedDocument);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating document", error: error.message });
    }
  });

  // PATCH endpoint for updating specific fields (like category) of compliance documents
  app.patch("/api/documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      
      // Validate document ID
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      // Check if document exists
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check permissions
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Perform the update using transaction
      const updatedDocument = await storage.updateDocument(documentId, req.body);
      
      if (!updatedDocument) {
        return res.status(500).json({ message: "Failed to update document" });
      }
      
      // Create audit trail record
      await storage.createAuditRecord({
        documentId: document.id,
        userId: req.user.id,
        action: "DOCUMENT_UPDATED",
        details: `Document "${document.title}" updated`,
        ipAddress: req.ip
      });
      
      res.status(200).json(updatedDocument);
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error updating document", 
        error: error.message 
      });
    }
  });

  // Update document status only
  app.patch("/api/documents/:id/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check permissions
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedDocument = await storage.updateDocument(parseInt(req.params.id), { status });
      
      // Create audit trail record
      await storage.createAuditRecord({
        documentId: document.id,
        userId: req.user.id,
        action: "STATUS_CHANGED",
        details: `Document "${document.title}" status changed to ${status}`,
        ipAddress: req.ip
      });
      
      res.json(updatedDocument);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating document status", error: error.message });
    }
  });

  // Duplicate document
  app.post("/api/documents/:id/duplicate", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const originalDocument = await storage.getDocument(parseInt(req.params.id));
      
      if (!originalDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check permissions
      if (req.user.role === "employee" && originalDocument.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Create duplicate with new title and reset version
      const duplicateData = {
        title: `${originalDocument.title} (Copy)`,
        content: originalDocument.content,
        status: "draft" as const,
        templateId: originalDocument.templateId,
        version: 1,
        createdById: req.user.id
      };
      
      const duplicateDocument = await storage.createDocument(duplicateData);
      
      // Create audit trail record for original document
      await storage.createAuditRecord({
        documentId: originalDocument.id,
        userId: req.user.id,
        action: "DOCUMENT_DUPLICATED",
        details: `Document "${originalDocument.title}" duplicated as "${duplicateDocument.title}"`,
        ipAddress: req.ip
      });
      
      // Create audit trail record for new document
      await storage.createAuditRecord({
        documentId: duplicateDocument.id,
        userId: req.user.id,
        action: "DOCUMENT_CREATED",
        details: `Document "${duplicateDocument.title}" created as duplicate`,
        ipAddress: req.ip
      });
      
      res.json(duplicateDocument);
    } catch (error: any) {
      res.status(500).json({ message: "Error duplicating document", error: error.message });
    }
  });
  
  // Document versions API
  app.get("/api/documents/:id/versions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has access to the document
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const versions = await storage.getDocumentVersions(parseInt(req.params.id));
      res.json(versions);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving document versions", error: error.message });
    }
  });
  
  // Signatures API
  app.post("/api/documents/:id/signatures", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      const validation = insertSignatureSchema.safeParse({
        ...req.body,
        documentId: parseInt(req.params.id),
      });
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid signature data", errors: validation.error.format() });
      }
      const signature = await storage.createSignature(validation.data);
      await storage.createAuditRecord({
        documentId: signature.documentId,
        userId: signature.userId,
        action: "SIGNATURE_CREATED",
        details: `Signature by user ${signature.userId}`,
        ipAddress: req.ip
      });
      res.status(201).json(signature);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating signature", error: error.message });
    }
  });
  
  app.get("/api/documents/:id/signatures", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has access to the document
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const signatures = await storage.getDocumentSignatures(parseInt(req.params.id));
      res.json(signatures);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving signatures", error: error.message });
    }
  });
  
  // Audit trail API
  app.get("/api/documents/:id/audit", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has access to the document
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const auditTrail = await storage.getDocumentAuditTrail(parseInt(req.params.id));
      res.json(auditTrail);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving audit trail", error: error.message });
    }
  });

  // Compliance document download API
  app.get("/api/documents/:id/download", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has access to the document
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Create audit trail record
      await storage.createAuditRecord({
        documentId: document.id,
        userId: req.user.id,
        action: "DOCUMENT_DOWNLOADED",
        details: `Document "${document.title}" downloaded`,
        ipAddress: req.ip
      });
      
      // For compliance documents, we'll export the content as a downloadable text file
      const content = `${document.title}\n\n${document.content}`;
      const fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${document.version}.txt`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(content);
    } catch (error: any) {
      res.status(500).json({ message: "Error downloading document", error: error.message });
    }
  });
  
  // Compliance deadlines API
  app.get("/api/compliance-deadlines", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const options: any = {};
      
      // Filter by assignee if employee
      if (req.user.role === "employee") {
        options.assigneeId = req.user.id;
      } else if (req.query.assigneeId) {
        const parsedId = parseInt(String(req.query.assigneeId).replace(/[^0-9]/g, ''), 10);
        options.assigneeId = isNaN(parsedId) ? null : parsedId;
      }
      
      if (req.query.status) {
        options.status = req.query.status as string;
      }
      
      if (req.query.upcoming === "true") {
        options.upcoming = true;
      }
      
      if (req.query.limit) {
        const limit = parseInt(String(req.query.limit), 10);
        options.limit = isNaN(limit) ? 10 : limit; // Default to 10 if invalid
      }
      
      if (req.query.offset) {
        const offset = parseInt(String(req.query.offset), 10);
        options.offset = isNaN(offset) ? 0 : offset; // Default to 0 if invalid
      }
      
      console.log("Sanitized compliance deadlines query options:", options);
      
      const deadlines = await storage.listComplianceDeadlines(options);
      res.json(deadlines);
    } catch (error: any) {
      console.error("Error retrieving compliance deadlines:", error);
      res.status(500).json({ message: "Error retrieving compliance deadlines", error: error.message });
    }
  });
  
  app.post("/api/compliance-deadlines", requireRole(["admin", "compliance_officer"]), async (req: Request, res: Response) => {
    try {
      console.log("Original request body:", JSON.stringify(req.body));
      
      // First completely sanitize the entire request to prevent any NaN values
      let safeData = deepSanitizeObject(req.body);
      console.log("After deep sanitization:", JSON.stringify(safeData));
      
      // Process and sanitize the request data - now with safer data
      let requestData: Record<string, any> = {...safeData};
      
      // Handle date conversion
      if (requestData.deadline) {
        requestData.deadline = new Date(requestData.deadline);
      }
      
      // Handle assigneeId with proper type handling - additional safety
      if ('assigneeId' in requestData) {
        // If null, empty string or "none", set to null
        if (requestData.assigneeId === null || 
            requestData.assigneeId === "" || 
            requestData.assigneeId === "none" || 
            requestData.assigneeId === "null") {
          requestData.assigneeId = null;
        } 
        // If it's already a number, verify it's not NaN
        else if (typeof requestData.assigneeId === 'number') {
          requestData.assigneeId = isNaN(requestData.assigneeId) ? null : requestData.assigneeId;
        } 
        // If it's a string that can be parsed as a number
        else if (typeof requestData.assigneeId === 'string') {
          // Remove any non-numeric characters first
          const cleanedValue = requestData.assigneeId.replace(/[^0-9]/g, '');
          if (cleanedValue === '') {
            requestData.assigneeId = null;
          } else {
            const parsedId = parseInt(cleanedValue, 10);
            requestData.assigneeId = isNaN(parsedId) ? null : parsedId;
          }
        } 
        // Anything else becomes null
        else {
          requestData.assigneeId = null;
        }
      }
      
      console.log("Sanitized request data for create:", JSON.stringify(requestData));
      
      // Convert to a clean object to avoid any potential prototype issues
      const cleanedData: Record<string, any> = {};
      
      // Only add properties that exist and have valid values
      for (const [key, value] of Object.entries(requestData)) {
        // Special handling for ID fields to ensure they are valid integers or null
        if (key.toLowerCase().includes('id') && key !== 'documentId') {
          if (value === null) {
            cleanedData[key] = null;
          } else if (typeof value === 'number') {
            cleanedData[key] = isNaN(value) ? null : value;
          } else if (typeof value === 'string') {
            const parsedId = parseInt(value.replace(/[^0-9]/g, ''), 10);
            cleanedData[key] = isNaN(parsedId) ? null : parsedId;
          }
        } 
        // For non-ID fields, just check if defined
        else if (value !== undefined) {
          cleanedData[key] = value;
        }
      }
      
      console.log("Final cleaned data:", JSON.stringify(cleanedData));
      
      try {
        // Validate the data - full validation for creation
        const validation = insertComplianceDeadlineSchema.safeParse(cleanedData);
        if (!validation.success) {
          return res.status(400).json({ message: "Invalid deadline data", errors: validation.error.format() });
        }
        
        // Use the validated data
        const validatedData = validation.data;
        
        const deadline = await storage.createComplianceDeadline(validatedData);
        
        if (deadline.documentId) {
          await storage.createAuditRecord({
            documentId: deadline.documentId,
            userId: req.user!.id,
            action: "COMPLIANCE_DEADLINE_CREATED",
            details: `Compliance deadline "${deadline.title}" created`,
            ipAddress: req.ip
          });
        }
        
        res.status(201).json(deadline);
      } catch (dbError: any) {
        console.error("Database error:", dbError);
        console.error("Error details:", dbError.detail || "No additional details");
        console.error("Error query:", dbError.query || "No query available");
        return res.status(500).json({ 
          message: "Database error while creating compliance deadline", 
          error: dbError.message,
          detail: dbError.detail || null
        });
      }
    } catch (error: any) {
      console.error("Error creating compliance deadline:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Error creating compliance deadline", error: error.message });
    }
  });
  
  /**
   * Sanitizes an object recursively to ensure all number fields are valid integers
   * or nulls, preventing any NaN values from reaching the database
   */
  function deepSanitizeObject(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Handle different data types appropriately
      if (value === null || value === undefined) {
        // Allow nulls/undefined to pass through
        result[key] = value;
      } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively sanitize nested objects
        result[key] = deepSanitizeObject(value);
      } else if (typeof value === 'string' && key.toLowerCase().includes('id') && key !== 'documentId') {
        // If field name contains 'id' and is a string, try to parse as integer
        if (value === '' || value === 'none' || value === 'null') {
          result[key] = null;
        } else {
          const parsed = parseInt(value.replace(/[^0-9-]/g, ''), 10);
          result[key] = isNaN(parsed) ? null : parsed;
        }
      } else if (typeof value === 'number' && isNaN(value) && key.toLowerCase().includes('id')) {
        // If it's NaN but in an ID field, convert to null
        result[key] = null;
      } else {
        // Pass all other values through unchanged
        result[key] = value;
      }
    }
    
    return result;
  }

  app.put("/api/compliance-deadlines/:id", requireRole(["admin", "compliance_officer"]), async (req: Request, res: Response) => {
    try {
      console.log("Original request body:", JSON.stringify(req.body));
      
      // First completely sanitize the entire request to prevent any NaN values
      let safeData = deepSanitizeObject(req.body);
      console.log("After deep sanitization:", JSON.stringify(safeData));
      
      // Process and sanitize the request data - now with safer data
      let requestData: Record<string, any> = {...safeData};
      
      // Handle date conversion
      if (requestData.deadline) {
        requestData.deadline = new Date(requestData.deadline);
      }
      
      // Handle assigneeId with proper type handling - additional safety
      if ('assigneeId' in requestData) {
        // If null, empty string or "none", set to null
        if (requestData.assigneeId === null || 
            requestData.assigneeId === "" || 
            requestData.assigneeId === "none" || 
            requestData.assigneeId === "null") {
          requestData.assigneeId = null;
        } 
        // If it's already a number, verify it's not NaN
        else if (typeof requestData.assigneeId === 'number') {
          requestData.assigneeId = isNaN(requestData.assigneeId) ? null : requestData.assigneeId;
        } 
        // If it's a string that can be parsed as a number
        else if (typeof requestData.assigneeId === 'string') {
          // Remove any non-numeric characters first
          const cleanedValue = requestData.assigneeId.replace(/[^0-9]/g, '');
          if (cleanedValue === '') {
            requestData.assigneeId = null;
          } else {
            const parsedId = parseInt(cleanedValue, 10);
            requestData.assigneeId = isNaN(parsedId) ? null : parsedId;
          }
        } 
        // Anything else becomes null
        else {
          requestData.assigneeId = null;
        }
      }
      
      console.log("Sanitized request data for update:", JSON.stringify(requestData));
      
      // Convert to a clean object to avoid any potential prototype issues
      const cleanedData: Record<string, any> = {};
      
      // Only add properties that exist and have valid values
      for (const [key, value] of Object.entries(requestData)) {
        // Special handling for ID fields to ensure they are valid integers or null
        if (key.toLowerCase().includes('id') && key !== 'documentId') {
          if (value === null) {
            cleanedData[key] = null;
          } else if (typeof value === 'number') {
            cleanedData[key] = isNaN(value) ? null : value;
          } else if (typeof value === 'string') {
            const parsedId = parseInt(value.replace(/[^0-9]/g, ''), 10);
            cleanedData[key] = isNaN(parsedId) ? null : parsedId;
          }
        } 
        // For non-ID fields, just check if defined
        else if (value !== undefined) {
          cleanedData[key] = value;
        }
      }
      
      console.log("Final cleaned data:", JSON.stringify(cleanedData));
      
      try {
        // Parse ID correctly and with a fallback
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid ID format" });
        }
        
        const deadline = await storage.updateComplianceDeadline(id, cleanedData);
        
        if (!deadline) {
          return res.status(404).json({ message: "Compliance deadline not found" });
        }
        
        // Create audit trail record if related to a document
        if (deadline.documentId) {
          await storage.createAuditRecord({
            documentId: deadline.documentId,
            userId: req.user!.id,
            action: "COMPLIANCE_DEADLINE_UPDATED",
            details: `Compliance deadline "${deadline.title}" updated`,
            ipAddress: req.ip
          });
        }
        
        res.json(deadline);
      } catch (dbError: any) {
        console.error("Database error:", dbError);
        console.error("Error details:", dbError.detail || "No additional details");
        console.error("Error query:", dbError.query || "No query available");
        return res.status(500).json({ 
          message: "Database error while updating compliance deadline", 
          error: dbError.message,
          detail: dbError.detail || null
        });
      }
    } catch (error: any) {
      console.error("Error updating compliance deadline:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Error updating compliance deadline", error: error.message });
    }
  });
  
  // Add this new route after the existing compliance deadlines API routes
  app.get("/api/compliance-deadlines/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Parse and validate the ID
      const rawId = req.params.id;
      const id = parseInt(String(rawId).replace(/[^0-9]/g, ''), 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deadline ID format" });
      }
      
      const deadline = await storage.getComplianceDeadline(id);
      
      if (!deadline) {
        return res.status(404).json({ message: "Compliance deadline not found" });
      }
      
      // Check if employee has access to this deadline
      if (req.user.role === "employee" && deadline.assigneeId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(deadline);
    } catch (error: any) {
      console.error("Error retrieving compliance deadline:", error);
      res.status(500).json({ message: "Error retrieving compliance deadline", error: error.message });
    }
  });
  
  // Templates API
  app.get("/api/templates", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const templates = await storage.listTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving templates", error: error.message });
    }
  });
  
  app.get("/api/templates/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const template = await storage.getTemplate(parseInt(req.params.id));
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving template", error: error.message });
    }
  });
  
  app.post("/api/templates", requireRole(["admin", "compliance_officer"]), async (req: Request, res: Response) => {
    try {
      const validation = insertTemplateSchema.safeParse({
        ...req.body,
        createdById: req.user?.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid template data", errors: validation.error.format() });
      }
      
      const template = await storage.createTemplate({
        ...req.body,
        createdById: req.user?.id
      });
      
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating template", error: error.message });
    }
  });

  app.put("/api/templates/:id", requireRole(["admin", "compliance_officer"]), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const templateId = parseInt(req.params.id);
      
      // Validate template ID
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Check if template exists
      const existingTemplate = await storage.getTemplate(templateId);
      
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check permissions - only allow editing if user is admin or created the template
      if (req.user.role !== "admin" && existingTemplate.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Don't allow editing default templates
      if (existingTemplate.isDefault) {
        return res.status(403).json({ message: "Cannot edit default templates" });
      }
      
      const validation = insertTemplateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid template data", errors: validation.error.format() });
      }
      
      const updatedTemplate = await storage.updateTemplate(templateId, req.body);
      
      if (!updatedTemplate) {
        return res.status(500).json({ message: "Failed to update template" });
      }
      
      res.json(updatedTemplate);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating template", error: error.message });
    }
  });

  app.delete("/api/templates/:id", requireRole(["admin", "compliance_officer"]), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const templateId = parseInt(req.params.id);
      
      // Validate template ID
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Check if template exists
      const existingTemplate = await storage.getTemplate(templateId);
      
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check permissions - only allow deleting if user is admin or created the template
      if (req.user.role !== "admin" && existingTemplate.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Don't allow deleting default templates
      if (existingTemplate.isDefault) {
        return res.status(403).json({ message: "Cannot delete default templates" });
      }
      
      await storage.deleteTemplate(templateId);
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting template", error: error.message });
    }
  });
  
  // AI service endpoints
  app.post("/api/ai/generate-from-template", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { templateId, companyInfo } = req.body;
      
      if (!templateId || !companyInfo) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const generatedContent = await aiService.generateDocumentFromTemplate(
        template.content,
        companyInfo
      );
      
      res.json({ content: generatedContent });
    } catch (error: any) {
      res.status(500).json({ message: "Error generating document", error: error.message });
    }
  });
  
  app.post("/api/ai/improve-document", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Missing document content" });
      }
      
      const improvedContent = await aiService.improveDocumentContent(content);
      res.json({ content: improvedContent });
    } catch (error: any) {
      res.status(500).json({ message: "Error improving document", error: error.message });
    }
  });
  
  app.post("/api/ai/check-compliance", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Missing document content" });
      }
      
      const complianceCheck = await aiService.checkComplianceIssues(content);
      res.json(complianceCheck);
    } catch (error: any) {
      res.status(500).json({ message: "Error checking compliance", error: error.message });
    }
  });
  
  app.post("/api/ai/suggest-actions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { currentCompliance } = req.body;
      
      if (!currentCompliance) {
        return res.status(400).json({ message: "Missing compliance data" });
      }
      
      const suggestions = await aiService.suggestComplianceActions(currentCompliance);
      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ message: "Error generating suggestions", error: error.message });
    }
  });
  
  // Users API (admin only)
  app.get("/api/users", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const users = await storage.listUsers();
      
      // Remove passwords from response
      const usersResponse = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersResponse);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving users", error: error.message });
    }
  });
  
  // Dashboard stats API
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Get compliance documents
      const allComplianceDocuments = await storage.listDocuments();
      
      // Filter compliance documents for user if they're an employee
      const userComplianceDocuments = req.user.role === "employee" 
        ? allComplianceDocuments.filter(doc => doc.createdById === req.user.id)
        : allComplianceDocuments;
      
      // Get user-uploaded documents
      const userUploadedDocuments = await storage.getUserDocuments(req.user.id);
      
      // Combine both types of documents for total count
      const totalDocuments = userComplianceDocuments.length + userUploadedDocuments.length;
      
      // Get pending compliance documents
      const pendingComplianceDocuments = userComplianceDocuments.filter(doc => 
        doc.status === "pending_approval" || doc.status === "draft"
      );
      
      // For user documents, consider "draft" status as pending
      const pendingUserDocuments = userUploadedDocuments.filter(doc => 
        doc.status === "draft"
      );
      
      const totalPendingDocuments = pendingComplianceDocuments.length + pendingUserDocuments.length;
      
      // Get upcoming compliance deadlines
      const deadlineOptions: any = { upcoming: true };
      if (req.user.role === "employee") {
        deadlineOptions.assigneeId = req.user.id;
      }
      
      const upcomingDeadlines = await storage.listComplianceDeadlines(deadlineOptions);
      
      // Calculate compliance rate - based on active compliance documents and approved user documents
      const activeComplianceDocuments = userComplianceDocuments.filter(doc => doc.status === "active");
      const activeUserDocuments = userUploadedDocuments.filter(doc => doc.status === "approved");
      const totalActiveDocuments = activeComplianceDocuments.length + activeUserDocuments.length;
      
      const expiringDocuments = activeComplianceDocuments.filter(doc => {
        if (!doc.expiresAt) return false;
        
        const now = new Date();
        const expiresDate = new Date(doc.expiresAt);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);
        
        return expiresDate <= sevenDaysFromNow && expiresDate > now;
      });
      
      // Calculate compliance rate based on document statuses
      const totalRelevantDocs = totalDocuments > 0 ? totalDocuments : 1; // Avoid div by zero
      const complianceRate = Math.round((totalActiveDocuments / totalRelevantDocs) * 100);
      
      // Get stats from last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const complianceDocsCreatedLastMonth = userComplianceDocuments.filter(doc => {
        const createdAt = new Date(doc.createdAt);
        return createdAt >= lastMonth;
      }).length;
      
      const userDocsCreatedLastMonth = userUploadedDocuments.filter(doc => {
        const createdAt = new Date(doc.createdAt);
        return createdAt >= lastMonth;
      }).length;
      
      const totalDocsCreatedLastMonth = complianceDocsCreatedLastMonth + userDocsCreatedLastMonth;
      
      // Calculate urgent documents
      const urgentComplianceDocuments = pendingComplianceDocuments.filter(doc => {
        if (!doc.expiresAt) return false;
        
        const now = new Date();
        const expiresDate = new Date(doc.expiresAt);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);
        
        return expiresDate <= threeDaysFromNow;
      }).length;
      
      // For user documents, consider recently uploaded drafts as potentially urgent
      const urgentUserDocuments = pendingUserDocuments.filter(doc => {
        const createdAt = new Date(doc.createdAt);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        return createdAt <= threeDaysAgo; // Draft for more than 3 days
      }).length;
      
      const totalUrgentDocuments = urgentComplianceDocuments + urgentUserDocuments;
      
      // Create stats object
      const stats = {
        documents: totalDocuments,
        pending: totalPendingDocuments,
        complianceRate: complianceRate,
        expiringCount: expiringDocuments.length,
        docsCreatedLastMonth: totalDocsCreatedLastMonth,
        urgentCount: totalUrgentDocuments,
        lastMonthComplianceChange: "+2%", // In a real app, this would be calculated
        // Additional breakdown for debugging/transparency
        breakdown: {
          complianceDocuments: userComplianceDocuments.length,
          userDocuments: userUploadedDocuments.length,
          pendingCompliance: pendingComplianceDocuments.length,
          pendingUser: pendingUserDocuments.length,
          activeCompliance: activeComplianceDocuments.length,
          activeUser: activeUserDocuments.length
        }
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving dashboard stats", error: error.message });
    }
  });

  // AI Chat API
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { messages, model = "gpt-4o-mini", temperature = 0.7, max_tokens = 500, context } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid request. Messages array is required." });
      }
      
      // Format messages for OpenAI
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add system message with context if provided
      if (context) {
        formattedMessages.unshift({
          role: "system",
          content: context
        });
      }
      
      const response = await openai.chat.completions.create({
        model,
        messages: formattedMessages,
        temperature,
        max_tokens,
      });
      
      // Create an audit record for the AI interaction
      await storage.createAuditRecord({
        userId: req.user!.id,
        action: "AI_CHAT_INTERACTION",
        details: `User interaction with AI assistant`,
        ipAddress: req.ip
      });
      
      res.json({
        choices: [
          {
            message: {
              content: response.choices[0]?.message?.content || "I'm sorry, I couldn't process that request."
            }
          }
        ]
      });
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ 
        message: "Error processing AI request", 
        error: error.message 
      });
    }
  });
  // User Document Folders API
  app.get("/api/user-documents/folders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Ensure "General" folder exists for this user
      const generalFolderCheck = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM user_documents 
        WHERE user_id = ${req.user.id} AND category = 'General'
      `);
      
      if ((generalFolderCheck.rows[0] as any).count === 0) {
        // Create General folder placeholder
        await db.execute(sql`
          INSERT INTO user_documents (
            user_id, 
            title, 
            description, 
            file_name,
            file_type,
            file_size,
            file_url,
            category, 
            status,
            is_folder_placeholder
          ) VALUES (
            ${req.user.id},
            '__FOLDER_PLACEHOLDER__',
            'Folder placeholder - do not display',
            '__folder_placeholder__',
            'application/folder',
            0,
            '',
            'General',
            'draft',
            true
          )
        `);
      }
      
      // Get all unique categories for the user and count real documents (exclude placeholders)
      const result = await db.execute(sql`
        SELECT 
          COALESCE(category, 'General') as name,
          COUNT(CASE WHEN COALESCE(is_folder_placeholder, false) = false THEN 1 END) as document_count,
          MIN(created_at) as created_at
        FROM user_documents 
        WHERE user_id = ${req.user.id}
        GROUP BY COALESCE(category, 'General')
        ORDER BY name
      `);
      
      const folders = result.rows.map((row: any, index: number) => ({
        id: `folder-${req.user.id}-${row.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
        name: row.name,
        documentCount: parseInt(row.document_count),
        createdAt: row.created_at,
        isDefault: row.name === 'General'
      }));
      
      res.json(folders);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving folders", error: error.message });
    }
  });

  app.post("/api/user-documents/folders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Folder name is required" });
      }
      
      const folderName = name.trim();
      
      // Validate folder name
      if (folderName.length < 2) {
        return res.status(400).json({ message: "Folder name must be at least 2 characters" });
      }
      
      if (folderName.length > 50) {
        return res.status(400).json({ message: "Folder name must be less than 50 characters" });
      }
      
      // Check for invalid characters
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(folderName)) {
        return res.status(400).json({ message: "Folder name contains invalid characters" });
      }
      
      // Check for reserved names
      const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
      if (reservedNames.includes(folderName.toUpperCase())) {
        return res.status(400).json({ message: "Folder name is reserved and cannot be used" });
      }
      
      // Check if folder already exists for this user
      const existingFolder = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM user_documents 
        WHERE user_id = ${req.user.id} AND category = ${folderName}
      `);
      
      if ((existingFolder.rows[0] as any).count > 0) {
        return res.status(409).json({ message: "A folder with this name already exists" });
      }
      
      // Create a placeholder document to establish the folder in the database
      // This ensures the folder appears in the folder list even when empty
      const insertResult = await db.execute(sql`
        INSERT INTO user_documents (
          user_id, 
          title, 
          description, 
          file_name,
          file_type,
          file_size,
          file_url,
          category, 
          status,
          is_folder_placeholder
        ) VALUES (
          ${req.user.id},
          '__FOLDER_PLACEHOLDER__',
          'Folder placeholder - do not display',
          '__folder_placeholder__',
          'application/folder',
          0,
          '',
          ${folderName},
          'draft',
          true
        )
      `);
      
      const folderId = `folder-${req.user.id}-${folderName.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      res.status(201).json({
        id: folderId,
        name: folderName,
        documentCount: 0,
        createdAt: new Date().toISOString(),
        isDefault: false
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating folder", error: error.message });
    }
  });

  // Rename folder endpoint
  app.put("/api/user-documents/folders/:folderId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { folderId } = req.params;
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "New folder name is required" });
      }
      
      const newFolderName = name.trim();
      
      // Validate folder name
      if (newFolderName.length < 2) {
        return res.status(400).json({ message: "Folder name must be at least 2 characters" });
      }
      
      if (newFolderName.length > 50) {
        return res.status(400).json({ message: "Folder name must be less than 50 characters" });
      }
      
      // Check for invalid characters
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(newFolderName)) {
        return res.status(400).json({ message: "Folder name contains invalid characters" });
      }
      
      // Extract current folder name from ID
      const currentFolderName = folderId.replace(`folder-${req.user.id}-`, '').replace(/-/g, ' ');
      
      // Check if new name is the same as current name
      if (currentFolderName === newFolderName) {
        return res.status(400).json({ message: "New folder name is the same as current name" });
      }
      
      // Check if a folder with the new name already exists
      const existingFolder = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM user_documents 
        WHERE user_id = ${req.user.id} AND category = ${newFolderName}
      `);
      
      if ((existingFolder.rows[0] as any).count > 0) {
        return res.status(409).json({ message: "A folder with this name already exists" });
      }
      
      // Prevent renaming the default "General" folder
      if (currentFolderName === 'General') {
        return res.status(400).json({ message: "Cannot rename the default General folder" });
      }
      
      // Update all documents in the folder to use the new category name
      const updateResult = await db.execute(sql`
        UPDATE user_documents 
        SET category = ${newFolderName}, updated_at = NOW()
        WHERE user_id = ${req.user.id} AND category = ${currentFolderName}
      `);
      
      // Generate new folder ID
      const newFolderId = `folder-${req.user.id}-${newFolderName.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      // Get document count for response
      const documentCount = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM user_documents 
        WHERE user_id = ${req.user.id} 
          AND category = ${newFolderName} 
          AND COALESCE(is_folder_placeholder, false) = false
      `);
      
      res.json({
        id: newFolderId,
        name: newFolderName,
        documentCount: parseInt((documentCount.rows[0] as any).count),
        createdAt: new Date().toISOString(),
        isDefault: false,
        message: "Folder renamed successfully"
      });
      
    } catch (error: any) {
      console.error("Error renaming folder:", error);
      res.status(500).json({ message: "Error renaming folder", error: error.message });
    }
  });

  // Cleanup duplicate folders (remove unmanaged category folders)
  app.post("/api/user-documents/folders/cleanup", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // This endpoint helps clean up any duplicate folders that may exist
      // It doesn't delete any real documents, just ensures folder structure is clean
      
      // Get all categories that have placeholder folders (managed folders)
      const managedCategories = await db.execute(sql`
        SELECT DISTINCT category 
        FROM user_documents 
        WHERE user_id = ${req.user.id} AND is_folder_placeholder = true
      `);
      
      const managedCategoryNames = managedCategories.rows.map((row: any) => row.category);
      
      // For any documents that don't have a matching managed folder, move them to General
      if (managedCategoryNames.length > 0) {
        // Use Drizzle's proper parameter binding with inArray
        await db.execute(sql`
          UPDATE user_documents 
          SET category = 'General'
          WHERE user_id = ${req.user.id} 
            AND category NOT IN (${sql.join(managedCategoryNames.map(name => sql`${name}`), sql`, `)})
            AND is_folder_placeholder = false
        `);
      }
      
      res.json({ 
        message: "Folder cleanup completed",
        managedFolders: managedCategoryNames.length
      });
      
    } catch (error: any) {
      res.status(500).json({ message: "Error during folder cleanup", error: error.message });
    }
  });

  // Get folder statistics
  app.get("/api/user-documents/folders/:folderId/stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { folderId } = req.params;
      
      // Extract folder name from ID
      const folderName = folderId.replace(`folder-${req.user.id}-`, '').replace(/-/g, ' ');
      
      // Get detailed statistics
      const stats = await db.execute(sql`
        SELECT 
          COUNT(CASE WHEN COALESCE(is_folder_placeholder, false) = false THEN 1 END) as document_count,
          SUM(CASE WHEN COALESCE(is_folder_placeholder, false) = false THEN file_size ELSE 0 END) as total_size,
          COUNT(CASE WHEN COALESCE(is_folder_placeholder, false) = false AND starred = true THEN 1 END) as starred_count,
          MAX(CASE WHEN COALESCE(is_folder_placeholder, false) = false THEN updated_at END) as last_modified
        FROM user_documents 
        WHERE user_id = ${req.user.id} AND category = ${folderName}
      `);
      
      const result = stats.rows[0] as any;
      
      res.json({
        folderName,
        documentCount: parseInt(result.document_count) || 0,
        totalSize: parseInt(result.total_size) || 0,
        starredCount: parseInt(result.starred_count) || 0,
        lastModified: result.last_modified,
        isEmpty: parseInt(result.document_count) === 0
      });
      
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving folder statistics", error: error.message });
    }
  });

  app.delete("/api/user-documents/folders/:folderId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { folderId } = req.params;
      const { force } = req.query; // Optional force parameter for confirmed deletions
      
      // Extract folder name from ID
      const folderName = folderId.replace(`folder-${req.user.id}-`, '').replace(/-/g, ' ');
      
      // Prevent deleting the default "General" folder
      if (folderName === 'General') {
        return res.status(400).json({ message: "Cannot delete the default General folder" });
      }
      
      // Get document count and details
      const documentsResult = await db.execute(sql`
        SELECT 
          id,
          file_url,
          file_name,
          COALESCE(is_folder_placeholder, false) as is_placeholder
        FROM user_documents 
        WHERE user_id = ${req.user.id} AND category = ${folderName}
      `);
      
      const documents = documentsResult.rows as any[];
      const realDocuments = documents.filter(doc => !doc.is_placeholder);
      
      // If folder has documents and force=true is not specified, return confirmation requirement
      if (realDocuments.length > 0 && force !== 'true') {
        return res.status(409).json({ 
          message: "Folder contains documents",
          requiresConfirmation: true,
          documentCount: realDocuments.length,
          folderName: folderName
        });
      }
      
      // Delete files from object storage for real documents
      if (realDocuments.length > 0) {
        let objectStorage: any;
        
        if (isReplitEnvironment) {
          objectStorage = new Client({
            bucketId: REPLIT_OBJECT_STORAGE_BUCKET_ID
          });
        } else {
          objectStorage = objectClient;
        }
        
        // Delete files from object storage (best effort)
        for (const doc of realDocuments) {
          if (doc.file_url) {
            try {
              await objectStorage.delete(doc.file_url);
              console.log(`🗑️ Deleted file from storage: ${doc.file_url}`);
            } catch (storageError) {
              console.error(`⚠️ Failed to delete file from storage: ${doc.file_url}`, storageError);
              // Continue with database deletion even if storage deletion fails
            }
          }
        }
      }
      
      // Delete all documents in this category (including placeholders)
      await db.execute(sql`
        DELETE FROM user_documents 
        WHERE user_id = ${req.user.id} AND category = ${folderName}
      `);
      
      const deletedCount = realDocuments.length;
      res.status(200).json({ 
        message: "Folder deleted successfully",
        deletedDocuments: deletedCount,
        folderName: folderName
      });
      
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Error deleting folder", error: error.message });
    }
  });

  // User Document Repository API
  app.get("/api/user-documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userDocuments = await storage.getUserDocuments(req.user.id);
      
      // Return documents with their original object storage paths preserved
      // Frontend will construct API URLs as needed: /api/user-documents/${doc.id}/download
      const documentsWithUrls = userDocuments;
      
      res.json(documentsWithUrls);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving user documents", error: error.message });
    }
  });
  
  // Get single user document by ID
  app.get("/api/user-documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await storage.getUserDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "User document not found" });
      }
      
      // Check if user has access to this document
      if (document.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'compliance_officer') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving user document", error: error.message });
    }
  });

  // Add document download endpoint
  app.get("/api/user-documents/:id/download", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      
      // Get document metadata
      const document = await storage.getUserDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      console.log(`📥 Download request for document:`, {
        documentId: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        userId: document.userId,
        createdAt: document.createdAt,
        category: document.category
      });
      
      // Ensure user can only access their own files
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Use the global object storage client
      if (!objectClient) {
        console.error("❌ Object storage client not initialized");
        return res.status(500).json({ message: "Storage service not available" });
      }
      
      const storageClient = objectClient;
      
      // Determine the object key to stream, with a resilient fallback if the recorded key is wrong
      let streamKey = document.fileUrl;
      console.log(`🔍 Checking if file exists in object storage: ${streamKey}`);
      const existsResult = await storageClient.exists(streamKey);
      console.log(`🔍 Object storage exists check result:`, existsResult);
      
      if (!existsResult.ok) {
        console.error(`❌ Error checking file existence: ${existsResult.error}`);
        return res.status(500).json({ message: "Error checking file", error: existsResult.error });
      }
      if (!existsResult.value) {
        console.warn(`⚠️ File not found at recorded key: ${streamKey}. Attempting fallback search by filename...`);
        try {
          const category = document.category || 'General';
          const categorySlug = category.replace(/\s+/g, '-').toLowerCase();
          const userPrefix = `user-documents/${document.userId}/`;

          // Build prefix list: env-driven first, then sensible defaults
          const dynamicPrefixes: string[] = [];
          for (const p of MANUAL_IMPORT_PREFIXES) {
            if (p.includes('{userId}') || p.includes('{category}') || p.includes('{categorySlug}')) {
              dynamicPrefixes.push(
                p
                  .replaceAll('{userId}', String(document.userId))
                  .replaceAll('{category}', category)
                  .replaceAll('{categorySlug}', categorySlug)
              );
            } else {
              dynamicPrefixes.push(p.endsWith('/') ? p : `${p}`);
            }
          }

          const knownPrefixes = [
            ...dynamicPrefixes,
            `user-documents/${document.userId}/${categorySlug}/`,
            userPrefix,
            `docfiles/${category}/`,
            'docfiles/',
          ];
          if (process.env.ALLOW_BUCKET_WIDE_SCAN === 'true') knownPrefixes.push('');

          // Gather candidates across prefixes (with pagination)
          const candidates: { name: string; size?: number }[] = [];
          for (const prefix of knownPrefixes) {
            try {
              const items = await listAllObjectNames(storageClient, prefix);
              candidates.push(...items);
            } catch (e) {
              console.warn(`Prefix scan failed for '${prefix}':`, (e as any)?.message || e);
            }
          }

          const best = chooseBestMatch(document.fileName, document.fileSize, candidates);
          if (!best) {
            console.error(`❌ No matching object found for filename: ${document.fileName}`);
            return res.status(404).json({ message: "File not found" });
          }

          streamKey = best;
          console.log(`🔁 Fallback matched object: ${streamKey} (updating database file_url)`);
          try {
            await storage.updateUserDocument(document.id, { fileUrl: streamKey });
          } catch (updateErr) {
            console.warn(`⚠️ Failed to update fileUrl for document ${document.id}`, updateErr);
          }
        } catch (fallbackErr) {
          console.error(`❌ Fallback search failed:`, fallbackErr);
          return res.status(404).json({ message: "File not found" });
        }
      }
      
      console.log(`✅ Using object storage key: ${streamKey}`);
      
      try {
        // Get the content type
        const contentType = mime.lookup(document.fileName) as string || document.fileType || 'application/octet-stream';
        console.log(`📄 Content type detected: ${contentType} for file: ${document.fileName}`);
        
        // Set headers BEFORE starting the body
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Try streaming first, with proper error handling
        let streamed = false;
        try {
          if (typeof (storageClient as any).downloadAsStream === 'function') {
            const maybeStream: any = await (storageClient as any).downloadAsStream(streamKey);
            if (maybeStream && typeof maybeStream.pipe === 'function') {
              console.log(`📡 Starting Node stream for: ${streamKey}`);
              streamed = true;
              
              // Set up proper error handling
              maybeStream.on('error', (err: any) => {
                console.error(`❌ Node stream error for ${document.fileName}:`, err);
                if (!res.headersSent) {
                  res.status(500).json({ message: "Stream error", error: err.message });
                }
              });
              
              // Handle stream end
              maybeStream.on('end', () => {
                console.log(`✅ Stream completed for: ${document.fileName}`);
              });
              
              // Pipe the stream to response
              maybeStream.pipe(res);
            } else if (maybeStream && typeof maybeStream.getReader === 'function') {
              console.log(`📡 Starting Web stream for: ${streamKey}`);
              const { Readable } = await import('stream');
              const nodeStream = (Readable as any).fromWeb ? (Readable as any).fromWeb(maybeStream) : null;
              if (nodeStream) {
                streamed = true;
                nodeStream.on('error', (err: any) => {
                  console.error(`❌ Web->Node stream error for ${document.fileName}:`, err);
                  if (!res.headersSent) {
                    res.status(500).json({ message: "Stream conversion error", error: err.message });
                  }
                });
                nodeStream.pipe(res);
              }
            }
          }
        } catch (streamErr) {
          console.warn(`⚠️ Streaming attempt failed, will try bytes fallback:`, (streamErr as any)?.message || streamErr);
        }

        // Fallback to bytes download if streaming failed
        if (!streamed) {
          if (typeof (storageClient as any).downloadAsBytes === 'function') {
            console.log(`⬇️ Falling back to bytes download for: ${streamKey}`);
            try {
              const bytesRes: any = await (storageClient as any).downloadAsBytes(streamKey);
              
              if (!bytesRes.ok) {
                console.error(`❌ Bytes download failed: ${bytesRes.error}`);
                return res.status(500).json({ message: "Download failed", error: bytesRes.error });
              }
              
              const bytes: Uint8Array = bytesRes.value;
              const buf = Buffer.from(bytes);
              
              // Set content length for proper download
              res.setHeader('Content-Length', String(buf.length));
              console.log(`✅ Sending ${buf.length} bytes for: ${document.fileName}`);
              
              return res.end(buf);
            } catch (bytesErr) {
              console.error(`❌ Bytes download error:`, bytesErr);
              return res.status(500).json({ message: "Download error", error: bytesErr instanceof Error ? bytesErr.message : String(bytesErr) });
            }
          } else {
            console.error(`❌ Storage client does not support downloadAsBytes and streaming was unavailable.`);
            return res.status(500).json({ message: "Storage client cannot download file" });
          }
        }
        
      } catch (setupError) {
        console.error(`❌ Error setting up download for ${document.fileName}:`, setupError);
        if (!res.headersSent) {
          res.status(500).json({ 
            message: "Error setting up file download", 
            error: setupError instanceof Error ? setupError.message : String(setupError)
          });
        }
      }
      
    } catch (error) {
      console.error("Error processing download request:", error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Error processing request", 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  
  app.post("/api/user-documents/upload", async (req: Request & { files?: any, user?: any }, res: Response) => {
    try {
      // Debug logging
      console.log("Upload request received");
      console.log("Request body:", req.body);
      console.log("Files:", req.files);
      console.log("User:", req.user);

      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // More detailed file validation
      if (!req.files) {
        console.error("No files object in request");
        return res.status(400).json({ message: "No files were uploaded" });
      }
      
      if (!req.files.file) {
        console.error("No file with key 'file' in request.files");
        return res.status(400).json({ message: "No file found with key 'file'" });
      }
      
      const file = req.files.file;
      
      // Handle both array and single file
      const uploadedFile = Array.isArray(file) ? file[0] : file;
      
      // More validation
      if (!uploadedFile.name || !uploadedFile.mimetype || !uploadedFile.size) {
        console.error("Invalid file object:", uploadedFile);
        return res.status(400).json({ message: "Invalid file object" });
      }
      
      // Parse metadata with better error handling
      let metadata: {
        title?: string;
        description?: string | null;
        tags?: string[];
        folderId?: string;
      } = {};
      
      if (req.body.metadata) {
        try {
          metadata = JSON.parse(req.body.metadata);
        } catch (error) {
          console.error("Error parsing metadata:", error);
          console.log("Raw metadata received:", req.body.metadata);
          // Continue with empty metadata instead of failing
        }
      }
      
      console.log("Processing file:", uploadedFile.name);
      console.log("File type:", uploadedFile.mimetype);
      console.log("File size:", uploadedFile.size);
      
      // Extract category from folder ID if provided (do this early to use in object path)
      let category = 'General'; // Default category
      if (metadata.folderId) {
        // Extract folder name from ID format: folder-{userId}-{folderName}
        const folderNamePart = metadata.folderId.replace(/^folder-\d+-/, '');
        category = folderNamePart.replace(/-/g, ' ');
      }
      
      // For storage in Replit Object Storage - include category/folder structure
      const timestamp = Date.now();
      const sanitizedFileName = uploadedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const sanitizedCategory = category.replace(/\s+/g, '-').toLowerCase();
      const objectName = `user-documents/${req.user.id}/${sanitizedCategory}/${timestamp}-${sanitizedFileName}`;
      
      try {
        // Use the same global storage client for consistency with download
        const objectStorage = objectClient;
        
        if (!objectStorage) {
          throw new Error('Object storage client not initialized');
        }
        
        console.log("Attempting to upload file to object storage path:", objectName);
        
        // Read file content from temp file path (express-fileupload with useTempFiles: true)
        let fileData: Buffer;
        if (uploadedFile.tempFilePath) {
          // File is stored in temp location, read it
          fileData = fs.readFileSync(uploadedFile.tempFilePath);
          console.log(`📁 Read file from temp path: ${uploadedFile.tempFilePath} (${fileData.length} bytes)`);
        } else if (uploadedFile.data) {
          // File is in memory
          fileData = uploadedFile.data;
          console.log(`📁 Using file data from memory (${fileData.length} bytes)`);
        } else {
          throw new Error('No file data available - neither tempFilePath nor data property found');
        }

        // Upload file to Object Storage
        console.log(`🚀 Uploading to object storage:`, {
          objectName,
          fileSize: fileData.length,
          bucketId: REPLIT_OBJECT_STORAGE_BUCKET_ID,
          isReplitEnv: isReplitEnvironment
        });
        
        const uploadResult = await objectStorage.uploadFromBytes(
          objectName, 
          fileData
        );
        
        console.log(`📤 Upload result:`, uploadResult);
        
        if (!uploadResult.ok) {
          console.error("❌ Error uploading to storage:", uploadResult.error);
          console.error("❌ Error details:", JSON.stringify(uploadResult, null, 2));
          return res.status(500).json({ 
            message: "Error uploading file to storage", 
            error: uploadResult.error,
            details: uploadResult
          });
        }
        
        console.log(`✅ Successfully uploaded to object storage: ${objectName}`);
        
        // Verify the file was uploaded by checking if it exists
        try {
          const verifyResult = await objectStorage.exists(objectName);
          console.log(`🔍 Upload verification:`, verifyResult);
          if (!verifyResult.ok || !verifyResult.value) {
            console.error(`❌ File verification failed: ${objectName}`);
            return res.status(500).json({ 
              message: "File upload verification failed" 
            });
          }
        } catch (verifyError) {
          console.error(`❌ Could not verify upload:`, verifyError);
          // Don't fail the request, just log the warning
        }
        
        // Clean up temporary file if it exists
        if (uploadedFile.tempFilePath) {
          try {
            fs.unlinkSync(uploadedFile.tempFilePath);
            console.log(`🗑️ Cleaned up temp file: ${uploadedFile.tempFilePath}`);
          } catch (cleanupError) {
            console.warn(`⚠️ Failed to cleanup temp file: ${uploadedFile.tempFilePath}`, cleanupError);
            // Don't fail the upload for cleanup errors
          }
        }

        // Create a new document record
        const newDocument = await storage.createUserDocument({
          userId: req.user.id,
          title: metadata.title || uploadedFile.name,
          description: metadata.description || null,
          fileName: uploadedFile.name,
          fileType: uploadedFile.mimetype,
          fileSize: uploadedFile.size,
          fileUrl: objectName, // Store the object path in storage bucket
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          category: category,
        });

        // Create notification for admins and compliance officers about new user document
        const users = await storage.listUsers();
        const adminUsers = users.filter(user => 
          user.role === "admin" || user.role === "compliance_officer"
        );
        
        for (const adminUser of adminUsers) {
          await storage.createNotification({
            userId: adminUser.id,
            title: "New User Document Uploaded",
            message: `Document "${newDocument.title}" has been uploaded by ${req.user.name}`,
            type: "user_document_upload",
            priority: "low",
            relatedId: newDocument.id,
            relatedType: "user_document"
          });
        }
        
        console.log("Document created successfully:", newDocument);
        res.status(201).json(newDocument);
      } catch (error: any) {
        console.error("Object storage error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        res.status(500).json({ 
          message: "Error uploading document", 
          error: error.message,
          details: error.code || error.name || "unknown_error",
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        message: "Error uploading document", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Bulk upload endpoint for multiple files
  app.post("/api/user-documents/bulk-upload", async (req: Request & { files?: any, user?: any }, res: Response) => {
    try {
      console.log("Bulk upload request received");
      console.log("Request body:", req.body);
      console.log("Files object:", req.files ? Object.keys(req.files) : "No files");

      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate files exist
      if (!req.files) {
        console.error("No files object in bulk upload request");
        return res.status(400).json({ message: "No files were uploaded" });
      }
      
      if (!req.files.files) {
        console.error("No files with key 'files' in request.files");
        return res.status(400).json({ message: "No files found with key 'files'" });
      }
      
      // Get files array - express-fileupload provides array for multiple files
      const filesData = req.files.files;
      const files = Array.isArray(filesData) ? filesData : [filesData];
      
      console.log(`Processing ${files.length} files for bulk upload`);
      
      // Parse shared metadata with error handling
      let sharedMetadata: {
        description?: string | null;
        tags?: string[];
        folderId?: string;
        category?: string;
      } = {};
      
      if (req.body.metadata) {
        try {
          sharedMetadata = JSON.parse(req.body.metadata);
        } catch (error) {
          console.error("Error parsing shared metadata:", error);
          console.log("Raw shared metadata received:", req.body.metadata);
          // Continue with empty metadata instead of failing
        }
      }
      
      // Extract category from folder ID if provided
      let category = 'General'; // Default category
      if (sharedMetadata.folderId) {
        const folderNamePart = sharedMetadata.folderId.replace(/^folder-\d+-/, '');
        category = folderNamePart.replace(/-/g, ' ');
      } else if (sharedMetadata.category) {
        category = sharedMetadata.category;
      }
      
      // Function to process a single file
      const processSingleFile = async (file: any, index: number) => {
        const fileResult = {
          fileName: file.name || `file_${index}`,
          originalIndex: index,
          status: 'pending' as 'success' | 'error' | 'pending',
          document: null as any,
          error: null as string | null
        };
        
        try {
          // Validate file object
          if (!file.name || !file.mimetype || !file.size) {
            throw new Error(`Invalid file object at index ${index}`);
          }
          
          // Validate file size (50MB limit from express-fileupload config)
          if (file.size > 50 * 1024 * 1024) {
            throw new Error(`File "${file.name}" exceeds 50MB limit`);
          }
          
          console.log(`Processing file ${index + 1}/${files.length}: ${file.name} (${file.size} bytes)`);
          
          // Generate unique object name for storage with proper folder structure
          const timestamp = Date.now();
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const sanitizedCategory = category.replace(/\s+/g, '-').toLowerCase();
          const objectName = `user-documents/${req.user.id}/${sanitizedCategory}/${timestamp}-${index}-${sanitizedFileName}`;
          
          // Use the same global storage client for consistency with download
          const objectStorage = objectClient;
          
          if (!objectStorage) {
            throw new Error('Object storage client not initialized');
          }
          
          // Read file content from temp file path (express-fileupload with useTempFiles: true)
          let fileData: Buffer;
          if (file.tempFilePath) {
            // File is stored in temp location, read it
            fileData = fs.readFileSync(file.tempFilePath);
            console.log(`📁 Read file from temp path: ${file.tempFilePath} (${fileData.length} bytes)`);
          } else if (file.data) {
            // File is in memory
            fileData = file.data;
            console.log(`📁 Using file data from memory (${fileData.length} bytes)`);
          } else {
            throw new Error('No file data available - neither tempFilePath nor data property found');
          }

          // Upload file to Object Storage
          const uploadResult = await objectStorage.uploadFromBytes(
            objectName, 
            fileData
          );
          
          if (!uploadResult.ok) {
            throw new Error(`Storage upload failed: ${uploadResult.error}`);
          }
          
          console.log(`✅ File uploaded to object storage: ${objectName}`);
          
          // Clean up temporary file if it exists
          if (file.tempFilePath) {
            try {
              fs.unlinkSync(file.tempFilePath);
              console.log(`🗑️ Cleaned up temp file: ${file.tempFilePath}`);
            } catch (cleanupError) {
              console.warn(`⚠️ Failed to cleanup temp file: ${file.tempFilePath}`, cleanupError);
              // Don't fail the upload for cleanup errors
            }
          }
          
          // Verify the file was uploaded by checking if it exists
          const existsCheck = await objectStorage.exists(objectName);
          if (!existsCheck.ok || !existsCheck.value) {
            console.error(`❌ File verification failed for: ${objectName}`);
            throw new Error(`File upload verification failed: ${objectName}`);
          }
          
          console.log(`✅ File existence verified in object storage: ${objectName}`);
          
          // Create database record
          const newDocument = await storage.createUserDocument({
            userId: req.user.id,
            title: file.name, // Use original filename as title for bulk uploads
            description: sharedMetadata.description || null,
            fileName: file.name,
            fileType: file.mimetype,
            fileSize: file.size,
            fileUrl: objectName, // This is the key field - storing the object storage path
            tags: Array.isArray(sharedMetadata.tags) ? sharedMetadata.tags : [],
            category: category,
          });
          
          console.log(`✅ Database record created for file ${index + 1}: ${file.name}`, {
            documentId: newDocument.id,
            fileUrl: newDocument.fileUrl,
            fileName: newDocument.fileName
          });
          
          fileResult.status = 'success';
          fileResult.document = newDocument;
          
        } catch (error: any) {
          console.error(`Error processing file ${index + 1} (${file.name}):`, error);
          fileResult.status = 'error';
          fileResult.error = error.message || 'Unknown error occurred';
        }
        
        return fileResult;
      };
      
      // Process files in batches of 5 for optimal performance
      const BATCH_SIZE = 5;
      const results: any[] = [];
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const batchStartIndex = i;
        
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)} (files ${i + 1}-${Math.min(i + BATCH_SIZE, files.length)})`);
        
        // Process batch concurrently using Promise.allSettled to handle individual failures
        const batchPromises = batch.map((file, batchIndex) => 
          processSingleFile(file, batchStartIndex + batchIndex)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Extract results from Promise.allSettled
        const batchProcessedResults = batchResults.map((result, batchIndex) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            // Handle case where processSingleFile itself threw an error
            return {
              fileName: batch[batchIndex]?.name || `file_${batchStartIndex + batchIndex}`,
              originalIndex: batchStartIndex + batchIndex,
              status: 'error' as const,
              document: null,
              error: result.reason?.message || 'Failed to process file'
            };
          }
        });
        
        results.push(...batchProcessedResults);
        
        // Log batch completion
        const batchSuccessful = batchProcessedResults.filter(r => r.status === 'success').length;
        const batchFailed = batchProcessedResults.filter(r => r.status === 'error').length;
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} completed: ${batchSuccessful} successful, ${batchFailed} failed`);
      }
      
      // Calculate summary statistics
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'error').length;
      
      console.log(`Bulk upload completed: ${successful}/${files.length} files successful`);
      
      // Return comprehensive results
      res.status(201).json({
        results: results,
        summary: {
          total: files.length,
          successful: successful,
          failed: failed,
          successRate: files.length > 0 ? Math.round((successful / files.length) * 100) : 0
        }
      });
      
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ 
        message: "Error processing bulk upload", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.patch("/api/user-documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      
      // Validate document ID
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      // Check if document exists and belongs to user
      const document = await storage.getUserDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Perform the update using transaction
      const updatedDocument = await storage.updateUserDocument(documentId, req.body);
      
      if (!updatedDocument) {
        return res.status(500).json({ message: "Failed to update document" });
      }
      
      res.status(200).json(updatedDocument);
    } catch (error: any) {
      console.error(`❌ Error updating user document:`, {
        documentId: req.params.id,
        userId: req.user?.id,
        updateData: req.body,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ 
        message: "Error updating document", 
        error: error.message,
        details: "Check server logs for more information"
      });
    }
  });

  app.delete("/api/user-documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      
      // Check if document exists and belongs to user
      const document = await storage.getUserDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Delete from object storage if it exists
      if (document.fileUrl && objectClient) {
        try {
          // Delete the file from storage
          await objectClient.delete(document.fileUrl);
        } catch (storageError) {
          console.error("Error deleting file from storage:", storageError);
          // Continue with deletion even if storage deletion fails
        }
      }
      
      // Delete the document
      await storage.deleteUserDocument(documentId);
      
      res.status(200).json({ message: "Document deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting document", error: error.message });
    }
  });

  // Notifications API
  app.get("/api/notifications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const options: any = {};
      
      if (req.query.isRead !== undefined) {
        options.isRead = req.query.isRead === 'true';
      }
      
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit as string);
      }
      
      if (req.query.offset) {
        options.offset = parseInt(req.query.offset as string);
      }
      
      const notifications = await storage.getUserNotifications(req.user.id, options);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving notifications", error: error.message });
    }
  });

  app.get("/api/notifications/counts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const counts = await storage.getNotificationCounts(req.user.id);
      res.json(counts);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving notification counts", error: error.message });
    }
  });

  app.put("/api/notifications/:id/read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ message: "Error marking notification as read", error: error.message });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: "Error marking all notifications as read", error: error.message });
    }
  });

  app.delete("/api/notifications/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const notificationId = parseInt(req.params.id);
      await storage.deleteNotification(notificationId);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting notification", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}