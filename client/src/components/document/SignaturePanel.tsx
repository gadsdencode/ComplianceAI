import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Signature } from '@/types';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { PenTool, User, Clock, Info, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '@/hooks/use-auth';

interface SignaturePanelProps {
  documentId: number;
  signatures: Signature[];
  isLoading: boolean;
  documentStatus: string;
}

export default function SignaturePanel({ 
  documentId, 
  signatures, 
  isLoading,
  documentStatus
}: SignaturePanelProps) {
  const [sigCanvas, setSigCanvas] = useState<SignatureCanvas | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for typed signature
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');

  // Check if user has already signed
  const hasUserSigned = signatures.some(sig => sig.userId === user?.id);

  // Signature mutation
  const signatureMutation = useMutation({
    mutationFn: async (signature: string) => {
      return await apiRequest(
        'POST',
        `/api/documents/${documentId}/signatures`,
        { signature, metadata: { type: signatureType } }
      );
    },
    onSuccess: () => {
      // Clear signature
      if (sigCanvas) sigCanvas.clear();
      setTypedSignature('');
      
      // Refetch signatures and document
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/signatures`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}`] });
      
      toast({
        title: 'Document signed',
        description: 'Your signature has been successfully added to the document. The document will now be marked as active.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Signature failed',
        description: error.message || 'Failed to sign document',
        variant: 'destructive',
      });
    }
  });

  const handleSignDocument = () => {
    let signature = '';
    
    if (signatureType === 'draw') {
      if (!sigCanvas?.isEmpty()) {
        signature = sigCanvas?.toDataURL() || '';
      } else {
        toast({
          title: 'Signature required',
          description: 'Please draw your signature',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (typedSignature.trim()) {
        signature = typedSignature;
      } else {
        toast({
          title: 'Signature required',
          description: 'Please type your signature',
          variant: 'destructive',
        });
        return;
      }
    }
    
    signatureMutation.mutate(signature);
  };

  const handleClearSignature = () => {
    if (signatureType === 'draw') {
      sigCanvas?.clear();
    } else {
      setTypedSignature('');
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            <div className="h-20 bg-slate-200 rounded w-full"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="flex items-center">
          <PenTool className="mr-2 h-5 w-5" />
          Document Signatures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Signature List */}
        {signatures.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Signatures ({signatures.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signatures.map((signature) => (
                <div 
                  key={signature.id} 
                  className="border rounded-md p-4 bg-slate-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium mb-1">User ID: {signature.userId}</p>
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {format(new Date(signature.createdAt), 'MMM d, yyyy h:mm a')}
                      </div>
                      {signature.ipAddress && (
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                          <Info className="h-3.5 w-3.5 mr-1" />
                          IP: {signature.ipAddress}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-success-100 text-success-600">
                      <CheckCircle size={16} />
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-white border rounded-md">
                    {signature.metadata?.type === 'type' ? (
                      <p className="font-medium text-lg text-slate-700 italic">{signature.signature}</p>
                    ) : (
                      <img 
                        src={signature.signature}
                        alt="Signature"
                        className="max-h-16"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-6 border rounded-md bg-slate-50">
            <PenTool className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium mb-1">No signatures yet</h3>
            <p className="text-slate-500 mb-4">This document hasn't been signed yet.</p>
          </div>
        )}

        {/* Sign Document Section */}
        {!hasUserSigned && documentStatus !== 'draft' && documentStatus !== 'expired' && documentStatus !== 'archived' && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Sign Document</h3>
            
            <div className="flex space-x-4 mb-4">
              <Button
                variant={signatureType === 'draw' ? "default" : "outline"}
                onClick={() => setSignatureType('draw')}
              >
                Draw Signature
              </Button>
              <Button
                variant={signatureType === 'type' ? "default" : "outline"}
                onClick={() => setSignatureType('type')}
              >
                Type Signature
              </Button>
            </div>
            
            {signatureType === 'draw' ? (
              <div className="mb-4">
                <div className="border-2 border-slate-300 rounded-md bg-white mb-3">
                  <SignatureCanvas
                    ref={(ref) => setSigCanvas(ref)}
                    penColor="black"
                    canvasProps={{
                      className: "w-full h-40"
                    }}
                  />
                </div>
                <p className="text-sm text-slate-500 mb-4">Draw your signature above</p>
              </div>
            ) : (
              <div className="mb-4">
                <Label htmlFor="typedSignature">Enter your signature</Label>
                <Input
                  id="typedSignature"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your full name"
                  className="font-medium text-slate-800 italic text-lg h-12 mt-1"
                />
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  Type your full legal name as your electronic signature
                </p>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleClearSignature}
                disabled={signatureMutation.isPending}
              >
                Clear
              </Button>
              <Button 
                onClick={handleSignDocument}
                disabled={signatureMutation.isPending}
              >
                {signatureMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  'Sign Document'
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Message for draft documents */}
        {documentStatus === 'draft' && (
          <div className="mt-6 border-t pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Document needs to be submitted first</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    This document is still in draft status. To collect signatures, it must first be 
                    submitted for signature approval. Go to the "Details" tab and click "Submit for Signature".
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
