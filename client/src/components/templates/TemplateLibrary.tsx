import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Copy,
  Edit,
  Download,
  Clock,
  Tag,
  Shield,
  Sparkles,
  ChevronRight,
  Layout,
  FileCode,
  Lock,
  Users,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BookOpen,
  PlusCircle,
  Star,
  StarOff,
  Grid3X3,
  List,
  Variable,
  Timer,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Template } from '@shared/schema';
import { cn } from '@/lib/utils';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void;
  mode?: 'selection' | 'management';
  className?: string;
}

// Category icons and colors
const categoryConfig = {
  Privacy: {
    icon: Lock,
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-200',
    bgGradient: 'from-purple-50 to-purple-100'
  },
  Security: {
    icon: Shield,
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-200',
    bgGradient: 'from-blue-50 to-blue-100'
  },
  Legal: {
    icon: FileCode,
    color: 'bg-amber-100 text-amber-700',
    borderColor: 'border-amber-200',
    bgGradient: 'from-amber-50 to-amber-100'
  },
  HR: {
    icon: Users,
    color: 'bg-green-100 text-green-700',
    borderColor: 'border-green-200',
    bgGradient: 'from-green-50 to-green-100'
  },
  Financial: {
    icon: TrendingUp,
    color: 'bg-indigo-100 text-indigo-700',
    borderColor: 'border-indigo-200',
    bgGradient: 'from-indigo-50 to-indigo-100'
  },
  Compliance: {
    icon: CheckCircle,
    color: 'bg-teal-100 text-teal-700',
    borderColor: 'border-teal-200',
    bgGradient: 'from-teal-50 to-teal-100'
  }
};

export default function TemplateLibrary({
  onSelectTemplate,
  mode = 'selection',
  className
}: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates']
  });

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'all' || 
        template.category === selectedCategory;
      
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => template.tags?.includes(tag));
      
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [templates, searchQuery, selectedCategory, selectedTags]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, [templates]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach(t => {
      t.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [templates]);

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      return await apiRequest('POST', '/api/templates', {
        name: `${template.name} (Copy)`,
        description: template.description,
        content: template.content,
        category: template.category,
        tags: template.tags,
        variables: template.variables,
        estimatedTime: template.estimatedTime,
        complianceStandards: template.complianceStandards
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template duplicated",
        description: "The template has been successfully duplicated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate template. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleUseTemplate = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
      toast({
        title: "Template selected",
        description: `Using "${template.name}" template for document creation.`,
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Document Template Library
          </h2>
          <p className="text-muted-foreground mt-1">
            Professional templates for compliance and business documents
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  data-testid="toggle-view-mode"
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {mode === 'management' && (
            <Button data-testid="create-new-template">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Template
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-templates"
              />
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="all" data-testid="category-all">All</TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} data-testid={`category-${cat.toLowerCase()}`}>
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground mr-2">Filter by tags:</span>
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleTag(tag)}
                    data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTemplates.length} of {templates.length} templates
        </p>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTags([])}
            data-testid="clear-filters"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Templates Display */}
      <ScrollArea className="h-[600px] pr-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template, index) => {
                const config = categoryConfig[template.category as keyof typeof categoryConfig] || 
                               categoryConfig.Compliance;
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card 
                      className={cn(
                        "h-full hover:shadow-lg transition-all duration-200 cursor-pointer",
                        config.borderColor
                      )}
                      onClick={() => handlePreview(template)}
                      data-testid={`template-card-${template.id}`}
                    >
                      <CardHeader className={cn("bg-gradient-to-br", config.bgGradient)}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg", config.color)}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-1">
                                {template.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {template.category}
                                </Badge>
                                {template.isDefault && (
                                  <Badge variant="default" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-4">
                        <CardDescription className="line-clamp-2 mb-3">
                          {template.description || 'Professional template for compliance documentation'}
                        </CardDescription>
                        
                        {/* Template Meta Info */}
                        <div className="space-y-2 text-sm">
                          {template.estimatedTime && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Timer className="h-4 w-4" />
                              <span>{template.estimatedTime}</span>
                            </div>
                          )}
                          
                          {template.variables && template.variables.length > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Variable className="h-4 w-4" />
                              <span>{template.variables.length} variables</span>
                            </div>
                          )}
                          
                          {template.complianceStandards && template.complianceStandards.length > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Shield className="h-4 w-4" />
                              <span className="line-clamp-1">
                                {template.complianceStandards.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Tags */}
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {template.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-0">
                        <div className="flex gap-2 w-full">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(template);
                            }}
                            data-testid={`preview-template-${template.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseTemplate(template);
                            }}
                            data-testid={`use-template-${template.id}`}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Use
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template, index) => {
                const config = categoryConfig[template.category as keyof typeof categoryConfig] || 
                               categoryConfig.Compliance;
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                  >
                    <Card
                      className="hover:shadow-md transition-all duration-200"
                      data-testid={`template-list-item-${template.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={cn("p-2 rounded-lg", config.color)}>
                              <Icon className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">
                                  {template.name}
                                </h3>
                                {template.isDefault && (
                                  <Star className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {template.description}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {template.category}
                                </Badge>
                                {template.estimatedTime && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {template.estimatedTime}
                                  </span>
                                )}
                                {template.variables && (
                                  <span className="text-xs text-muted-foreground">
                                    {template.variables.length} variables
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {mode === 'management' && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => duplicateTemplateMutation.mutate(template.id)}
                                  data-testid={`duplicate-template-${template.id}`}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`edit-template-${template.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(template)}
                              data-testid={`preview-list-template-${template.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUseTemplate(template)}
                              data-testid={`use-list-template-${template.id}`}
                            >
                              Use Template
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedTemplate.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedTemplate.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-4">
                {/* Template Meta */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedTemplate.category}</Badge>
                  </div>
                  {selectedTemplate.estimatedTime && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      {selectedTemplate.estimatedTime}
                    </div>
                  )}
                  {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Variable className="h-4 w-4" />
                      {selectedTemplate.variables.length} variables
                    </div>
                  )}
                </div>
                
                {/* Variables */}
                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Required Variables</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map(variable => (
                          <Badge key={variable} variant="outline">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Compliance Standards */}
                {selectedTemplate.complianceStandards && selectedTemplate.complianceStandards.length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Compliance Standards</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.complianceStandards.map(standard => (
                          <Badge key={standard} variant="default">
                            <Shield className="h-3 w-3 mr-1" />
                            {standard}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Content Preview */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Content Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                      <pre className="whitespace-pre-wrap text-sm">
                        {selectedTemplate.content.substring(0, 1500)}
                        {selectedTemplate.content.length > 1500 && '...'}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleUseTemplate(selectedTemplate);
                    setPreviewOpen(false);
                  }}
                  data-testid="use-template-from-preview"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}