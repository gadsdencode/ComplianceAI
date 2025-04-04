import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, FileText, Clock, User, Eye } from 'lucide-react';
import { DocumentVersion } from '@/types';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DocumentDetail from './DocumentDetail';

interface DocumentVersionHistoryProps {
  versions: DocumentVersion[];
  isLoading: boolean;
}

export default function DocumentVersionHistory({ versions, isLoading }: DocumentVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  
  const handleViewVersion = (version: DocumentVersion) => {
    setSelectedVersion(version);
  };
  
  const closeVersionDialog = () => {
    setSelectedVersion(null);
  };

  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            <div className="h-20 bg-slate-200 rounded w-full"></div>
            <div className="h-20 bg-slate-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            Document Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length > 0 ? (
            <div className="space-y-4">
              {versions.map((version) => (
                <div 
                  key={version.id}
                  className="border rounded-md p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h4 className="font-medium">Version {version.version}</h4>
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                          
                          <span className="mx-2">•</span>
                          
                          <User className="h-3.5 w-3.5 mr-1" />
                          User ID: {version.createdById}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewVersion(version)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border rounded-md bg-slate-50">
              <History className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-medium mb-1">No version history</h3>
              <p className="text-slate-500">This document doesn't have any version history yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Content Dialog */}
      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={closeVersionDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Version {selectedVersion.version}</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-slate-500 mb-4">
              Created on {format(new Date(selectedVersion.createdAt), 'MMM d, yyyy h:mm a')} 
              by User ID: {selectedVersion.createdById}
            </div>
            <DocumentDetail content={selectedVersion.content} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
