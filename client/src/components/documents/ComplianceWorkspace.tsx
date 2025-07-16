"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  FolderPlus, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal,
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Share2,
  Download,
  Trash2,
  Edit3,
  Eye,
  Clock,
  User,
  Tag,
  Plus,
  Upload
} from "lucide-react";
import { UserDocument, Document } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import DocumentViewer from '@/components/documents/DocumentViewer';
import FileUploader from '@/components/documents/FileUploader';
import DocumentMoreOptions from '@/components/documents/DocumentMoreOptions';
import UserDocumentEditModal from '@/components/documents/UserDocumentEditModal';

interface FileNode {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: FileNode[];
  size?: string;
  modified?: string;
  status?: "draft" | "review" | "approved" | "archived";
  tags?: string[];
  starred?: boolean;
  document?: UserDocument | Document;
}

interface GridItemProps {
  node: FileNode;
  onSelect: (node: FileNode) => void;
  onToggle?: (id: string) => void;
  onStar?: (node: FileNode) => void;
  onDelete?: (node: FileNode) => void;
  onView?: (node: FileNode) => void;
  onEdit?: (node: FileNode) => void;
  onShare?: (node: FileNode) => void;
  onDownload?: (node: FileNode) => void;
  onChangeStatus?: (node: FileNode, status: string) => void;
  onDuplicate?: (node: FileNode) => void;
  isSelected: boolean;
  level?: number;
}

