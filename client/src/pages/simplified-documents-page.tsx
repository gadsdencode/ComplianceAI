import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import UnifiedDocumentManager from '@/components/documents/UnifiedDocumentManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  FileText, 
  FolderPlus,
  Filter,
  Grid3X3,
  List,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Document, UserDocument, Template } from '@/types';

export default function SimplifiedDocumentsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch recent documents for quick access
  const { data: recentDocuments = [] } = useQuery<(Document | UserDocument)[]>({
    queryKey: ['/api/documents/recent'],
  });

  const { data: starredDocuments = [] } = useQuery<(Document | UserDocument)[]>({
    queryKey: ['/api/documents/starred'],
  });

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  return (
    <DashboardLayout pageTitle="Documents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
            <p className="text-slate-600 mt-1">Manage all your documents, templates, and signatures</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </div>
        </div>

        {/* Quick Access Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <UnifiedDocumentManager />
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recently Accessed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentDocuments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>No recent documents</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentDocuments.slice(0, 10).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-slate-600" />
                          <div>
                            <h4 className="font-medium text-slate-900">{doc.title}</h4>
                            <p className="text-sm text-slate-600">
                              Accessed {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="starred" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Starred Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {starredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Star className="mx-auto h-12 w-12 mb-4" />
                    <p>No starred documents</p>
                    <p className="text-sm">Star documents to access them quickly</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {starredDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <div>
                            <h4 className="font-medium text-slate-900">{doc.title}</h4>
                            <p className="text-sm text-slate-600">
                              Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>No templates available</p>
                    <p className="text-sm">Create templates to speed up document creation</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <div key={template.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-slate-900">{template.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            Template
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          {template.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                          </span>
                          <Button size="sm" variant="outline">
                            Use Template
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
