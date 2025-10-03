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
  Eye,
  ArrowRight,
  Filter,
  SortAsc,
  Bell,
  Zap,
  Target,
  Shield,
  BookOpen
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DashboardStats, Document, UserDocument, ComplianceDeadline } from '@/types';

interface EnhancedDashboardProps {
  className?: string;
}

interface TaskItem {
  id: number;
  title: string;
  type: 'document' | 'deadline' | 'signature' | 'review';
  documentType?: 'compliance' | 'user';
  status: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string;
  action: string;
  actionLabel: string;
  description?: string;
  assignee?: string;
}

interface QuickStat {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function EnhancedDashboard({ className }: EnhancedDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
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

  // Create unified task list with better categorization
  const tasks: TaskItem[] = useMemo(() => {
    const taskList: TaskItem[] = [];

    // High priority: Urgent deadlines
    upcomingDeadlines
      .filter(deadline => new Date(deadline.deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
      .forEach(deadline => {
        taskList.push({
          id: deadline.id,
          title: deadline.title,
          type: 'deadline',
          status: deadline.status,
          priority: 'urgent',
          dueDate: deadline.deadline,
          action: 'view',
          actionLabel: 'View Details',
          description: `Due in ${formatDistanceToNow(new Date(deadline.deadline))}`,
        });
      });

    // High priority: Pending approvals
    pendingDocuments.slice(0, 5).forEach(doc => {
      taskList.push({
        id: doc.id,
        title: doc.title,
        type: 'review',
        documentType: 'compliance',
        status: doc.status,
        priority: doc.deadline && new Date(doc.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'high' : 'medium',
        dueDate: doc.deadline,
        action: 'review',
        actionLabel: 'Review & Approve',
        description: 'Compliance document awaiting approval',
      });
    });

    // Medium priority: Draft documents
    userDocuments
      .filter(doc => doc.status === 'draft')
      .slice(0, 3)
      .forEach(doc => {
        taskList.push({
          id: doc.id,
          title: doc.title,
          type: 'document',
          documentType: 'user',
          status: doc.status,
          priority: 'medium',
          action: 'complete',
          actionLabel: 'Complete Draft',
          description: 'Personal document in draft status',
        });
      });

    // Low priority: Upcoming deadlines
    upcomingDeadlines
      .filter(deadline => new Date(deadline.deadline) >= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
      .slice(0, 3)
      .forEach(deadline => {
        taskList.push({
          id: deadline.id,
          title: deadline.title,
          type: 'deadline',
          status: deadline.status,
          priority: 'low',
          dueDate: deadline.deadline,
          action: 'view',
          actionLabel: 'View Details',
          description: `Due ${format(new Date(deadline.deadline), 'MMM d, yyyy')}`,
        });
      });

    return taskList.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [pendingDocuments, userDocuments, upcomingDeadlines]);

  // Filter tasks based on search and priority
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, filterPriority]);

  // Quick stats with better visual hierarchy
  const quickStats: QuickStat[] = useMemo(() => [
    {
      label: 'Pending Actions',
      value: dashboardStats?.pending || 0,
      change: '+12%',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Compliance Rate',
      value: `${dashboardStats?.complianceRate || 0}%`,
      change: '+5%',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'Urgent Items',
      value: dashboardStats?.urgentCount || 0,
      change: '-2',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-red-700',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Total Documents',
      value: dashboardStats?.documents || 0,
      change: '+8',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50'
    }
  ], [dashboardStats]);

  const handleTaskAction = (task: TaskItem) => {
    switch (task.type) {
      case 'document':
        if (task.action === 'complete') {
          navigate(`/documents/${task.id}?action=edit&type=${task.documentType}`);
        }
        break;
      case 'review':
        navigate(`/documents/${task.id}?action=review&type=${task.documentType}`);
        break;
      case 'deadline':
        navigate(`/compliance/deadlines/${task.id}`);
        break;
      case 'signature':
        navigate(`/documents/${task.id}?action=sign&type=${task.documentType}`);
        break;
    }
  };

  const getPriorityColor = (priority: 'urgent' | 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getPriorityIcon = (priority: 'urgent' | 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'urgent': return <Zap className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: 'document' | 'deadline' | 'signature' | 'review') => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'deadline': return <Calendar className="h-4 w-4" />;
      case 'signature': return <Star className="h-4 w-4" />;
      case 'review': return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Good morning!</h1>
          <p className="text-slate-600 text-lg">Here's what needs your attention today</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => navigate('/documents?action=create')} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Document
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tasks, documents, and deadlines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterPriority === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('all')}
          >
            All
          </Button>
          <Button
            variant={filterPriority === 'urgent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('urgent')}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Zap className="h-3 w-3 mr-1" />
            Urgent
          </Button>
          <Button
            variant={filterPriority === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority('high')}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            High
          </Button>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoadingStats ? '...' : stat.value}
                  </p>
                  {stat.change && (
                    <p className="text-xs text-slate-500">{stat.change} from last week</p>
                  )}
                </div>
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", stat.bgColor)}>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  My Tasks
                </CardTitle>
                <Badge variant="outline" className="text-sm">
                  {filteredTasks.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
                  <p className="text-slate-600">No tasks match your current filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <div
                      key={`${task.type}-${task.id}`}
                      className={cn(
                        "flex items-center justify-between p-5 rounded-xl border-2 transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer",
                        getPriorityColor(task.priority)
                      )}
                      onClick={() => handleTaskAction(task)}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(task.priority)}
                          {getTypeIcon(task.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-lg truncate">{task.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
                            <Badge variant="outline" className="text-xs font-medium">
                              {task.type}
                            </Badge>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="shadow-sm hover:shadow-md transition-shadow"
                        >
                          {task.actionLabel}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <Card className="border-0 shadow-sm">
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
                  .slice(0, 8)
                  .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-slate-600" />
                        </div>
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

        <TabsContent value="insights" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Document Processing</p>
                    <p className="text-xs text-blue-600">Average time to approval</p>
                  </div>
                  <p className="text-lg font-bold text-blue-900">2.3 days</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div>
                    <p className="text-sm font-medium text-green-900">Compliance Rate</p>
                    <p className="text-xs text-green-600">Current month</p>
                  </div>
                  <p className="text-lg font-bold text-green-900">94%</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                  <div>
                    <p className="text-sm font-medium text-amber-900">Pending Reviews</p>
                    <p className="text-xs text-amber-600">Requires attention</p>
                  </div>
                  <p className="text-lg font-bold text-amber-900">{dashboardStats?.pending || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-sm font-medium text-slate-900">💡 Pro Tip</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Use the search function to quickly find documents by keywords or tags.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-sm font-medium text-slate-900">⚡ Quick Action</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Press Ctrl+K to open the global search and navigate faster.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-sm font-medium text-slate-900">📊 Insight</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Documents reviewed within 24 hours have 40% higher approval rates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
