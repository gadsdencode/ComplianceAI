import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComplianceDeadline, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

type DeadlineStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

type EditDeadlineModalProps = {
  isOpen: boolean;
  onClose: () => void;
  deadline: ComplianceDeadline;
  isLoading?: boolean;
};

export default function EditDeadlineModal({
  isOpen,
  onClose,
  deadline,
  isLoading = false,
}: EditDeadlineModalProps) {
  // Extract and validate deadline ID early
  const deadlineId = typeof deadline.id === 'number' 
    ? deadline.id 
    : (typeof deadline.id === 'string' ? parseInt(deadline.id, 10) : null);

  // Safely parse date with fallback
  const parseDeadlineDate = () => {
    try {
      const date = new Date(deadline.deadline);
      // Check if date is valid
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (e) {
      console.error("Error parsing deadline date:", e);
      return new Date();
    }
  };

  // Initialize state with default values to prevent undefined values
  const [title, setTitle] = useState(deadline.title || '');
  const [description, setDescription] = useState(deadline.description || '');
  const [type, setType] = useState<string>(deadline.type || 'regulatory');
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(parseDeadlineDate());
  const [status, setStatus] = useState<DeadlineStatus>((deadline.status as DeadlineStatus) || 'not_started');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  
  // Update state when deadline prop changes
  useEffect(() => {
    if (!deadline) return;
    
    setTitle(deadline.title || '');
    setDescription(deadline.description || '');
    setType(deadline.type || 'regulatory');
    setDeadlineDate(parseDeadlineDate());
    setStatus((deadline.status as DeadlineStatus) || 'not_started');
    
    // Ensure assigneeId is a valid number or null
    if (deadline.assigneeId && typeof deadline.assigneeId === 'number') {
      setAssigneeId(deadline.assigneeId);
    } else if (deadline.assigneeId && typeof deadline.assigneeId === 'string') {
      const parsedId = parseInt(deadline.assigneeId, 10);
      setAssigneeId(isNaN(parsedId) ? null : parsedId);
    } else {
      setAssigneeId(null);
    }
  }, [deadline]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch users for the assignee dropdown
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateDeadlineMutation = useMutation({
    mutationFn: async (updatedDeadline: Record<string, any>) => {
      // Validate the deadline ID 
      if (!deadlineId || isNaN(deadlineId)) {
        throw new Error("Invalid deadline ID");
      }
      
      console.log('Updating deadline:', updatedDeadline);
      console.log('Deadline ID:', deadlineId, 'Type:', typeof deadlineId);
      
      const response = await fetch(`/api/compliance-deadlines/${deadlineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDeadline),
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to update deadline';
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-deadlines'] });
      toast({
        title: 'Deadline updated',
        description: 'The compliance deadline has been updated successfully.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update deadline: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate deadline ID before submitting
    if (!deadlineId || isNaN(deadlineId)) {
      toast({
        title: 'Error',
        description: 'Invalid deadline ID. Cannot update this deadline.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!deadlineDate) {
      toast({
        title: 'Validation Error',
        description: 'Deadline date is required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Create a properly formatted deadline object
      const payload: Record<string, any> = {
        title: title.trim(),
        type,
        status,
        deadline: deadlineDate.toISOString(),
      };
      
      // Add optional fields
      if (description.trim()) {
        payload.description = description.trim();
      }
      
      // Only add assigneeId if it's a valid number
      if (assigneeId !== null && typeof assigneeId === 'number') {
        payload.assigneeId = assigneeId;
      } else {
        // Include null explicitly to clear the assignee
        payload.assigneeId = null;
      }
      
      updateDeadlineMutation.mutate(payload);
    } catch (error) {
      console.error('Error preparing deadline data:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare deadline data',
        variant: 'destructive',
      });
    }
  };
  
  // If deadline ID is invalid, show error in modal
  if (!deadlineId || isNaN(deadlineId)) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-red-500">Invalid deadline ID. Cannot edit this deadline.</p>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Compliance Deadline</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading || updateDeadlineMutation.isPending}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading || updateDeadlineMutation.isPending}
              rows={3}
              placeholder="Enter a description for this compliance deadline"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              value={type} 
              onValueChange={(value) => setType(value)}
              disabled={isLoading || updateDeadlineMutation.isPending}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regulatory">Regulatory</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadlineDate && "text-muted-foreground"
                  )}
                  disabled={isLoading || updateDeadlineMutation.isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadlineDate ? format(deadlineDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deadlineDate}
                  onSelect={setDeadlineDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee (optional)</Label>
            <Select 
              value={assigneeId !== null ? assigneeId.toString() : "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  setAssigneeId(null);
                } else {
                  try {
                    const id = parseInt(value, 10);
                    setAssigneeId(isNaN(id) ? null : id);
                  } catch (e) {
                    console.error("Error parsing assignee ID:", e);
                    setAssigneeId(null);
                  }
                }
              }}
              disabled={isLoading || updateDeadlineMutation.isPending || usersLoading}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={status} 
              onValueChange={(value: DeadlineStatus) => setStatus(value)}
              disabled={isLoading || updateDeadlineMutation.isPending}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateDeadlineMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || updateDeadlineMutation.isPending}
            >
              {updateDeadlineMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 