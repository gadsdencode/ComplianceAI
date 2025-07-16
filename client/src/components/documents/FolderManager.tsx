import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, 
  Upload, 
  MoreHorizontal,
  Edit2,
  Trash2,
  FileText,
  X,
  Save,
  Plus,
  Folder,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface FolderItem {
  id: string;
  name: string;
  documentCount: number;
  createdAt: string;
  isDefault?: boolean;
}

interface FolderManagerProps {
  folders: FolderItem[];
  onCreateFolder: (name: string) => Promise<void>;
  onRenameFolder: (id: string, newName: string) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  onUploadToFolder: (folderId: string, files: FileList) => Promise<void>;
  onMoveDocument?: (documentId: number, targetFolderId: string, currentCategory: string) => Promise<void>;
  isCreating?: boolean;
  className?: string;
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isSaving?: boolean;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving = false
}) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmedName = folderName.trim();
    
    if (!trimmedName) {
      setError('Folder name is required');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Folder name must be at least 2 characters');
      return;
    }
    
    if (trimmedName.length > 50) {
      setError('Folder name must be less than 50 characters');
      return;
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setError('Folder name contains invalid characters');
      return;
    }
    
    setError('');
    onSave(trimmedName);
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Create New Folder
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                if (error) setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter folder name"
              disabled={isSaving}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !folderName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface FolderCardProps {
  folder: FolderItem;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onUpload: (folderId: string, files: FileList) => void;
  onMoveDocument?: (documentId: number, targetFolderId: string, currentCategory: string) => Promise<void>;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent, folderId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, folderId: string) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onRename,
  onDelete,
  onUpload,
  onMoveDocument,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showActions, setShowActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSaveEdit = () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== folder.name) {
      onRename(folder.id, trimmedName);
    }
    setIsEditing(false);
    setEditName(folder.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(folder.name);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(folder.id, files);
    }
    // Reset the input to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        relative group p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
        ${isDragOver 
          ? 'border-blue-400 bg-blue-50 shadow-lg scale-105' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
        }
        bg-white
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onDragOver={(e) => onDragOver(e, folder.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, folder.id)}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.json,.xml"
        aria-label={`Upload files to ${folder.name} folder`}
        title={`Upload files to ${folder.name} folder`}
      />

      {/* Folder Icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isDragOver ? (
            <FolderOpen className="w-8 h-8 text-blue-500" />
          ) : (
            <Folder className="w-8 h-8 text-blue-500" />
          )}
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  onBlur={handleSaveEdit}
                  className="text-sm h-6 px-2"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                />
              </div>
            ) : (
              <h3 className="font-medium text-gray-900 text-sm truncate">
                {folder.name}
              </h3>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <AnimatePresence>
          {showActions && !isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={handleUploadClick}
                className="p-1 rounded-md hover:bg-blue-100 transition-colors"
                title="Upload files to this folder"
              >
                <Upload className="w-4 h-4 text-blue-600" />
              </button>
              
              {!folder.isDefault && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    title="Rename folder"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  <button
                    onClick={() => onDelete(folder.id)}
                    className="p-1 rounded-md hover:bg-red-100 transition-colors"
                    title="Delete folder"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Count */}
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <FileText className="w-3 h-3" />
        {folder.documentCount} {folder.documentCount === 1 ? 'document' : 'documents'}
      </div>

      {/* Drag overlay */}
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-100/50 rounded-xl flex items-center justify-center border-2 border-blue-400 border-dashed"
        >
          <div className="text-blue-600 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Drop files here</p>
          </div>
        </motion.div>
      )}

      {/* Default folder indicator */}
      {folder.isDefault && (
        <div className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
          Default
        </div>
      )}
    </motion.div>
  );
};

export default function FolderManager({
  folders,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onUploadToFolder,
  onMoveDocument,
  isCreating = false,
  className = ''
}: FolderManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreateFolder = async (name: string) => {
    try {
      await onCreateFolder(name);
      setShowCreateModal(false);
      toast({
        title: "Folder Created",
        description: `Folder "${name}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRenameFolder = async (id: string, newName: string) => {
    try {
      await onRenameFolder(id, newName);
      toast({
        title: "Folder Renamed",
        description: `Folder has been renamed to "${newName}".`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename folder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (!folder) return;

    if (folder.documentCount > 0) {
      toast({
        title: "Cannot Delete Folder",
        description: "Please move or delete all documents in this folder first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onDeleteFolder(id);
      toast({
        title: "Folder Deleted",
        description: `Folder "${folder.name}" has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete folder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(folderId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we're leaving the actual folder card
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverFolder(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    try {
      // Check if it's a document being moved
      const dragDataString = e.dataTransfer.getData('application/json');
      if (dragDataString) {
        const dragData = JSON.parse(dragDataString);
        
        if (dragData.type === 'document' && onMoveDocument) {
          // Handle document move
          const targetFolder = folders.find(f => f.id === folderId);
          if (!targetFolder) return;
          
          // Extract folder name from ID format: folder-{userId}-{folderName}
          const targetFolderName = targetFolder.name;
          
          // Don't move if it's already in the target folder
          if (dragData.currentCategory === targetFolderName) {
            toast({
              title: "No Move Needed",
              description: `Document is already in the "${targetFolderName}" folder.`,
            });
            return;
          }
          
          await onMoveDocument(dragData.documentId, folderId, dragData.currentCategory);
          
          toast({
            title: "Document Moved",
            description: `"${dragData.title}" moved to "${targetFolderName}" successfully.`,
          });
          return;
        }
      }
      
      // Handle file uploads from file system (existing functionality)
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await onUploadToFolder(folderId, files);
        const folder = folders.find(f => f.id === folderId);
        toast({
          title: "Files Uploaded",
          description: `${files.length} file(s) uploaded to "${folder?.name}" successfully.`,
        });
      }
    } catch (error) {
      console.error('Drop error:', error);
      toast({
        title: "Operation Failed",
        description: "Failed to complete the operation. Please try again.",
        variant: "destructive",
      });
    }
  }, [folders, onUploadToFolder, onMoveDocument, toast]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
          <p className="text-sm text-gray-500">
            Organize your documents by creating folders and dragging files or documents to them
          </p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={isCreating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          {isCreating ? 'Creating...' : 'New Folder'}
        </Button>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onRename={handleRenameFolder}
              onDelete={handleDeleteFolder}
              onUpload={onUploadToFolder}
              onMoveDocument={onMoveDocument}
              isDragOver={dragOverFolder === folder.id}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {folders.length === 0 && (
        <div className="text-center py-12">
          <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No folders yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first folder to organize your documents
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Create First Folder
          </Button>
        </div>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateFolder}
        isSaving={isCreating}
      />
    </div>
  );
}