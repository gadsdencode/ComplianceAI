import type { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

// Detect Replit environment
const isReplitEnvironment = !!(
  process.env.REPL_ID || 
  process.env.REPLIT_DB_URL || 
  process.env.REPLIT_DEPLOYMENT || 
  process.env.REPLIT_DOMAINS
);

// Object storage configuration
const envBucketId = process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID;
const isValidBucketId = envBucketId && envBucketId.startsWith('replit-objstore-');
const REPLIT_OBJECT_STORAGE_BUCKET_ID = isValidBucketId 
  ? envBucketId 
  : 'replit-objstore-98b6b970-0937-4dd6-9dc9-d33d8ec62826';

export function registerHealthRoutes(app: Express): void {
  // Health check endpoint for deployment
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "ComplianceAI API"
    });
  });

  // Environment info endpoint for debugging
  app.get("/api/environment", (req: Request, res: Response) => {
    const envInfo = {
      isReplitEnvironment,
      nodeEnv: process.env.NODE_ENV,
      bucketId: REPLIT_OBJECT_STORAGE_BUCKET_ID,
      detectedVariables: {
        REPL_ID: !!process.env.REPL_ID,
        REPLIT_DB_URL: !!process.env.REPLIT_DB_URL,
        REPLIT_DEPLOYMENT: !!process.env.REPLIT_DEPLOYMENT,
        REPLIT_DOMAINS: !!process.env.REPLIT_DOMAINS,
        FORCE_REPLIT_STORAGE: process.env.FORCE_REPLIT_STORAGE,
        REPLIT_OBJECT_STORAGE_BUCKET_ID: !!process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID
      },
      storageMode: isReplitEnvironment ? 'real-object-storage' : 'mock-development-storage'
    };
    res.json(envInfo);
  });
}

