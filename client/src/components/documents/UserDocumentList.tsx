import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserDocument } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Eye, Download, Trash2, AlertTriangle, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface UserDocumentListProps {
  documents: UserDocument[];
  isLoading: boolean;
  error?: string;
  onDelete: (document: UserDocument) => Promise<void>;
  onView: (document: UserDocument) => void;
}

export default function UserDocumentList({ 
  documents, 
  isLoading, 
  error, 
  onDelete,
  onView 
}: UserDocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<UserDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Filter documents by search query (title, description, and tags)
  const filteredDocuments = documents.filter(doc => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = doc.title.toLowerCase().includes(query);
    const matchesDescription = doc.description?.toLowerCase().includes(query) || false;
    const matchesTags = doc.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
    
    return matchesTitle || matchesDescription || matchesTags;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteClick = (document: UserDocument) => {
    setDocumentToDelete(document);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(documentToDelete);
      toast({
        title: 'Document Deleted',
        description: `"${documentToDelete.title}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'There was an error deleting the document. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDocumentToDelete(null);
  };

  const handleDownload = (doc: UserDocument) => {
    // Use the same approach as working file downloads to preserve authentication
    const link = window.document.createElement('a');
    link.href = doc.fileUrl; // This is already the full API path: /api/user-documents/:id/download
    link.setAttribute('download', doc.fileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center">
                <Skeleton className="h-10 w-10 rounded-md mr-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-error-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error loading documents</h3>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>
      
      {filteredDocuments.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-white">
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No documents found</h3>
          {searchQuery ? (
            <p className="text-slate-600 mb-6">No documents match your search query.</p>
          ) : (
            <p className="text-slate-600 mb-6">Upload documents to see them here.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <Card 
              key={document.id} 
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center mr-4">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium">{document.title}</h3>
                        {document.description && (
                          <p className="text-sm text-slate-500 mt-1">{document.description}</p>
                        )}
                        <div className="flex items-center flex-wrap mt-2">
                          <span className="text-xs text-slate-500 mr-4">
                            {document.fileType.split('/')[1]?.toUpperCase() || document.fileType} 
                            {' • '}
                            {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="text-xs text-slate-500">
                            Uploaded {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                          </span>
                          
                          {document.tags && document.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {document.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onView(document)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-error-500 hover:text-error-600 hover:bg-error-50"
                        onClick={() => handleDeleteClick(document)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!documentToDelete} onOpenChange={open => !open && cancelDelete()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete "{documentToDelete?.title}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 