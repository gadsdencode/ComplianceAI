import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Tag,
  Clock,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileCheck,
  FileX,
  FileClock
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
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
}

interface EnhancedDocumentManagerProps {
  className?: string;
}

export default function EnhancedDocumentManager({ className }: EnhancedDocumentManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [documentType, setDocumentType] = useState<'all' | 'compliance' | 'user' | 'template'>('all');
  const [selectedDocument, setSelectedDocument] = useState<UnifiedDocument | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all document types
  const { data: complianceDocuments = [], isLoading: isLoadingCompliance } = useQuery<Document[]>({
    queryKey: ['/api/documents', { status: activeTab !== 'all' ? activeTab : undefined }],
    staleTime: 5 * 60 * 1000,
  });

  const { data: userDocuments = [], isLoading: isLoadingUser } = useQuery<UserDocument[]>({
    queryKey: ['/api/user-documents'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    staleTime: 5 * 60 * 1000,
  });

  // Combine and transform documents with enhanced metadata
  const unifiedDocuments: UnifiedDocument[] = useMemo(() => {
    const docs = [
      ...complianceDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
        type: 'compliance' as const,
        document: doc,
        priority: 'medium' as const,
        dueDate: undefined
      })),
      ...userDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        status: doc.status || 'draft',
        category: doc.category,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
        type: 'user' as const,
        document: doc,
        priority: doc.status === 'draft' ? 'high' as const : 'medium' as const
      })),
      ...templates.map(template => ({
        id: template.id,
        title: template.name,
        status: 'active',
        updatedAt: template.updatedAt,
        createdAt: template.createdAt,
        type: 'template' as const,
        document: template,
        priority: 'low' as const
      }))
    ];

    // Sort documents
    return docs.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [complianceDocuments, userDocuments, templates, sortBy, sortOrder]);

  // Filter documents with enhanced search
  const filteredDocuments = useMemo(() => {
    return unifiedDocuments.filter(doc => {
      const matchesSearch = !searchQuery || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = documentType === 'all' || doc.type === documentType;
      const matchesStatus = activeTab === 'all' || doc.status === activeTab;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [unifiedDocuments, searchQuery, documentType, activeTab]);

  // Quick actions with enhanced functionality
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
      case 'approve':
        handleApprove(document);
        break;
      case 'reject':
        handleReject(document);
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

  const handleShare = (document: UnifiedDocument) => {
    const shareUrl = `${window.location.origin}/documents/${document.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Document link copied to clipboard",
    });
  };

  const handleCreateTemplate = (document: UnifiedDocument) => {
    toast({
      title: "Template Creation",
      description: "Template creation feature coming soon",
    });
  };

  const handleApprove = (document: UnifiedDocument) => {
    toast({
      title: "Document Approved",
      description: `${document.title} has been approved`,
    });
  };

  const handleReject = (document: UnifiedDocument) => {
    toast({
      title: "Document Rejected",
      description: `${document.title} has been rejected`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      draft: { 
        className: "bg-yellow-100 text-yellow-800 border-yellow-200", 
        icon: <FileClock className="h-3 w-3" />
      },
      pending_approval: { 
        className: "bg-blue-100 text-blue-800 border-blue-200", 
        icon: <Clock className="h-3 w-3" />
      },
      active: { 
        className: "bg-green-100 text-green-800 border-green-200", 
        icon: <CheckCircle className="h-3 w-3" />
      },
      approved: { 
        className: "bg-green-100 text-green-800 border-green-200", 
        icon: <FileCheck className="h-3 w-3" />
      },
      expired: { 
        className: "bg-red-100 text-red-800 border-red-200", 
        icon: <FileX className="h-3 w-3" />
      },
      archived: { 
        className: "bg-gray-100 text-gray-800 border-gray-200", 
        icon: <XCircle className="h-3 w-3" />
      },
    };

    const variant = variants[status] || variants['draft'];

    return (
      <Badge className={cn("text-xs font-medium flex items-center gap-1", variant.className)}>
        {variant.icon}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: 'compliance' | 'user' | 'template') => {
    const variants = {
      compliance: "bg-purple-100 text-purple-800 border-purple-200",
      user: "bg-orange-100 text-orange-800 border-orange-200",
      template: "bg-blue-100 text-blue-800 border-blue-200"
    };

    return (
      <Badge className={cn("text-xs font-medium", variants[type])}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority?: 'high' | 'medium' | 'low') => {
    if (!priority) return null;
    
    const variants = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200"
    };

    return (
      <Badge className={cn("text-xs font-medium", variants[priority])}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getQuickActions = (document: UnifiedDocument) => {
    const actions = [
      { key: 'view', icon: Eye, label: 'View', color: 'text-blue-600 hover:bg-blue-50' },
      { key: 'download', icon: Download, label: 'Download', color: 'text-green-600 hover:bg-green-50' },
      { key: 'share', icon: Share2, label: 'Share', color: 'text-purple-600 hover:bg-purple-50' },
    ];

    if (document.type === 'user') {
      actions.push({ key: 'edit', icon: Edit3, label: 'Edit', color: 'text-orange-600 hover:bg-orange-50' });
    }

    if (document.type === 'compliance' && document.status === 'pending_approval') {
      actions.push(
        { key: 'approve', icon: CheckCircle, label: 'Approve', color: 'text-green-600 hover:bg-green-50' },
        { key: 'reject', icon: XCircle, label: 'Reject', color: 'text-red-600 hover:bg-red-50' }
      );
    }

    if (document.type === 'compliance') {
      actions.push({ key: 'sign', icon: Star, label: 'Sign', color: 'text-yellow-600 hover:bg-yellow-50' });
    }

    if (document.type !== 'template') {
      actions.push({ key: 'template', icon: Copy, label: 'Template', color: 'text-indigo-600 hover:bg-indigo-50' });
    }

    return actions;
  };

  const DocumentCard = ({ document }: { document: UnifiedDocument }) => (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group hover:scale-[1.01]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <FileText className="h-6 w-6 text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-lg truncate">{document.title}</h3>
              <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                {getTypeBadge(document.type)}
                {getStatusBadge(document.status)}
                {getPriorityBadge(document.priority)}
                {document.category && (
                  <Badge variant="outline" className="text-xs font-medium">{document.category}</Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-500 mt-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                </span>
                {document.dueDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due {format(new Date(document.dueDate), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {getQuickActions(document).slice(0, 3).map((action) => (
              <Button
                key={action.key}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction(action.key, document)}
                className={cn("h-9 w-9 p-0 rounded-lg", action.color)}
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
  );

  const DocumentListItem = ({ document }: { document: UnifiedDocument }) => (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors group">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{document.title}</h3>
          <div className="flex items-center space-x-2 mt-1">
            {getTypeBadge(document.type)}
            {getStatusBadge(document.status)}
            {getPriorityBadge(document.priority)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-sm text-slate-500">
          {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {getQuickActions(document).slice(0, 2).map((action) => (
            <Button
              key={action.key}
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction(action.key, document)}
              className={cn("h-8 w-8 p-0", action.color)}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Document Library</h2>
          <p className="text-slate-600 mt-1">Manage all your documents, templates, and signatures</p>
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

      {/* Enhanced Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
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
        
        <div className="flex gap-2">
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
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-2"
            )}>
              {filteredDocuments.map((doc) => 
                viewMode === 'grid' ? (
                  <DocumentCard key={`${doc.type}-${doc.id}`} document={doc} />
                ) : (
                  <DocumentListItem key={`${doc.type}-${doc.id}`} document={doc} />
                )
              )}
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
                <div className="flex items-center gap-2 flex-wrap">
                  {getTypeBadge(selectedDocument.type)}
                  {getStatusBadge(selectedDocument.status)}
                  {getPriorityBadge(selectedDocument.priority)}
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

                {selectedDocument.dueDate && (
                  <div>
                    <span className="font-medium text-slate-600">Due Date</span>
                    <p>{format(new Date(selectedDocument.dueDate), 'PPP')}</p>
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
