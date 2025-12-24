import type { Express, Request, Response } from "express";
import { storage } from "../storage.js";

export function registerAnalyticsRoutes(app: Express): void {
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
      
      // Combine documents for stats
      const allDocs = [
        ...userComplianceDocuments,
        ...userUploadedDocuments
      ];
      
      // Calculate stats
      const totalDocuments = allDocs.length;
      const pendingDocuments = userComplianceDocuments.filter(doc => doc.status === "pending_approval").length;
      const activeDocuments = userComplianceDocuments.filter(doc => doc.status === "active").length;
      
      // Calculate compliance rate
      const complianceRate = totalDocuments > 0 
        ? Math.round((activeDocuments / totalDocuments) * 100) 
        : 0;
      
      // Get upcoming deadlines
      const deadlines = await storage.listComplianceDeadlines({ upcoming: true, limit: 10 });
      const expiringCount = deadlines.filter(d => {
        const deadline = new Date(d.deadline);
        const now = new Date();
        const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 30 && diffDays >= 0;
      }).length;
      
      // Documents created last month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const docsCreatedLastMonth = allDocs.filter(doc => 
        new Date(doc.createdAt) > oneMonthAgo
      ).length;
      
      // Urgent items (overdue or due within 7 days)
      const urgentCount = deadlines.filter(d => {
        const deadline = new Date(d.deadline);
        const now = new Date();
        const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }).length;
      
      res.json({
        documents: totalDocuments,
        pending: pendingDocuments,
        complianceRate,
        expiringCount,
        docsCreatedLastMonth,
        urgentCount,
        lastMonthComplianceChange: "+2%"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving dashboard stats", error: error.message });
    }
  });

  // Analytics overview
  app.get("/api/analytics/overview", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documents = await storage.listDocuments();
      const userDocuments = await storage.getUserDocuments(req.user.id);
      const deadlines = await storage.listComplianceDeadlines({ limit: 100 });
      
      // Document status breakdown
      const statusBreakdown = {
        draft: documents.filter(d => d.status === "draft").length,
        pending_approval: documents.filter(d => d.status === "pending_approval").length,
        active: documents.filter(d => d.status === "active").length,
        expired: documents.filter(d => d.status === "expired").length,
        archived: documents.filter(d => d.status === "archived").length
      };
      
      // Monthly document creation trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const count = documents.filter(doc => {
          const createdAt = new Date(doc.createdAt);
          return createdAt >= monthStart && createdAt < monthEnd;
        }).length;
        
        monthlyTrend.push({
          month: monthStart.toLocaleString('default', { month: 'short' }),
          count
        });
      }
      
      // Deadline completion rate
      const completedDeadlines = deadlines.filter(d => d.status === "completed").length;
      const completionRate = deadlines.length > 0 
        ? Math.round((completedDeadlines / deadlines.length) * 100) 
        : 0;
      
      res.json({
        statusBreakdown,
        monthlyTrend,
        completionRate,
        totalDocuments: documents.length,
        totalUserDocuments: userDocuments.length,
        totalDeadlines: deadlines.length
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving analytics", error: error.message });
    }
  });

  // Document categories
  app.get("/api/analytics/categories", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const documents = await storage.listDocuments();
      
      // Group by category
      const categories = documents.reduce((acc: any, doc) => {
        const category = doc.category || "Uncategorized";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving categories", error: error.message });
    }
  });
}

