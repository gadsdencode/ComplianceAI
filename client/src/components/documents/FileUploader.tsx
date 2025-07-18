import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, X, AlertCircle, File, Loader2, Folder, Files, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BulkUploadResponse, BulkUploadFileResult } from '@/types';

interface FolderOption {
  id: string;
  name: string;
}

interface FileUploaderProps {
  onFileUpload: (file: File, metadata: { title: string; description?: string; tags?: string[]; folderId?: string }) => Promise<void>;
  onBulkFileUpload?: (files: FileList, metadata: { description?: string; tags?: string[]; folderId?: string }) => Promise<BulkUploadResponse>;
  folders?: FolderOption[];
  defaultFolderId?: string;
  isUploading?: boolean;
  supportsBulkUpload?: boolean;
  maxFiles?: number;
}

export default function FileUploader({ 
  onFileUpload, 
  onBulkFileUpload,
  folders = [], 
  defaultFolderId, 
  isUploading = false,
  supportsBulkUpload = false,
  maxFiles = 50
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  
  // Single file mode state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  
  // Bulk file mode state
  const [files, setFiles] = useState<File[]>([]);
  const [bulkResults, setBulkResults] = useState<BulkUploadFileResult[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  
  // Shared state
  const [fileError, setFileError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(defaultFolderId || (folders.length > 0 ? folders[0].id : ''));
  
  const inputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    // Accept common document formats: PDF, Word, Excel, PowerPoint, etc.
    const validTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload a PDF, Word, Excel, PowerPoint, or text document.';
    }
    
    // Limit file size to 20MB per file
    if (file.size > 20 * 1024 * 1024) {
      return 'File is too large. Please upload a file smaller than 20MB.';
    }
    
    return null;
  };

  const validateFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    
    if (filesArray.length > maxFiles) {
      return `Too many files. Maximum ${maxFiles} files allowed.`;
    }
    
    for (const file of filesArray) {
      const error = validateFile(file);
      if (error) {
        return `${file.name}: ${error}`;
      }
    }
    
    return null;
  };

  const handleSingleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const error = validateFile(droppedFile);
      
      if (error) {
        setFileError(error);
        toast({
          title: 'Invalid File',
          description: error,
          variant: 'destructive'
        });
      } else {
        setFile(droppedFile);
        setFileError(null);
        // Auto-populate title with filename (without extension)
        const fileName = droppedFile.name.split('.').slice(0, -1).join('.');
        setTitle(fileName || droppedFile.name);
      }
    }
  };

  const handleBulkFilesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      const error = validateFiles(e.dataTransfer.files);
      
      if (error) {
        setFileError(error);
        toast({
          title: 'Invalid Files',
          description: error,
          variant: 'destructive'
        });
      } else {
        setFiles(Array.from(e.dataTransfer.files));
        setFileError(null);
        setBulkResults([]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const error = validateFile(selectedFile);
      
      if (error) {
        setFileError(error);
        toast({
          title: 'Invalid File',
          description: error,
          variant: 'destructive'
        });
      } else {
        setFile(selectedFile);
        setFileError(null);
        // Auto-populate title with filename (without extension)
        const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
        setTitle(fileName || selectedFile.name);
      }
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const error = validateFiles(e.target.files);
      
      if (error) {
        setFileError(error);
        toast({
          title: 'Invalid Files',
          description: error,
          variant: 'destructive'
        });
      } else {
        setFiles(Array.from(e.target.files));
        setFileError(null);
        setBulkResults([]);
      }
    }
  };

  const handleButtonClick = () => {
    if (isBulkMode) {
      bulkInputRef.current?.click();
    } else {
      inputRef.current?.click();
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemoveBulkFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setBulkResults([]);
  };

  const handleClearAllFiles = () => {
    setFiles([]);
    setBulkResults([]);
    setFileError(null);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
  };

  const handleSingleSubmit = async () => {
    if (!file) {
      setFileError('Please select a file to upload');
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: 'Missing Title',
        description: 'Please provide a title for your document',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const tagArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const metadata = {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
        folderId: selectedFolderId || undefined
      };
      
      await onFileUpload(file, metadata);
      
      // Reset form after successful upload
      setFile(null);
      setTitle('');
      setDescription('');
      setTags('');
      setSelectedFolderId(defaultFolderId || (folders.length > 0 ? folders[0].id : ''));
      if (inputRef.current) inputRef.current.value = '';
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your document. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleBulkSubmit = async () => {
    if (!files.length) {
      setFileError('Please select files to upload');
      return;
    }
    
    if (!onBulkFileUpload) {
      toast({
        title: 'Bulk Upload Not Supported',
        description: 'Bulk upload is not available in this context.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsBulkUploading(true);
      
      const tagArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const metadata = {
        description: description.trim() || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
        folderId: selectedFolderId || undefined
      };
      
      // Convert files array to FileList-like object
      const fileList = files.reduce((dataTransfer, file) => {
        dataTransfer.items.add(file);
        return dataTransfer;
      }, new DataTransfer()).files;
      
      const response = await onBulkFileUpload(fileList, metadata);
      setBulkResults(response.results);
      
      const successful = response.summary.successful;
      const failed = response.summary.failed;
      
      if (failed === 0) {
        toast({
          title: 'Bulk Upload Successful',
          description: `All ${successful} files uploaded successfully!`,
        });
      } else {
        toast({
          title: 'Bulk Upload Completed',
          description: `${successful} files uploaded successfully, ${failed} failed.`,
          variant: successful > 0 ? 'default' : 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Error in bulk upload:', error);
      toast({
        title: 'Bulk Upload Failed',
        description: 'There was an error uploading your documents. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsBulkUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const getTotalFileSize = () => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle (only show if bulk upload is supported) */}
      {supportsBulkUpload && (
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant={!isBulkMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsBulkMode(false);
              setFiles([]);
              setBulkResults([]);
              setFileError(null);
            }}
            className="flex items-center space-x-2"
          >
            <File className="h-4 w-4" />
            <span>Single Upload</span>
          </Button>
          <Button
            type="button"
            variant={isBulkMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsBulkMode(true);
              setFile(null);
              setTitle('');
              setFileError(null);
            }}
            className="flex items-center space-x-2"
          >
            <Files className="h-4 w-4" />
            <span>Bulk Upload</span>
          </Button>
        </div>
      )}

      {/* File Drop Zone */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary-500 bg-primary-50" : "border-slate-300",
          fileError ? "border-error-300 bg-error-50" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={isBulkMode ? handleBulkFilesDrop : handleSingleFileDrop}
      >
        <div className="flex flex-col items-center justify-center py-4">
          {/* Single File Mode */}
          {!isBulkMode && !file && (
            <>
              <UploadCloud 
                className={cn(
                  "h-12 w-12 mb-4",
                  fileError ? "text-error-500" : "text-slate-400"
                )} 
              />
              <h3 className="text-lg font-medium mb-2">Drag & drop your document</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Support for PDF, Word, Excel, PowerPoint, and text files
                <br />
                Max file size: 20MB
              </p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleButtonClick}
                className="relative"
              >
                Browse files
                <input 
                  ref={inputRef}
                  type="file" 
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  title="Upload a file"
                  placeholder="Upload a file"
                />
              </Button>
              {fileError && (
                <div className="flex items-center text-error-600 mt-4">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">{fileError}</span>
                </div>
              )}
            </>
          )}

          {/* Bulk File Mode */}
          {isBulkMode && files.length === 0 && (
            <>
              <Files 
                className={cn(
                  "h-12 w-12 mb-4",
                  fileError ? "text-error-500" : "text-slate-400"
                )} 
              />
              <h3 className="text-lg font-medium mb-2">Drag & drop multiple documents</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Support for PDF, Word, Excel, PowerPoint, and text files
                <br />
                Max {maxFiles} files, 20MB each
              </p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleButtonClick}
                className="relative"
              >
                Browse files
                <input 
                  ref={bulkInputRef}
                  type="file" 
                  className="sr-only"
                  onChange={handleBulkFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  multiple
                  title="Upload multiple files"
                  placeholder="Upload multiple files"
                />
              </Button>
              {fileError && (
                <div className="flex items-center text-error-600 mt-4">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">{fileError}</span>
                </div>
              )}
            </>
          )}

          {/* Single File Selected */}
          {!isBulkMode && file && (
            <div className="w-full">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Multiple Files Selected */}
          {isBulkMode && files.length > 0 && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {files.length} files selected
                  </Badge>
                  <span className="text-sm text-slate-500">
                    Total: {formatFileSize(getTotalFileSize())}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFiles}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-2">
                {files.map((file, index) => {
                  const result = bulkResults.find(r => r.originalIndex === index);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {result && (
                          <>
                            {result.status === 'success' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                                                         {result.status === 'error' && (
                               <div title={result.error || 'Upload failed'}>
                                 <XCircle className="h-4 w-4 text-red-500" />
                               </div>
                             )}
                          </>
                        )}
                        {!result && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBulkFile(index)}
                            disabled={isBulkUploading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Bulk Results Summary */}
              {bulkResults.length > 0 && (
                <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Upload Results</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {bulkResults.filter(r => r.status === 'success').length}
                      </div>
                      <div className="text-xs text-slate-500">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {bulkResults.filter(r => r.status === 'error').length}
                      </div>
                      <div className="text-xs text-slate-500">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-slate-600">
                        {bulkResults.length}
                      </div>
                      <div className="text-xs text-slate-500">Total</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metadata Form (only show if files are selected) */}
      {((file && !isBulkMode) || (files.length > 0 && isBulkMode)) && (
        <div className="space-y-4">
          {/* Title (only for single file mode) */}
          {!isBulkMode && (
            <div>
              <Label htmlFor="document-title" className="block text-sm font-medium text-slate-700 mb-1">
                Document Title *
              </Label>
              <Input
                id="document-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                required
              />
            </div>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="document-description" className="block text-sm font-medium text-slate-700 mb-1">
              Description (Optional)
            </Label>
            <Input
              id="document-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>

          {/* Folder Selection */}
          {folders.length > 0 && (
            <div>
              <Label htmlFor="document-folder" className="block text-sm font-medium text-slate-700 mb-1">
                Folder
              </Label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center space-x-2">
                        <Folder className="h-4 w-4" />
                        <span>{folder.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label htmlFor="document-tags" className="block text-sm font-medium text-slate-700 mb-1">
              Tags (Optional)
            </Label>
            <Input
              id="document-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
            {tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.split(',').map((tag, index) => (
                  tag.trim() && (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                    >
                      {tag.trim()}
                    </span>
                  )
                ))}
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="pt-2">
            <Button
              onClick={isBulkMode ? handleBulkSubmit : handleSingleSubmit}
              disabled={
                isUploading || isBulkUploading || 
                (!isBulkMode && (!file || !title.trim())) ||
                (isBulkMode && files.length === 0)
              }
              className="w-full"
            >
              {isUploading || isBulkUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isBulkMode ? `Uploading ${files.length} files...` : 'Uploading...'}
                </>
              ) : (
                isBulkMode ? `Upload ${files.length} Documents` : 'Upload Document'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 