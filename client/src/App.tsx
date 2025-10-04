import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import ModernDashboardPage from "@/pages/modern-dashboard-page";
import UltraModernDashboardPage from "@/pages/ultra-modern-dashboard-page";
import MinimalDashboardPage from "@/pages/minimal-dashboard-page";
import ModernDocumentsPage from "@/pages/modern-documents-page";
import SimplifiedAnalyticsPage from "@/pages/simplified-analytics-page";
import SimplifiedCalendarPage from "@/pages/simplified-calendar-page";
import UsersPage from "@/pages/users-page";
import SettingsPage from "@/pages/settings-page";
import DocumentDetailPage from "@/pages/document-detail-page";


function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={UltraModernDashboardPage} />
      <ProtectedRoute path="/dashboard/minimal" component={MinimalDashboardPage} />
      <ProtectedRoute path="/dashboard/modern" component={ModernDashboardPage} />
      <ProtectedRoute path="/documents" component={ModernDocumentsPage} />
      <ProtectedRoute path="/documents/:id" component={DocumentDetailPage} />
      <ProtectedRoute path="/analytics" component={SimplifiedAnalyticsPage} />
      <ProtectedRoute path="/calendar" component={SimplifiedCalendarPage} />
      <ProtectedRoute path="/users" component={UsersPage} allowedRoles={["admin", "compliance_officer"]} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
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
