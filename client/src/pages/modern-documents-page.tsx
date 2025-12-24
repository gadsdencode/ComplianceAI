import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ModernLayout from '@/components/layouts/ModernLayout';
import ModernDocumentManager from '@/components/documents/ModernDocumentManager';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Filter, SortAsc } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function ModernDocumentsPage() {
  const [, setLocation] = useLocation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const queryClient = useQueryClient();

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      const metadata = {
        title: file.name.split('.').slice(0, -1).join('.') || file.name,
        description: `Uploaded document: ${file.name}`,
        tags: ['uploaded']
      };
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await fetch('/api/user-documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data, file) => {
      toast({
        title: "Upload Successful",
        description: `"${file.name}" has been uploaded successfully.`,
      });
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
    },
    onError: (error: any, file) => {
      toast({
        title: "Upload Failed",
        description: `Failed to upload "${file.name}": ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  const handleCreateDocument = () => {
    setLocation('/documents?action=create');
  };

  const handleUploadDocument = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.ppt,.pptx,.csv';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        toast({
          title: "Upload Started",
          description: `Uploading ${files.length} file(s)...`,
        });
        
        // Upload each file
        Array.from(files).forEach((file) => {
          uploadMutation.mutate(file);
        });
      }
    };
    
    input.click();
  };

  const handleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
    toast({
      title: showAdvancedFilters ? "Filters Hidden" : "Advanced Filters",
      description: showAdvancedFilters ? "Advanced filters are now hidden." : "Advanced filters are now visible.",
    });
  };

  const handleSort = () => {
    toast({
      title: "Sort Options",
      description: "Sort options are available in the document manager below.",
    });
  };

  return (
    <ModernLayout 
      pageTitle="Documents"
      breadcrumbs={[
        { label: "Documents" }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAdvancedFilters}>
            <Filter size={16} className="mr-2" />
            Advanced Filters
          </Button>
          <Button variant="outline" size="sm" onClick={handleSort}>
            <SortAsc size={16} className="mr-2" />
            Sort
          </Button>
          <Button variant="outline" size="sm" onClick={handleUploadDocument}>
            <Upload size={16} className="mr-2" />
            Upload
          </Button>
          <Button size="sm" className="bg-primary-600 hover:bg-primary-700" onClick={handleCreateDocument}>
            <Plus size={16} className="mr-2" />
            Create Document
          </Button>
        </div>
      }
    >
      <ModernDocumentManager />
    </ModernLayout>
  );
}
