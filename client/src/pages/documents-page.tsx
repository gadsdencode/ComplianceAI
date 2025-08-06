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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Document, UserDocument } from '@/types';
import { Plus, Filter, Search, FileText, FolderPlus, Star, Download, Eye, Edit, Trash2, Share2, Calendar, User, Clock, Tag, X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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
  const [isViewerOpen, setIsViewerOpen] = useState(false);
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
    setSelectedDocument(document);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedDocument(null);
  };

  const handleDownloadDocument = (documentItem: UnifiedDocument) => {
    if (documentItem.type === 'user') {
      const userDoc = documentItem.document as UserDocument;
      
      // Create a proper download URL using the API endpoint
      const downloadUrl = `/api/user-documents/${userDoc.id}/download`;
      
      // Create a temporary link element and trigger download
      const link = globalThis.document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', userDoc.fileName);
      link.style.display = 'none';
      
      // Add credentials to ensure authentication
      link.setAttribute('crossorigin', 'use-credentials');
      
      globalThis.document.body.appendChild(link);
      link.click();
      globalThis.document.body.removeChild(link);
      
      // Show success toast
      toast({
        title: "Download Started",
        description: `Downloading ${userDoc.fileName}...`,
      });
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

  const DocumentViewer = () => {
    if (!selectedDocument) return null;

    const doc = selectedDocument.document;
    const isUserDocument = selectedDocument.type === 'user';
    const userDoc = isUserDocument ? doc as UserDocument : null;
    const complianceDoc = !isUserDocument ? doc as Document : null;

    return (
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">{selectedDocument.title}</DialogTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    {getTypeBadge(selectedDocument.type)}
                    {getStatusBadge(selectedDocument.status)}
                    {selectedDocument.category && (
                      <Badge variant="outline">{selectedDocument.category}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseViewer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Title</span>
                        <span className="text-sm">{selectedDocument.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Type</span>
                        <span className="text-sm capitalize">{selectedDocument.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Status</span>
                        <span className="text-sm capitalize">{selectedDocument.status.replace('_', ' ')}</span>
                      </div>
                      {selectedDocument.category && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-slate-600">Category</span>
                          <span className="text-sm">{selectedDocument.category}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Timestamps */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Timestamps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Created</span>
                        <span className="text-sm">{format(new Date(selectedDocument.createdAt), 'PPP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Updated</span>
                        <span className="text-sm">{format(new Date(selectedDocument.updatedAt), 'PPP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Age</span>
                        <span className="text-sm">{formatDistanceToNow(new Date(selectedDocument.createdAt), { addSuffix: true })}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document Specific Information */}
                  {isUserDocument && userDoc && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Download className="h-4 w-4 mr-2" />
                          File Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-slate-600">File Name</span>
                          <span className="text-sm">{userDoc.fileName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-slate-600">File Type</span>
                          <span className="text-sm">{userDoc.fileType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-slate-600">File Size</span>
                          <span className="text-sm">{(userDoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        {userDoc.description && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-slate-600">Description</span>
                            <span className="text-sm">{userDoc.description}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {!isUserDocument && complianceDoc && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Compliance Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-slate-600">Version</span>
                          <span className="text-sm">{complianceDoc.version}</span>
                        </div>
                        {complianceDoc.expiresAt && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-slate-600">Expires</span>
                            <span className="text-sm">{format(new Date(complianceDoc.expiresAt), 'PPP')}</span>
                          </div>
                        )}
                        {userDoc?.tags && userDoc.tags.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-slate-600">Tags</span>
                            <div className="flex flex-wrap gap-1">
                              {userDoc.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isUserDocument && userDoc ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">File Preview</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadDocument(selectedDocument)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <p className="text-sm text-slate-600">
                            File: {userDoc.fileName} ({userDoc.fileType})
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            Click download to view the full file content.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <p className="text-sm text-slate-600">
                            {complianceDoc?.content || 'No content available'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleDownloadDocument(selectedDocument)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Document
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          // Navigate to edit mode
                          window.location.href = `/documents/${selectedDocument.id}?action=edit`;
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Document
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Document
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Star Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
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
                            title="View document details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                            title="Download document"
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

      {/* Document Viewer Modal */}
      <DocumentViewer />
    </DashboardLayout>
  );
}
