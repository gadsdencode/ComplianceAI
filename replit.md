# ComplianceAI - AI-Powered Document Compliance Application

## Overview

ComplianceAI is a comprehensive web application designed to help businesses manage regulatory compliance through AI-powered document creation, storage, digital signatures, and audit trails. The system enables compliance officers and employees to streamline their regulatory requirements with automated workflows and intelligent document management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack TypeScript Application
- **Frontend**: React with TypeScript, Vite build system
- **Backend**: Node.js with Express
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Authentication**: Passport.js with local strategy and session management

### Deployment Strategy
- Designed for Replit environment
- Uses Replit Object Storage for file management
- Environment variables for configuration
- Supports both development and production builds

## Key Components

### Authentication System
- **Strategy**: Local authentication with username/password
- **Session Management**: Express sessions with PostgreSQL store
- **Password Security**: Scrypt-based hashing with salt
- **Role-Based Access**: Three roles (admin, compliance_officer, employee)
- **Authorization**: Route-level and component-level access control

### Database Schema
- **Users**: Role-based user management
- **Documents**: Versioned compliance documents with status tracking
- **Templates**: AI-assisted document templates
- **Signatures**: Digital signature system with verification
- **Audit Trail**: Comprehensive activity logging
- **Compliance Deadlines**: Automated deadline tracking
- **User Documents**: Personal document storage separate from compliance docs

### AI Integration
- **Service**: OpenAI GPT-4 integration for document generation
- **Features**: Template-based document creation, content improvement, compliance checking
- **Fallback**: Graceful degradation when AI service unavailable
- **Assistant**: Interactive chat interface for compliance queries

### File Management
- **Storage**: Replit Object Storage for production, local mock for development
- **Upload**: Multi-file upload with validation and metadata
- **Security**: File type validation and size limits
- **Organization**: Folder-based file organization

## Data Flow

### Document Lifecycle
1. Template selection or creation
2. AI-assisted content generation
3. Version control and editing
4. Approval workflow
5. Digital signature collection
6. Audit trail maintenance
7. Compliance deadline tracking

### User Workflow
1. Authentication and role assignment
2. Dashboard with compliance overview
3. Document creation/editing
4. Signature and approval processes
5. Audit trail review
6. Compliance deadline management

### AI Assistant Flow
1. User query processing
2. Context-aware response generation
3. Document template suggestions
4. Compliance recommendations

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless
- **AI Service**: OpenAI API (GPT-4)
- **File Storage**: Replit Object Storage
- **Session Store**: PostgreSQL-based sessions

### UI/UX Libraries
- **Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query

### Development Tools
- **Build**: Vite with TypeScript
- **Database**: Drizzle Kit for migrations
- **Type Safety**: Strict TypeScript configuration
- **Path Mapping**: Absolute imports with @ aliases

## Deployment Strategy

### Build Process
1. Frontend build with Vite
2. Backend TypeScript compilation
3. Database migration execution
4. Static file serving configuration

### Environment Configuration
- **Development**: Local development with mock services
- **Production**: Replit deployment with full integrations
- **Database**: Automatic connection pooling and SSL
- **Sessions**: Persistent session storage

### Performance Considerations
- **Connection Pooling**: Optimized database connections
- **File Storage**: Efficient binary storage handling
- **Caching**: React Query for client-side caching
- **Bundle Optimization**: Vite's tree-shaking and code splitting

### Security Features
- **Authentication**: Secure password hashing and session management
- **Authorization**: Role-based access control
- **File Validation**: Strict file type and size validation
- **SQL Injection**: Parameterized queries with Drizzle ORM
- **XSS Protection**: React's built-in protections and input sanitization