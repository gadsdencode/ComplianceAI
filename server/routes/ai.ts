import type { Express, Request, Response } from "express";
import { storage } from "../storage.js";
import { aiService } from "../ai-service.js";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiter for AI endpoints (10 requests per minute per user)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id?.toString() || req.ip || 'anonymous';
  },
  message: { 
    error: 'Too many AI requests. Please wait before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export function registerAIRoutes(app: Express): void {
  // Apply rate limiter to all AI routes
  app.use("/api/ai/*", aiRateLimiter);

  // Generate document from template
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
    } catch (error: any) {
      if (error.message === 'AI_SERVICE_UNAVAILABLE') {
        return res.status(503).json({ 
          message: 'AI Service temporarily unavailable',
          retryAfter: 30
        });
      }
      res.status(500).json({ message: "Error generating document", error: error.message });
    }
  });

  // Improve document content
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
    } catch (error: any) {
      if (error.message === 'AI_SERVICE_UNAVAILABLE') {
        return res.status(503).json({ 
          message: 'AI Service temporarily unavailable',
          retryAfter: 30
        });
      }
      res.status(500).json({ message: "Error improving document", error: error.message });
    }
  });

  // Check compliance issues
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
    } catch (error: any) {
      if (error.message === 'AI_SERVICE_UNAVAILABLE') {
        return res.status(503).json({ 
          message: 'AI Service temporarily unavailable',
          retryAfter: 30
        });
      }
      res.status(500).json({ message: "Error checking compliance", error: error.message });
    }
  });

  // Suggest compliance actions
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
    } catch (error: any) {
      if (error.message === 'AI_SERVICE_UNAVAILABLE') {
        return res.status(503).json({ 
          message: 'AI Service temporarily unavailable',
          retryAfter: 30
        });
      }
      res.status(500).json({ message: "Error generating suggestions", error: error.message });
    }
  });

  // AI Chat endpoint
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { messages, model = "gpt-4o-mini", temperature = 0.7, max_tokens = 500, context } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid request. Messages array is required." });
      }
      
      // Format messages for OpenAI
      const formattedMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add system message with context if provided
      if (context) {
        formattedMessages.unshift({
          role: "system",
          content: context
        });
      }
      
      const response = await openai.chat.completions.create({
        model,
        messages: formattedMessages,
        temperature,
        max_tokens,
      });
      
      // Create an audit record for the AI interaction
      await storage.createAuditRecord({
        userId: req.user!.id,
        action: "AI_CHAT_INTERACTION",
        details: `User interaction with AI assistant`,
        ipAddress: req.ip
      });
      
      res.json({
        choices: [
          {
            message: {
              content: response.choices[0]?.message?.content || "I'm sorry, I couldn't process that request."
            }
          }
        ]
      });
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ 
        message: "Error processing AI request", 
        error: error.message 
      });
    }
  });
}

