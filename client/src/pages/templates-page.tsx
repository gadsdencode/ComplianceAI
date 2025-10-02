import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
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
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
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

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TemplateFormValues }) => {
      return await apiRequest('PUT', `/api/templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setEditingTemplate(null);
      form.reset();
      toast({
        title: 'Template updated',
        description: 'The template has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating template',
        description: error.message || 'Failed to update template',
        variant: 'destructive',
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setDeletingTemplate(null);
      toast({
        title: 'Template deleted',
        description: 'The template has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting template',
        description: error.message || 'Failed to delete template',
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

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      content: template.content,
      category: template.category || ''
    });
  };

  const handleDeleteTemplate = (template: Template) => {
    setDeletingTemplate(template);
  };

  const handleDuplicateTemplate = (template: Template) => {
    form.reset({
      name: `${template.name} (Copy)`,
      content: template.content,
      category: template.category || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingTemplate) {
      deleteTemplateMutation.mutate(deletingTemplate.id);
    }
  };

  const onSubmit = (data: TemplateFormValues) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
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
        onEdit={handleEditTemplate}
        onDelete={handleDeleteTemplate}
        onDuplicate={handleDuplicateTemplate}
      />

      {/* Create/Edit Template Modal */}
      <Dialog open={isCreateModalOpen || editingTemplate !== null} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setEditingTemplate(null);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
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
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending || updateTemplateMutation.isPending 
                    ? (editingTemplate ? 'Updating...' : 'Creating...') 
                    : (editingTemplate ? 'Update Template' : 'Create Template')
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deletingTemplate !== null} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeletingTemplate(null)}
              disabled={deleteTemplateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
