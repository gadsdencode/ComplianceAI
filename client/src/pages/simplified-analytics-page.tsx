import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Users,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Document, Signature, AuditTrail, ComplianceDeadline } from '@/types';

export default function SimplifiedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch analytics data
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const { data: signatures = [], isLoading: isLoadingSignatures } = useQuery<Signature[]>({
    queryKey: ['/api/signatures'],
  });

  const { data: auditTrail = [], isLoading: isLoadingAudit } = useQuery<AuditTrail[]>({
    queryKey: ['/api/audit-trail'],
  });

  const { data: deadlines = [], isLoading: isLoadingDeadlines } = useQuery<ComplianceDeadline[]>({
    queryKey: ['/api/compliance-deadlines'],
  });

  // Calculate metrics
  const metrics = {
    totalDocuments: documents.length,
    pendingSignatures: signatures.filter(s => s.status === 'pending').length,
    completedSignatures: signatures.filter(s => s.status === 'completed').length,
    overdueDeadlines: deadlines.filter(d => new Date(d.deadline) < new Date() && d.status !== 'completed').length,
    complianceRate: documents.length > 0 ? Math.round((documents.filter(d => d.status === 'active').length / documents.length) * 100) : 0,
    avgProcessingTime: 2.5, // This would be calculated from audit trail
    monthlyGrowth: 12.5 // This would be calculated from historical data
  };

  const recentActivity = auditTrail
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created': return <FileText className="h-4 w-4" />;
      case 'signed': return <CheckCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'updated': return <Clock className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout pageTitle="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Analytics & Reports</h1>
            <p className="text-slate-600">Track compliance metrics and system activity</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Documents</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics.totalDocuments}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{metrics.monthlyGrowth}% this month
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
                  <p className="text-sm font-medium text-slate-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics.complianceRate}%</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5% from last month
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Signatures</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics.pendingSignatures}</p>
                  <p className="text-xs text-yellow-600 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Avg {metrics.avgProcessingTime} days
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
                  <p className="text-sm font-medium text-slate-600">Overdue Items</p>
                  <p className="text-2xl font-bold text-slate-900">{metrics.overdueDeadlines}</p>
                  <p className="text-xs text-red-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Needs attention
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Document Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Document Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['active', 'pending_approval', 'draft', 'expired'].map((status) => {
                      const count = documents.filter(d => d.status === status).length;
                      const percentage = documents.length > 0 ? Math.round((count / documents.length) * 100) : 0;
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[1]}`} />
                            <span className="text-sm font-medium capitalize">
                              {status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-600">{count}</span>
                            <span className="text-xs text-slate-500">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        {getActivityIcon(activity.action)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {activity.action} - {activity.documentTitle}
                          </p>
                          <p className="text-xs text-slate-600">
                            by {activity.userName} • {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        {getActivityIcon(activity.action)}
                        <div>
                          <h4 className="font-medium text-slate-900">
                            {activity.action} - {activity.documentTitle}
                          </h4>
                          <p className="text-sm text-slate-600">
                            by {activity.userName} • {format(new Date(activity.timestamp), 'PPP p')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signatures" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Signature Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {signatures.map((signature) => (
                    <div key={signature.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-slate-600" />
                        <div>
                          <h4 className="font-medium text-slate-900">{signature.documentTitle}</h4>
                          <p className="text-sm text-slate-600">
                            {signature.signerName} • {format(new Date(signature.signedAt), 'PPP')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(signature.status)}>
                        {signature.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Compliance Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deadlines.map((deadline) => (
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
                        <Badge className={getStatusColor(deadline.status)}>
                          {deadline.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
