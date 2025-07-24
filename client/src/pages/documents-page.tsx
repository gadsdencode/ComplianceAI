import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document, UserDocument } from '@/types';
import { Plus, Filter, Search, FileText, FolderPlus, Star, Download, Eye, Edit, Trash2, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface UnifiedDocument {
  id: number;
  title: string;
  status: string;
  category?: string;
  updatedAt: string;
  createdAt: string;
  type: 'compliance' | 'user';
  document: Document | UserDocument;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [documentType, setDocumentType] = useState<'all' | 'compliance' | 'user'>('all');
  const [selectedDocument, setSelectedDocument] = useState<UnifiedDocument | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch compliance documents
  const { 
    data: complianceDocuments = [], 
    isLoading: isLoadingCompliance 
  } = useQuery<Document[]>({
    queryKey: ['/api/documents', { status: activeTab !== 'all' ? activeTab : undefined }],
  });

  // Fetch user documents
  const { 
    data: userDocuments = [], 
    isLoading: isLoadingUser 
  } = useQuery<UserDocument[]>({
    queryKey: ['/api/user-documents'],
  });

  // Fetch user document folders
  const { 
    data: folders = [], 
    isLoading: isLoadingFolders 
  } = useQuery<any[]>({
    queryKey: ['/api/user-documents/folders'],
  });

  // Combine and transform documents
  const unifiedDocuments: UnifiedDocument[] = [
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
    }))
  ];

  // Filter documents
  const filteredDocuments = unifiedDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = documentType === 'all' || doc.type === documentType;
    const matchesStatus = activeTab === 'all' || doc.status === activeTab;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Move document mutation
  const moveDocumentMutation = useMutation({
    mutationFn: async ({ documentId, newCategory, currentCategory }: {
      documentId: number;
      newCategory: string;
      currentCategory: string;
    }) => {
      const response = await fetch(`/api/user-documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category: newCategory }),
      });

      if (!response.ok) {
        throw new Error('Failed to move document');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the cache with the new data
      queryClient.setQueryData(['/api/user-documents'], (oldData: UserDocument[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(doc => 
          doc.id === variables.documentId 
            ? { ...doc, category: variables.newCategory, updatedAt: new Date().toISOString() }
            : doc
        );
      });

      toast({
        title: "Document Moved",
        description: `Document moved to ${variables.newCategory}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Move Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleMoveDocument = async (documentId: number, newCategory: string, currentCategory: string) => {
    if (currentCategory === newCategory) return;
    
    moveDocumentMutation.mutate({ documentId, newCategory, currentCategory });
  };

  const handleViewDocument = (document: UnifiedDocument) => {
    if (document.type === 'user') {
      // For user documents, show in modal or navigate to detail view
      setSelectedDocument(document);
    } else {
      // For compliance documents, navigate to detail page
      window.location.href = `/documents/${document.id}`;
    }
  };

  const handleDownloadDocument = (documentItem: UnifiedDocument) => {
    if (documentItem.type === 'user') {
      const userDoc = documentItem.document as UserDocument;
      const link = globalThis.document.createElement('a');
      link.href = userDoc.fileUrl;
      link.setAttribute('download', userDoc.fileName);
      link.style.display = 'none';
      globalThis.document.body.appendChild(link);
      link.click();
      globalThis.document.body.removeChild(link);
    } else {
      toast({
        title: "Download",
        description: "Compliance document download not yet implemented",
      });
    }
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

  const getTypeBadge = (type: 'compliance' | 'user') => {
    return (
      <Badge className={type === 'compliance' ? "bg-purple-100 text-purple-800" : "bg-orange-100 text-orange-800"}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  return (
    <DashboardLayout pageTitle="Documents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
            <p className="text-slate-600">Manage all your documents in one place</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Document
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="compliance">Compliance Documents</SelectItem>
              <SelectItem value="user">User Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="pending_approval">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoadingCompliance || isLoadingUser ? (
              <div className="text-center py-8">Loading documents...</div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>No documents found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDocuments.map((doc) => (
                  <Card key={`${doc.type}-${doc.id}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{doc.title}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {getTypeBadge(doc.type)}
                              {getStatusBadge(doc.status)}
                              {doc.category && (
                                <Badge variant="outline">{doc.category}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {doc.type === 'user' && (
                            <Select
                              value={doc.category || 'General'}
                              onValueChange={(value) => handleMoveDocument(doc.id, value, doc.category || 'General')}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {folders.map((folder) => (
                                  <SelectItem key={folder.id} value={folder.name}>
                                    {folder.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
