import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Template } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { FileText, User, Calendar, Eye, Copy, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';

interface TemplateListProps {
  templates: Template[];
  isLoading: boolean;
  error?: string;
}

export default function TemplateList({ templates, isLoading, error }: TemplateListProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const handleUseTemplate = (template: Template) => {
    // In a real app, this would navigate to document creation with template pre-selected
    toast({
      title: 'Template selected',
      description: `Selected template: ${template.name}`
    });
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center">
                <Skeleton className="h-10 w-10 rounded-md mr-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-8 w-24 mr-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 border rounded-lg bg-white">
        <div className="mx-auto h-12 w-12 text-red-500 mb-4">
          <FileText />
        </div>
        <h3 className="text-lg font-medium mb-2">Error loading templates</h3>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg bg-white">
        <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No templates found</h3>
        <p className="text-slate-600 mb-6">Create your first template to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center mr-4">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium">{template.name}</h3>
                        {template.isDefault && (
                          <Badge className="ml-2 bg-slate-100 text-slate-800 hover:bg-slate-100">Default</Badge>
                        )}
                        {template.category && (
                          <Badge variant="outline" className="ml-2">{template.category}</Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <span className="flex items-center">
                          <User className="h-3.5 w-3.5 mr-1" />
                          Created by User ID: {template.createdById}
                        </span>
                        
                        <span className="flex items-center ml-4">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Preview Modal */}
      <Dialog open={previewTemplate !== null} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[70vw] h-[90vh] max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>Template Preview: {previewTemplate?.name}</span>
              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Previewing document template in markdown format
            </p>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto flex-grow" style={{ maxHeight: "calc(90vh - 100px)" }}>
            <div className="p-4 border rounded-md bg-white">
              <div className="prose max-w-none prose-slate prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-a:text-primary-600">
                {previewTemplate && <ReactMarkdown>{previewTemplate.content}</ReactMarkdown>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
