import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { format } from 'date-fns';
import { CalendarIcon, Clock, FileText, Edit, AlertTriangle, CheckCircle, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import EditDeadlineModal from '@/components/compliance/EditDeadlineModal';
import { ComplianceDeadline } from '@/types';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  not_started: 'bg-slate-100 text-slate-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
};

const statusIcons = {
  not_started: <Clock className="h-4 w-4" />,
  in_progress: <FileText className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  overdue: <AlertTriangle className="h-4 w-4" />
};

export default function ComplianceDeadlinePage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const {
    data: deadline,
    isLoading,
    error
  } = useQuery<ComplianceDeadline>({
    queryKey: ['/api/compliance-deadlines', parseInt(id)],
    enabled: !!id,
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/compliance-deadlines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-deadlines', parseInt(id)] });
      toast({
        title: 'Status updated',
        description: 'The deadline status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleMarkInProgress = () => {
    updateStatusMutation.mutate('in_progress');
  };
  
  const handleMarkComplete = () => {
    updateStatusMutation.mutate('completed');
  };
  
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };
  
  const handleGoBack = () => {
    navigate('/dashboard');
  };
  
  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Compliance Deadline">
        <div className="flex items-center justify-center py-16">
          <div className="animate-pulse h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !deadline) {
    return (
      <DashboardLayout pageTitle="Compliance Deadline">
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Deadline</h2>
          <p className="text-slate-600 mb-4">Unable to load the deadline details.</p>
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  const deadlineDate = new Date(deadline.deadline);
  const isPastDeadline = deadlineDate < new Date();
  const statusClass = statusColors[deadline.status as keyof typeof statusColors] || statusColors.not_started;
  const StatusIcon = statusIcons[deadline.status as keyof typeof statusIcons] || statusIcons.not_started;
  
  return (
    <DashboardLayout pageTitle="Compliance Deadline">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Compliance Deadline Details</h1>
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{deadline.title}</CardTitle>
                <CardDescription className="mt-2 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {format(deadlineDate, "MMMM d, yyyy")}
                  {isPastDeadline && deadline.status !== 'completed' && (
                    <Badge variant="destructive" className="ml-2">Past Due</Badge>
                  )}
                </CardDescription>
              </div>
              <Badge className={`${statusClass} flex items-center gap-1 px-2 py-1`}>
                {StatusIcon}
                {deadline.status === 'not_started' && 'Not Started'}
                {deadline.status === 'in_progress' && 'In Progress'}
                {deadline.status === 'completed' && 'Completed'}
                {deadline.status === 'overdue' && 'Overdue'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Type</h3>
              <p className="capitalize">{deadline.type}</p>
            </div>
            
            {deadline.description && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Description</h3>
                <p>{deadline.description}</p>
              </div>
            )}
            
            {deadline.assigneeId && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Assignee</h3>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-sm font-medium">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="ml-2">ID: {deadline.assigneeId}</span>
                </div>
              </div>
            )}
            
            {deadline.documentId && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Related Document</h3>
                <Button 
                  variant="link" 
                  className="px-0"
                  onClick={() => navigate(`/documents/${deadline.documentId}`)}
                >
                  View Document
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <div>
              <Button
                variant="outline"
                onClick={handleEdit}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            </div>
            <div className="space-x-2">
              {deadline.status !== 'completed' && (
                <Button 
                  variant="outline" 
                  onClick={handleMarkInProgress}
                  disabled={deadline.status === 'in_progress' || updateStatusMutation.isPending}
                >
                  Mark In Progress
                </Button>
              )}
              {deadline.status !== 'completed' && (
                <Button 
                  onClick={handleMarkComplete}
                  disabled={updateStatusMutation.isPending}
                >
                  Mark Complete
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {isEditModalOpen && deadline && (
        <EditDeadlineModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          deadline={deadline}
        />
      )}
    </DashboardLayout>
  );
} 