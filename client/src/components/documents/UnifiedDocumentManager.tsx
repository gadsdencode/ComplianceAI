import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Document, UserDocument, Template } from '@/types';
import { 
  Plus, 
  Search, 
  FileText, 
  Edit3, 
  Download, 
  Share2, 
  Star, 
  Copy, 
  Eye,
  Trash2,
  FolderPlus,
  Filter,
  MoreHorizontal,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UnifiedDocument {
  id: number;
  title: string;
  status: string;
  category?: string;
  updatedAt: string;
  createdAt: string;
  type: 'compliance' | 'user' | 'template';
  document: Document | UserDocument | Template;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UnifiedDocumentManagerProps {
  className?: string;
}

export default function UnifiedDocumentManager({ className }: UnifiedDocumentManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [documentType, setDocumentType] = useState<'all' | 'compliance' | 'user' | 'template'>('all');
  const [selectedDocument, setSelectedDocument] = useState<UnifiedDocument | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch paginated compliance documents
  const { 
    data: complianceResponse, 
    isLoading: isLoadingCompliance, 
    error: complianceError,
    isFetching: isFetchingCompliance
  } = useQuery<PaginatedResponse<Document>>({
    queryKey: ['/api/documents', { page, limit, status: activeTab !== 'all' ? activeTab : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (activeTab !== 'all') {
        params.set('status', activeTab);
      }
      
      const response = await fetch(`/api/documents?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }
      
      return response.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const complianceDocuments = complianceResponse?.data || [];
  const pagination = complianceResponse?.pagination;

  const { data: userDocuments = [], isLoading: isLoadingUser, error: userError } = useQuery<UserDocument[]>({
    queryKey: ['/api/user-documents'],
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: templates = [], isLoading: isLoadingTemplates, error: templatesError } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Combine and transform documents
  const unifiedDocuments: UnifiedDocument[] = useMemo(() => [
    ...complianceDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      status: doc.status,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
      type: 'compliance' as const,
      document: doc
    })),
    ...userDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      status: doc.status || 'draft',
      category: doc.category,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
      type: 'user' as const,
      document: doc
    })),
    ...templates.map(template => ({
      id: template.id,
      title: template.name,
      status: 'active',
      updatedAt: template.updatedAt,
      createdAt: template.createdAt,
      type: 'template' as const,
      document: template
    }))
  ], [complianceDocuments, userDocuments, templates]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return unifiedDocuments.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = documentType === 'all' || doc.type === documentType;
      const matchesStatus = activeTab === 'all' || doc.status === activeTab;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [unifiedDocuments, searchQuery, documentType, activeTab]);

  // Reset to page 1 when filters change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  // Quick actions
  const handleQuickAction = (action: string, document: UnifiedDocument) => {
    switch (action) {
      case 'view':
        setSelectedDocument(document);
        setIsDetailSheetOpen(true);
        break;
      case 'edit':
        if (document.type === 'user') {
          navigate(`/documents/${document.id}?action=edit`);
        } else {
          navigate(`/documents/${document.id}`);
        }
        break;
      case 'download':
        handleDownload(document);
        break;
      case 'share':
        handleShare(document);
        break;
      case 'template':
        handleCreateTemplate(document);
        break;
      case 'sign':
        navigate(`/documents/${document.id}?action=sign`);
        break;
    }
  };

  const handleDownload = (doc: UnifiedDocument) => {
    if (doc.type === 'user') {
      const userDoc = doc.document as UserDocument;
      const downloadUrl = `/api/user-documents/${userDoc.id}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', userDoc.fileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${userDoc.fileName}...`,
      });
    } else {
      toast({
        title: "Download",
        description: "Document download not yet implemented",
      });
    }
  };

  const handleShare = (doc: UnifiedDocument) => {
    const shareUrl = `${window.location.origin}/documents/${doc.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Document link copied to clipboard",
    });
  };

  const handleCreateTemplate = (doc: UnifiedDocument) => {
    toast({
      title: "Template Creation",
      description: "Template creation feature coming soon",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-yellow-100 text-yellow-800",
      pending_approval: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      approved: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      archived: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: 'compliance' | 'user' | 'template') => {
    const variants = {
      compliance: "bg-purple-100 text-purple-800",
      user: "bg-orange-100 text-orange-800",
      template: "bg-blue-100 text-blue-800"
    };

    return (
      <Badge className={variants[type]}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const getQuickActions = (document: UnifiedDocument) => {
    const actions = [
      { key: 'view', icon: Eye, label: 'View', color: 'text-blue-600' },
      { key: 'download', icon: Download, label: 'Download', color: 'text-green-600' },
      { key: 'share', icon: Share2, label: 'Share', color: 'text-purple-600' },
    ];

    if (document.type === 'user') {
      actions.push({ key: 'edit', icon: Edit3, label: 'Edit', color: 'text-orange-600' });
    }

    if (document.type === 'compliance') {
      actions.push({ key: 'sign', icon: Star, label: 'Sign', color: 'text-yellow-600' });
    }

    if (document.type !== 'template') {
      actions.push({ key: 'template', icon: Copy, label: 'Template', color: 'text-indigo-600' });
    }

    return actions;
  };

  // Pagination component
  const PaginationControls = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="text-sm text-slate-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} documents
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1 || isFetchingCompliance}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isFetchingCompliance}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages || isFetchingCompliance}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(pagination.totalPages)}
            disabled={page === pagination.totalPages || isFetchingCompliance}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">All Documents</h2>
          <p className="text-slate-600 mt-1">Manage documents, templates, and signatures in one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => setIsCreatingDocument(true)} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Document
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search documents, templates, and signatures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="user">User Documents</SelectItem>
            <SelectItem value="template">Templates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoadingCompliance || isLoadingUser || isLoadingTemplates ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : complianceError || userError || templatesError ? (
            <div className="text-center py-8 text-red-600">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Error loading documents</p>
              <p className="text-sm">Please try refreshing the page</p>
              {complianceError && <p className="text-xs mt-2">Compliance: {complianceError.message}</p>}
              {userError && <p className="text-xs mt-2">User: {userError.message}</p>}
              {templatesError && <p className="text-xs mt-2">Templates: {templatesError.message}</p>}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {filteredDocuments.map((doc) => (
                  <Card key={`${doc.type}-${doc.id}`} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group hover:scale-[1.01]">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <FileText className="h-6 w-6 text-slate-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-lg truncate">{doc.title}</h3>
                            <div className="flex items-center space-x-2 mt-2">
                              {getTypeBadge(doc.type)}
                              {getStatusBadge(doc.status)}
                              {doc.category && (
                                <Badge variant="outline" className="text-xs font-medium">{doc.category}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {getQuickActions(doc).map((action) => (
                            <Button
                              key={action.key}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickAction(action.key, doc)}
                              className={cn("h-9 w-9 p-0 rounded-lg hover:bg-slate-100", action.color)}
                              title={action.label}
                            >
                              <action.icon className="h-4 w-4" />
                            </Button>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            title="More options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination Controls */}
              <PaginationControls />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Document Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedDocument?.title}
            </SheetTitle>
          </SheetHeader>
          
          {selectedDocument && (
            <div className="mt-6 space-y-6">
              {/* Document Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getTypeBadge(selectedDocument.type)}
                  {getStatusBadge(selectedDocument.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Created</span>
                    <p>{format(new Date(selectedDocument.createdAt), 'PPP')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Updated</span>
                    <p>{format(new Date(selectedDocument.updatedAt), 'PPP')}</p>
                  </div>
                </div>

                {selectedDocument.category && (
                  <div>
                    <span className="font-medium text-slate-600">Category</span>
                    <p>{selectedDocument.category}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {getQuickActions(selectedDocument).map((action) => (
                    <Button
                      key={action.key}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleQuickAction(action.key, selectedDocument);
                        setIsDetailSheetOpen(false);
                      }}
                      className="justify-start"
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
