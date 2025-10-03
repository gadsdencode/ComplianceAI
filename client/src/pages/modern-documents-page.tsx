import { useState } from 'react';
import { useLocation } from 'wouter';
import ModernLayout from '@/components/layouts/ModernLayout';
import ModernDocumentManager from '@/components/documents/ModernDocumentManager';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Filter, SortAsc } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ModernDocumentsPage() {
  const [, setLocation] = useLocation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleCreateDocument = () => {
    setLocation('/documents?action=create');
  };

  const handleUploadDocument = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.txt,.rtf';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        toast({
          title: "Upload Started",
          description: `Uploading ${files.length} file(s)...`,
        });
        
        // In a real app, this would upload the files
        Array.from(files).forEach((file, index) => {
          setTimeout(() => {
            toast({
              title: "Upload Complete",
              description: `"${file.name}" has been uploaded successfully.`,
            });
          }, (index + 1) * 1000);
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
