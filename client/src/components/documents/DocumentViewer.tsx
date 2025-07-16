import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserDocument } from '@/types';
import { Download, X, FileText, AlertTriangle, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DocumentViewerProps {
  document: UserDocument;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = () => {
    // Create a direct link to download the file with proper authentication
    const link = window.document.createElement('a');
    link.href = document.fileUrl; // This is the API endpoint: /api/user-documents/:id/download
    link.setAttribute('download', document.fileName);
    link.style.display = 'none';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  // Determine if the file is an image type
  const isImageType = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  // Get file icon and description
  const getFileInfo = () => {
    if (isImageType(document.fileType)) {
      return {
        description: 'Image file',
        icon: <FileText className="mx-auto h-12 w-12 text-blue-400 mb-4" />
      };
    } else if (document.fileType === 'application/pdf') {
      return {
        description: 'PDF document',
        icon: <FileText className="mx-auto h-12 w-12 text-red-400 mb-4" />
      };
    } else if (document.fileType.includes('word') || document.fileType.includes('document')) {
      return {
        description: 'Word document',
        icon: <FileText className="mx-auto h-12 w-12 text-blue-600 mb-4" />
      };
    } else if (document.fileType.includes('excel') || document.fileType.includes('sheet')) {
      return {
        description: 'Excel spreadsheet',
        icon: <FileText className="mx-auto h-12 w-12 text-green-600 mb-4" />
      };
    } else {
      return {
        description: 'Document',
        icon: <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
      };
    }
  };

  const fileInfo = getFileInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] max-h-[800px] flex flex-col">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>{document.title}</DialogTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="text-center p-8 max-w-md">
              {fileInfo.icon}
              <h3 className="text-lg font-medium mb-2">{document.fileName}</h3>
              <p className="text-slate-600 mb-2">{fileInfo.description}</p>
              <p className="text-sm text-slate-500 mb-6">
                {(document.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800">
                      Preview is currently unavailable. Please download the file to view its contents.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleDownload} size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 