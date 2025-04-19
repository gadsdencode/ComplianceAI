import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserDocument } from '@/types';
import { Download, X, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DocumentViewerProps {
  document: UserDocument;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load document preview.');
  };

  // Determine if we can preview the document based on file type
  const canPreview = () => {
    const previewableTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/svg+xml',
      'text/plain',
      'text/csv',
      'text/html'
    ];

    return previewableTypes.includes(document.fileType);
  };

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
          {canPreview() ? (
            <div className="relative h-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500 mb-2" />
                    <p className="text-sm text-slate-600">Loading document...</p>
                  </div>
                </div>
              )}
              
              <iframe
                src={document.fileUrl}
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title={document.title}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="text-center p-8">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Preview not available</h3>
                <p className="text-slate-600 mb-6">This file type cannot be previewed. Please download the file to view it.</p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="text-center p-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-error-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Error Loading Preview</h3>
                <p className="text-slate-600 mb-6">{error}</p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Instead
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 