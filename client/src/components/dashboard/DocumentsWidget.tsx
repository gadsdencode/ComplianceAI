import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  FileText, 
  Clock,
  Star,
  Eye,
  ExternalLink,
  FolderPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Document, UserDocument, Template } from '@/types';

interface DocumentsWidgetProps {
  className?: string;
}

export default function DocumentsWidget({ className }: DocumentsWidgetProps) {
  const [activeTab, setActiveTab] = useState('recent');
  const [, navigate] = useLocation();

  // Fetch recent documents for quick access
  const { data: recentDocuments = [], error: recentError } = useQuery<(Document | UserDocument)[]>({
    queryKey: ['/api/documents/recent'],
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: starredDocuments = [], error: starredError } = useQuery<(Document | UserDocument)[]>({
    queryKey: ['/api/documents/starred'],
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: templates = [], error: templatesError } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleViewDocument = (doc: Document | UserDocument) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleViewAllDocuments = () => {
    navigate('/documents');
  };

  const handleCreateDocument = () => {
    navigate('/documents');
  };

  const handleUseTemplate = (template: Template) => {
    // Navigate to document creation with template
    navigate(`/documents?template=${template.id}`);
  };

  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            Documents
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewAllDocuments}
            className="text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="recent" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="starred" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Starred
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-3">
            {recentError ? (
              <div className="text-center py-4 text-red-600">
                <p className="text-sm">Error loading recent documents</p>
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <FileText className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No recent documents</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDocuments.slice(0, 4).map((doc) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <FileText className="h-3 w-3 text-slate-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      {doc.status}
                    </Badge>
                    <Eye className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="starred" className="space-y-3">
            {starredError ? (
              <div className="text-center py-4 text-red-600">
                <p className="text-sm">Error loading starred documents</p>
              </div>
            ) : starredDocuments.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Star className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No starred documents</p>
                <p className="text-xs">Star documents to access them quickly</p>
              </div>
            ) : (
              <div className="space-y-2">
                {starredDocuments.slice(0, 4).map((doc) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                        <p className="text-xs text-slate-500">
                          Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      {doc.status}
                    </Badge>
                    <Eye className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-3">
            {templatesError ? (
              <div className="text-center py-4 text-red-600">
                <p className="text-sm">Error loading templates</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <FileText className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No templates available</p>
                <p className="text-xs">Create templates to speed up document creation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.slice(0, 4).map((template) => (
                  <div 
                    key={template.id} 
                    className="p-2 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer group"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-slate-900 truncate flex-1">{template.name}</h4>
                      <Badge variant="outline" className="text-xs ml-2">
                        Template
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                      {template.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                      </span>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        Use
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs"
              onClick={handleCreateDocument}
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Document
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs"
              onClick={handleViewAllDocuments}
            >
              <FolderPlus className="h-3 w-3 mr-1" />
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
