import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Document } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Eye, Calendar, Clock, CheckCircle, AlertTriangle, Archive } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  error?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft':
      return <FileText className="text-slate-400" size={16} />;
    case 'pending_approval':
      return <Clock className="text-warning-500" size={16} />;
    case 'active':
      return <CheckCircle className="text-success-500" size={16} />;
    case 'expired':
      return <AlertTriangle className="text-error-500" size={16} />;
    case 'archived':
      return <Archive className="text-slate-500" size={16} />;
    default:
      return <FileText className="text-slate-400" size={16} />;
  }
};

const getStatusBadge = (status: string) => {
  let variant = '';
  let label = status.replace('_', ' ');
  
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="bg-slate-100 text-slate-800">Draft</Badge>;
    case 'pending_approval':
      return <Badge variant="outline" className="bg-warning-100 text-warning-800">Pending Approval</Badge>;
    case 'active':
      return <Badge variant="outline" className="bg-success-100 text-success-800">Active</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-error-100 text-error-800">Expired</Badge>;
    case 'archived':
      return <Badge variant="outline" className="bg-slate-200 text-slate-800">Archived</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

export default function DocumentList({ documents, isLoading, error }: DocumentListProps) {
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center">
                <Skeleton className="h-10 w-10 rounded-md mr-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-8 w-24 mr-2" />
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

  if (documents.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg bg-white">
        <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No documents found</h3>
        <p className="text-slate-600 mb-6">Start creating compliance documents to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <Card 
          key={document.id} 
          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/documents/${document.id}`)}
        >
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center mr-4">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium">{document.title}</h3>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <span className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Updated {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                      </span>
                      
                      {document.expiresAt && (
                        <span className="flex items-center ml-4">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          Expires {formatDistanceToNow(new Date(document.expiresAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(document.status)}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/documents/${document.id}`);
                  }}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
