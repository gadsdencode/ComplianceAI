import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Document, DocumentVersion, Signature, AuditTrail } from '@/types';
import { ArrowLeft, Clock, User, FileText, PenTool, History, CheckSquare } from 'lucide-react';
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
  
  // Set active tab based on URL action
  useEffect(() => {
    if (actionParam === 'sign') {
      setActiveTab('signatures');
    } else if (actionParam === 'review' || actionParam === 'approve') {
      setActiveTab('details');
    }
  }, [actionParam]);

  // Fetch document details
  const { 
    data: document,
    isLoading: isLoadingDocument,
    error: documentError
  } = useQuery<Document>({
    queryKey: [`/api/documents/${id}`],
    enabled: !!id,
  });

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
      return await apiRequest(
        'PUT', 
        `/api/documents/${id}`,
        { content, status, createdById: user?.id }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}`] });
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
    navigate('/document-repository');
  };

  const handleEdit = () => {
    setIsEditing(true);
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
  if (documentError) {
    return (
      <DashboardLayout pageTitle="Document Details">
        <div className="p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-error-100 text-error-600 flex items-center justify-center mx-auto mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-medium mb-2">Error loading document</h3>
          <p className="text-slate-600 mb-4">{documentError.message || 'Failed to load document'}</p>
          <Button onClick={handleBack}>
            Back to Document Repository
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Display loading state
  if (isLoadingDocument || !document) {
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
        <h1 className="text-2xl font-bold text-slate-800">{document.title}</h1>
        {getStatusBadge(document.status)}
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-slate-400 mr-2" />
              <div>
                <p className="text-sm text-slate-500">Last Updated</p>
                <p className="font-medium">{formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</p>
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
                <p className="font-medium">User ID: {document.createdById}</p>
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
                <p className="font-medium">{document.version}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {document.expiresAt && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-slate-400 mr-2" />
                <div>
                  <p className="text-sm text-slate-500">Expires</p>
                  <p className="font-medium">{format(new Date(document.expiresAt), 'MMM d, yyyy')}</p>
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
          
          <div className="mt-6">
            <TabsContent value="details">
              {isEditing ? (
                <DocumentEditor 
                  content={document.content} 
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  isSaving={updateDocumentMutation.isPending}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end space-x-2">
                    {document.status === 'draft' && (
                      <Button onClick={handleSubmitForSignature} disabled={updateDocumentMutation.isPending}>
                        Submit for Signature
                      </Button>
                    )}
                    {document.status === 'pending_approval' && (user?.role === 'admin' || user?.role === 'compliance_officer') && (
                      <Button onClick={handleApprove} disabled={updateDocumentMutation.isPending}>
                        Approve Document
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={handleEdit}
                      disabled={document.status === 'active' || document.status === 'expired' || document.status === 'archived'}
                    >
                      Edit Document
                    </Button>
                  </div>
                  <DocumentDetail content={document.content} />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="signatures">
              <SignaturePanel 
                documentId={document.id} 
                signatures={signatures || []} 
                isLoading={isLoadingSignatures}
                documentStatus={document.status}
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
              <FileManagerPanel documentId={document.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
