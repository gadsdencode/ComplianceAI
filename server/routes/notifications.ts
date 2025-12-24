import type { Express, Request, Response } from "express";
import { storage } from "../storage.js";

export function registerNotificationRoutes(app: Express): void {
  // Get user notifications
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

  // Get notification counts
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

  // Mark notification as read
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

  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: "Error marking notifications as read", error: error.message });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const notificationId = parseInt(req.params.id);
      
      // Verify notification belongs to user
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteNotification(notificationId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting notification", error: error.message });
    }
  });
}

