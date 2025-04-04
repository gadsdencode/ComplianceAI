import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Document, Signature, DocumentVersion } from '@/types';
import { PenTool, Calendar, Clock, Eye, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

export default function SignaturesPage() {
  const [activeTab, setActiveTab] = useState('signed');
  const [, navigate] = useLocation();
  
  // Fetch documents that need signatures (pending)
  const { 
    data: pendingDocuments,
    isLoading: isLoadingPending
  } = useQuery<Document[]>({
    queryKey: ['/api/documents', { status: 'pending_approval' }],
  });

  // Fetch documents that have been signed by the current user
  const {
    data: signedDocuments,
    isLoading: isLoadingSigned
  } = useQuery<Document[]>({
    queryKey: ['/api/documents', { status: 'active' }],
  });

  // For each signed document, we would fetch signatures but to simplify, we'll assume we have signatures
  
  const handleViewDocument = (documentId: number) => {
    navigate(`/documents/${documentId}`);
  };

  const handleSignDocument = (documentId: number) => {
    navigate(`/documents/${documentId}?action=sign`);
  };

  return (
    <DashboardLayout pageTitle="Signatures">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Signatures</h1>
        <p className="text-slate-500">Manage document signatures and verification</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="signed">
            <PenTool className="h-4 w-4 mr-2" />
            Documents You've Signed
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" />
            Pending Signatures
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="signed">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Signed Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSigned ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-3" />
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-5 w-32 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : signedDocuments && signedDocuments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Signed Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signedDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-slate-400 mr-2" />
                            <span className="font-medium">{document.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(document.updatedAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                            Signed
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDocument(document.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-6">
                  <PenTool className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No signed documents</h3>
                  <p className="text-slate-500">You haven't signed any documents yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Documents Awaiting Your Signature</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPending ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-3" />
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-5 w-32 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : pendingDocuments && pendingDocuments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Requested Date</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-slate-400 mr-2" />
                            <span className="font-medium">{document.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(document.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {document.expiresAt ? (
                            format(new Date(document.expiresAt), 'MMM d, yyyy')
                          ) : (
                            <span className="text-slate-500">No deadline</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDocument(document.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleSignDocument(document.id)}
                            >
                              <PenTool className="h-4 w-4 mr-1" />
                              Sign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-6">
                  <Clock className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending signatures</h3>
                  <p className="text-slate-500">You don't have any documents awaiting your signature.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Signature Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6">
              <ExternalLink className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Verify Document Signatures</h3>
              <p className="text-slate-500 mb-4">
                Verify the authenticity of signatures on compliance documents
              </p>
              <Button>Verify a Signature</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
