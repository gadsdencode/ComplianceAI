import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  FolderOpen,
  CheckSquare,
  Square,
  MoreVertical
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
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (folderId: string) => void;
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
  onDrop,
  isMultiSelectMode = false,
  isSelected = false,
  onSelect
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showActions, setShowActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSaveEdit = async () => {
    const trimmedName = editName.trim();
    
    if (!trimmedName) {
      toast({
        title: "Invalid Name",
        description: "Folder name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    if (trimmedName.length < 2) {
      toast({
        title: "Invalid Name",
        description: "Folder name must be at least 2 characters.",
        variant: "destructive",
      });
      return;
    }
    
    if (trimmedName.length > 50) {
      toast({
        title: "Invalid Name",
        description: "Folder name must be less than 50 characters.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      toast({
        title: "Invalid Name",
        description: "Folder name contains invalid characters.",
        variant: "destructive",
      });
      return;
    }
    
    if (trimmedName === folder.name) {
      setIsEditing(false);
      return;
    }
    
    try {
      await onRename(folder.id, trimmedName);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in the parent component
      setEditName(folder.name); // Reset to original name on error
    }
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
      whileHover={{ 
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      data-folder-id={folder.id}
      className={`
        relative group p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
        ${isDragOver 
          ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-2xl scale-105 animate-pulse' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-blue-50'
        }
        bg-white backdrop-blur-sm
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
          {isMultiSelectMode && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect?.(folder.id)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </motion.button>
          )}
          <motion.div
            whileHover={{ rotate: isDragOver ? 0 : -5, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {isDragOver ? (
              <FolderOpen className="w-8 h-8 text-blue-500" />
            ) : (
              <Folder className="w-8 h-8 text-blue-500" />
            )}
          </motion.div>
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
              <motion.h3 
                className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors"
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {folder.name}
              </motion.h3>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <AnimatePresence>
          {showActions && !isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="flex items-center gap-1"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleUploadClick}
                className="p-1 rounded-md hover:bg-blue-100 transition-colors"
                title="Upload files to this folder"
              >
                <Upload className="w-4 h-4 text-blue-600" />
              </motion.button>
              
              {!folder.isDefault && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    title="Rename folder"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(folder.id)}
                    className="p-1 rounded-md hover:bg-red-100 transition-colors"
                    title="Delete folder"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Count */}
      <motion.div 
        className="text-xs text-gray-500 flex items-center gap-1 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <FileText className="w-3 h-3" />
        <motion.span
          key={folder.documentCount}
          initial={{ scale: 1.2, color: "#3b82f6" }}
          animate={{ scale: 1, color: "#6b7280" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {folder.documentCount} {folder.documentCount === 1 ? 'document' : 'documents'}
        </motion.span>
      </motion.div>

      {/* Drag overlay with enhanced animation */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-100/80 to-blue-200/60 rounded-xl flex items-center justify-center border-2 border-blue-400 border-dashed backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
              className="text-blue-600 text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 0.6, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Upload className="w-8 h-8 mx-auto mb-2" />
              </motion.div>
              <motion.p 
                className="text-sm font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Drop here
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Default folder indicator with animation */}
      {folder.isDefault && (
        <motion.div 
          className="absolute top-2 right-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full shadow-sm"
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          Default
        </motion.div>
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
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const { toast } = useToast();

  // Add global drag end handler to ensure overlay clears when drag ends
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDragOverFolder(null);
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    document.addEventListener('drop', handleGlobalDragEnd);

    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
      document.removeEventListener('drop', handleGlobalDragEnd);
    };
  }, []);

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

  const handleBulkDelete = async () => {
    if (selectedFolders.size === 0) return;

    const foldersToDelete = folders.filter(f => 
      selectedFolders.has(f.id) && !f.isDefault && f.documentCount === 0
    );

    if (foldersToDelete.length === 0) {
      toast({
        title: "Cannot Delete",
        description: "Selected folders contain documents or include protected folders.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete folders sequentially to avoid overwhelming the server
      for (const folder of foldersToDelete) {
        await onDeleteFolder(folder.id);
      }
      
      setSelectedFolders(new Set());
      setIsMultiSelectMode(false);
      
      toast({
        title: "Folders Deleted",
        description: `${foldersToDelete.length} folder(s) have been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some folders. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectFolder = (folderId: string) => {
    if (!isMultiSelectMode) return;
    
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId);
    } else {
      newSelected.add(folderId);
    }
    setSelectedFolders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFolders.size === folders.length) {
      setSelectedFolders(new Set());
    } else {
      setSelectedFolders(new Set(folders.map(f => f.id)));
    }
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedFolders(new Set());
  };

  const handleDragOver = useCallback((e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(folderId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear drag state when leaving the folder card or when relatedTarget is null (drag ended)
    const relatedTarget = e.relatedTarget as Node;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
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
          
          // Add loading state and success animation
          const folderCard = document.querySelector(`[data-folder-id="${folderId}"]`) as HTMLElement;
          if (folderCard) {
            folderCard.style.transform = 'scale(0.95)';
            folderCard.style.transition = 'transform 0.2s ease';
          }
          
          await onMoveDocument(dragData.documentId, folderId, dragData.currentCategory);
          
          // Success animation
          if (folderCard) {
            folderCard.style.transform = 'scale(1.05)';
            setTimeout(() => {
              folderCard.style.transform = 'scale(1)';
              
              // Add a subtle pulse effect
              folderCard.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.3)';
              setTimeout(() => {
                folderCard.style.boxShadow = '';
                folderCard.style.transition = '';
              }, 500);
            }, 200);
          }
          
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
        
        <div className="flex items-center gap-2">
          {isMultiSelectMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedFolders.size === folders.length ? 'Deselect All' : 'Select All'}
              </Button>
              
              {selectedFolders.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete ({selectedFolders.size})
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMultiSelectMode}
                className="text-xs"
              >
                Cancel
              </Button>
            </>
          )}
          
          {!isMultiSelectMode && folders.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMultiSelectMode}
              className="text-xs"
            >
              <MoreVertical className="w-3 h-3 mr-1" />
              Manage
            </Button>
          )}
          
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'New Folder'}
          </Button>
        </div>
      </div>

      {/* Folders Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.2
            }
          }
        }}
      >
        <AnimatePresence>
          {folders.map((folder, index) => (
            <motion.div
              key={folder.id}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.9 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                    delay: index * 0.05
                  }
                }
              }}
              layout
            >
              <FolderCard
                folder={folder}
                onRename={handleRenameFolder}
                onDelete={handleDeleteFolder}
                onUpload={onUploadToFolder}
                onMoveDocument={onMoveDocument}
                isDragOver={dragOverFolder === folder.id}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={selectedFolders.has(folder.id)}
                onSelect={handleSelectFolder}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {folders.length === 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 400, damping: 25 }}
          >
            <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          </motion.div>
          <motion.h3 
            className="text-lg font-medium text-gray-900 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            No folders yet
          </motion.h3>
          <motion.p 
            className="text-gray-500 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Create your first folder to organize your documents
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 400, damping: 25 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create First Folder
            </Button>
          </motion.div>
        </motion.div>
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