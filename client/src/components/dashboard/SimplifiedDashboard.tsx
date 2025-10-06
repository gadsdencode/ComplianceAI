import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { getTimeBasedGreeting } from '@/lib/utils';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus,
  Sparkles,
  Target,
  Activity
} from 'lucide-react';
import EnhancedDocumentSearch from '../common/EnhancedDocumentSearch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  documents: number;
  pending: number;
  complianceRate: number;
  urgentCount: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  action: () => void;
  count?: number;
}

export default function SimplifiedDashboard() {
  const [, setLocation] = useLocation();

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentDocuments = [] } = useQuery<any[]>({
    queryKey: ['/api/documents/recent'],
    staleTime: 2 * 60 * 1000,
  });

  // Simplified quick actions based on priority
  const quickActions: QuickAction[] = useMemo(() => {
    const actions: QuickAction[] = [];

    // High priority actions
    if (dashboardStats?.urgentCount && dashboardStats.urgentCount > 0) {
      actions.push({
        id: 'urgent-review',
        title: 'Review Urgent Items',
        description: `${dashboardStats.urgentCount} items need immediate attention`,
        icon: <AlertTriangle className="h-4 w-4" />,
        priority: 'high',
        count: dashboardStats.urgentCount,
        action: () => setLocation('/documents?status=pending_approval&urgent=true')
      });
    }

    if (dashboardStats?.pending && dashboardStats.pending > 0) {
      actions.push({
        id: 'pending-review',
        title: 'Pending Reviews',
        description: `${dashboardStats.pending} documents awaiting review`,
        icon: <CheckCircle2 className="h-4 w-4" />,
        priority: 'medium',
        count: dashboardStats.pending,
        action: () => setLocation('/documents?status=pending_approval')
      });
    }

    // Always available actions
    actions.push({
      id: 'create-doc',
      title: 'Create Document',
      description: 'Start a new compliance document',
      icon: <Plus className="h-4 w-4" />,
      priority: 'low',
      action: () => setLocation('/documents?action=create')
    });

    return actions.slice(0, 3); // Limit to 3 actions
  }, [dashboardStats, setLocation]);

  // Recent activity with smart filtering
  const recentActivity = useMemo(() => {
    return recentDocuments.slice(0, 4).map(doc => ({
      id: `doc-${doc.id}`,
      title: doc.title,
      subtitle: `Updated ${formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}`,
      status: doc.status,
      icon: <FileText className="h-4 w-4" />
    }));
  }, [recentDocuments]);

  const handleCreateDocument = () => {
    setLocation('/documents?action=create');
  };

  if (statsLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section - Search Centric */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{getTimeBasedGreeting()}</h1>
          </div>
          <p className="text-lg text-slate-600 mb-6 max-w-2xl">
            Start by searching for what you need. All actions flow from here.
          </p>
          
          {/* Primary Search Bar */}
          <div className="max-w-2xl">
            <EnhancedDocumentSearch 
              placeholder="Search documents, create new ones, or navigate anywhere..."
              className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg"
              maxResults={8}
              showQuickActions={true}
            />
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-200/30 to-blue-200/30"></div>
      </div>

      {/* Minimal Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{dashboardStats?.documents || 0}</div>
                <div className="text-sm text-slate-500">Documents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{dashboardStats?.pending || 0}</div>
                <div className="text-sm text-slate-500">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">{dashboardStats?.complianceRate || 0}%</div>
                <div className="text-sm text-slate-500">Compliance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Only if there are urgent items */}
      {quickActions.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 flex flex-col items-start gap-3 hover:shadow-md transition-all duration-200",
                    action.priority === 'high' && "border-red-200 bg-red-50 hover:bg-red-100",
                    action.priority === 'medium' && "border-amber-200 bg-amber-50 hover:bg-amber-100",
                    action.priority === 'low' && "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  )}
                  onClick={action.action}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className={cn(
                      "p-2 rounded-lg",
                      action.priority === 'high' && "bg-red-100 text-red-600",
                      action.priority === 'medium' && "bg-amber-100 text-amber-600",
                      action.priority === 'low' && "bg-slate-100 text-slate-600"
                    )}>
                      {action.icon}
                    </span>
                    {action.count && (
                      <Badge variant="secondary" className="ml-auto">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity - Simplified */}
      {recentActivity.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-emerald-600" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-600">{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{activity.title}</div>
                    <div className="text-sm text-slate-500">{activity.subtitle}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Action */}
      <div className="flex justify-center">
        <Button onClick={handleCreateDocument} className="shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New Document
        </Button>
      </div>
    </div>
  );
}