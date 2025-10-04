import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  documents: number;
  pending: number;
  complianceRate: number;
  expiringCount: number;
  docsCreatedLastMonth: number;
  urgentCount: number;
  lastMonthComplianceChange: string;
}

interface PriorityItem {
  id: string;
  title: string;
  type: 'document' | 'deadline' | 'review';
  priority: 'critical' | 'high' | 'medium';
  dueDate?: string;
  action: () => void;
}

export default function MinimalDashboard() {
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

  // Smart priority items - only show what actually needs attention
  const priorityItems: PriorityItem[] = useMemo(() => {
    const items: PriorityItem[] = [];

    // Only show urgent items if they exist
    if (dashboardStats?.urgentCount > 0) {
      items.push({
        id: 'urgent-review',
        title: `${dashboardStats.urgentCount} Urgent Items Need Review`,
        type: 'review',
        priority: 'critical',
        action: () => setLocation('/documents?status=pending_approval&urgent=true')
      });
    }

    // Only show expiring if they exist
    if (dashboardStats?.expiringCount > 0) {
      items.push({
        id: 'expiring-docs',
        title: `${dashboardStats.expiringCount} Documents Expiring Soon`,
        type: 'deadline',
        priority: 'high',
        action: () => setLocation('/documents?status=expiring')
      });
    }

    // Only show pending if they exist and aren't already urgent
    if (dashboardStats?.pending > 0 && dashboardStats.urgentCount === 0) {
      items.push({
        id: 'pending-review',
        title: `${dashboardStats.pending} Documents Pending Review`,
        type: 'review',
        priority: 'medium',
        action: () => setLocation('/documents?status=pending_approval')
      });
    }

    return items;
  }, [dashboardStats, setLocation]);

  // Get the most important metric to highlight
  const primaryMetric = useMemo(() => {
    if (!dashboardStats) return null;

    // If compliance is low, that's the most important
    if (dashboardStats.complianceRate < 70) {
      return {
        title: 'Compliance Rate',
        value: `${dashboardStats.complianceRate}%`,
        status: 'critical',
        description: 'Below target - immediate attention needed',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    // If there are urgent items, highlight that
    if (dashboardStats.urgentCount > 0) {
      return {
        title: 'Urgent Items',
        value: dashboardStats.urgentCount.toString(),
        status: 'urgent',
        description: 'Items requiring immediate attention',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
      };
    }

    // If there are pending items, highlight that
    if (dashboardStats.pending > 0) {
      return {
        title: 'Pending Review',
        value: dashboardStats.pending.toString(),
        status: 'pending',
        description: 'Documents awaiting your review',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }

    // Everything is good
    return {
      title: 'All Good!',
      value: '✓',
      status: 'good',
      description: 'No immediate actions required',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    };
  }, [dashboardStats]);

  const handleCreateDocument = () => {
    setLocation('/documents?action=create');
  };

  const handleViewAllDocuments = () => {
    setLocation('/documents');
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="h-32 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-lg text-slate-600">
          {priorityItems.length > 0 
            ? `${priorityItems.length} item${priorityItems.length > 1 ? 's' : ''} need${priorityItems.length === 1 ? 's' : ''} your attention`
            : 'Welcome back! Here\'s what\'s happening with your documents.'
          }
        </p>
      </div>

      {/* Primary Metric - Only show if there's something important */}
      {primaryMetric && (
        <Card className={cn("border-2 shadow-lg", primaryMetric.borderColor)}>
          <CardContent className="p-8 text-center">
            <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-full mb-4", primaryMetric.bgColor)}>
              <span className={cn("text-2xl font-bold", primaryMetric.color)}>
                {primaryMetric.value}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{primaryMetric.title}</h2>
            <p className="text-slate-600 mb-6">{primaryMetric.description}</p>
            
            {primaryMetric.status !== 'good' && (
              <Button 
                size="lg" 
                className="bg-slate-900 hover:bg-slate-800"
                onClick={() => {
                  if (primaryMetric.status === 'critical' || primaryMetric.status === 'urgent') {
                    setLocation('/documents?status=pending_approval&urgent=true');
                  } else if (primaryMetric.status === 'pending') {
                    setLocation('/documents?status=pending_approval');
                  }
                }}
              >
                Take Action
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Priority Items - Only show if there are any */}
      {priorityItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md",
                    item.priority === 'critical' && "border-red-200 bg-red-50",
                    item.priority === 'high' && "border-amber-200 bg-amber-50",
                    item.priority === 'medium' && "border-blue-200 bg-blue-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      item.priority === 'critical' && "bg-red-100",
                      item.priority === 'high' && "bg-amber-100",
                      item.priority === 'medium' && "bg-blue-100"
                    )}>
                      {item.type === 'review' && <CheckCircle2 className="h-4 w-4 text-slate-600" />}
                      {item.type === 'deadline' && <Clock className="h-4 w-4 text-slate-600" />}
                      {item.type === 'document' && <FileText className="h-4 w-4 text-slate-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      {item.dueDate && (
                        <p className="text-sm text-slate-600">
                          Due {formatDistanceToNow(new Date(item.dueDate), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button onClick={item.action} size="sm">
                    Review
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {dashboardStats?.documents || 0}
            </div>
            <div className="text-sm text-slate-600">Total Documents</div>
            {dashboardStats?.docsCreatedLastMonth > 0 && (
              <div className="text-xs text-emerald-600 mt-1">
                +{dashboardStats.docsCreatedLastMonth} this month
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {dashboardStats?.complianceRate || 0}%
            </div>
            <div className="text-sm text-slate-600">Compliance Rate</div>
            <div className="text-xs text-slate-500 mt-1">
              {dashboardStats?.lastMonthComplianceChange || '+0%'} from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {upcomingDeadlines.length}
            </div>
            <div className="text-sm text-slate-600">Upcoming Deadlines</div>
            <div className="text-xs text-slate-500 mt-1">Next 30 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleCreateDocument} size="lg" className="shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Document
        </Button>
        <Button variant="outline" onClick={handleViewAllDocuments} size="lg">
          <FileText className="h-4 w-4 mr-2" />
          View All Documents
        </Button>
        <Button variant="outline" onClick={() => setLocation('/analytics')} size="lg">
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </Button>
      </div>
    </div>
  );
}
