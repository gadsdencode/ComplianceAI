import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../auth.js";

// Import route modules
import { registerDocumentRoutes } from "./documents.js";
import { registerUserDocumentRoutes } from "./user-documents.js";
import { registerAIRoutes } from "./ai.js";
import { registerTemplateRoutes } from "./templates.js";
import { registerAnalyticsRoutes } from "./analytics.js";
import { registerComplianceRoutes } from "./compliance.js";
import { registerNotificationRoutes } from "./notifications.js";
import { registerUserRoutes } from "./users.js";
import { registerHealthRoutes } from "./health.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes first
  setupAuth(app);
  
  // Register all route modules
  registerHealthRoutes(app);
  registerDocumentRoutes(app);
  registerUserDocumentRoutes(app);
  registerTemplateRoutes(app);
  registerAIRoutes(app);
  registerAnalyticsRoutes(app);
  registerComplianceRoutes(app);
  registerNotificationRoutes(app);
  registerUserRoutes(app);
  
  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