const GridItem: React.FC<GridItemProps> = ({ 
  node, 
  onSelect, 
  onToggle, 
  onStar,
  onDelete,
  onView,
  onEdit,
  onShare,
  onDownload,
  onChangeStatus,
  onDuplicate,
  isSelected, 
  level = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleToggle = () => {
    if (node.type === "folder") {
      setIsExpanded(!isExpanded);
      onToggle?.(node.id);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "draft": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "review": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "approved": return "bg-green-500/20 text-green-300 border-green-500/30";
      case "archived": return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative group"
    >
      <motion.div
        className={`
          relative p-4 rounded-xl border transition-all duration-300 cursor-pointer
          ${isSelected 
            ? "bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20" 
            : "bg-background/50 border-border hover:border-blue-400/50 hover:bg-blue-500/10"
          }
          backdrop-blur-sm
        `}
        onClick={() => onSelect(node)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {node.type === "folder" ? (
              <motion.div
                className="flex items-center gap-1 text-blue-400"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle();
                }}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
                <FolderPlus className="w-5 h-5" />
              </motion.div>
            ) : (
              <FileText className="w-5 h-5 text-gray-400" />
            )}
            {node.starred && (
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            )}
          </div>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (node.type === "file" && onView) {
                      onView(node);
                    }
                  }}
                  title="View document"
                  aria-label="View document"
                >
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                  onClick={() => onStar?.(node)}
                  title={node.starred ? "Remove from favorites" : "Add to favorites"}
                  aria-label={node.starred ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={`w-4 h-4 ${node.starred ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
                </button>
                {node.type === "file" && onDelete && (
                  <button 
                    className="p-1 rounded-md hover:bg-red-500/20 transition-colors"
                    onClick={() => onDelete(node)}
                    title="Delete document"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
                {node.type === "file" && node.document && (
                  <DocumentMoreOptions
                    document={node.document}
                    onEdit={onEdit ? () => onEdit(node) : undefined}
                    onShare={onShare ? () => onShare(node) : undefined}
                    onDownload={onDownload ? () => onDownload(node) : undefined}
                    onChangeStatus={onChangeStatus ? (status) => onChangeStatus(node, status) : undefined}
                    onDuplicate={onDuplicate ? () => onDuplicate(node) : undefined}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground mb-2 line-clamp-2">
          {node.name}
        </h3>

        {/* Status Badge */}
        {node.status && (
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mb-2 ${getStatusColor(node.status)}`}>
            {node.status}
          </div>
        )}

        {/* Tags */}
        {node.tags && node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {node.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-300 rounded-md text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {node.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{node.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {node.modified || "2 days ago"}
          </div>
          {node.size && (
            <div className="flex items-center gap-1">
              <span>{node.size}</span>
            </div>
          )}
        </div>

        {/* Children count for folders */}
        {node.type === "folder" && node.children && (
          <div className="absolute top-2 right-2 bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
            {node.children.length}
          </div>
        )}
      </motion.div>

      {/* Expanded Children */}
      <AnimatePresence>
        {isExpanded && node.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 mt-2 space-y-2 border-l border-border/50 pl-4"
          >
            {node.children.map((child) => (
              <GridItem
                key={child.id}
                node={child}
                onSelect={onSelect}
                onToggle={onToggle}
                onStar={onStar}
                onDelete={onDelete}
                onView={onView}
                onEdit={onEdit}
                onShare={onShare}
                onDownload={onDownload}
                onChangeStatus={onChangeStatus}
                onDuplicate={onDuplicate}
                isSelected={isSelected}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ComplianceWorkspace: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewingDocument, setViewingDocument] = useState<UserDocument | null>(null);
  const [editingDocument, setEditingDocument] = useState<UserDocument | null>(null);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [starredComplianceDocs, setStarredComplianceDocs] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Load starred compliance documents from localStorage on mount
  useEffect(() => {
    const savedStarred = localStorage.getItem('starredComplianceDocs');
    if (savedStarred) {
      try {
        const parsed = JSON.parse(savedStarred);
        setStarredComplianceDocs(new Set(parsed));
      } catch (error) {
        console.error('Error loading starred documents:', error);
      }
    }
  }, []);

  // Fetch user documents
  const { data: userDocuments, isLoading: isLoadingUserDocs } = useQuery<UserDocument[]>({
    queryKey: ['/api/user-documents'],
  });

  // Fetch compliance documents
  const { data: complianceDocuments, isLoading: isLoadingComplianceDocs } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  // Star document mutation
  const starDocumentMutation = useMutation({
    mutationFn: async ({ documentId, starred }: { documentId: number; starred: boolean }) => {
      return apiRequest('PATCH', `/api/user-documents/${documentId}`, { starred });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    }
  });

  // Status update mutation for user documents
  const updateStatusMutation = useMutation({
    mutationFn: async ({ documentId, status }: { documentId: number; status: string }) => {
      return apiRequest('PATCH', `/api/user-documents/${documentId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      toast({
        title: "Status Updated",
        description: "Document status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      });
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest('DELETE', `/api/user-documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      setSelectedNode(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  });

  // Edit document mutation
  const editDocumentMutation = useMutation({
    mutationFn: async ({ documentId, updates }: { documentId: number; updates: Partial<UserDocument> }) => {
      return apiRequest('PATCH', `/api/user-documents/${documentId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
      setEditingDocument(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    }
  });

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
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.status) formData.append('status', metadata.status);
      
      const response = await fetch('/api/user-documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      setIsUploadMode(false);
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

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Transform documents into hierarchical structure
  const transformToFileNodes = (): FileNode[] => {
    if (!userDocuments && !complianceDocuments) return [];

    const folders: Record<string, FileNode> = {};
    const allDocuments = [
      ...(userDocuments || []).map(doc => ({ ...doc, type: 'user' as const })),
      ...(complianceDocuments || []).map(doc => ({ ...doc, type: 'compliance' as const }))
    ];

    allDocuments.forEach(doc => {
      const category = ('category' in doc ? doc.category : 'Compliance') || 'General';
      
      if (!folders[category]) {
        folders[category] = {
          id: `folder-${category}`,
          name: category,
          type: "folder",
          children: []
        };
      }

      const fileNode: FileNode = {
        id: `${doc.type}-${doc.id}`,
        name: doc.title,
        type: "file",
        size: 'fileSize' in doc ? formatFileSize(doc.fileSize) : undefined,
        modified: formatDate(doc.updatedAt || doc.createdAt),
        status: doc.status as any,
        tags: 'tags' in doc ? doc.tags : undefined,
        starred: 'starred' in doc ? doc.starred : starredComplianceDocs.has(doc.id),
        document: doc
      };

      folders[category].children!.push(fileNode);
    });

    return Object.values(folders);
  };

  const fileNodes = transformToFileNodes();

  const filteredData = fileNodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (node.children && node.children.some(child => 
        child.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    const matchesFilter = filterStatus === "all" || 
      (node.children && node.children.some(child => child.status === filterStatus));
    
    return matchesSearch && matchesFilter;
  });

  const handleStarDocument = (node: FileNode) => {
    if (!node.document) return;
    
    if ('starred' in node.document) {
      // User document - use API
      starDocumentMutation.mutate({
        documentId: node.document.id,
        starred: !node.starred
      });
    } else {
      // Compliance document - use localStorage
      const newStarredSet = new Set(starredComplianceDocs);
      if (starredComplianceDocs.has(node.document.id)) {
        newStarredSet.delete(node.document.id);
        toast({
          title: "Removed from favorites",
          description: "Document removed from your favorites.",
        });
      } else {
        newStarredSet.add(node.document.id);
        toast({
          title: "Added to favorites",
          description: "Document added to your favorites.",
        });
      }
      
      setStarredComplianceDocs(newStarredSet);
      localStorage.setItem('starredComplianceDocs', JSON.stringify(Array.from(newStarredSet)));
    }
  };

  const handleDeleteDocument = (node: FileNode) => {
    if (node.document && 'userId' in node.document) {
      deleteDocumentMutation.mutate(node.document.id);
    }
  };

  const handleViewDocument = (node: FileNode) => {
    if (!node.document) return;
    
    if ('userId' in node.document) {
      // User document - open in modal
      setViewingDocument(node.document);
    } else {
      // Compliance document - navigate to detail page
      setLocation(`/documents/${node.document.id}`);
    }
  };

  const handleUpload = async (file: File, metadata: any) => {
    uploadMutation.mutate({ file, metadata });
  };

  const handleEditDocument = (node: FileNode) => {
    if (!node.document) return;
    
    if ('userId' in node.document) {
      // User document - open edit modal
      setEditingDocument(node.document);
    } else {
      // Compliance document - navigate to edit mode
      setLocation(`/documents/${node.document.id}?action=edit`);
    }
  };

  const handleSaveDocumentEdit = (documentId: number, updates: Partial<UserDocument>) => {
    editDocumentMutation.mutate({ documentId, updates });
  };

  const handleShareDocument = (node: FileNode) => {
    if (!node.document) return;
    
    const shareUrl = `${window.location.origin}/documents/${node.document.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Document link has been copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Share Failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    });
  };

  const handleDownloadDocument = (node: FileNode) => {
    if (!node.document) return;
    
    if ('userId' in node.document) {
      // User document - use existing file URL
      const link = document.createElement('a');
      link.href = node.document.fileUrl;
      link.download = node.document.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Compliance document - for now, just show a toast
      toast({
        title: "Download Document",
        description: "Compliance document download is not yet implemented.",
      });
    }
  };

  const handleChangeDocumentStatus = (node: FileNode, newStatus: string) => {
    if (!node.document) return;
    
    if ('userId' in node.document) {
      // User document - update status
      updateStatusMutation.mutate({
        documentId: node.document.id,
        status: newStatus,
      });
    } else {
      // Compliance document - would need API endpoint
      toast({
        title: "Status Change",
        description: `Changing compliance document status to ${newStatus} is not yet implemented.`,
      });
    }
  };

  const handleDuplicateDocument = (node: FileNode) => {
    if (!node.document) return;
    
    toast({
      title: "Duplicate Document",
      description: "Document duplication is not yet implemented.",
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "draft": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "review": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "approved": return "bg-green-500/20 text-green-300 border-green-500/30";
      case "archived": return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  if (isLoadingUserDocs || isLoadingComplianceDocs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-6 flex items-center justify-center">
        <div className="text-white text-lg">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Compliance Documentation Workspace
              </h1>
              <p className="text-blue-200">
                Organize and manage your compliance documents with visual clarity
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsUploadMode(!isUploadMode)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadMode ? 'Cancel Upload' : 'Upload Document'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Filter documents by status"
              title="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="approved">Approved</option>
              <option value="archived">Archived</option>
            </select>

            <div className="flex items-center bg-white/10 rounded-lg border border-white/20">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === "grid" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
                }`}
                aria-label="Grid view"
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
                }`}
                aria-label="List view"
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Upload Section */}
        <AnimatePresence>
          {isUploadMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Upload Document</h2>
              <FileUploader 
                onFileUpload={handleUpload}
                isUploading={uploadMutation.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <motion.div
          layout
          className={`grid gap-4 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          }`}
        >
          <AnimatePresence>
            {filteredData.map((node) => (
              <GridItem
                key={node.id}
                node={node}
                onSelect={setSelectedNode}
                onStar={handleStarDocument}
                onDelete={handleDeleteDocument}
                onView={handleViewDocument}
                onEdit={handleEditDocument}
                onShare={handleShareDocument}
                onDownload={handleDownloadDocument}
                onChangeStatus={handleChangeDocumentStatus}
                onDuplicate={handleDuplicateDocument}
                isSelected={selectedNode?.id === node.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Selected Item Details */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 w-80 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Selected Item</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close details"
                  title="Close details"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {selectedNode.type === "folder" ? (
                    <FolderPlus className="w-4 h-4 text-blue-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-white font-medium">{selectedNode.name}</span>
                </div>
                {selectedNode.status && (
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(selectedNode.status)}`}>
                    {selectedNode.status}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button 
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-md text-xs hover:bg-blue-500/30 transition-colors"
                    onClick={() => handleShareDocument(selectedNode)}
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                  <button 
                    className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-300 rounded-md text-xs hover:bg-green-500/30 transition-colors"
                    onClick={() => handleDownloadDocument(selectedNode)}
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Viewer Modal */}
        {viewingDocument && (
          <DocumentViewer
            document={viewingDocument}
            isOpen={!!viewingDocument}
            onClose={() => setViewingDocument(null)}
          />
        )}

        {/* Document Edit Modal */}
        {editingDocument && (
          <UserDocumentEditModal
            document={editingDocument}
            isOpen={!!editingDocument}
            onClose={() => setEditingDocument(null)}
            onSave={handleSaveDocumentEdit}
            isSaving={editDocumentMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default ComplianceWorkspace; 