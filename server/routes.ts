import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireRole } from "./auth";
import { 
  insertDocumentSchema, insertSignatureSchema, 
  insertComplianceDeadlineSchema, insertTemplateSchema 
} from "@shared/schema";
import { aiService } from "./ai-service";

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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Error retrieving document", error: error.message });
    }
  });
  
  app.post("/api/documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const validation = insertDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid document data", errors: validation.error.format() });
      }
      
      // Set the created by ID to the current user
      const documentData = { ...req.body, createdById: req.user.id };
      
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
    } catch (error) {
      res.status(500).json({ message: "Error creating document", error: error.message });
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
    } catch (error) {
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
    } catch (error) {
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
        userId: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid signature data", errors: validation.error.format() });
      }
      
      const signature = await storage.createSignature({
        ...req.body,
        documentId: parseInt(req.params.id),
        userId: req.user.id,
        ipAddress: req.ip
      });
      
      // Create audit trail record
      await storage.createAuditRecord({
        documentId: document.id,
        userId: req.user.id,
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
        options.assigneeId = parseInt(req.query.assigneeId as string);
      }
      
      if (req.query.status) {
        options.status = req.query.status as string;
      }
      
      if (req.query.upcoming === "true") {
        options.upcoming = true;
      }
      
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit as string);
      }
      
      if (req.query.offset) {
        options.offset = parseInt(req.query.offset as string);
      }
      
      const deadlines = await storage.listComplianceDeadlines(options);
      res.json(deadlines);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving compliance deadlines", error: error.message });
    }
  });
  
  app.post("/api/compliance-deadlines", requireRole(["admin", "compliance_officer"]), async (req: Request, res: Response) => {
    try {
      const validation = insertComplianceDeadlineSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid deadline data", errors: validation.error.format() });
      }
      
      const deadline = await storage.createComplianceDeadline(req.body);
      
      // Create audit trail record if related to a document
      if (deadline.documentId) {
        await storage.createAuditRecord({
          documentId: deadline.documentId,
          userId: req.user.id,
          action: "COMPLIANCE_DEADLINE_CREATED",
          details: `Compliance deadline "${deadline.title}" created`,
          ipAddress: req.ip
        });
      }
      
      res.status(201).json(deadline);
    } catch (error) {
      res.status(500).json({ message: "Error creating compliance deadline", error: error.message });
    }
  });
  
  app.put("/api/compliance-deadlines/:id", requireRole(["admin", "compliance_officer"]), async (req: Request, res: Response) => {
    try {
      const deadline = await storage.updateComplianceDeadline(parseInt(req.params.id), req.body);
      
      if (!deadline) {
        return res.status(404).json({ message: "Compliance deadline not found" });
      }
      
      // Create audit trail record if related to a document
      if (deadline.documentId) {
        await storage.createAuditRecord({
          documentId: deadline.documentId,
          userId: req.user.id,
          action: "COMPLIANCE_DEADLINE_UPDATED",
          details: `Compliance deadline "${deadline.title}" updated`,
          ipAddress: req.ip
        });
      }
      
      res.json(deadline);
    } catch (error) {
      res.status(500).json({ message: "Error updating compliance deadline", error: error.message });
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Error retrieving template", error: error.message });
    }
  });
  
  app.post("/api/templates", requireRole(["admin", "compliance_officer"]), async (req: Request, res: Response) => {
    try {
      const validation = insertTemplateSchema.safeParse({
        ...req.body,
        createdById: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid template data", errors: validation.error.format() });
      }
      
      const template = await storage.createTemplate({
        ...req.body,
        createdById: req.user.id
      });
      
      res.status(201).json(template);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Error retrieving dashboard stats", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
