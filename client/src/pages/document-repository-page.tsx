import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUploader from '@/components/documents/FileUploader';
import UserDocumentList from '@/components/documents/UserDocumentList';
import DocumentList from '@/components/document/DocumentList';
import DocumentViewer from '@/components/documents/DocumentViewer';
import CreateDocumentModal from '@/components/documents/CreateDocumentModal';
import { UserDocument, Document, Template } from '@/types';
import { Plus, Upload, Filter } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function DocumentRepositoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadingMode, setIsUploadingMode] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<UserDocument | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get filter from URL if present
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const filterParam = urlParams.get('filter');
  
  // Set active tab based on URL filter
  useEffect(() => {
    if (filterParam) {
      setActiveTab(filterParam);
    }
  }, [filterParam]);

  // Fetch user uploaded documents
  const { 
    data: userDocuments,
    isLoading: isLoadingUserDocuments,
    error: userDocumentsError
  } = useQuery<UserDocument[]>({
    queryKey: ['/api/user-documents'],
  });

  // Fetch compliance documents with selected filter
  const { 
    data: complianceDocuments,
    isLoading: isLoadingDocuments,
    error: documentsError
  } = useQuery<Document[]>({
    queryKey: ['/api/documents', { status: activeTab !== 'all' ? activeTab : undefined }],
  });

  // Fetch templates for create document modal
  const {
    data: templates,
    isLoading: isLoadingTemplates
  } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    enabled: isCreateModalOpen, // Only fetch when modal is open
  });

  // Filter documents by search query
  const filteredComplianceDocuments = complianceDocuments?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter user documents by search query
  const filteredUserDocuments = userDocuments?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; metadata: any }): Promise<UserDocument> => {
      const { file, metadata } = data;
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', metadata.title || file.name);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
      
      const response = await fetch('/api/user-documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      setIsUploadingMode(false);
      toast({
        title: 'Upload Successful',
        description: 'Your document has been uploaded.',
      });
    },
    onError: (error: any) => {
      console.error("Upload mutation error:", error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'There was an error uploading your document.',
        variant: 'destructive',
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (document: UserDocument): Promise<void> => {
      await apiRequest(
        'DELETE',
        `/api/user-documents/${document.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
    },
  });

  const handleUpload = async (file: File, metadata: any) => {
    uploadMutation.mutate({ file, metadata });
  };

  const handleDelete = async (document: UserDocument) => {
    return deleteMutation.mutateAsync(document);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleUploadMode = () => {
    setIsUploadingMode(!isUploadingMode);
    if (isCreateModalOpen) setIsCreateModalOpen(false);
  };

  const handleCreateDocument = () => {
    setIsCreateModalOpen(true);
    if (isUploadingMode) setIsUploadingMode(false);
  };

  const handleViewDocument = (document: UserDocument) => {
    setViewingDocument(document);
  };

  return (
    <DashboardLayout 
      pageTitle="Document Repository" 
      onSearch={handleSearch}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Document Repository</h1>
        <div className="flex space-x-2">
          <Button onClick={toggleUploadMode}>
            {isUploadingMode ? (
              <>Cancel</>
            ) : (
              <>
                <Upload className="mr-1 h-4 w-4" /> 
                Upload Document
              </>
            )}
          </Button>
          <Button onClick={handleCreateDocument}>
            <Plus className="mr-1 h-4 w-4" /> 
            Create Document
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="uploaded">Uploaded Documents</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="pending_approval">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Advanced Filter
          </Button>
        </div>

        {isUploadingMode ? (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
              <FileUploader 
                onFileUpload={handleUpload}
                isUploading={uploadMutation.isPending}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="all">
              <h2 className="text-lg font-medium mb-4">Compliance Documents</h2>
              <DocumentList 
                documents={filteredComplianceDocuments || []} 
                isLoading={isLoadingDocuments} 
                error={documentsError?.message}
              />
              
              <h2 className="text-lg font-medium mb-4 mt-6">Uploaded Documents</h2>
              <UserDocumentList 
                documents={filteredUserDocuments || []} 
                isLoading={isLoadingUserDocuments} 
                error={userDocumentsError?.message}
                onDelete={handleDelete}
                onView={handleViewDocument}
              />
            </TabsContent>
            
            <TabsContent value="uploaded">
              <UserDocumentList 
                documents={filteredUserDocuments || []} 
                isLoading={isLoadingUserDocuments} 
                error={userDocumentsError?.message}
                onDelete={handleDelete}
                onView={handleViewDocument}
              />
            </TabsContent>
            
            <TabsContent value="draft">
              <DocumentList 
                documents={filteredComplianceDocuments || []} 
                isLoading={isLoadingDocuments} 
                error={documentsError?.message}
              />
            </TabsContent>
            
            <TabsContent value="pending_approval">
              <DocumentList 
                documents={filteredComplianceDocuments || []} 
                isLoading={isLoadingDocuments} 
                error={documentsError?.message}
              />
            </TabsContent>
            
            <TabsContent value="active">
              <DocumentList 
                documents={filteredComplianceDocuments || []} 
                isLoading={isLoadingDocuments} 
                error={documentsError?.message}
              />
            </TabsContent>
            
            <TabsContent value="expired">
              <DocumentList 
                documents={filteredComplianceDocuments || []} 
                isLoading={isLoadingDocuments} 
                error={documentsError?.message}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}

      {isCreateModalOpen && (
        <CreateDocumentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          templates={templates || [] as Template[]}
          isLoadingTemplates={isLoadingTemplates}
        />
      )}
    </DashboardLayout>
  );
} 