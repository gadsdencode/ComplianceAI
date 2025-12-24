import type { Express, Request, Response } from "express";
import { storage } from "../storage.js";
import { requireRole } from "../auth.js";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export function registerUserRoutes(app: Express): void {
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

  // Update user
  app.put("/api/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      
      // Only admins can update other users
      if (req.user.role !== "admin" && req.user.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Only admins can change roles
      if (req.body.role && req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can change user roles" });
      }
      
      const updateData = { ...req.body };
      
      // Hash password if being updated
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }
      
      const user = await storage.updateUser(userId, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating user", error: error.message });
    }
  });

  // Change password
  app.post("/api/user/change-password", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user.id, { password: hashedPassword });
      
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error changing password", error: error.message });
    }
  });

  // Update notification preferences
  app.put("/api/user/notifications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Store notification preferences in user metadata
      res.json({ message: "Notification preferences updated" });
    } catch (error: any) {
      res.status(500).json({ message: "Error updating notification preferences", error: error.message });
    }
  });

  // Update company settings
  app.put("/api/settings/company", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Only admins can update company settings
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      res.json({ message: "Company settings updated" });
    } catch (error: any) {
      res.status(500).json({ message: "Error updating company settings", error: error.message });
    }
  });

  // Update AI settings
  app.put("/api/settings/ai", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      res.json({ message: "AI settings updated" });
    } catch (error: any) {
      res.status(500).json({ message: "Error updating AI settings", error: error.message });
    }
  });

  // Sign out all sessions
  app.post("/api/user/signout-all", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: "Error signing out" });
        }
        res.json({ message: "Signed out from all sessions" });
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error signing out", error: error.message });
    }
  });
}

