import { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserDocument } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Eye, Download, Trash2, AlertTriangle, Search, GripVertical, Loader2 } from 'lucide-react';
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
  onMoveDocument?: (documentId: number, newCategory: string) => Promise<void>;
}

export default function UserDocumentList({ 
  documents, 
  isLoading, 
  error, 
  onDelete,
  onView,
  onMoveDocument 
}: UserDocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<UserDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedDocument, setDraggedDocument] = useState<UserDocument | null>(null);
  const [movingDocumentId, setMovingDocumentId] = useState<number | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);
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

  const createCustomDragPreview = (doc: UserDocument) => {
    const dragPreview = window.document.createElement('div');
    dragPreview.className = `
      bg-white rounded-lg shadow-2xl border-2 border-blue-400 p-3 max-w-64 transform rotate-2 opacity-90
      backdrop-blur-sm bg-white/95
    `;
    dragPreview.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 truncate">${doc.title}</p>
          <p class="text-xs text-gray-500">${doc.fileType.split('/')[1]?.toUpperCase() || 'FILE'}</p>
        </div>
      </div>
    `;
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    dragPreview.style.left = '-1000px';
    dragPreview.style.zIndex = '9999';
    window.document.body.appendChild(dragPreview);
    return dragPreview;
  };

  const handleDragStart = (e: React.DragEvent, document: UserDocument) => {
    setDraggedDocument(document);
    
    const dragData = {
      type: 'document',
      documentId: document.id,
      documentType: 'user',
      currentCategory: document.category || 'General',
      title: document.title
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    // Create and set custom drag preview
    const customPreview = createCustomDragPreview(document);
    e.dataTransfer.setDragImage(customPreview, 60, 30);
    
    // Clean up the preview element after a short delay
    setTimeout(() => {
      if (customPreview.parentNode) {
        customPreview.parentNode.removeChild(customPreview);
      }
    }, 100);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedDocument(null);
  };

  const handleMoveWithFeedback = async (documentId: number, newCategory: string) => {
    if (!onMoveDocument) return;
    
    setMovingDocumentId(documentId);
    try {
      await onMoveDocument(documentId, newCategory);
    } finally {
      setMovingDocumentId(null);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const searchVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30
      }
    }
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
    <motion.div 
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="relative" variants={searchVariants}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </motion.div>
      
      {filteredDocuments.length === 0 ? (
        <motion.div 
          className="text-center p-12 border rounded-lg bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No documents found</h3>
          {searchQuery ? (
            <p className="text-slate-600 mb-6">No documents match your search query.</p>
          ) : (
            <p className="text-slate-600 mb-6">Upload documents to see them here.</p>
          )}
        </motion.div>
      ) : (
        <motion.div className="space-y-4" variants={containerVariants}>
          <AnimatePresence>
            {filteredDocuments.map((document, index) => (
              <motion.div
                key={document.id}
                variants={cardVariants}
                layout
                whileHover={{ 
                  scale: 1.02,
                  y: -2,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
                whileTap={{ scale: 0.98 }}
                drag={false} // Disable framer-motion drag to use native HTML5 drag
              >
                <Card 
                  className={`overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing relative group
                    ${draggedDocument?.id === document.id ? 'opacity-60 scale-95 rotate-2' : 'shadow-md hover:shadow-lg'}
                    ${movingDocumentId === document.id ? 'pointer-events-none' : ''}
                  `}
                  draggable
                  onDragStart={(e) => handleDragStart(e, document)}
                  onDragEnd={handleDragEnd}
                >
                  <CardContent className="p-0">
                    <div className="p-4">
                      {/* Moving indicator overlay */}
                      <AnimatePresence>
                        {movingDocumentId === document.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"
                          >
                            <div className="flex items-center space-x-2 bg-white/90 px-4 py-2 rounded-full shadow-lg">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">Moving...</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex items-center mr-3">
                            <motion.div
                              className="cursor-grab"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <GripVertical className="h-4 w-4 text-slate-400 mr-2 transition-colors group-hover:text-slate-600" />
                            </motion.div>
                            <motion.div 
                              className="h-10 w-10 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center"
                              whileHover={{ rotate: 5, scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <FileText size={20} />
                            </motion.div>
                          </div>
                          <div>
                            <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                              {document.title}
                            </h3>
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
                                  {document.tags.map((tag, tagIndex) => (
                                    <motion.div
                                      key={tagIndex}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: index * 0.1 + tagIndex * 0.05 }}
                                    >
                                      <Badge variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {document.category && (
                              <motion.div 
                                className="mt-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                              >
                                <Badge variant="secondary" className="text-xs">
                                  {document.category}
                                </Badge>
                              </motion.div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => onView(document)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                              onClick={() => handleDownload(document)}
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDeleteClick(document)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={documentToDelete !== null} onOpenChange={() => setDocumentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete "{documentToDelete?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="relative"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 