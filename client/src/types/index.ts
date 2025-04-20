// User related types
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: "admin" | "compliance_officer" | "employee";
  createdAt: string;
}

// Document related types
export type DocumentStatus = "draft" | "pending_approval" | "active" | "expired" | "archived";

export interface Document {
  id: number;
  title: string;
  content: string;
  status: DocumentStatus;
  templateId?: number;
  version: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface DocumentVersion {
  id: number;
  documentId: number;
  version: number;
  content: string;
  createdById: number;
  createdAt: string;
}

// Signature related types
export interface Signature {
  id: number;
  documentId: number;
  userId: number;
  signature: string;
  createdAt: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

// Audit trail related types
export interface AuditTrail {
  id: number;
  documentId?: number;
  userId: number;
  action: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

// Compliance deadlines related types
export type DeadlineStatus = "not_started" | "in_progress" | "completed" | "overdue";

export interface ComplianceDeadline {
  id: number;
  title: string;
  description?: string;
  deadline: string;
  documentId?: number;
  assigneeId?: number;
  status: DeadlineStatus;
  type: string;
  createdAt: string;
}

// Template related types
export interface Template {
  id: number;
  name: string;
  content: string;
  category?: string;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

// Dashboard related types
export interface DashboardStats {
  documents: number;
  pending: number;
  complianceRate: number;
  expiringCount: number;
  docsCreatedLastMonth: number;
  urgentCount: number;
  lastMonthComplianceChange: string;
}

export interface PendingDocumentItem {
  id: number;
  title: string;
  deadline?: string;
  status: DocumentStatus;
  actionType: "sign" | "review" | "approve";
}

export interface RecentDocumentItem {
  id: number;
  title: string;
  updatedAt: string;
  status: DocumentStatus;
}

export interface ComplianceCalendarItem {
  id: number;
  title: string;
  deadline: string;
  type: string;
  assignee: {
    id: number;
    name: string;
    initials: string;
  };
  status: DeadlineStatus;
}

// AI Assistant related types
export interface AIMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

export interface AIComplianceIssue {
  issues: string[];
  score: number;
}

export interface AITemplateGeneration {
  templateId: number;
  companyInfo: {
    name: string;
    industry?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    [key: string]: any;
  };
}

// User Document related types
export interface UserDocument {
  id: number;
  userId: number;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
