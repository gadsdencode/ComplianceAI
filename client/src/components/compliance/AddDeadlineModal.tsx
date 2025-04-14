import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar'; // Using calendar instead of date-picker
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComplianceDeadline } from '@/types';
import { useToast } from '@/hooks/use-toast'; // Using hooks/use-toast instead of components/ui/use-toast

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
  const [type, setType] = useState<string>('regulatory');
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(new Date());
  const [status, setStatus] = useState<DeadlineStatus>('not_started');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createDeadlineMutation = useMutation({
    mutationFn: async (newDeadline: Partial<ComplianceDeadline>) => {
      const response = await fetch('/api/compliance-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeadline),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create deadline');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-deadlines'] });
      toast({
        title: 'Deadline created',
        description: 'The compliance deadline has been created successfully.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create deadline: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineDate) return;
    
    createDeadlineMutation.mutate({
      title,
      type,
      deadline: deadlineDate.toISOString(),
      status,
      assigneeId: assigneeId || undefined,
    });
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