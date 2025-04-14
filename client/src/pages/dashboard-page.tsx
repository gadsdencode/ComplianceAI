import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DocumentsSection from '@/components/dashboard/DocumentsSection';
import ComplianceCalendar from '@/components/dashboard/ComplianceCalendar';
import AIAssistant from '@/components/dashboard/AIAssistant';
import CreateDocumentModal from '@/components/documents/CreateDocumentModal';
import EditDeadlineModal from '@/components/compliance/EditDeadlineModal';
import AddDeadlineModal from '@/components/compliance/AddDeadlineModal';
import { DashboardStats, PendingDocumentItem, RecentDocumentItem, ComplianceCalendarItem, Template, ComplianceDeadline } from '@/types';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDeadlineModalOpen, setIsEditDeadlineModalOpen] = useState(false);
  const [isAddDeadlineModalOpen, setIsAddDeadlineModalOpen] = useState(false);
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  
  // Fetch dashboard stats
  const { 
    data: dashboardStats,
    isLoading: isLoadingStats
  } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch documents that need action
  const {
    data: pendingDocuments,
    isLoading: isLoadingPending
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

  // Fetch recent documents
  const {
    data: recentDocuments,
    isLoading: isLoadingRecent
  } = useQuery<RecentDocumentItem[]>({
    queryKey: ['/api/documents'],
    select: (data) => data.slice(0, 5).map(doc => ({
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt,
      status: doc.status
    })),
  });

  // Fetch compliance deadlines
  const {
    data: complianceDeadlines,
    isLoading: isLoadingDeadlines
  } = useQuery<ComplianceCalendarItem[]>({
    queryKey: ['/api/compliance-deadlines', { upcoming: true }],
    select: (data) => data.map(deadline => ({
      id: deadline.id,
      title: deadline.title,
      deadline: deadline.deadline,
      type: deadline.type,
      assignee: {
        id: deadline.assignee?.id || 0,
        name: deadline.assignee?.name || 'User Name',
        initials: deadline.assignee?.name?.slice(0, 2) || 'UN'
      },
      status: deadline.status
    })),
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
    >
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
        pendingDocuments={pendingDocuments || []} 
        recentDocuments={recentDocuments || []}
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

      {isEditDeadlineModalOpen && selectedDeadline && (
        <EditDeadlineModal
          isOpen={isEditDeadlineModalOpen}
          onClose={handleCloseEditDeadlineModal}
          deadline={selectedDeadline}
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
