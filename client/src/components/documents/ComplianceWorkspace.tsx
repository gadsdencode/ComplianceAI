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
import { UserDocument, Document, BulkUploadResponse } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import DocumentViewer from '@/components/documents/DocumentViewer';
import FileUploader from '@/components/documents/FileUploader';
import DocumentMoreOptions from '@/components/documents/DocumentMoreOptions';
import UserDocumentEditModal from '@/components/documents/UserDocumentEditModal';
import ShareModal from '@/components/documents/ShareModal';
import FolderManager from '@/components/documents/FolderManager';

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
  folderId?: string; // For managed folders
  documentCount?: number; // For managed folders
  isManaged?: boolean; // For managed folders
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
  onMoveToFolder?: (documentId: string, folderId: string, sourceNodeId: string) => void;
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
  onMoveToFolder,
  isSelected, 
  level = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    
    if (node.type === "file" && node.document) {
      const dragData = {
        type: 'document',
        documentId: node.document.id,
        documentType: 'type' in node.document ? node.document.type : 'user',
        currentCategory: 'category' in node.document ? node.document.category : 'Compliance',
        currentFolderId: 'folderId' in node.document ? node.document.folderId : null,
        sourceNodeId: node.id
      };
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'move';
      
      // Add visual feedback to the dragged element
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.transform = 'rotate(5deg)';
      dragImage.style.opacity = '0.8';
      e.dataTransfer.setDragImage(dragImage, 0, 0);
    } else if (node.type === "folder") {
      const dragData = {
        type: 'folder',
        folderId: node.folderId || node.id,
        folderName: node.name,
        sourceNodeId: node.id,
        isManaged: node.isManaged || false,
        documentCount: node.documentCount || 0
      };
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'move';
      
      // Add visual feedback to the dragged folder
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.transform = 'rotate(3deg)';
      dragImage.style.opacity = '0.7';
      e.dataTransfer.setDragImage(dragImage, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (node.type === "folder") {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (node.type === "folder") {
      // Only clear drag over if we're actually leaving the folder
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        setIsDragOver(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (node.type === "folder") {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      
      try {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
        
        if (dragData.type === 'document' && dragData.documentType === 'user') {
          // Move document to folder - use the actual folder ID for managed folders
          const targetFolderId = node.isManaged ? node.folderId : node.id;
          if (onMoveToFolder && targetFolderId) {
            onMoveToFolder(dragData.documentId, targetFolderId, dragData.sourceNodeId);
          }
        } else if (dragData.type === 'folder' && dragData.sourceNodeId !== node.id) {
          // Only allow moving managed folders for now
          if (dragData.isManaged && node.isManaged) {
            // Move folder into this folder (create subfolder relationship)
            if (onMoveToFolder) {
              onMoveToFolder(dragData.folderId, node.folderId || node.id, dragData.sourceNodeId);
            }
          }
        }
      } catch (error) {
        console.error('Error handling drop:', error);
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative group"
    >
      <div
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative p-4 rounded-xl border transition-all duration-300 cursor-pointer
          ${isSelected 
            ? "bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20" 
            : "bg-background/50 border-border hover:border-blue-400/50 hover:bg-blue-500/10"
          }
          ${isDragOver && node.type === "folder" 
            ? "border-green-400 bg-green-500/10 scale-105" 
            : ""
          }
          backdrop-blur-sm
          cursor-move
        `}
        onClick={(e) => {
          // Only handle click if it's not a drag operation
          if (e.detail > 0) { // detail > 0 means it's a real click, not from drag
            if (node.type === "folder") {
              handleToggle();
            }
            onSelect(node);
          }
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {node.type === "folder" ? (
              <motion.div
                className="flex items-center gap-1 text-blue-400 cursor-pointer"
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
                className="flex items-center gap-1 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onView) {
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onStar?.(node);
                  }}
                  title={node.starred ? "Remove from favorites" : "Add to favorites"}
                  aria-label={node.starred ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={`w-4 h-4 ${node.starred ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
                </button>
                {node.type === "file" && onDelete && (
                  <button 
                    className="p-1 rounded-md hover:bg-red-500/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(node);
                    }}
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
        {node.type === "folder" && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {node.isManaged && (
              <div className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full border border-green-500/30">
                Managed
              </div>
            )}
            {(node.children || node.documentCount !== undefined) && (
              <div className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                {node.documentCount !== undefined ? node.documentCount : (node.children?.length || 0)}
              </div>
            )}
          </div>
        )}

        {/* Drop zone indicator for folders */}
        {node.type === "folder" && isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-green-500/20 border-2 border-dashed border-green-400 rounded-xl flex items-center justify-center backdrop-blur-sm"
          >
            <div className="text-green-400 font-semibold text-sm flex items-center gap-2">
              <span>📂</span>
              Drop document here
            </div>
          </motion.div>
        )}
      </motion.div>
      </div>

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
                onMoveToFolder={onMoveToFolder}
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
  const [sharingDocument, setSharingDocument] = useState<UserDocument | Document | null>(null);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [starredComplianceDocs, setStarredComplianceDocs] = useState<Set<number>>(new Set());
  const [isMainAreaDragOver, setIsMainAreaDragOver] = useState(false);
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
  const { data: userDocuments, isLoading: isLoadingUserDocs, dataUpdatedAt: userDocsUpdatedAt } = useQuery<UserDocument[]>({
    queryKey: ['/api/user-documents'],
  });

  // Fetch compliance documents
  const { data: complianceDocuments, isLoading: isLoadingComplianceDocs } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  // Fetch user document folders
  const { data: folders, isLoading: isLoadingFolders, dataUpdatedAt: foldersUpdatedAt } = useQuery<any[]>({
    queryKey: ['/api/user-documents/folders'],
  });

  // Debug logging for data changes
  useEffect(() => {
    if (userDocuments) {
      console.log('🔄 USER DOCUMENTS UPDATED:', {
        count: userDocuments.length,
        timestamp: new Date().toISOString(),
        dataUpdatedAt: userDocsUpdatedAt,
        documents: userDocuments.map(doc => ({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          updatedAt: doc.updatedAt
        }))
      });
    }
  }, [userDocuments, userDocsUpdatedAt]);

  useEffect(() => {
    if (folders) {
      console.log('🔄 FOLDERS UPDATED:', {
        count: folders.length,
        timestamp: new Date().toISOString(),
        dataUpdatedAt: foldersUpdatedAt,
        folders: folders.map(f => ({
          id: f.id,
          name: f.name,
          createdAt: f.createdAt
        }))
      });
    }
  }, [folders, foldersUpdatedAt]);

  // Cleanup duplicate folders on component mount
  useEffect(() => {
    const cleanupFolders = async () => {
      try {
        await apiRequest('POST', '/api/user-documents/folders/cleanup');
        // Refresh folder list after cleanup
        queryClient.invalidateQueries({ queryKey: ['/api/user-documents/folders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      } catch (error) {
        console.log('Folder cleanup skipped:', error);
        // Don't show error to user as this is a background cleanup
      }
    };

    // Only run cleanup once when folders are first loaded
    if (folders && folders.length > 0) {
      cleanupFolders();
    }
  }, [folders?.length]); // Only trigger when folder count changes

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

  // Folder management mutations
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('POST', '/api/user-documents/folders', { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
    }
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      return apiRequest('PUT', `/api/user-documents/folders/${id}`, { name: newName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Rename Failed",
        description: error.message || "Failed to rename folder. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      // First try without force to check if confirmation is needed
      try {
        return await apiRequest('DELETE', `/api/user-documents/folders/${id}`);
      } catch (error: any) {
        // If the error indicates confirmation is needed, the FolderManager will handle it
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
    }
  });

  const uploadToFolderMutation = useMutation({
    mutationFn: async ({ folderId, files }: { folderId: string; files: FileList }) => {
      // Upload each file to the specified folder
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('folderId', folderId);
        
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
      });
      
      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents/folders'] });
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

  // Bulk upload document mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (data: { files: FileList; metadata: any }): Promise<BulkUploadResponse> => {
      const { files, metadata } = data;
      
      // Create form data for bulk file upload
      const formData = new FormData();
      
      // Append all files with the key 'files'
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      
      // Append metadata as JSON string
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      const response = await fetch('/api/user-documents/bulk-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload documents');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents/folders'] });
    },
    onError: (error: any) => {
      console.error("Bulk upload mutation error:", error);
      toast({
        title: 'Bulk Upload Failed',
        description: error.message || 'There was an error uploading your documents.',
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

    console.log('🔄 Transforming documents to file nodes:', {
      userDocuments: userDocuments?.length || 0,
      complianceDocuments: complianceDocuments?.length || 0,
      folders: folders?.length || 0,
      timestamp: new Date().toISOString()
    });

    // DEBUG: Log all user documents with their categories
    if (userDocuments && userDocuments.length > 0) {
      console.log('📋 USER DOCUMENTS DEBUG:', userDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        updatedAt: doc.updatedAt
      })));
    }

    // DEBUG: Log all available folders
    if (folders && folders.length > 0) {
      console.log('📁 FOLDERS DEBUG:', folders.map(f => ({
        id: f.id,
        name: f.name,
        createdAt: f.createdAt
      })));
    }

    const folderNodes: Record<string, FileNode> = {};
    const allDocuments = [
      ...(userDocuments || []).map(doc => ({ ...doc, type: 'user' as const })),
      ...(complianceDocuments || []).map(doc => ({ ...doc, type: 'compliance' as const }))
    ];

    // Create managed folders from API response
    if (folders && Array.isArray(folders)) {
      console.log('📁 Creating managed folders:', folders.map(f => ({ id: f.id, name: f.name })));
      
      folders.forEach(folder => {
        folderNodes[folder.id] = {
          id: `managed-folder-${folder.id}`,
          name: folder.name,
          type: "folder",
          children: [],
          modified: formatDate(folder.createdAt || new Date().toISOString()),
          folderId: folder.id, // Store original folder ID for operations
          documentCount: 0, // We'll count as we add documents
          isManaged: true // Flag to distinguish from category folders
        };
      });
    }

    // Ensure "General" folder always exists
    if (!Object.values(folderNodes).find(folder => folder.name === 'General')) {
      console.log('📁 Creating default General folder');
      const generalFolderId = 'general-default';
      folderNodes[generalFolderId] = {
        id: `managed-folder-${generalFolderId}`,
        name: 'General',
        type: "folder",
        children: [],
        modified: formatDate(new Date().toISOString()),
        folderId: generalFolderId,
        documentCount: 0,
        isManaged: true
      };
    }

    // DEBUG: Log created folder structure
    console.log('📁 CREATED FOLDERS:', Object.values(folderNodes).map(folder => ({
      id: folder.id,
      name: folder.name,
      folderId: folder.folderId,
      isManaged: folder.isManaged
    })));

    // Process documents and assign them to managed folders
    allDocuments.forEach(doc => {
      const category = ('category' in doc ? doc.category : 'Compliance') || 'General';
      
      console.log('📄 Processing document:', {
        id: doc.id,
        title: doc.title,
        category: category,
        type: doc.type,
        updatedAt: doc.updatedAt
      });
      
      // Find the managed folder that matches this document's category (case-insensitive)
      const matchingManagedFolder = Object.values(folderNodes).find(folder => 
        folder.isManaged && folder.name.toLowerCase() === category.toLowerCase()
      );
      
      console.log('🔍 FOLDER MATCHING DEBUG:', {
        documentCategory: category,
        availableFolders: Object.values(folderNodes).map(f => f.name),
        matchingFolder: matchingManagedFolder?.name || 'NONE',
        matchingFolderId: matchingManagedFolder?.folderId || 'NONE'
      });
      
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

      if (matchingManagedFolder) {
        // Add to the matching managed folder
        console.log(`✅ Adding document "${doc.title}" to folder "${matchingManagedFolder.name}"`);
        matchingManagedFolder.children!.push(fileNode);
        matchingManagedFolder.documentCount = (matchingManagedFolder.documentCount || 0) + 1;
      } else {
        // If no managed folder exists for this category, add to General folder
        const generalFolder = Object.values(folderNodes).find(folder => 
          folder.isManaged && folder.name === 'General'
        );
        
        if (generalFolder) {
          console.log(`⚠️ No folder found for category "${category}", adding document "${doc.title}" to General folder`);
          generalFolder.children!.push(fileNode);
          generalFolder.documentCount = (generalFolder.documentCount || 0) + 1;
        } else {
          console.error(`❌ No General folder found for document "${doc.title}" with category "${category}"`);
        }
      }
    });

    const result = Object.values(folderNodes);
    console.log('📋 FINAL FOLDER STRUCTURE:', result.map(folder => ({
      name: folder.name,
      documentCount: folder.children?.length || 0,
      isManaged: folder.isManaged,
      documents: folder.children?.map(child => ({
        name: child.name,
        category: child.document && 'category' in child.document ? child.document.category : 'N/A'
      })) || []
    })));

    return result;
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

  const handleBulkUpload = async (files: FileList, metadata: any) => {
    return await bulkUploadMutation.mutateAsync({ files, metadata });
  };

  // Folder management handlers
  const handleCreateFolder = async (name: string) => {
    await createFolderMutation.mutateAsync(name);
  };

  const handleRenameFolder = async (id: string, newName: string) => {
    await renameFolderMutation.mutateAsync({ id, newName });
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolderMutation.mutateAsync(id);
  };

  const handleUploadToFolder = async (folderId: string, files: FileList) => {
    await uploadToFolderMutation.mutateAsync({ folderId, files });
  };

  const handleMoveDocument = async (documentId: number, targetFolderId: string, currentCategory: string) => {
    try {
      // Extract folder name from ID format: folder-{userId}-{folderName}
      const targetFolder = folders?.find(f => f.id === targetFolderId);
      if (!targetFolder) {
        throw new Error('Target folder not found');
      }
      
      const targetFolderName = targetFolder.name;
      
      // Don't move if it's already in the target folder
      if (currentCategory === targetFolderName) {
        return;
      }
      
      // Update the document's category using the existing PATCH endpoint
      await apiRequest('PATCH', `/api/user-documents/${documentId}`, { 
        category: targetFolderName 
      });
      
      // Refresh the queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents/folders'] });
      
    } catch (error) {
      console.error('Error moving document:', error);
      throw error;
    }
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
    
    setSharingDocument(node.document);
  };

  const handleDownloadDocument = (node: FileNode) => {
    if (!node.document) return;
    
    if ('userId' in node.document) {
      // User document - use API endpoint with proper authentication
      const link = document.createElement('a');
      link.href = node.document.fileUrl; // This is the API endpoint: /api/user-documents/:id/download
      link.setAttribute('download', node.document.fileName);
      link.style.display = 'none';
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

  const handleMoveToFolder = async (itemId: string, targetFolderId: string, sourceNodeId: string) => {
    try {
      // Find the target folder for better user feedback
      const targetFolder = fileNodes.find(folder => 
        folder.id === targetFolderId || 
        folder.folderId === targetFolderId ||
        folder.id === `managed-folder-${targetFolderId}`
      );
      
      if (!targetFolder) {
        console.error('❌ Target folder not found:', { targetFolderId, availableFolders: fileNodes.map(f => f.id) });
        throw new Error('Target folder not found');
      }
      
      const targetFolderName = targetFolder.name;
      
      // Determine if we're moving a document or a folder
      const sourceNode = fileNodes.flatMap(folder => [folder, ...(folder.children || [])])
        .find(node => node.id === sourceNodeId);
      
      if (!sourceNode) {
        console.error('❌ Source item not found:', { sourceNodeId, availableNodes: fileNodes.flatMap(f => [f, ...(f.children || [])]).map(n => n.id) });
        throw new Error('Source item not found');
      }
      
      const isMovingFolder = sourceNode.type === 'folder';
      const itemName = sourceNode.name;
      
      console.log('🔄 Move operation details:', {
        itemId,
        targetFolderId,
        targetFolderName,
        sourceNodeId,
        isMovingFolder,
        itemName,
        sourceDocument: sourceNode.document
      });
      
      // For managed folders, use actual API calls
      if (targetFolder?.isManaged) {
        if (isMovingFolder && sourceNode.isManaged) {
          // Moving a managed folder into another managed folder
          // This would require backend support for nested folders
          toast({
            title: "Feature Not Available",
            description: "Nested managed folders are not yet supported.",
            variant: "destructive",
          });
          return;
        } else if (!isMovingFolder && sourceNode.document && 'userId' in sourceNode.document) {
          // Moving a user document to a managed folder
          console.log('🔄 Moving document to folder:', { 
            documentId: itemId, 
            targetCategory: targetFolderName,
            sourceDocument: sourceNode.document 
          });
          
          try {
            // Show loading state
            toast({
              title: "Moving Document",
              description: `Moving "${itemName}" to ${targetFolderName}...`,
            });
            
            // Extract the actual document ID from the node ID format: "user-123" -> 123
            const actualDocumentId = sourceNode.document.id;
            const currentCategory = sourceNode.document.category;
            
            // Don't move if it's already in the target folder
            if (currentCategory === targetFolderName) {
              toast({
                title: "No Move Needed", 
                description: `Document is already in the "${targetFolderName}" folder.`,
              });
              return;
            }
            
            console.log('📝 Making API call to update document category:', {
              documentId: actualDocumentId,
              newCategory: targetFolderName,
              currentCategory: currentCategory
            });
            
            // DEBUG: Log pre-move state
            console.log('🔍 PRE-MOVE DEBUG STATE:', {
              userDocumentsBefore: userDocuments?.map(doc => ({
                id: doc.id,
                title: doc.title,
                category: doc.category,
                updatedAt: doc.updatedAt
              })) || [],
              foldersBefore: folders?.map(f => ({ id: f.id, name: f.name })) || []
            });
            
            // Make the API call to update the document's category
            const response = await apiRequest('PATCH', `/api/user-documents/${actualDocumentId}`, { 
              category: targetFolderName 
            });
            
            console.log('✅ Document move API response:', response);
            
            // DEBUG: Parse and log the response data
            const responseData = await response.json();
            console.log('📊 PARSED API RESPONSE:', {
              documentId: responseData.id,
              title: responseData.title,
              oldCategory: currentCategory,
              newCategory: responseData.category,
              updatedAt: responseData.updatedAt,
              wasSuccessful: responseData.category === targetFolderName
            });
            
            // More aggressive query invalidation to ensure UI updates
            console.log('🔄 Invalidating queries for UI refresh...');
            
            // Invalidate multiple related queries to ensure complete refresh
            await Promise.all([
              queryClient.invalidateQueries({ 
                queryKey: ['/api/user-documents'],
                refetchType: 'all' // Force refetch even if stale time hasn't expired
              }),
              queryClient.invalidateQueries({ 
                queryKey: ['/api/user-documents/folders'],
                refetchType: 'all' // Force refetch even if stale time hasn't expired
              }),
              // Also invalidate with exact matching to catch any cache variations
              queryClient.invalidateQueries({ 
                queryKey: ['/api/user-documents'], 
                exact: false,
                refetchType: 'all'
              })
            ]);
            
            // Force a refetch of the specific queries we use
            await Promise.all([
              queryClient.refetchQueries({ queryKey: ['/api/user-documents'] }),
              queryClient.refetchQueries({ queryKey: ['/api/user-documents/folders'] })
            ]);
            
            console.log('✅ Query invalidation completed');
            
            // DEBUG: Add a small delay and then log post-move state
            setTimeout(() => {
              console.log('🔍 POST-MOVE DEBUG STATE (delayed):', {
                userDocumentsAfter: userDocuments?.map(doc => ({
                  id: doc.id,
                  title: doc.title,
                  category: doc.category,
                  updatedAt: doc.updatedAt
                })) || [],
                foldersAfter: folders?.map(f => ({ id: f.id, name: f.name })) || []
              });
            }, 1000);
            
            // Success feedback
            toast({
              title: "Document Moved Successfully",
              description: `"${itemName}" has been moved to ${targetFolderName}.`,
            });
            
            console.log('✅ Document move completed successfully');
            return;
            
          } catch (apiError: any) {
            console.error('❌ API error moving document:', {
              error: apiError,
              documentId: sourceNode.document.id,
              targetCategory: targetFolderName,
              response: apiError.response?.data
            });
            throw new Error(`Failed to move document: ${apiError.message || 'Unknown API error'}`);
          }
        }
      }
      
      // For category folders or other operations, show success toast
      // (these are visual operations for now)
      toast({
        title: `${isMovingFolder ? 'Folder' : 'Document'} Moved`,
        description: `${itemName} has been moved to ${targetFolderName}.`,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Move operation failed:', {
        error,
        itemId,
        targetFolderId,
        sourceNodeId,
        errorMessage
      });
      
      toast({
        title: "Move Failed",
        description: `Failed to move item: ${errorMessage}`,
        variant: "destructive",
      });
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
                onClick={() => setShowFolderManager(!showFolderManager)}
                variant={showFolderManager ? "secondary" : "outline"}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                {showFolderManager ? 'Hide Folders' : 'Manage Folders'}
              </Button>
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
                onBulkFileUpload={handleBulkUpload}
                folders={folders?.map(folder => ({ id: folder.id, name: folder.name })) || []}
                isUploading={uploadMutation.isPending}
                supportsBulkUpload={true}
                maxFiles={50}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Folder Manager Section */}
        <AnimatePresence>
          {showFolderManager && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            >
              <FolderManager
                folders={folders || []}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onUploadToFolder={handleUploadToFolder}
                onMoveDocument={handleMoveDocument}
                isCreating={createFolderMutation.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <motion.div
          layout
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setIsMainAreaDragOver(true);
          }}
          onDragLeave={(e) => {
            // Only clear if we're leaving the main area completely
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsMainAreaDragOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsMainAreaDragOver(false);
            
            try {
              const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
              if (dragData.type === 'folder' && dragData.isManaged) {
                toast({
                  title: "Folder Organized",
                  description: `${dragData.folderName} is now displayed in the main area.`,
                });
                // Managed folders are already displayed in main area by default
              } else if (dragData.type === 'document') {
                toast({
                  title: "Document Organization",
                  description: "Documents can be moved between folders by dropping them on folder icons.",
                });
              }
            } catch (error) {
              console.error('Error handling main area drop:', error);
            }
          }}
          className={`grid gap-4 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          } ${isMainAreaDragOver ? 'bg-blue-500/10 border-2 border-dashed border-blue-400 rounded-lg p-4' : ''}`}
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
                onMoveToFolder={handleMoveToFolder}
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

        {/* Document Share Modal */}
        {sharingDocument && (
          <ShareModal
            document={sharingDocument}
            isOpen={!!sharingDocument}
            onClose={() => setSharingDocument(null)}
            onDownload={() => handleDownloadDocument({ document: sharingDocument } as FileNode)}
          />
        )}
      </div>
    </div>
  );
};

export default ComplianceWorkspace; 