import type { Express, Request, Response } from "express";
import { storage } from "../storage.js";

export function registerDocumentRoutes(app: Express): void {
  // Get all documents (paginated)
  app.get("/api/documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const options: any = {};
      const countOptions: any = {};
      
      // Filter by user if not admin or compliance officer
      if (req.user.role === "employee") {
        options.createdById = req.user.id;
        countOptions.createdById = req.user.id;
      }
      
      if (req.query.status) {
        options.status = req.query.status as string;
        countOptions.status = req.query.status as string;
      }
      
      // Pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 per page
      const offset = (page - 1) * limit;
      
      options.limit = limit;
      options.offset = offset;
      
      // Fetch documents and total count in parallel
      const [documents, total] = await Promise.all([
        storage.listDocuments(options),
        storage.countDocuments(countOptions)
      ]);
      
      // Return paginated response
      res.json({
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving documents", error: error.message });
    }
  });

  // Get recent documents
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

  // Search documents
  app.get("/api/documents/search", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const searchQuery = req.query.q as string;
      
      if (!searchQuery || searchQuery.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const options: any = {
        searchQuery,
        limit: parseInt(req.query.limit as string) || 10
      };
      
      // Filter by user if not admin or compliance officer
      if (req.user.role === "employee") {
        options.createdById = req.user.id;
      }
      
      const documents = await storage.searchDocuments(options);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: "Error searching documents", error: error.message });
    }
  });

  // Get single document
  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check access permissions
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving document", error: error.message });
    }
  });

  // Create document
  app.post("/api/documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentData = {
        ...req.body,
        createdById: req.user.id,
        status: req.body.status || "draft",
        version: 1
      };
      
      const document = await storage.createDocument(documentData);
      
      // Create audit record
      await storage.createAuditRecord({
        documentId: document.id,
        userId: req.user.id,
        action: "DOCUMENT_CREATED",
        details: `Created document: ${document.title}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating document", error: error.message });
    }
  });

  // Update document
  app.put("/api/documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const existingDocument = await storage.getDocument(documentId);
      
      if (!existingDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check access permissions
      if (req.user.role === "employee" && existingDocument.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Create version if content changed
      if (req.body.content && req.body.content !== existingDocument.content) {
        await storage.createDocumentVersion({
          documentId: existingDocument.id,
          version: existingDocument.version,
          content: existingDocument.content,
          createdById: req.user.id
        });
        
        req.body.version = existingDocument.version + 1;
      }
      
      const document = await storage.updateDocument(documentId, req.body);
      
      // Create audit record
      await storage.createAuditRecord({
        documentId: documentId,
        userId: req.user.id,
        action: "DOCUMENT_UPDATED",
        details: `Updated document: ${document?.title}`,
        ipAddress: req.ip
      });
      
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating document", error: error.message });
    }
  });

  // Document versions
  app.get("/api/documents/:id/versions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (req.user.role === "employee" && document.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const versions = await storage.getDocumentVersions(documentId);
      res.json(versions);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving versions", error: error.message });
    }
  });

  // Document signatures
  app.get("/api/documents/:id/signatures", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const signatures = await storage.getDocumentSignatures(documentId);
      res.json(signatures);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving signatures", error: error.message });
    }
  });

  // Create signature
  app.post("/api/documents/:id/sign", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const signature = await storage.createSignature({
        documentId,
        userId: req.user.id,
        signatureData: req.body.signatureData || "Electronic signature",
        ipAddress: req.ip || "Unknown"
      });
      
      // Create audit record
      await storage.createAuditRecord({
        documentId,
        userId: req.user.id,
        action: "DOCUMENT_SIGNED",
        details: `Signed document: ${document.title}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(signature);
    } catch (error: any) {
      res.status(500).json({ message: "Error signing document", error: error.message });
    }
  });

  // Audit trail
  app.get("/api/documents/:id/audit", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const auditTrail = await storage.getDocumentAuditTrail(documentId);
      res.json(auditTrail);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving audit trail", error: error.message });
    }
  });
}

