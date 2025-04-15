import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireRole } from "./auth";
import { 
  insertDocumentSchema, insertSignatureSchema, 
  insertComplianceDeadlineSchema, insertTemplateSchema 
} from "@shared/schema";
import { aiService } from "./ai-service";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      
      const validation = insertDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Document validation failed:", validation.error.format());
        return res.status(400).json({ message: "Invalid document data", errors: validation.error.format() });
      }
      
      // Set the created by ID to the current user, overriding any provided value for security
      const documentData = { 
        ...validation.data,
        createdById: req.user.id 
      };
      
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
        userId: req.user?.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid signature data", errors: validation.error.format() });
      }
      
      const signature = await storage.createSignature({
        ...req.body,
        documentId: parseInt(req.params.id),
        userId: req.user?.id,
        ipAddress: req.ip
      });
      
      // Create audit trail record
      await storage.createAuditRecord({
        documentId: document.id,
        userId: req.user?.id,
        action: "DOCUMENT_SIGNED",
        details: `Document "${document.title}" signed by ${req.user.name}`,
        ipAddress: req.ip
      });
      
      // Update document status if needed (e.g., from pending_approval to active)
      if (document.status === "pending_approval") {
        await storage.updateDocument(document.id, {
          status: "active",
          createdById: document.createdById
        });
      }
      
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

  const httpServer = createServer(app);
  return httpServer;
}
