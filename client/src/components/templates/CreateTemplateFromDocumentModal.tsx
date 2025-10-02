import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Document, UserDocument } from '@/types';
import { FileText, Copy } from 'lucide-react';

const templateFormSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.string().optional()
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface CreateTemplateFromDocumentModalProps {
  document: {
    id: number;
    title: string;
    type: 'compliance' | 'user';
    document: Document | UserDocument;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTemplateFromDocumentModal({
  document,
  isOpen,
  onClose
}: CreateTemplateFromDocumentModalProps) {
  const { toast } = useToast();
  
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      content: '',
      category: ''
    }
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const doc = document.document;
      const content = 'content' in doc ? doc.content : '';
      
      form.reset({
        name: `${document.title} Template`,
        content: content || '',
        category: 'content' in doc && doc.category ? doc.category : 'General'
      });
    }
  }, [isOpen, document, form]);

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      return await apiRequest('POST', '/api/templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      onClose();
      form.reset();
      toast({
        title: 'Template created',
        description: 'The template has been created successfully from the document.',
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

  const onSubmit = (data: TemplateFormValues) => {
    createTemplateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Create Template from Document
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Source Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900">Source Document</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Title:</span> {document.title}</p>
              <p><span className="font-medium">Type:</span> {document.type === 'compliance' ? 'Compliance Document' : 'User Document'}</p>
              <p><span className="font-medium">ID:</span> {document.id}</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="templateName" className="block text-sm font-medium text-slate-700 mb-1">
                Template Name
              </Label>
              <Input
                id="templateName"
                {...form.register('name')}
                placeholder="Enter template name"
                disabled={createTemplateMutation.isPending}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="templateCategory" className="block text-sm font-medium text-slate-700 mb-1">
                Category (Optional)
              </Label>
              <Input
                id="templateCategory"
                {...form.register('category')}
                placeholder="E.g. Security, Privacy, Financial"
                disabled={createTemplateMutation.isPending}
              />
            </div>
            
            <div>
              <Label htmlFor="templateContent" className="block text-sm font-medium text-slate-700 mb-1">
                Template Content
              </Label>
              <Textarea
                id="templateContent"
                {...form.register('content')}
                placeholder="Enter template content in Markdown format..."
                className="min-h-[300px] font-mono"
                disabled={createTemplateMutation.isPending}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.content.message}</p>
              )}
            </div>
            
            <DialogFooter className="mt-5 border-t border-slate-200 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
