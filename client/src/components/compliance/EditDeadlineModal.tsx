import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ComplianceDeadline } from '@/types';
import { useToast } from '@/hooks/use-toast';

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
  const [title, setTitle] = useState(deadline.title);
  const [type, setType] = useState<string>(deadline.type);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(new Date(deadline.deadline));
  const [status, setStatus] = useState<DeadlineStatus>(deadline.status as DeadlineStatus);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateDeadlineMutation = useMutation({
    mutationFn: async (updatedDeadline: Partial<ComplianceDeadline>) => {
      const response = await fetch(`/api/compliance-deadlines/${deadline.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDeadline),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update deadline');
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
    if (!deadlineDate) return;
    
    updateDeadlineMutation.mutate({
      title,
      type,
      deadline: deadlineDate.toISOString(),
      status,
    });
  };
  
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