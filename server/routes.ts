import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireRole } from "./auth";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { 
  insertDocumentSchema, insertSignatureSchema, 
  insertComplianceDeadlineSchema, insertTemplateSchema 
} from "@shared/schema";
import { aiService } from "./ai-service";
import OpenAI from "openai";
import { Client as ObjectStorageClient } from "@replit/object-storage";
import dotenv from "dotenv";
// @ts-ignore: multer has no types in tsconfig
import multer from 'multer';
// @ts-ignore: object-storage types are present but skipLibCheck may hide them
import { Client } from '@replit/object-storage';
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

const upload = multer();

// Check if we're running in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Create a mock object client for local development
class MockObjectClient {
  private storage: Map<string, Buffer> = new Map();
  
  async uploadFromBytes(key: string, data: Buffer): Promise<any> {
    this.storage.set(key, data);
    return { ok: true };
  }
  
  async exists(key: string): Promise<any> {
    return { ok: true, value: this.storage.has(key) };
  }
  
  async delete(key: string): Promise<any> {
    this.storage.delete(key);
    return { ok: true };
  }
  
  async list(options: { prefix: string }): Promise<any> {
    const results = Array.from(this.storage.keys())
      .filter(key => key.startsWith(options.prefix))
      .map(name => ({ name }));
    return { ok: true, value: results };
  }
  
  downloadAsStream(key: string): any {
    // This is a simplified mock that returns a readable stream from a buffer
    const Readable = require('stream').Readable;
    const stream = new Readable();
    const data = this.storage.get(key) || Buffer.from('');
    stream.push(data);
    stream.push(null); // Signal the end of the stream
    return stream;
  }
}

