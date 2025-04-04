import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TemplateList from '@/components/templates/TemplateList';
import { Template } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

const templateFormSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.string().optional()
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      content: '',
      category: ''
    }
  });

  // Fetch templates
  const {
    data: templates,
    isLoading,
    error
  } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      return await apiRequest('POST', '/api/templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: 'Template created',
        description: 'The template has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating template',
        description: error.message || 'Failed to create template',
        variant: 'destructive',
      });
    }
  });

  // Filter templates by search query
  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.category && template.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreateTemplate = () => {
    setIsCreateModalOpen(true);
  };

  const onSubmit = (data: TemplateFormValues) => {
    createTemplateMutation.mutate(data);
  };

  return (
    <DashboardLayout 
      pageTitle="Templates" 
      onSearch={handleSearch}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Document Templates</h1>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-1 h-4 w-4" /> 
          Create Template
        </Button>
      </div>

      <TemplateList 
        templates={filteredTemplates || []} 
        isLoading={isLoading} 
        error={error?.message}
      />

      {/* Create Template Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Enter template name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="E.g. Security, Privacy, Financial"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Enter template content in Markdown format..."
                        className="min-h-[200px] font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createTemplateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
