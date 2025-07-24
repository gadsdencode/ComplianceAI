import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import TemplatesPage from "@/pages/templates-page";
import SignaturesPage from "@/pages/signatures-page";
import AuditPage from "@/pages/audit-page";
import UsersPage from "@/pages/users-page";
import SettingsPage from "@/pages/settings-page";
import DocumentDetailPage from "@/pages/document-detail-page";
import ComplianceDeadlinePage from '@/pages/compliance-deadline-page';
import DocumentDashboardPage from '@/pages/document-dashboard-page';
import DocumentRepositoryPage from "@/pages/document-repository-page";
import DocumentsPage from "@/pages/documents-page";


function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/document-repository" component={DocumentRepositoryPage} />
      <ProtectedRoute path="/document-repository/:id" component={DocumentDetailPage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/documents/:id" component={DocumentDetailPage} />
      <ProtectedRoute path="/templates" component={TemplatesPage} />
      <ProtectedRoute path="/signatures" component={SignaturesPage} />
      <ProtectedRoute path="/audit" component={AuditPage} />
      <ProtectedRoute path="/users" component={UsersPage} allowedRoles={["admin", "compliance_officer"]} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/compliance/deadlines/:id" component={ComplianceDeadlinePage} />
      <ProtectedRoute path="/document-dashboard" component={DocumentDashboardPage} />
      <Route path="/auth" component={AuthPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
