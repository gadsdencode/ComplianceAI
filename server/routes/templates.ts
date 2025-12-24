import type { Express, Request, Response } from "express";
import { storage } from "../storage.js";

export function registerTemplateRoutes(app: Express): void {
  // Get all templates
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

  // Get single template
  app.get("/api/templates/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving template", error: error.message });
    }
  });

  // Create template
  app.post("/api/templates", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Only allow admins and compliance officers to create templates
    if (req.user.role !== "admin" && req.user.role !== "compliance_officer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const templateData = {
        ...req.body,
        createdById: req.user.id,
        isDefault: false
      };
      
      const template = await storage.createTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating template", error: error.message });
    }
  });

  // Update template
  app.put("/api/templates/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const templateId = parseInt(req.params.id);
      const existingTemplate = await storage.getTemplate(templateId);
      
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check permissions
      if (req.user.role !== "admin" && existingTemplate.createdById !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Don't allow modifying isDefault status unless admin
      if (req.body.isDefault !== undefined && req.user.role !== "admin") {
        delete req.body.isDefault;
      }
      
      const template = await storage.updateTemplate(templateId, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating template", error: error.message });
    }
  });

  // Delete template
  app.delete("/api/templates/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const templateId = parseInt(req.params.id);
      
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const existingTemplate = await storage.getTemplate(templateId);
      
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check permissions
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
}

