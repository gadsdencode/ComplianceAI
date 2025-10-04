import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DocumentCreationPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft'
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; status: string }) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create document' }));
        throw new Error(errorData.message || `Failed to create document: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (document) => {
      toast({
        title: "Document Created",
        description: `"${document.title}" has been created successfully.`,
      });
      navigate(`/documents/${document.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a document title.",
        variant: "destructive",
      });
      return;
    }
    createDocumentMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout pageTitle="Create Document">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/documents')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Document</h1>
            <p className="text-slate-600">Start a new compliance document</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Document Title *
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter document title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium text-slate-700">
                  Document Content
                </label>
                <Textarea
                  id="content"
                  placeholder="Enter document content..."
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="w-full min-h-[200px]"
                  rows={8}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/documents')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDocumentMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createDocumentMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
