import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentList from '@/components/document/DocumentList';
import CreateDocumentModal from '@/components/documents/CreateDocumentModal';
import { Document } from '@/types';
import { Plus, Filter } from 'lucide-react';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [location] = useLocation();

  // Get filter from URL if present
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const filterParam = urlParams.get('filter');
  
  // Set active tab based on URL filter
  useState(() => {
    if (filterParam) {
      setActiveTab(filterParam);
    }
  });

  // Fetch documents with selected filter
  const { 
    data: documents,
    isLoading,
    error
  } = useQuery<Document[]>({
    queryKey: ['/api/documents', { status: activeTab !== 'all' ? activeTab : undefined }],
  });

  // Fetch templates for create document modal
  const {
    data: templates,
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['/api/templates'],
    enabled: isCreateModalOpen, // Only fetch when modal is open
  });

  // Filter documents by search query
  const filteredDocuments = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreateDocument = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <DashboardLayout 
      pageTitle="Documents" 
      onSearch={handleSearch}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
        <Button onClick={handleCreateDocument}>
          <Plus className="mr-1 h-4 w-4" /> 
          Create Document
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="pending_approval">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Advanced Filter
          </Button>
        </div>

        <TabsContent value="all">
          <DocumentList 
            documents={filteredDocuments || []} 
            isLoading={isLoading} 
            error={error?.message}
          />
        </TabsContent>
        
        <TabsContent value="draft">
          <DocumentList 
            documents={filteredDocuments || []} 
            isLoading={isLoading} 
            error={error?.message}
          />
        </TabsContent>
        
        <TabsContent value="pending_approval">
          <DocumentList 
            documents={filteredDocuments || []} 
            isLoading={isLoading} 
            error={error?.message}
          />
        </TabsContent>
        
        <TabsContent value="active">
          <DocumentList 
            documents={filteredDocuments || []} 
            isLoading={isLoading} 
            error={error?.message}
          />
        </TabsContent>
        
        <TabsContent value="expired">
          <DocumentList 
            documents={filteredDocuments || []} 
            isLoading={isLoading} 
            error={error?.message}
          />
        </TabsContent>
      </Tabs>

      {isCreateModalOpen && (
        <CreateDocumentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          templates={templates || []}
          isLoadingTemplates={isLoadingTemplates}
        />
      )}
    </DashboardLayout>
  );
}
