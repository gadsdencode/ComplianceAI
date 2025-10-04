import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";

dotenv.config();

function validateEnvironment() {
  console.log("\n🔍 Environment Variable Check:");
  console.log("================================");
  
  const requiredVars = ["DATABASE_URL"];
  const optionalVars = ["OPENAI_API_KEY", "SESSION_SECRET", "PORT"];
  
  let hasErrors = false;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.error(`❌ ${varName}: MISSING (Required)`);
      hasErrors = true;
    }
  });
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.warn(`⚠️  ${varName}: Not set (Optional, using default)`);
    }
  });
  
  console.log("================================\n");
  
  if (hasErrors) {
    console.error("❌ Missing required environment variables. Server cannot start.");
    throw new Error("Missing required environment variables");
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  // Log file upload request details
  if (path === '/api/user-documents/upload' && req.method === 'POST') {
    console.log('📁 File upload request received:');
    console.log('- Content-Type:', req.headers['content-type']);
    console.log('- Content-Length:', req.headers['content-length']);
    console.log('- Has files object:', req.files ? 'Yes' : 'No');
    if (req.files) {
      console.log('- Files keys:', Object.keys(req.files));
    }
  }
  
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
      
      // Additional logging for file upload responses
      if (path === '/api/user-documents/upload') {
        console.log(`📁 File upload response: ${res.statusCode}`);
      }
    }
  });

  next();
});

(async () => {
  try {
    console.log("🚀 Starting application...\n");
    
    validateEnvironment();
    
    const { testDatabaseConnection } = await import("./db.js");
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      console.error("❌ Failed to connect to database. Exiting...");
      process.exit(1);
    }
    
    console.log("📦 Registering routes...");
    const server = await registerRoutes(app);
    console.log("✅ Routes registered successfully\n");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error(`❌ Error ${status}: ${message}`);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      console.log("🔧 Setting up Vite development server...");
      await setupVite(app, server);
    } else {
      console.log("📁 Serving static files...");
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log("\n✅ Server successfully started!");
      console.log(`🌍 Listening on 0.0.0.0:${port}`);
      console.log(`📍 Environment: ${app.get("env") || "production"}`);
      console.log("==================================\n");
    });
    
    server.on('error', (error: any) => {
      console.error("❌ Server error:", error);
      if (error.code === 'EADDRINUSE') {
        console.error(`   Port ${port} is already in use`);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error("\n❌ FATAL ERROR during startup:");
    console.error(error);
    console.error("\nServer failed to start. Please check the error above.\n");
    process.exit(1);
  }
})();
