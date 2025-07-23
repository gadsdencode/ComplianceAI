import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DocumentsSection from '@/components/dashboard/DocumentsSection';
import ComplianceCalendar from '@/components/dashboard/ComplianceCalendar';
import AIAssistant from '@/components/dashboard/AIAssistant';
import CreateDocumentModal from '@/components/documents/CreateDocumentModal';
import EditDeadlineModal from '@/components/compliance/EditDeadlineModal';
import AddDeadlineModal from '@/components/compliance/AddDeadlineModal';
import { DashboardStats, PendingDocumentItem, RecentDocumentItem, ComplianceCalendarItem, Template, ComplianceDeadline, User } from '@/types';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDeadlineModalOpen, setIsEditDeadlineModalOpen] = useState(false);
  const [isAddDeadlineModalOpen, setIsAddDeadlineModalOpen] = useState(false);
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch dashboard stats
  const { 
    data: dashboardStats,
    isLoading: isLoadingStats
  } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch compliance documents that need action
  const {
    data: pendingComplianceDocuments,
    isLoading: isLoadingPendingCompliance
  } = useQuery<PendingDocumentItem[]>({
    queryKey: ['/api/documents', { status: 'pending_approval' }],
    select: (data) => data.map(doc => ({
      id: doc.id,
      title: doc.title,
      deadline: doc.deadline || undefined,
      status: doc.status,
      actionType: doc.status === 'pending_approval' ? 'approve' : 
                 doc.status === 'active' ? 'review' : 'sign'
    })),
  });

  // Fetch user documents that need action (drafts)
  const {
    data: pendingUserDocuments,
    isLoading: isLoadingPendingUser
  } = useQuery<any[]>({
    queryKey: ['/api/user-documents'],
    select: (data) => data
      .filter(doc => doc.status === 'draft')
      .slice(0, 5)
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        deadline: undefined,
        status: doc.status,
        actionType: 'complete',
        isUserDocument: true
      })),
  });

  // Combine pending documents
  const pendingDocuments = [
    ...(pendingComplianceDocuments || []),
    ...(pendingUserDocuments || [])
  ];

  const isLoadingPending = isLoadingPendingCompliance || isLoadingPendingUser;

  // Fetch recent compliance documents
  const {
    data: recentComplianceDocuments,
    isLoading: isLoadingRecentCompliance
  } = useQuery<RecentDocumentItem[]>({
    queryKey: ['/api/documents'],
    select: (data) => data.slice(0, 3).map(doc => ({
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt,
      status: doc.status
    })),
  });

  // Fetch recent user documents
  const {
    data: recentUserDocuments,
    isLoading: isLoadingRecentUser
  } = useQuery<any[]>({
    queryKey: ['/api/user-documents'],
    select: (data) => data.slice(0, 2).map(doc => ({
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt,
      status: doc.status,
      isUserDocument: true
    })),
  });

  // Combine recent documents
  const recentDocuments = [
    ...(recentComplianceDocuments || []),
    ...(recentUserDocuments || [])
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  const isLoadingRecent = isLoadingRecentCompliance || isLoadingRecentUser;

  // Filter documents based on search query
  const filteredPendingDocuments = useMemo(() => {
    if (!searchQuery.trim()) return pendingDocuments;
    
    const query = searchQuery.toLowerCase();
    return pendingDocuments.filter(doc => {
      // Search in title (always available)
      const matchesTitle = doc.title.toLowerCase().includes(query);
      
      // Search in description if available (user documents)
      const matchesDescription = (doc as any).description?.toLowerCase().includes(query) || false;
      
      // Search in content if available (compliance documents)
      const matchesContent = (doc as any).content?.toLowerCase().includes(query) || false;
      
      // Search in tags if available (user documents)
      const matchesTags = (doc as any).tags?.some((tag: string) => tag.toLowerCase().includes(query)) || false;
      
      return matchesTitle || matchesDescription || matchesContent || matchesTags;
    });
  }, [pendingDocuments, searchQuery]);

  const filteredRecentDocuments = useMemo(() => {
    if (!searchQuery.trim()) return recentDocuments;
    
    const query = searchQuery.toLowerCase();
    return recentDocuments.filter(doc => {
      // Search in title (always available)
      const matchesTitle = doc.title.toLowerCase().includes(query);
      
      // Search in description if available (user documents)
      const matchesDescription = (doc as any).description?.toLowerCase().includes(query) || false;
      
      // Search in content if available (compliance documents)
      const matchesContent = (doc as any).content?.toLowerCase().includes(query) || false;
      
      // Search in tags if available (user documents)
      const matchesTags = (doc as any).tags?.some((tag: string) => tag.toLowerCase().includes(query)) || false;
      
      return matchesTitle || matchesDescription || matchesContent || matchesTags;
    });
  }, [recentDocuments, searchQuery]);

  // Search handler for dashboard layout
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Fetch compliance deadlines
  const {
    data: complianceDeadlines,
    isLoading: isLoadingDeadlines
  } = useQuery<ComplianceCalendarItem[]>({
    queryKey: ['/api/compliance-deadlines', { upcoming: true }],
    select: (data: any[]) => data.map(deadline => {
      // Find the assignee user if available
      const assigneeUser = users?.find(user => user.id === deadline.assigneeId);
      
      return {
        id: deadline.id,
        title: deadline.title,
        deadline: deadline.deadline,
        type: deadline.type,
        assignee: {
          id: assigneeUser?.id || 0,
          name: assigneeUser?.name || 'Unassigned',
          initials: assigneeUser?.name?.slice(0, 2)?.toUpperCase() || 'UN'
        },
        status: deadline.status
      };
    }),
  });

  // Fetch users for assignee information
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch templates for create document modal
  const {
    data: templates,
    isLoading: isLoadingTemplates
  } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    enabled: isCreateModalOpen, // Only fetch when modal is open
  });

  // Fetch deadline details when editing
  const {
    data: selectedDeadline,
    isLoading: isLoadingSelectedDeadline
  } = useQuery<ComplianceDeadline>({
    queryKey: ['/api/compliance-deadlines', selectedDeadlineId],
    enabled: isEditDeadlineModalOpen && selectedDeadlineId !== null,
  });

  // Create a validated deadline object to ensure ID is properly set
  const validatedSelectedDeadline = selectedDeadline && selectedDeadlineId ? {
    ...selectedDeadline,
    id: selectedDeadlineId
  } : null;

  const handleCreateDocument = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleViewDeadline = (id: number) => {
    navigate(`/compliance/deadlines/${id}`);
  };

  const handleEditDeadline = (id: number) => {
    if (!id || isNaN(id)) {
      toast({
        title: 'Error',
        description: 'Cannot edit deadline: Invalid ID',
        variant: 'destructive',
      });
      return;
    }
    setSelectedDeadlineId(id);
    setIsEditDeadlineModalOpen(true);
  };

  const handleCloseEditDeadlineModal = () => {
    setIsEditDeadlineModalOpen(false);
    setSelectedDeadlineId(null);
  };

  const handleAddDeadline = () => {
    setIsAddDeadlineModalOpen(true);
  };

  const handleCloseAddDeadlineModal = () => {
    setIsAddDeadlineModalOpen(false);
  };

  return (
    <DashboardLayout 
      pageTitle="Dashboard" 
      notificationCount={dashboardStats?.pending || 0}
      onSearch={handleSearch}
    >
      {searchQuery && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Showing {(filteredPendingDocuments.length + filteredRecentDocuments.length)} result{(filteredPendingDocuments.length + filteredRecentDocuments.length) !== 1 ? 's' : ''} for: <span className="font-semibold">"{searchQuery}"</span>
            <button 
              onClick={() => setSearchQuery('')} 
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Clear search
            </button>
          </p>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to ComplianceAI</h1>
          <p className="text-slate-500">Manage your compliance documents efficiently</p>
        </div>
        <Button onClick={handleCreateDocument}>
          <Plus className="mr-1 h-4 w-4" /> 
          Create Document
        </Button>
      </div>

      <DashboardOverview 
        stats={dashboardStats || {
          documents: 0,
          pending: 0,
          complianceRate: 0,
          expiringCount: 0,
          docsCreatedLastMonth: 0,
          urgentCount: 0,
          lastMonthComplianceChange: "+0%"
        }} 
        isLoading={isLoadingStats}
      />

      <DocumentsSection 
        pendingDocuments={filteredPendingDocuments || []} 
        recentDocuments={filteredRecentDocuments || []}
        isLoading={isLoadingPending || isLoadingRecent}
      />

      <ComplianceCalendar 
        calendarItems={complianceDeadlines || []}
        isLoading={isLoadingDeadlines}
        onViewItem={handleViewDeadline}
        onEditItem={handleEditDeadline}
        onAddItem={handleAddDeadline}
      />

      <AIAssistant />

      {isCreateModalOpen && (
        <CreateDocumentModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          templates={templates || []}
          isLoadingTemplates={isLoadingTemplates}
        />
      )}

      {isEditDeadlineModalOpen && validatedSelectedDeadline && (
        <EditDeadlineModal
          isOpen={isEditDeadlineModalOpen}
          onClose={handleCloseEditDeadlineModal}
          deadline={validatedSelectedDeadline}
          isLoading={isLoadingSelectedDeadline}
        />
      )}

      {isAddDeadlineModalOpen && (
        <AddDeadlineModal
          isOpen={isAddDeadlineModalOpen}
          onClose={handleCloseAddDeadlineModal}
        />
      )}
    </DashboardLayout>
  );
}
