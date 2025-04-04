import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DocumentsSection from '@/components/dashboard/DocumentsSection';
import ComplianceCalendar from '@/components/dashboard/ComplianceCalendar';
import AIAssistant from '@/components/dashboard/AIAssistant';
import CreateDocumentModal from '@/components/documents/CreateDocumentModal';
import { DashboardStats, PendingDocumentItem, RecentDocumentItem, ComplianceCalendarItem } from '@/types';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, navigate] = useNavigate();
  
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
      deadline: doc.expiresAt,
      status: doc.status,
      actionType: 'sign' // This would be determined by the document type and user role
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
        id: deadline.assigneeId || 0,
        name: 'User Name', // In a real implementation, you'd fetch user details
        initials: 'UN'
      },
      status: deadline.status
    })),
  });

  // Fetch templates for create document modal
  const {
    data: templates,
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['/api/templates'],
    enabled: isCreateModalOpen, // Only fetch when modal is open
  });

  const handleCreateDocument = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleViewDeadline = (id: number) => {
    // In a real implementation, this would navigate to compliance deadline details
    console.log(`View deadline ${id}`);
  };

  const handleEditDeadline = (id: number) => {
    // In a real implementation, this would open a modal to edit the deadline
    console.log(`Edit deadline ${id}`);
  };

  const handleAddDeadline = () => {
    // In a real implementation, this would open a modal to add a new deadline
    console.log('Add new deadline');
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
    </DashboardLayout>
  );
}
