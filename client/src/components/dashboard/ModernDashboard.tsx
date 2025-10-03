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
  Activity
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

// Mock data - replace with actual API calls
const mockDashboardData = {
  stats: {
    totalDocuments: 1247,
    pendingReview: 23,
    approved: 1189,
    overdue: 5,
    thisWeek: 12,
    thisMonth: 47
  },
  recentDocuments: [
    {
      id: 1,
      title: "Q4 Compliance Report",
      status: "review",
      author: "Sarah Johnson",
      lastModified: "2 hours ago",
      priority: "high",
      category: "Financial"
    },
    {
      id: 2,
      title: "Safety Protocol Update",
      status: "approved",
      author: "Mike Chen",
      lastModified: "1 day ago",
      priority: "medium",
      category: "Safety"
    },
    {
      id: 3,
      title: "Employee Handbook 2024",
      status: "draft",
      author: "Emily Davis",
      lastModified: "3 days ago",
      priority: "low",
      category: "HR"
    },
    {
      id: 4,
      title: "Data Privacy Policy",
      status: "overdue",
      author: "Alex Rodriguez",
      lastModified: "1 week ago",
      priority: "high",
      category: "Legal"
    }
  ],
  upcomingDeadlines: [
    {
      id: 1,
      title: "Annual Compliance Review",
      dueDate: "2024-02-15",
      daysLeft: 5,
      priority: "high",
      assignee: "Sarah Johnson"
    },
    {
      id: 2,
      title: "Safety Training Documentation",
      dueDate: "2024-02-20",
      daysLeft: 10,
      priority: "medium",
      assignee: "Mike Chen"
    },
    {
      id: 3,
      title: "Financial Audit Preparation",
      dueDate: "2024-02-25",
      daysLeft: 15,
      priority: "high",
      assignee: "Emily Davis"
    }
  ],
  teamActivity: [
    {
      id: 1,
      user: "Sarah Johnson",
      action: "approved",
      document: "Q4 Compliance Report",
      timestamp: "2 hours ago",
      avatar: "/avatars/sarah.jpg"
    },
    {
      id: 2,
      user: "Mike Chen",
      action: "created",
      document: "Safety Protocol Update",
      timestamp: "4 hours ago",
      avatar: "/avatars/mike.jpg"
    },
    {
      id: 3,
      user: "Emily Davis",
      action: "reviewed",
      document: "Employee Handbook 2024",
      timestamp: "1 day ago",
      avatar: "/avatars/emily.jpg"
    }
  ]
};

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

  // Mock API calls - replace with actual queries
  const { data: dashboardData = mockDashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
            <div className="text-2xl font-bold text-slate-900">{dashboardData.stats.totalDocuments.toLocaleString()}</div>
            <p className="text-xs text-slate-600 mt-1">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{dashboardData.stats.pendingReview}</div>
            <p className="text-xs text-slate-600 mt-1">
              <span className="text-yellow-600">3</span> high priority
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{dashboardData.stats.approved}</div>
            <p className="text-xs text-slate-600 mt-1">
              <span className="text-green-600">95.3%</span> approval rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{dashboardData.stats.overdue}</div>
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
                  const count = status === 'draft' ? 35 : 
                               status === 'review' ? dashboardData.stats.pendingReview :
                               status === 'approved' ? dashboardData.stats.approved :
                               status === 'published' ? 890 : dashboardData.stats.overdue;
                  const percentage = (count / dashboardData.stats.totalDocuments) * 100;
                  
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
            {dashboardData.recentDocuments.map((doc) => {
              const statusInfo = statusConfig[doc.status as keyof typeof statusConfig];
              const priorityInfo = priorityConfig[doc.priority as keyof typeof priorityConfig];
              
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
                          <Badge variant="outline" className={priorityInfo?.color || "bg-slate-100 text-slate-800"}>
                            {priorityInfo?.label || doc.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>By {doc.author}</span>
                          <span>•</span>
                          <span>{doc.lastModified}</span>
                          <span>•</span>
                          <span>{doc.category}</span>
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
            })}
          </div>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {dashboardData.upcomingDeadlines.map((deadline) => (
              <Card key={deadline.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{deadline.title}</h3>
                        <Badge className={priorityConfig[deadline.priority as keyof typeof priorityConfig]?.color || "bg-slate-100 text-slate-800"}>
                          {priorityConfig[deadline.priority as keyof typeof priorityConfig]?.label || deadline.priority}
                        </Badge>
                        {deadline.daysLeft <= 7 && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle size={12} className="mr-1" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>Due: {new Date(deadline.dueDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Assigned to: {deadline.assignee}</span>
                        <span>•</span>
                        <span className={deadline.daysLeft <= 7 ? "text-red-600 font-medium" : ""}>
                          {deadline.daysLeft} days left
                        </span>
                      </div>
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="space-y-4">
            {dashboardData.teamActivity.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activity.avatar} />
                      <AvatarFallback>{(activity.user || 'Unknown').split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user || 'Unknown User'}</span>{" "}
                        <span className="text-slate-600">{activity.action}</span>{" "}
                        <span className="font-medium">{activity.document}</span>
                      </p>
                      <p className="text-xs text-slate-500">{activity.timestamp}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleViewDocument(activity.id)}>
                      <Eye size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
