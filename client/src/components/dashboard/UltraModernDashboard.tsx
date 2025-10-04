import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  Search,
  Calendar,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface DashboardStats {
  documents: number;
  pending: number;
  complianceRate: number;
  expiringCount: number;
  docsCreatedLastMonth: number;
  urgentCount: number;
  lastMonthComplianceChange: string;
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

interface InsightCard {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function UltraModernDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentDocuments = [] } = useQuery({
    queryKey: ['/api/documents/recent'],
    staleTime: 2 * 60 * 1000,
  });

  const { data: upcomingDeadlines = [] } = useQuery({
    queryKey: ['/api/compliance-deadlines', { upcoming: true }],
    staleTime: 5 * 60 * 1000,
  });

  // Smart insights based on data
  const insights: InsightCard[] = useMemo(() => {
    if (!dashboardStats) return [];
    
    return [
      {
        title: "Compliance Health",
        value: `${dashboardStats.complianceRate}%`,
        trend: dashboardStats.complianceRate > 80 ? 'up' : dashboardStats.complianceRate > 60 ? 'stable' : 'down',
        trendValue: dashboardStats.lastMonthComplianceChange,
        icon: <Shield className="h-5 w-5" />,
        color: dashboardStats.complianceRate > 80 ? 'text-emerald-600' : dashboardStats.complianceRate > 60 ? 'text-amber-600' : 'text-red-600',
        bgColor: dashboardStats.complianceRate > 80 ? 'bg-emerald-50' : dashboardStats.complianceRate > 60 ? 'bg-amber-50' : 'bg-red-50'
      },
      {
        title: "Active Documents",
        value: dashboardStats.documents.toString(),
        trend: dashboardStats.docsCreatedLastMonth > 0 ? 'up' : 'stable',
        trendValue: `+${dashboardStats.docsCreatedLastMonth} this month`,
        icon: <FileText className="h-5 w-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: "Attention Needed",
        value: dashboardStats.pending.toString(),
        trend: dashboardStats.pending > 0 ? 'down' : 'stable',
        trendValue: `${dashboardStats.urgentCount} urgent`,
        icon: <Target className="h-5 w-5" />,
        color: dashboardStats.pending > 0 ? 'text-amber-600' : 'text-emerald-600',
        bgColor: dashboardStats.pending > 0 ? 'bg-amber-50' : 'bg-emerald-50'
      }
    ];
  }, [dashboardStats]);

  // Smart quick actions based on priority
  const quickActions: QuickAction[] = useMemo(() => {
    const actions: QuickAction[] = [];

    // High priority actions
    if (dashboardStats?.urgentCount > 0) {
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

    if (dashboardStats?.expiringCount > 0) {
      actions.push({
        id: 'expiring-docs',
        title: 'Expiring Documents',
        description: `${dashboardStats.expiringCount} documents expiring soon`,
        icon: <Clock className="h-4 w-4" />,
        priority: 'high',
        count: dashboardStats.expiringCount,
        action: () => setLocation('/documents?status=expiring')
      });
    }

    // Medium priority actions
    if (dashboardStats?.pending > 0) {
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

    return actions.slice(0, 4); // Limit to 4 actions
  }, [dashboardStats, setLocation]);

  // Recent activity with smart filtering
  const recentActivity = useMemo(() => {
    const activities = [
      ...recentDocuments.slice(0, 3).map(doc => ({
        id: `doc-${doc.id}`,
        type: 'document' as const,
        title: doc.title,
        subtitle: `Updated ${formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}`,
        status: doc.status,
        icon: <FileText className="h-4 w-4" />
      })),
      ...upcomingDeadlines.slice(0, 2).map(deadline => ({
        id: `deadline-${deadline.id}`,
        type: 'deadline' as const,
        title: deadline.title,
        subtitle: `Due ${format(new Date(deadline.deadline), 'MMM d')}`,
        status: deadline.status,
        icon: <Calendar className="h-4 w-4" />
      }))
    ];

    return activities.sort((a, b) => {
      // Prioritize urgent items
      if (a.status === 'urgent' && b.status !== 'urgent') return -1;
      if (b.status === 'urgent' && a.status !== 'urgent') return 1;
      return 0;
    });
  }, [recentDocuments, upcomingDeadlines]);

  const handleCreateDocument = () => {
    setLocation('/documents?action=create');
  };

  const handleViewAllDocuments = () => {
    setLocation('/documents');
  };

  const handleGenerateReport = () => {
    toast({
      title: "Report Generated",
      description: "Your compliance report is ready for download.",
    });
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
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Good morning!</h1>
          </div>
          <p className="text-lg text-slate-600 mb-6 max-w-2xl">
            Here's your compliance overview. {dashboardStats?.pending > 0 
              ? `${dashboardStats.pending} items need your attention.` 
              : 'Everything looks great!'}
          </p>
          
          {/* Quick Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search documents, deadlines..."
              className="pl-10 bg-white/80 backdrop-blur-sm border-white/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-200/30 to-blue-200/30"></div>
      </div>

      {/* Smart Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {insights.map((insight, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", insight.bgColor)}>
                  <span className={insight.color}>{insight.icon}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{insight.value}</div>
                  <div className="text-sm text-slate-500">{insight.title}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{insight.trendValue}</span>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  insight.trend === 'up' ? 'text-emerald-600 bg-emerald-50' :
                  insight.trend === 'down' ? 'text-red-600 bg-red-50' :
                  'text-slate-600 bg-slate-50'
                )}>
                  <TrendingUp className={cn(
                    "h-3 w-3",
                    insight.trend === 'down' && 'rotate-180'
                  )} />
                  {insight.trend}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              Quick Actions
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleViewAllDocuments}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity) => (
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
              )) : (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-900 mb-2">No recent activity</h3>
                  <p className="text-sm text-slate-500">Activity will appear here as you work</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Progress */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              Compliance Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Overall Compliance</span>
                  <span className="text-sm font-bold text-slate-900">{dashboardStats?.complianceRate || 0}%</span>
                </div>
                <Progress 
                  value={dashboardStats?.complianceRate || 0} 
                  className="h-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-900">{dashboardStats?.documents || 0}</div>
                  <div className="text-xs text-blue-600">Total Documents</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-50">
                  <div className="text-2xl font-bold text-amber-900">{dashboardStats?.pending || 0}</div>
                  <div className="text-xs text-amber-600">Pending Review</div>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGenerateReport}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleCreateDocument} className="shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New Document
        </Button>
        <Button variant="outline" onClick={() => setLocation('/analytics')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          View Analytics
        </Button>
        <Button variant="outline" onClick={() => setLocation('/calendar')}>
          <Calendar className="h-4 w-4 mr-2" />
          View Calendar
        </Button>
      </div>
    </div>
  );
}
