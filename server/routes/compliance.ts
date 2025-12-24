import type { Express, Request, Response } from "express";
import { storage } from "../storage.js";

export function registerComplianceRoutes(app: Express): void {
  // Get compliance deadlines
  app.get("/api/compliance-deadlines", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const options: any = {};
      
      if (req.query.upcoming === "true") {
        options.upcoming = true;
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
      
      // Filter by assignee if employee
      if (req.user.role === "employee") {
        options.assigneeId = req.user.id;
      }
      
      const deadlines = await storage.listComplianceDeadlines(options);
      res.json(deadlines);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving deadlines", error: error.message });
    }
  });

  // Get single deadline
  app.get("/api/compliance-deadlines/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const deadlineId = parseInt(req.params.id);
      const deadline = await storage.getComplianceDeadline(deadlineId);
      
      if (!deadline) {
        return res.status(404).json({ message: "Deadline not found" });
      }
      
      res.json(deadline);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving deadline", error: error.message });
    }
  });

  // Create deadline
  app.post("/api/compliance-deadlines", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Only allow admins and compliance officers to create deadlines
    if (req.user.role !== "admin" && req.user.role !== "compliance_officer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const deadlineData = {
        ...req.body,
        createdById: req.user.id,
        status: req.body.status || "pending"
      };
      
      const deadline = await storage.createComplianceDeadline(deadlineData);
      res.status(201).json(deadline);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating deadline", error: error.message });
    }
  });

  // Update deadline
  app.put("/api/compliance-deadlines/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const deadlineId = parseInt(req.params.id);
      const existingDeadline = await storage.getComplianceDeadline(deadlineId);
      
      if (!existingDeadline) {
        return res.status(404).json({ message: "Deadline not found" });
      }
      
      // Only allow admins, compliance officers, or assignees to update
      if (
        req.user.role !== "admin" && 
        req.user.role !== "compliance_officer" && 
        existingDeadline.assigneeId !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const deadline = await storage.updateComplianceDeadline(deadlineId, req.body);
      res.json(deadline);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating deadline", error: error.message });
    }
  });

  // Mark deadline as complete
  app.post("/api/compliance-deadlines/:id/complete", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const deadlineId = parseInt(req.params.id);
      const existingDeadline = await storage.getComplianceDeadline(deadlineId);
      
      if (!existingDeadline) {
        return res.status(404).json({ message: "Deadline not found" });
      }
      
      // Only allow admins, compliance officers, or assignees to complete
      if (
        req.user.role !== "admin" && 
        req.user.role !== "compliance_officer" && 
        existingDeadline.assigneeId !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const deadline = await storage.updateComplianceDeadline(deadlineId, {
        status: "completed",
        completedAt: new Date().toISOString()
      });
      
      res.json(deadline);
    } catch (error: any) {
      res.status(500).json({ message: "Error completing deadline", error: error.message });
    }
  });
}

