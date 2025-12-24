import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SearchCommandCenter from '@/components/search/SearchCommandCenter';
import SearchResultsOverlay from '@/components/search/SearchResultsOverlay';
import { SearchResultsProvider, useSearchContext } from '@/components/search/SearchResultsProvider';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DocumentsSection from '@/components/dashboard/DocumentsSection';
import ComplianceCalendar from '@/components/dashboard/ComplianceCalendar';
import AIAssistant from '@/components/dashboard/AIAssistant';
import CreateDocumentModal from '@/components/documents/CreateDocumentModal';
import EditDeadlineModal from '@/components/compliance/EditDeadlineModal';
import AddDeadlineModal from '@/components/compliance/AddDeadlineModal';
import { 
  DashboardStats, 
  PendingDocumentItem, 
  RecentDocumentItem, 
  ComplianceCalendarItem, 
  Template, 
  ComplianceDeadline, 
  User 
} from '@/types';
import { Plus, AlertCircle, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Search-driven dashboard content component
function EnhancedDashboardContent() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDeadlineModalOpen, setIsEditDeadlineModalOpen] = useState(false);
  const [isAddDeadlineModalOpen, setIsAddDeadlineModalOpen] = useState(false);
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get search context
  const { query, isActive, hasResults, searchResults } = useSearchContext();
  
  // Fetch dashboard stats (filtered by search if active)
  const { 
    data: dashboardStats,
    isLoading: isLoadingStats
  } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query && query.length >= 2) {
        params.set('search', query);
      }
      
      const response = await fetch(`/api/dashboard/stats?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      return response.json();
    },
  });

  // Fetch compliance documents that need action (filtered by search)
  const {
    data: pendingComplianceDocuments,
    isLoading: isLoadingPendingCompliance
  } = useQuery<PendingDocumentItem[]>({
    queryKey: ['/api/documents', { status: 'pending_approval', search: query }],
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'pending_approval' });
      if (query && query.length >= 2) {
        params.set('search', query);
      }
      
      const response = await fetch(`/api/documents?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending documents');
      }
      
      const data = await response.json();
      return data.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        deadline: doc.deadline || undefined,
        status: doc.status,
        actionType: doc.status === 'pending_approval' ? 'approve' : 
                   doc.status === 'active' ? 'review' : 'sign'
      }));
    },
  });

  // Fetch user documents that need action (drafts) - filtered by search
  const {
    data: pendingUserDocuments,
    isLoading: isLoadingPendingUser
  } = useQuery<any[]>({
    queryKey: ['/api/user-documents', { status: 'draft', search: query }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query && query.length >= 2) {
        params.set('search', query);
      }
      
      const response = await fetch(`/api/user-documents?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user documents');
      }
      
      const data = await response.json();
      return data
        .filter((doc: any) => doc.status === 'draft')
        .slice(0, 5)
        .map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          deadline: undefined,
          status: doc.status,
          actionType: 'complete',
          isUserDocument: true
        }));
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Combine pending documents
  const pendingDocuments = [
    ...(pendingComplianceDocuments || []),
    ...(pendingUserDocuments || [])
  ];

  const isLoadingPending = isLoadingPendingCompliance || isLoadingPendingUser;

  // Fetch recent compliance documents (filtered by search)
  const {
    data: recentComplianceDocuments,
    isLoading: isLoadingRecentCompliance
  } = useQuery<RecentDocumentItem[]>({
    queryKey: ['/api/documents', { recent: true, search: query }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query && query.length >= 2) {
        params.set('search', query);
      }
      
      const response = await fetch(`/api/documents?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent documents');
      }
      
      const data = await response.json();
      return data.slice(0, 3).map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        updatedAt: doc.updatedAt,
        status: doc.status
      }));
    },
  });

  // Fetch recent user documents (filtered by search)
  const {
    data: recentUserDocuments,
    isLoading: isLoadingRecentUser
  } = useQuery<any[]>({
    queryKey: ['/api/user-documents', { recent: true, search: query }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query && query.length >= 2) {
        params.set('search', query);
      }
      
      const response = await fetch(`/api/user-documents?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent user documents');
      }
      
      const data = await response.json();
      return data.slice(0, 2).map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        updatedAt: doc.updatedAt,
        status: doc.status,
        isUserDocument: true
      }));
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Combine recent documents
  const recentDocuments = [
    ...(recentComplianceDocuments || []),
    ...(recentUserDocuments || [])
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  const isLoadingRecent = isLoadingRecentCompliance || isLoadingRecentUser;

  // Fetch compliance deadlines (filtered by search)
  const {
    data: complianceDeadlines,
    isLoading: isLoadingDeadlines
  } = useQuery<ComplianceCalendarItem[]>({
    queryKey: ['/api/compliance-deadlines', { upcoming: true, search: query }],
    queryFn: async () => {
      const params = new URLSearchParams({ upcoming: 'true' });
      if (query && query.length >= 2) {
        params.set('search', query);
      }
      
      const response = await fetch(`/api/compliance-deadlines?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch compliance deadlines');
      }
      
      const data = await response.json();
      return data.map((deadline: any) => ({
        id: deadline.id,
        title: deadline.title,
        deadline: deadline.deadline,
        type: deadline.type,
        assignee: {
          id: 0, // Will be populated with user data
          name: 'Unassigned',
          initials: 'UN'
        },
        status: deadline.status
      }));
    },
  });

  // Fetch users for assignee information
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch templates for create document modal
  const {
    data: templates,
    isLoading: isLoadingTemplates
  } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    enabled: isCreateModalOpen,
  });

  // Fetch deadline details when editing
  const {
    data: selectedDeadline,
    isLoading: isLoadingSelectedDeadline
  } = useQuery<ComplianceDeadline>({
    queryKey: ['/api/compliance-deadlines', selectedDeadlineId],
    enabled: isEditDeadlineModalOpen && selectedDeadlineId !== null,
  });

  // Create a validated deadline object
  const validatedSelectedDeadline = selectedDeadline && selectedDeadlineId ? {
    ...selectedDeadline,
    id: selectedDeadlineId
  } : null;

  // Event handlers
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Search Command Center - The Crown Jewel */}
      <motion.div variants={sectionVariants}>
        <SearchCommandCenter 
          placeholder="Search everything: documents, deadlines, insights..."
        />
      </motion.div>

      {/* Search Results Overlay */}
      <AnimatePresence>
        {isActive && hasResults && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <SearchResultsOverlay 
              onResultClick={(result) => {
                console.log('Search result clicked:', result);
                // Handle result click - navigate to detail page, etc.
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Context Indicator */}
      {isActive && (
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-800">
                      Search Active
                    </span>
                  </div>
                  
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    "{query}"
                  </Badge>
                  
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {searchResults.totalMatches} results
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-slate-600">
                  <span className="flex items-center space-x-1">
                    <Filter className="h-3 w-3" />
                    <span>Filtered view</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dashboard Header */}
      <motion.div 
        className="flex justify-between items-center"
        variants={sectionVariants}
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isActive ? `Search Results for "${query}"` : 'Welcome to Compliance360'}
          </h1>
          <p className="text-slate-500">
            {isActive 
              ? `Found ${searchResults.totalMatches} results across all categories`
              : 'Manage your compliance documents efficiently'
            }
          </p>
        </div>
        <Button onClick={handleCreateDocument}>
          <Plus className="mr-1 h-4 w-4" /> 
          Create Document
        </Button>
      </motion.div>

      {/* Dashboard Overview - Search-driven */}
      <motion.div
        variants={sectionVariants}
        className={cn(
          "transition-all duration-500",
          isActive && "opacity-90 scale-98"
        )}
      >
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
      </motion.div>

      {/* Documents Section - Search-filtered */}
      <motion.div
        variants={sectionVariants}
        className={cn(
          "transition-all duration-500",
          isActive && "opacity-90 scale-98"
        )}
      >
        <DocumentsSection 
          pendingDocuments={pendingDocuments || []} 
          recentDocuments={recentDocuments || []}
          isLoading={isLoadingPending || isLoadingRecent}
        />
      </motion.div>

      {/* Compliance Calendar - Search-filtered */}
      <motion.div
        variants={sectionVariants}
        className={cn(
          "transition-all duration-500",
          isActive && "opacity-90 scale-98"
        )}
      >
        <ComplianceCalendar 
          calendarItems={complianceDeadlines || []}
          isLoading={isLoadingDeadlines}
          onViewItem={handleViewDeadline}
          onEditItem={handleEditDeadline}
          onAddItem={handleAddDeadline}
        />
      </motion.div>

      {/* AI Assistant - Enhanced with search context */}
      <motion.div
        variants={sectionVariants}
        className={cn(
          "transition-all duration-500",
          isActive && "opacity-75 scale-95"
        )}
      >
        <AIAssistant />
      </motion.div>

      {/* Modals */}
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
    </motion.div>
  );
}

// Main dashboard page component
export default function EnhancedSearchDashboardPage() {
  return (
    <SearchResultsProvider>
      <DashboardLayout 
        pageTitle="Enhanced Dashboard" 
        notificationCount={0}
      >
        <EnhancedDashboardContent />
      </DashboardLayout>
    </SearchResultsProvider>
  );
}