// Use a mock client in development to avoid connection issues
const objectClient = isDevelopment ? new MockObjectClient() : new Client();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
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
      // Get documents
      const allDocuments = await storage.listDocuments();
      
      // Filter for user if they're an employee
      const userDocuments = req.user.role === "employee" 
        ? allDocuments.filter(doc => doc.createdById === req.user.id)
        : allDocuments;
      
      // Get pending documents
      const pendingDocuments = userDocuments.filter(doc => 
        doc.status === "pending_approval" || doc.status === "draft"
      );
      
      // Get upcoming compliance deadlines
      const deadlineOptions: any = { upcoming: true };
      if (req.user.role === "employee") {
        deadlineOptions.assigneeId = req.user.id;
      }
      
      const upcomingDeadlines = await storage.listComplianceDeadlines(deadlineOptions);
      
      // Calculate compliance rate - in a real app, this would be more sophisticated
      const activeDocuments = userDocuments.filter(doc => doc.status === "active");
      const expiringDocuments = activeDocuments.filter(doc => {
        if (!doc.expiresAt) return false;
        
        const now = new Date();
        const expiresDate = new Date(doc.expiresAt);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);
        
        return expiresDate <= sevenDaysFromNow && expiresDate > now;
      });
      
      // Calculate compliance rate based on document statuses
      const totalRelevantDocs = userDocuments.length > 0 ? userDocuments.length : 1; // Avoid div by zero
      const compliantDocs = activeDocuments.length;
      const complianceRate = Math.round((compliantDocs / totalRelevantDocs) * 100);
      
      // Get stats from last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const docsCreatedLastMonth = userDocuments.filter(doc => {
        const createdAt = new Date(doc.createdAt);
        return createdAt >= lastMonth;
      }).length;
      
      // Create stats object
      const stats = {
        documents: userDocuments.length,
        pending: pendingDocuments.length,
        complianceRate: complianceRate,
        expiringCount: expiringDocuments.length,
        docsCreatedLastMonth,
        urgentCount: pendingDocuments.filter(doc => {
          if (!doc.expiresAt) return false;
          
          const now = new Date();
          const expiresDate = new Date(doc.expiresAt);
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(now.getDate() + 3);
          
          return expiresDate <= threeDaysFromNow;
        }).length,
        lastMonthComplianceChange: "+2%" // In a real app, this would be calculated
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
      
      // Check if folder already exists for this user
      const existingFolder = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM user_documents 
        WHERE user_id = ${req.user.id} AND category = ${folderName}
      `);
      
      if ((existingFolder.rows[0] as any).count > 0) {
        return res.status(409).json({ message: "Folder already exists" });
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

  app.delete("/api/user-documents/folders/:folderId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { folderId } = req.params;
      
      // Extract folder name from ID
      const folderName = folderId.replace(`folder-${req.user.id}-`, '').replace(/-/g, ' ');
      
      // Check if folder has real documents (excluding placeholders)
      const documentCount = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM user_documents 
        WHERE user_id = ${req.user.id} 
          AND category = ${folderName} 
          AND COALESCE(is_folder_placeholder, false) = false
      `);
      
      if ((documentCount.rows[0] as any).count > 0) {
        return res.status(400).json({ message: "Cannot delete folder with documents" });
      }
      
      // Delete all documents in this category (including placeholders)
      await db.execute(sql`
        DELETE FROM user_documents 
        WHERE user_id = ${req.user.id} AND category = ${folderName}
      `);
      
      res.status(200).json({ message: "Folder deleted successfully" });
    } catch (error: any) {
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
      
      // Add signed URLs for direct access to documents
      const documentsWithUrls = userDocuments.map(doc => ({
        ...doc,
        // Create a direct download URL for each document
        fileUrl: `/api/user-documents/${doc.id}/download`
      }));
      
      res.json(documentsWithUrls);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving user documents", error: error.message });
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
      
      // Ensure user can only access their own files
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Instead of trying to serve the file directly, we'll just redirect to a download
      // This approach works with any storage system configuration
      res.status(200).json({
        success: true,
        message: "Direct previews are not available. Please download file to view.",
        document: {
          id: document.id,
          title: document.title,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        }
      });
    } catch (error) {
      console.error("Error processing download request:", error);
      res.status(500).json({ 
        message: "Error processing request", 
        error: error instanceof Error ? error.message : String(error)
      });
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
      
      // For storage in Replit Object Storage
      const timestamp = Date.now();
      const sanitizedFileName = uploadedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const objectName = `${req.user.id}/${timestamp}-${sanitizedFileName}`;
      
      try {
        // Initialize Object Storage client with the specified bucket ID
        console.log("Initializing Object Storage client with bucket ID: replit-objstore-98b6b970-0937-4dd6-9dc9-d33d8ec62826");
        const objectStorage = new ObjectStorageClient({
          bucketId: 'replit-objstore-98b6b970-0937-4dd6-9dc9-d33d8ec62826'
        });
        
        console.log("Attempting to upload file:", objectName);
        // Upload file to Object Storage
        const uploadResult = await objectStorage.uploadFromBytes(
          objectName, 
          uploadedFile.data
        );
        
        if (!uploadResult.ok) {
          console.error("Error uploading to storage:", uploadResult.error);
          console.error("Error details:", JSON.stringify(uploadResult, null, 2));
          return res.status(500).json({ 
            message: "Error uploading file to storage", 
            error: uploadResult.error,
            details: uploadResult
          });
        }
        
        // Extract category from folder ID if provided
        let category = 'General'; // Default category
        if (metadata.folderId) {
          // Extract folder name from ID format: folder-{userId}-{folderName}
          const folderNamePart = metadata.folderId.replace(/^folder-\d+-/, '');
          category = folderNamePart.replace(/-/g, ' ');
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
  
  app.patch("/api/user-documents/:id", async (req: Request, res: Response) => {
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
      
      // Update the document
      const updatedDocument = await storage.updateUserDocument(documentId, req.body);
      
      res.status(200).json(updatedDocument);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating document", error: error.message });
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
      if (document.fileUrl) {
        try {
          const objectStorage = new ObjectStorageClient({
            bucketId: 'replit-objstore-98b6b970-0937-4dd6-9dc9-d33d8ec62826'
          });
          
          // Delete the file from storage
          await objectStorage.delete(document.fileUrl);
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

  // Duplicate user document
  app.post("/api/user-documents/:id/duplicate", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const originalDocumentId = parseInt(req.params.id);
      
      // Check if document exists and belongs to user
      const originalDocument = await storage.getUserDocument(originalDocumentId);
      
      if (!originalDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (originalDocument.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Create duplicate with new title and reset status to draft
      const duplicateData = {
        userId: req.user.id,
        title: `${originalDocument.title} (Copy)`,
        description: originalDocument.description,
        fileName: `copy_${originalDocument.fileName}`,
        fileType: originalDocument.fileType,
        fileSize: originalDocument.fileSize,
        fileUrl: originalDocument.fileUrl, // Keep the same file URL since it's the same content
        tags: originalDocument.tags,
        category: originalDocument.category,
        starred: false, // Reset starred status
        status: "draft" as const // Reset to draft
      };
      
      const duplicateDocument = await storage.createUserDocument(duplicateData);
      
      res.json(duplicateDocument);
    } catch (error: any) {
      res.status(500).json({ message: "Error duplicating document", error: error.message });
    }
  });

  // Document Files API
  app.post("/api/documents/:id/files", upload.single('file'), async (req: any, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const documentId = parseInt(req.params.id);
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const objectName = `documents/${documentId}/${Date.now()}-${file.originalname}`;
    try {
      const uploadResult = await objectClient.uploadFromBytes(objectName, file.buffer);
      if (!uploadResult.ok) {
        return res.status(500).json({ message: "Error uploading file", error: uploadResult.error });
      }
      await storage.createAuditRecord({
        documentId,
        userId: req.user.id,
        action: "FILE_UPLOADED",
        details: `Uploaded file ${file.originalname}`,
        ipAddress: req.ip
      });
      res.status(201).json({ name: file.originalname, key: objectName });
    } catch (err: any) {
      res.status(500).json({ message: "Error uploading file", error: err.message });
    }
  });

  app.get("/api/documents/:id/files", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const documentId = parseInt(req.params.id);
    try {
      const listResult = await objectClient.list({ prefix: `documents/${documentId}/` });
      if (!listResult.ok) {
        return res.status(500).json({ message: "Error listing files", error: listResult.error });
      }
      const files = listResult.value.map((f: any) => ({ name: f.name.split('/').slice(2).join('/'), key: f.name }));
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ message: "Error listing files", error: err.message });
    }
  });

  app.get("/api/documents/:id/files/:fileName", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const documentId = parseInt(req.params.id);
    const fileName = req.params.fileName;
    const objectKey = `documents/${documentId}/${fileName}`;
    try {
      const existsResult = await objectClient.exists(objectKey);
      if (!existsResult.ok) {
        return res.status(500).json({ message: "Error checking file", error: existsResult.error });
      }
      if (!existsResult.value) {
        return res.status(404).json({ message: "File not found" });
      }
      const stream = objectClient.downloadAsStream(objectKey);
      const contentType = mime.lookup(fileName) as string || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      stream.pipe(res);
    } catch (err: any) {
      res.status(500).json({ message: "Error downloading file", error: err.message });
    }
  });

  app.delete("/api/documents/:id/files/:fileName", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const documentId = parseInt(req.params.id);
    const fileName = req.params.fileName;
    const objectKey = `documents/${documentId}/${fileName}`;
    try {
      const deleteResult = await objectClient.delete(objectKey);
      if (!deleteResult.ok) {
        return res.status(500).json({ message: "Error deleting file", error: deleteResult.error });
      }
      await storage.createAuditRecord({
        documentId,
        userId: req.user.id,
        action: "FILE_DELETED",
        details: `Deleted file ${fileName}`,
        ipAddress: req.ip
      });
      res.sendStatus(204);
    } catch (err: any) {
      res.status(500).json({ message: "Error deleting file", error: err.message });
    }
  });

  // Add this endpoint after your existing document file endpoints
  app.get("/api/documents/files", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const listResult = await objectClient.list({ prefix: 'documents/' });
      if (!listResult.ok) {
        return res.status(500).json({ message: "Error listing files", error: listResult.error });
      }
      
      // Transform the results to include document IDs
      const files = listResult.value.map((file: any) => {
        const parts = file.name.split('/');
        if (parts.length >= 2) {
          return {
            name: parts.slice(2).join('/'),
            key: file.name,
            documentId: parseInt(parts[1], 10)
          };
        }
        return null;
      }).filter(Boolean);
      
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ message: "Error listing all files", error: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
