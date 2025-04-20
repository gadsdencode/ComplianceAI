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
import { CalendarIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComplianceDeadline, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

type DeadlineStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

type AddDeadlineModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AddDeadlineModal({
  isOpen,
  onClose,
}: AddDeadlineModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('regulatory');
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(new Date());
  const [status, setStatus] = useState<DeadlineStatus>('not_started');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch users for the assignee dropdown
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const createDeadlineMutation = useMutation({
    mutationFn: async (newDeadline: Record<string, any>) => {
      console.log('Creating new deadline:', newDeadline);
      
      const response = await fetch('/api/compliance-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeadline),
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to create deadline';
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          
          // Extract detailed validation errors
          if (errorData.errors) {
            console.log('Validation errors:', JSON.stringify(errorData.errors, null, 2));
            
            // Create a more descriptive error message from validation errors
            const errorDetails = Object.entries(errorData.errors)
              .filter(([key, value]) => key !== '_errors' && typeof value === 'object' && value !== null)
              .map(([key, value]) => {
                const fieldErrors = (value as any)._errors;
                if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
                  return `${key}: ${fieldErrors.join(', ')}`;
                }
                return null;
              })
              .filter(Boolean)
              .join('; ');
            
            if (errorDetails) {
              errorMessage = `Validation failed: ${errorDetails}`;
            } else {
              errorMessage = errorData.message || errorMessage;
            }
          } else {
            errorMessage = errorData.message || errorMessage;
          }
          
          // Check for permission errors
          if (response.status === 401) {
            errorMessage = 'You must be logged in to create deadlines';
          } else if (response.status === 403) {
            errorMessage = 'You do not have permission to create deadlines';
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Deadline created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-deadlines'] });
      toast({
        title: 'Deadline created',
        description: 'The compliance deadline has been created successfully.',
      });
      onClose();
    },
    onError: (error) => {
      console.error('Deadline creation error:', error);
      toast({
        title: 'Error',
        description: `Failed to create deadline: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (!type) {
      toast({
        title: 'Validation Error',
        description: 'Type is required',
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
      // In the schema, deadline is a timestamp field in the database
      // For PostgreSQL timestamp fields, the correct format is an ISO string
      // But we need to make sure we modify the request on the server to accept this
      const deadline = deadlineDate.toISOString();
      
      // Create a properly formatted deadline object
      const payload: Record<string, any> = {
        title: title.trim(),
        type,
        status,
        deadline,
        ...(description.trim() ? { description: description.trim() } : {}),
      };
      
      // Only add assigneeId if it's a valid number
      if (assigneeId !== null && !isNaN(assigneeId)) {
        payload.assigneeId = assigneeId;
      }
      
      // Log the exact format we're sending
      console.log('Sending payload with deadline format:', {
        value: deadline,
        type: typeof deadline
      });
      
      createDeadlineMutation.mutate(payload);
    } catch (error) {
      console.error('Error preparing deadline payload:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare deadline data',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Compliance Deadline</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createDeadlineMutation.isPending}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createDeadlineMutation.isPending}
              rows={3}
              placeholder="Enter a description for this compliance deadline"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              value={type} 
              onValueChange={(value) => setType(value)}
              disabled={createDeadlineMutation.isPending}
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
                  disabled={createDeadlineMutation.isPending}
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
              value={assigneeId ? assigneeId.toString() : "none"}
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
              disabled={createDeadlineMutation.isPending || usersLoading}
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
              disabled={createDeadlineMutation.isPending}
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
              disabled={createDeadlineMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createDeadlineMutation.isPending}
            >
              {createDeadlineMutation.isPending ? 'Creating...' : 'Create Deadline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 