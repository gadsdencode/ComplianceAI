// client/src/pages/document-dashboard-page.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document } from '@/types';
import { FileText, Download, Trash2, Upload, Search, Filter, Eye, Edit, Plus, FilePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  name: string;
  key: string;
  documentId?: number;
}

export default function DocumentDashboardPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState<FileItem[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  // Fetch all documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', { status: statusFilter !== 'all' ? statusFilter : undefined }],
    queryFn: async () => {
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/documents${query}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
  });

  // Fetch all files for all documents
  const { data: allFiles = [], isLoading: isLoadingFiles } = useQuery<FileItem[]>({
    queryKey: ['/api/documents/files'],
    queryFn: async () => {
      const res = await fetch('/api/documents/files', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch all document files');
      return res.json();
    },
  });

  // Create new document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async ({ title, file }: { title: string; file: File }) => {
      // First create the document
      try {
        const docRes = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            content: '', 
            status: 'draft',
            // Don't send createdById - the server will set this from the authenticated user
          }),
          credentials: 'include',
        });
        
        // If the response is not OK, attempt to parse error details
        if (!docRes.ok) {
          const errorData = await docRes.json().catch(() => ({ message: 'Failed to parse error' }));
          console.error('Document creation failed:', errorData);
          throw new Error(errorData.message || `Failed to create document: ${docRes.status} ${docRes.statusText}`);
        }
        
        const document = await docRes.json();
        console.log('Document created successfully:', document);
        
        // Then upload the file to the document
        if (file) {
          console.log('Uploading file for document:', document.id);
          const formData = new FormData();
          formData.append('file', file);
          
          const fileRes = await fetch(`/api/documents/${document.id}/files`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          if (!fileRes.ok) {
            // If file upload fails, log it but don't fail the whole operation
            console.error('File upload failed for document:', document.id, await fileRes.text().catch(() => 'Could not read error details'));
          } else {
            console.log('File uploaded successfully for document:', document.id);
          }
        }
        
        return document;
      } catch (error) {
        console.error('Error in document creation process:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setIsUploadDialogOpen(false);
      setDocumentName('');
      setSelectedFile(null);
      toast({
        title: 'Success',
        description: `Document "${data.title}" created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create document',
        variant: 'destructive',
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (file: FileItem) => {
      const res = await fetch(`/api/documents/${file.documentId}/files/${file.name}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to delete file');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/files'] });
      if (selectedDocument) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/documents/${selectedDocument.id}/files`] 
        });
      }
      setIsDeleteConfirmOpen(false);
      setFileToDelete(null);
      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      });
    },
  });

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle document upload
  const handleUpload = () => {
    if (!documentName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a document name',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: 'Validation Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    createDocumentMutation.mutate({ 
      title: documentName, 
      file: selectedFile 
    });
  };

  // View document details
  const handleViewDocument = (documentId: number) => {
    navigate(`/documents/${documentId}`);
  };

  // Open file preview modal
  const handleViewFiles = (document: Document) => {
    setSelectedDocument(document);
    // Fetch files for the selected document
    fetch(`/api/documents/${document.id}/files`, { credentials: 'include' })
      .then(res => res.json())
      .then(files => setSelectedDocumentFiles(files))
      .catch(error => {
        console.error('Error fetching document files:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch document files',
          variant: 'destructive',
        });
      });
  };

  // Close file preview modal
  const handleCloseFilePreview = () => {
    setSelectedDocument(null);
    setSelectedDocumentFiles([]);
  };

  // Delete file confirmation
  const handleDeleteFile = (file: FileItem) => {
    setFileToDelete(file);
    setIsDeleteConfirmOpen(true);
  };

  // Execute file deletion
  const confirmDeleteFile = () => {
    if (fileToDelete) {
      deleteFileMutation.mutate(fileToDelete);
    }
  };

  // Get status badge based on document status
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

  // Download a file
  const handleDownloadFile = (file: FileItem) => {
    window.open(`/api/documents/${file.documentId}/files/${file.name}`, '_blank');
  };

  return (
    <DashboardLayout pageTitle="Document Dashboard">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Document Dashboard</h1>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <FilePlus className="mr-2 h-4 w-4" />
            Upload New Document
          </Button>
        </div>

        {/* Search and filter */}
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents table */}
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 bg-slate-200 animate-pulse rounded"></div>
            <div className="h-20 bg-slate-200 animate-pulse rounded"></div>
            <div className="h-20 bg-slate-200 animate-pulse rounded"></div>
            <div className="h-20 bg-slate-200 animate-pulse rounded"></div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <FileText className="h-12 w-12 text-slate-300" />
                          <p className="text-slate-500">No documents found</p>
                          <Button variant="outline" size="sm" onClick={() => setIsUploadDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Upload New Document
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleViewFiles(doc)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/documents/${doc.id}?action=edit`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload new document dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="document-name" className="text-sm font-medium">
                Document Name
              </label>
              <Input
                id="document-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="document-file" className="text-sm font-medium">
                File
              </label>
              <Input
                id="document-file"
                type="file"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-slate-500">Selected: {selectedFile.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={createDocumentMutation.status === 'pending'}
            >
              {createDocumentMutation.status === 'pending' ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File preview dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={handleCloseFilePreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Files for {selectedDocument?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedDocumentFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No files found for this document</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDocumentFiles.map((file) => (
                    <TableRow key={file.key}>
                      <TableCell>{file.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadFile(file)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteFile(file)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this file? This action cannot be undone.</p>
          {fileToDelete && <p className="font-medium">{fileToDelete.name}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteFile}
              disabled={deleteFileMutation.status === 'pending'}
            >
              {deleteFileMutation.status === 'pending' ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}