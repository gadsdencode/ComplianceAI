import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  TrendingUp,
  Users,
  Star,
  Download,
  Edit3,
  Eye
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DashboardStats, Document, UserDocument, ComplianceDeadline } from '@/types';

interface SimplifiedDashboardProps {
  className?: string;
}

interface QuickActionItem {
  id: number;
  title: string;
  type: 'document' | 'deadline' | 'signature';
  status: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  action: string;
  actionLabel: string;
}

export default function SimplifiedDashboard({ className }: SimplifiedDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [, navigate] = useLocation();

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: pendingDocuments = [] } = useQuery<Document[]>({
    queryKey: ['/api/documents', { status: 'pending_approval' }],
  });

  const { data: userDocuments = [] } = useQuery<UserDocument[]>({
    queryKey: ['/api/user-documents'],
  });

  const { data: upcomingDeadlines = [] } = useQuery<ComplianceDeadline[]>({
    queryKey: ['/api/compliance-deadlines', { upcoming: true }],
  });

  // Create unified quick actions
  const quickActions: QuickActionItem[] = useMemo(() => {
    const actions: QuickActionItem[] = [];

    // Add pending compliance documents
    pendingDocuments.slice(0, 3).forEach(doc => {
      actions.push({
        id: doc.id,
        title: doc.title,
        type: 'document',
        status: doc.status,
        priority: doc.deadline && new Date(doc.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'high' : 'medium',
        dueDate: doc.deadline,
        action: 'review',
        actionLabel: 'Review & Approve'
      });
    });

    // Add draft user documents
    userDocuments
      .filter(doc => doc.status === 'draft')
      .slice(0, 3)
      .forEach(doc => {
        actions.push({
          id: doc.id,
          title: doc.title,
          type: 'document',
          status: doc.status,
          priority: 'medium',
          action: 'complete',
          actionLabel: 'Complete Draft'
        });
      });

    // Add upcoming deadlines
    upcomingDeadlines.slice(0, 3).forEach(deadline => {
      actions.push({
        id: deadline.id,
        title: deadline.title,
        type: 'deadline',
        status: deadline.status,
        priority: new Date(deadline.deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? 'high' : 'medium',
        dueDate: deadline.deadline,
        action: 'view',
        actionLabel: 'View Details'
      });
    });

    return actions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [pendingDocuments, userDocuments, upcomingDeadlines]);

  // Filter quick actions based on search
  const filteredQuickActions = useMemo(() => {
    if (!searchQuery.trim()) return quickActions;
    
    const query = searchQuery.toLowerCase();
    return quickActions.filter(action => 
      action.title.toLowerCase().includes(query) ||
      action.actionLabel.toLowerCase().includes(query)
    );
  }, [quickActions, searchQuery]);

  const handleQuickAction = (action: QuickActionItem) => {
    switch (action.type) {
      case 'document':
        if (action.action === 'review') {
          navigate(`/documents/${action.id}?action=review`);
        } else if (action.action === 'complete') {
          navigate(`/documents/${action.id}?action=edit`);
        }
        break;
      case 'deadline':
        navigate(`/compliance/deadlines/${action.id}`);
        break;
      case 'signature':
        navigate(`/documents/${action.id}?action=sign`);
        break;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: 'document' | 'deadline' | 'signature') => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'deadline': return <Calendar className="h-4 w-4" />;
      case 'signature': return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-600">Your compliance overview and quick actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => navigate('/documents')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Document
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search your tasks, documents, and deadlines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Documents</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoadingStats ? '...' : dashboardStats?.documents || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Actions</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoadingStats ? '...' : dashboardStats?.pending || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoadingStats ? '...' : `${dashboardStats?.complianceRate || 0}%`}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Urgent Items</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoadingStats ? '...' : dashboardStats?.urgentCount || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Quick Actions</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="calendar">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredQuickActions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-sm">No pending actions at the moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuickActions.map((action) => (
                    <div
                      key={`${action.type}-${action.id}`}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-sm",
                        getPriorityColor(action.priority)
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(action.priority)}
                          {getTypeIcon(action.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{action.title}</h4>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <Badge variant="outline" className="text-xs">
                              {action.type}
                            </Badge>
                            {action.dueDate && (
                              <span>Due {format(new Date(action.dueDate), 'MMM d')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(action)}
                        className="ml-4"
                      >
                        {action.actionLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...pendingDocuments, ...userDocuments]
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 5)
                  .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-slate-600" />
                        <div>
                          <h4 className="font-medium text-slate-900">{doc.title}</h4>
                          <p className="text-sm text-slate-600">
                            Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {doc.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 5).map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-slate-600" />
                      <div>
                        <h4 className="font-medium text-slate-900">{deadline.title}</h4>
                        <p className="text-sm text-slate-600">
                          Due {format(new Date(deadline.deadline), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {deadline.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/compliance/deadlines/${deadline.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
