import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Document, DocumentVersion, Signature, AuditTrail } from '@/types';
import { ArrowLeft, Clock, User, FileText, PenTool, History, CheckSquare, Eye } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import DocumentDetail from '@/components/document/DocumentDetail';
import SignaturePanel from '@/components/document/SignaturePanel';
import DocumentVersionHistory from '@/components/document/DocumentVersionHistory';
import AuditTrailTable from '@/components/document/AuditTrailTable';
import FileManagerPanel from '@/components/document/FileManagerPanel';
import DocumentEditor from '@/components/document/DocumentEditor';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('details');
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Get action parameter from URL if present
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const actionParam = urlParams.get('action');
  
  // Set active tab and editing state based on URL action
  useEffect(() => {
    if (actionParam === 'sign') {
      setActiveTab('signatures');
    } else if (actionParam === 'review' || actionParam === 'approve') {
      setActiveTab('details');
    } else if (actionParam === 'edit') {
      setActiveTab('details');
      setIsEditing(true);
    }
  }, [actionParam]);

  // Determine document type from URL params or try both endpoints
  const documentType = new URLSearchParams(window.location.search).get('type') as 'compliance' | 'user' | null;
  
  // Fetch document details - try compliance documents first, then user documents
  const { 
    data: document,
    isLoading: isLoadingDocument,
    error: documentError
  } = useQuery<Document | any>({
    queryKey: [`/api/documents/${id}`],
    enabled: !!id && documentType !== 'user',
    retry: false,
  });

  // Fetch user document if compliance document not found or type is user
  const { 
    data: userDocument,
    isLoading: isLoadingUserDocument,
    error: userDocumentError
  } = useQuery<any>({
    queryKey: [`/api/user-documents/${id}`],
    enabled: !!id && (documentType === 'user' || (!document && !isLoadingDocument)),
    retry: false,
  });

  // Use the document that was found
  const currentDocument = document || userDocument;
  const isLoading = isLoadingDocument || isLoadingUserDocument;
  const error = documentError || userDocumentError;


  // Fetch document versions
  const {
    data: versions,
    isLoading: isLoadingVersions
  } = useQuery<DocumentVersion[]>({
    queryKey: [`/api/documents/${id}/versions`],
    enabled: !!id && activeTab === 'versions',
  });

  // Fetch document signatures
  const {
    data: signatures,
    isLoading: isLoadingSignatures
  } = useQuery<Signature[]>({
    queryKey: [`/api/documents/${id}/signatures`],
    enabled: !!id && activeTab === 'signatures',
  });

  // Fetch document audit trail
  const {
    data: auditTrail,
    isLoading: isLoadingAudit
  } = useQuery<AuditTrail[]>({
    queryKey: [`/api/documents/${id}/audit`],
    enabled: !!id && activeTab === 'audit',
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ content, status }: { content?: string, status?: string }) => {
      // Determine the correct API endpoint based on document type
      const endpoint = documentType === 'user' ? `/api/user-documents/${id}` : `/api/documents/${id}`;
      return await apiRequest(
        'PUT', 
        endpoint,
        { content, status, createdById: user?.id }
      );
    },
    onSuccess: () => {
      // Invalidate queries for both document types
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-documents/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}/versions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}/audit`] });
      
      toast({
        title: 'Document updated',
        description: 'The document has been updated successfully',
      });
      
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update document',
        variant: 'destructive',
      });
    }
  });

  const handleBack = () => {
    navigate('/documents');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handlePreview = () => {
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = (content: string) => {
    updateDocumentMutation.mutate({ content });
  };

  const handleApprove = () => {
    updateDocumentMutation.mutate({ status: 'active' });
  };

  const handleSubmitForSignature = () => {
    updateDocumentMutation.mutate({ status: 'pending_approval' });
  };

  // Display error if document couldn't be loaded
  if (error) {
    return (
      <DashboardLayout pageTitle="Document Details">
        <div className="p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-error-100 text-error-600 flex items-center justify-center mx-auto mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-medium mb-2">Error loading document</h3>
          <p className="text-slate-600 mb-4">{error.message || 'Failed to load document'}</p>
          <Button onClick={handleBack}>
            Back to Document Repository
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Display loading state
  if (isLoading || !currentDocument) {
    return (
      <DashboardLayout pageTitle="Document Details">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-200 rounded w-1/2"></div>
          <div className="h-64 bg-slate-200 rounded w-full"></div>
        </div>
      </DashboardLayout>
    );
  }


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-slate-100 text-slate-800">Draft</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-warning-100 text-warning-800">Pending Approval</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-success-100 text-success-800">Active</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-error-100 text-error-800">Expired</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-slate-200 text-slate-800">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout pageTitle="Document Details">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-800">{currentDocument?.title}</h1>
        {isEditing ? (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <FileText className="h-3 w-3 mr-1" />
            Editing
          </Badge>
        ) : (
          getStatusBadge(currentDocument?.status)
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-slate-400 mr-2" />
              <div>
                <p className="text-sm text-slate-500">Last Updated</p>
                <p className="font-medium">{formatDistanceToNow(new Date(currentDocument?.updatedAt), { addSuffix: true })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-slate-400 mr-2" />
              <div>
                <p className="text-sm text-slate-500">Created By</p>
                <p className="font-medium">User ID: {currentDocument?.createdById}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-slate-400 mr-2" />
              <div>
                <p className="text-sm text-slate-500">Version</p>
                <p className="font-medium">{currentDocument?.version}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {currentDocument?.expiresAt && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-slate-400 mr-2" />
                <div>
                  <p className="text-sm text-slate-500">Expires</p>
                  <p className="font-medium">{format(new Date(currentDocument?.expiresAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mb-4 flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="signatures">
              <PenTool className="h-4 w-4 mr-2" />
              Signatures
            </TabsTrigger>
            <TabsTrigger value="versions">
              <History className="h-4 w-4 mr-2" />
              Versions
            </TabsTrigger>
            <TabsTrigger value="audit">
              <CheckSquare className="h-4 w-4 mr-2" />
              Audit Trail
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileText className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">Edit Mode</h3>
                        <p className="text-sm text-blue-600">You are now editing this document. Use the tabs below to switch between editing and preview modes.</p>
                      </div>
                    </div>
                  </div>
                  <DocumentEditor 
                    content={currentDocument?.content || ''} 
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    isSaving={updateDocumentMutation.isPending}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end space-x-2">
                    {currentDocument?.status === 'draft' && (
                      <Button onClick={handleSubmitForSignature} disabled={updateDocumentMutation.isPending}>
                        Submit for Signature
                      </Button>
                    )}
                    {currentDocument?.status === 'pending_approval' && (user?.role === 'admin' || user?.role === 'compliance_officer') && (
                      <Button onClick={handleApprove} disabled={updateDocumentMutation.isPending}>
                        Approve Document
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={handleEdit}
                      disabled={currentDocument?.status === 'active' || currentDocument?.status === 'expired' || currentDocument?.status === 'archived'}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handlePreview}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                  <DocumentDetail content={currentDocument?.content || ''} />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="signatures">
              <SignaturePanel 
                documentId={currentDocument?.id} 
                signatures={signatures || []} 
                isLoading={isLoadingSignatures}
                documentStatus={currentDocument?.status}
              />
            </TabsContent>
            
            <TabsContent value="versions">
              <DocumentVersionHistory 
                versions={versions || []} 
                isLoading={isLoadingVersions}
              />
            </TabsContent>
            
            <TabsContent value="audit">
              <AuditTrailTable 
                auditTrail={auditTrail || []} 
                isLoading={isLoadingAudit}
              />
            </TabsContent>
            
            <TabsContent value="files">
              <FileManagerPanel documentId={currentDocument?.id} />
            </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
