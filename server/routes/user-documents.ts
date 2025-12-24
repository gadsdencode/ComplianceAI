import type { Express, Request, Response } from "express";
import { storage } from "../storage.js";

export function registerUserDocumentRoutes(app: Express): void {
  // Get user documents
  app.get("/api/user-documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documents = await storage.getUserDocuments(req.user.id);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving user documents", error: error.message });
    }
  });

  // Get single user document
  app.get("/api/user-documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getUserDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check ownership
      if (document.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving document", error: error.message });
    }
  });

  // Create user document
  app.post("/api/user-documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentData = {
        ...req.body,
        userId: req.user.id,
        status: req.body.status || "draft"
      };
      
      const document = await storage.createUserDocument(documentData);
      res.status(201).json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating document", error: error.message });
    }
  });

  // Update user document
  app.put("/api/user-documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const existingDocument = await storage.getUserDocument(documentId);
      
      if (!existingDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check ownership
      if (existingDocument.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const document = await storage.updateUserDocument(documentId, req.body);
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating document", error: error.message });
    }
  });

  // Delete user document
  app.delete("/api/user-documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const existingDocument = await storage.getUserDocument(documentId);
      
      if (!existingDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check ownership
      if (existingDocument.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteUserDocument(documentId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting document", error: error.message });
    }
  });

  // Download user document
  app.get("/api/user-documents/:id/download", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getUserDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check ownership
      if (document.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      if (!document.fileUrl) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Redirect to file URL or stream the file
      res.redirect(document.fileUrl);
    } catch (error: any) {
      res.status(500).json({ message: "Error downloading document", error: error.message });
    }
  });
}

