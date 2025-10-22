import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "compliance_officer", "employee"] }).notNull().default("employee"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["draft", "pending_approval", "active", "expired", "archived"] }).notNull().default("draft"),
  templateId: integer("template_id").references(() => templates.id),
  version: integer("version").notNull().default(1),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  category: varchar("category", { length: 100 }).default("Compliance"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Document versions schema
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Signatures schema
export const signatures = pgTable("signatures", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  signature: text("signature").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  metadata: jsonb("metadata"),
});

// Audit trail schema
export const auditTrail = pgTable("audit_trail", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

// Compliance deadlines schema
export const complianceDeadlines = pgTable("compliance_deadlines", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  deadline: timestamp("deadline").notNull(),
  documentId: integer("document_id").references(() => documents.id),
  assigneeId: integer("assignee_id").references(() => users.id),
  status: text("status", { enum: ["not_started", "in_progress", "completed", "overdue"] }).notNull().default("not_started"),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Templates schema - Enhanced with professional features
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  tags: text("tags").array(),
  variables: jsonb("variables").$type<Array<{
    name: string;
    type?: string;
    required?: boolean;
    defaultValue?: string;
    description?: string;
    placeholder?: string;
    validation?: string;
    options?: string[];
  }>>().default([]),
  estimatedTime: varchar("estimated_time", { length: 50 }),
  complianceStandards: text("compliance_standards").array(),
  version: integer("version").notNull().default(1),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
});

// User documents table
export const userDocuments = pgTable("user_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  tags: text("tags").array(),
  category: varchar("category", { length: 100 }).default("General"),
  starred: boolean("starred").default(false),
  status: text("status", { enum: ["draft", "review", "approved", "archived"] }).default("draft"),
  isFolderPlaceholder: boolean("is_folder_placeholder").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["document_update", "deadline_reminder", "approval_request", "system_notification", "user_document_upload"] }).notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  isRead: boolean("is_read").notNull().default(false),
  relatedId: integer("related_id"), // ID of related document, deadline, etc.
  relatedType: varchar("related_type", { length: 100 }), // Type of related item
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents)
  .partial({ createdById: true })
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({ id: true, createdAt: true });
export const insertSignatureSchema = createInsertSchema(signatures).omit({ id: true, createdAt: true });
export const insertAuditTrailSchema = createInsertSchema(auditTrail).omit({ id: true, timestamp: true });
export const insertComplianceDeadlineSchema = createInsertSchema(complianceDeadlines).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserDocumentSchema = createInsertSchema(userDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, updatedAt: true });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = z.infer<typeof insertSignatureSchema>;

export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;

export type ComplianceDeadline = typeof complianceDeadlines.$inferSelect;
export type InsertComplianceDeadline = z.infer<typeof insertComplianceDeadlineSchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type UserDocument = typeof userDocuments.$inferSelect;
export type InsertUserDocument = z.infer<typeof insertUserDocumentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
