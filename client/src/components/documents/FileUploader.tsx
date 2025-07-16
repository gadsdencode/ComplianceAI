import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, X, AlertCircle, File, Loader2, Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FolderOption {
  id: string;
  name: string;
}

interface FileUploaderProps {
  onFileUpload: (file: File, metadata: { title: string; description?: string; tags?: string[]; folderId?: string }) => Promise<void>;
  folders?: FolderOption[];
  defaultFolderId?: string;
  isUploading?: boolean;
}

export default function FileUploader({ onFileUpload, folders = [], defaultFolderId, isUploading = false }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(defaultFolderId || (folders.length > 0 ? folders[0].id : ''));
  
  const inputRef = useRef<HTMLInputElement>(null);
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
    
    // Limit file size to 20MB
    if (file.size > 20 * 1024 * 1024) {
      return 'File is too large. Please upload a file smaller than 20MB.';
    }
    
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
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

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async () => {
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
      console.log('Preparing file upload:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const tagArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const metadata = {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
        folderId: selectedFolderId || undefined
      };
      
      console.log('Upload metadata:', metadata);
      
      await onFileUpload(file, metadata);
      console.log('Upload completed successfully');
      
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

  return (
    <div className="space-y-6">
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary-500 bg-primary-50" : "border-slate-300",
          fileError ? "border-error-300 bg-error-50" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center py-4">
          {!file ? (
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
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded bg-primary-100 text-primary-700 flex items-center justify-center">
                    <File className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {file && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="document-title" className="block text-sm font-medium text-slate-700 mb-1">
              Document Title <span className="text-error-500">*</span>
            </Label>
            <Input
              id="document-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </div>
          
          <div>
            <Label htmlFor="document-description" className="block text-sm font-medium text-slate-700 mb-1">
              Description (Optional)
            </Label>
            <Input
              id="document-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description"
            />
          </div>
          
          {folders.length > 0 && (
            <div>
              <Label htmlFor="document-folder" className="block text-sm font-medium text-slate-700 mb-1">
                <Folder className="w-4 h-4 inline mr-1" />
                Folder
              </Label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
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
          
          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isUploading || !file || !title.trim()}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 