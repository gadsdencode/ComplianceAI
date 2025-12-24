import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  Calendar,
  Plus,
  Eye,
  Edit3,
  Download,
  Share2,
  Filter,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  FileCheck,
  UserCheck,
  Clock3,
  AlertTriangle,
  CheckSquare,
  BarChart3,
  PieChart,
  Activity,
  Bell
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";

// Real data will be fetched from API endpoints

const statusConfig = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-800", icon: Edit3 },
  review: { label: "In Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  published: { label: "Published", color: "bg-blue-100 text-blue-800", icon: FileCheck },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800", icon: AlertTriangle }
};

const priorityConfig = {
  high: { label: "High", color: "bg-red-100 text-red-800" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  low: { label: "Low", color: "bg-green-100 text-green-800" }
};

export default function ModernDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [, setLocation] = useLocation();

  // Real API calls
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: recentDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents/recent'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: upcomingDeadlines, isLoading: deadlinesLoading } = useQuery({
    queryKey: ['/api/compliance-deadlines', { upcoming: true }],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/notifications'],
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const isLoading = statsLoading || documentsLoading || deadlinesLoading || notificationsLoading;

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <config.icon size={16} /> : <FileText size={16} />;
  };

  const getPriorityColor = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return config ? config.color : "bg-slate-100 text-slate-800";
  };

  // Dashboard action handlers
  const handleCreateDocument = () => {
    setLocation('/documents?action=create');
  };

  const handleShareReport = () => {
    toast({
      title: "Report Shared",
      description: "Dashboard report has been shared successfully.",
    });
  };

  const handleViewDocument = (docId: number) => {
    setLocation(`/documents/${docId}`);
  };

  const handleEditDocument = (docId: number) => {
    setLocation(`/documents/${docId}?mode=edit`);
  };

  const handleDownloadDocument = (docId: number) => {
    toast({
      title: "Download Started",
      description: "Document download has started.",
    });
  };

  const handleViewDeadlineDetails = (deadlineId: number) => {
    setLocation(`/calendar?deadline=${deadlineId}`);
  };

  const handleReviewPendingDocuments = () => {
    setLocation('/documents?status=review');
  };

  const handleViewUpcomingDeadlines = () => {
    setLocation('/calendar');
  };

  const handleGenerateComplianceReport = () => {
    toast({
      title: "Report Generated",
      description: "Compliance report is being generated and will be available shortly.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening with your documents.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-primary-600 hover:bg-primary-700" onClick={handleCreateDocument}>
            <Plus size={16} className="mr-2" />
            Create Document
          </Button>
          <Button variant="outline" onClick={handleShareReport}>
            <Share2 size={16} className="mr-2" />
            Share Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{dashboardStats?.documents?.toLocaleString() || 0}</div>
            <p className="text-xs text-slate-600 mt-1">
              <span className="text-green-600">+{dashboardStats?.docsCreatedLastMonth || 0}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{dashboardStats?.pending || 0}</div>
            <p className="text-xs text-slate-600 mt-1">
              <span className="text-yellow-600">{dashboardStats?.urgentCount || 0}</span> urgent
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Compliance Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{dashboardStats?.complianceRate || 0}%</div>
            <p className="text-xs text-slate-600 mt-1">
              <span className="text-green-600">{dashboardStats?.lastMonthComplianceChange || '+0%'}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{dashboardStats?.expiringCount || 0}</div>
            <p className="text-xs text-slate-600 mt-1">
              <span className="text-red-600">Requires attention</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Recent Documents</TabsTrigger>
          <TabsTrigger value="deadlines">Upcoming Deadlines</TabsTrigger>
          <TabsTrigger value="activity">Team Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart size={20} />
                  Document Status Overview
                </CardTitle>
                <CardDescription>Current distribution of document statuses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(statusConfig).map(([status, config]) => {
                  // Map database statuses to display statuses
                  let count = 0;
                  if (recentDocuments) {
                    count = recentDocuments.filter(doc => {
                      switch (status) {
                        case 'draft':
                          return doc.status === 'draft';
                        case 'review':
                          return doc.status === 'pending_approval';
                        case 'approved':
                          return doc.status === 'active';
                        case 'published':
                          return doc.status === 'active'; // Treat active as published
                        case 'overdue':
                          return doc.status === 'expired';
                        default:
                          return false;
                      }
                    }).length;
                  }
                  
                  const totalDocs = dashboardStats?.documents || 1;
                  const percentage = (count / totalDocs) * 100;
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", config.color)}>
                          <config.icon size={16} />
                        </div>
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-slate-600">{count} documents</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{percentage.toFixed(1)}%</p>
                        <Progress value={percentage} className="w-20 h-2" />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={20} />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleCreateDocument}>
                  <Plus size={16} className="mr-3" />
                  Create New Document
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleReviewPendingDocuments}>
                  <FileCheck size={16} className="mr-3" />
                  Review Pending Documents
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleViewUpcomingDeadlines}>
                  <Calendar size={16} className="mr-3" />
                  View Upcoming Deadlines
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleGenerateComplianceReport}>
                  <BarChart3 size={16} className="mr-3" />
                  Generate Compliance Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 size={16} />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {recentDocuments && recentDocuments.length > 0 ? recentDocuments.map((doc) => {
              // Map database status to display status
              const displayStatus = doc.status === 'pending_approval' ? 'review' : 
                                  doc.status === 'active' ? 'approved' : 
                                  doc.status === 'expired' ? 'overdue' : doc.status;
              
              const statusInfo = statusConfig[displayStatus as keyof typeof statusConfig];
              
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                          <Badge className={statusInfo?.color || "bg-slate-100 text-slate-800"}>
                            {statusInfo?.label || doc.status}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-100 text-slate-800">
                            {doc.category || 'General'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>Version {doc.version}</span>
                          <span>•</span>
                          <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{doc.category || 'General'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc.id)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditDocument(doc.id)}>
                          <Edit3 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc.id)}>
                          <Download size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No recent documents</h3>
                  <p className="text-slate-600">Create your first document to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {upcomingDeadlines && upcomingDeadlines.length > 0 ? upcomingDeadlines.map((deadline) => {
              const daysLeft = Math.ceil((new Date(deadline.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 7;
              
              return (
                <Card key={deadline.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{deadline.title}</h3>
                          <Badge className={deadline.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                         deadline.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                         deadline.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}>
                            {deadline.status.replace('_', ' ')}
                          </Badge>
                          {isUrgent && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle size={12} className="mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>Due: {new Date(deadline.deadline).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Type: {deadline.type}</span>
                          <span>•</span>
                          <span className={isUrgent ? "text-red-600 font-medium" : ""}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                          </span>
                        </div>
                        {deadline.description && (
                          <p className="text-sm text-slate-600 mt-2">{deadline.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDeadlineDetails(deadline.id)}>
                          <Calendar size={16} className="mr-2" />
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar size={48} className="mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming deadlines</h3>
                  <p className="text-slate-600">All caught up! No deadlines approaching.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="space-y-4">
            {notifications && notifications.length > 0 ? notifications.slice(0, 10).map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{(notification.title || 'N').split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{notification.title || 'Notification'}</span>
                        {notification.message && (
                          <>
                            {" "}
                            <span className="text-slate-600">{notification.message}</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Bell size={48} className="mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No recent activity</h3>
                  <p className="text-slate-600">Activity will appear here as you work with documents.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

