import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  X,
  Plus,
  Trash2,
  Code,
  Eye,
  FileText,
  Variable,
  Tag,
  Shield,
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Copy,
  RefreshCw,
  Download,
  Upload,
  Wand2,
  Type,
  List,
  Hash,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building,
  User,
  Link,
  DollarSign,
  Percent,
  ToggleLeft,
  Database,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import type { Template } from '@shared/schema';

interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'address' | 'currency' | 'percentage' | 'boolean' | 'list';
  required: boolean;
  defaultValue?: string;
  description?: string;
  placeholder?: string;
  validation?: string;
  options?: string[]; // For list type
}

interface TemplateBuilderProps {
  template?: any;
  onSave?: (template: any) => void;
  onCancel?: () => void;
  className?: string;
}

// Variable type configurations
const variableTypes = [
  { value: 'text', label: 'Text', icon: Type, color: 'text-blue-600' },
  { value: 'number', label: 'Number', icon: Hash, color: 'text-green-600' },
  { value: 'date', label: 'Date', icon: Calendar, color: 'text-purple-600' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-red-600' },
  { value: 'phone', label: 'Phone', icon: Phone, color: 'text-orange-600' },
  { value: 'address', label: 'Address', icon: MapPin, color: 'text-indigo-600' },
  { value: 'currency', label: 'Currency', icon: DollarSign, color: 'text-emerald-600' },
  { value: 'percentage', label: 'Percentage', icon: Percent, color: 'text-pink-600' },
  { value: 'boolean', label: 'Yes/No', icon: ToggleLeft, color: 'text-cyan-600' },
  { value: 'list', label: 'List', icon: List, color: 'text-amber-600' },
];

// Common template snippets
const templateSnippets = {
  header: {
    name: 'Document Header',
    content: '# [Document Title]\n\n**Document ID:** [Document ID]\n**Version:** [Version]\n**Date:** [Date]\n**Classification:** [Classification]'
  },
  companyInfo: {
    name: 'Company Information',
    content: '**[Company Name]**\nAddress: [Company Address]\nPhone: [Company Phone]\nEmail: [Company Email]\nWebsite: [Company Website]'
  },
  signature: {
    name: 'Signature Block',
    content: '\n---\n\n**Signed:**\n\nName: _______________________\nTitle: _______________________\nDate: _______________________\nSignature: _______________________'
  },
  confidentiality: {
    name: 'Confidentiality Notice',
    content: '\n**CONFIDENTIAL**\n\nThis document contains confidential and proprietary information of [Company Name]. Any unauthorized review, use, disclosure, or distribution is prohibited.'
  },
  disclaimer: {
    name: 'Legal Disclaimer',
    content: '\n**Disclaimer:** The information contained in this document is provided for informational purposes only. [Company Name] makes no warranties, express or implied, regarding the accuracy or completeness of this information.'
  },
  contactInfo: {
    name: 'Contact Information',
    content: '\n**Contact Information:**\nName: [Contact Name]\nTitle: [Contact Title]\nEmail: [Contact Email]\nPhone: [Contact Phone]'
  }
};

export default function TemplateBuilder({
  template,
  onSave,
  onCancel,
  className
}: TemplateBuilderProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || 'Compliance');
  const [content, setContent] = useState(template?.content || '');
  const [tags, setTags] = useState<string[]>(template?.tags || []);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [estimatedTime, setEstimatedTime] = useState(template?.estimatedTime || '');
  const [complianceStandards, setComplianceStandards] = useState<string[]>(template?.complianceStandards || []);
  const [activeTab, setActiveTab] = useState('editor');
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newStandard, setNewStandard] = useState('');
  const [showVariableDialog, setShowVariableDialog] = useState(false);
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const [variableName, setVariableName] = useState('');
  const [variableType, setVariableType] = useState<TemplateVariable['type']>('text');
  const [variableRequired, setVariableRequired] = useState(true);
  const [variableDescription, setVariableDescription] = useState('');
  const [aiAssistEnabled, setAiAssistEnabled] = useState(false);
  const { toast } = useToast();

  // Parse variables from template on load
  useEffect(() => {
    if (template) {
      const extractedVars = extractVariablesFromContent(template.content);
      setVariables(extractedVars);
    }
  }, [template]);

  // Extract variables from content
  const extractVariablesFromContent = (text: string): TemplateVariable[] => {
    const regex = /\[([^\]]+)\]/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[1]);
    }
    
    return Array.from(matches).map(name => ({
      name,
      type: guessVariableType(name),
      required: true,
      description: ''
    }));
  };

  // Guess variable type from name
  const guessVariableType = (name: string): TemplateVariable['type'] => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('email')) return 'email';
    if (lowerName.includes('phone') || lowerName.includes('tel')) return 'phone';
    if (lowerName.includes('date') || lowerName.includes('time')) return 'date';
    if (lowerName.includes('address') || lowerName.includes('location')) return 'address';
    if (lowerName.includes('price') || lowerName.includes('cost') || lowerName.includes('amount')) return 'currency';
    if (lowerName.includes('percent') || lowerName.includes('rate')) return 'percentage';
    if (lowerName.includes('yes') || lowerName.includes('no') || lowerName.includes('agree')) return 'boolean';
    if (lowerName.includes('number') || lowerName.includes('count') || lowerName.includes('quantity')) return 'number';
    return 'text';
  };

  // Add variable to content
  const insertVariable = (variable: TemplateVariable) => {
    const varPlaceholder = `[${variable.name}]`;
    setContent(prev => prev + varPlaceholder);
    if (!variables.find(v => v.name === variable.name)) {
      setVariables(prev => [...prev, variable]);
    }
  };

  // Insert snippet
  const insertSnippet = (snippet: typeof templateSnippets[keyof typeof templateSnippets]) => {
    setContent(prev => prev + '\n\n' + snippet.content + '\n');
    // Extract and add new variables from snippet
    const extractedVars = extractVariablesFromContent(snippet.content);
    extractedVars.forEach(newVar => {
      if (!variables.find(v => v.name === newVar.name)) {
        setVariables(prev => [...prev, newVar]);
      }
    });
  };

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (template?.id) {
        return await apiRequest('PATCH', `/api/templates/${template.id}`, data);
      } else {
        return await apiRequest('POST', '/api/templates', data);
      }
    },
    onSuccess: (savedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template saved",
        description: `"${savedTemplate.name}" has been saved successfully.`,
      });
      if (onSave) {
        onSave(savedTemplate);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error saving template",
        description: error.message || "Failed to save template. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "Template name is required.",
        variant: "destructive"
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Validation error",
        description: "Template content is required.",
        variant: "destructive"
      });
      return;
    }
    
    const templateData = {
      name,
      description,
      category,
      content,
      tags,
      variables: variables.map(v => v.name),
      estimatedTime,
      complianceStandards,
      isActive: true
    };
    
    saveTemplateMutation.mutate(templateData);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addStandard = () => {
    if (newStandard.trim() && !complianceStandards.includes(newStandard.trim())) {
      setComplianceStandards([...complianceStandards, newStandard.trim()]);
      setNewStandard('');
    }
  };

  const removeStandard = (standard: string) => {
    setComplianceStandards(complianceStandards.filter(s => s !== standard));
  };

  const renderPreview = () => {
    let preview = content;
    variables.forEach(variable => {
      const placeholder = `[${variable.name}]`;
      const value = variable.defaultValue || `{${variable.name}}`;
      preview = preview.replace(new RegExp(placeholder, 'g'), value);
    });
    return preview;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
          <p className="text-muted-foreground mt-1">
            Build professional document templates with variables and automation
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="cancel-template-builder"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveTemplateMutation.isPending}
            data-testid="save-template"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor">
            <FileText className="h-4 w-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="variables">
            <Variable className="h-4 w-4 mr-2" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="metadata">
            <Tag className="h-4 w-4 mr-2" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., GDPR Privacy Policy"
                    data-testid="template-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="template-category" data-testid="template-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Privacy">Privacy</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this template is for..."
                  rows={2}
                  data-testid="template-description-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
              <CardDescription>
                Use [Variable Name] syntax to add variables to your template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowVariableDialog(true)}
                    data-testid="insert-variable-button"
                  >
                    <Variable className="h-4 w-4 mr-1" />
                    Variable
                  </Button>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  {/* Snippet Buttons */}
                  {Object.entries(templateSnippets).slice(0, 3).map(([key, snippet]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant="ghost"
                      onClick={() => insertSnippet(snippet)}
                      data-testid={`insert-snippet-${key}`}
                    >
                      {snippet.name}
                    </Button>
                  ))}
                </div>
                
                {aiAssistEnabled && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Assist On
                  </Badge>
                )}
              </div>
              
              {/* Editor */}
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your template content..."
                rows={20}
                className="font-mono text-sm"
                data-testid="template-content-editor"
              />
              
              {/* Quick Snippets */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Quick Snippets</CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(templateSnippets).map(([key, snippet]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant="outline"
                        onClick={() => insertSnippet(snippet)}
                        data-testid={`quick-snippet-${key}`}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {snippet.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Variables</CardTitle>
              <CardDescription>
                Define and manage variables used in your template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Variables List */}
                {variables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Variable className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No variables defined yet</p>
                    <p className="text-sm mt-2">
                      Add variables by using [Variable Name] syntax in your template
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variables.map((variable, index) => {
                      const typeConfig = variableTypes.find(t => t.value === variable.type);
                      const TypeIcon = typeConfig?.icon || Type;
                      
                      return (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={cn("p-2 rounded-lg bg-muted", typeConfig?.color)}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{variable.name}</span>
                                  {variable.required && (
                                    <Badge variant="secondary" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {typeConfig?.label}
                                  </Badge>
                                </div>
                                {variable.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {variable.description}
                                  </p>
                                )}
                                {variable.defaultValue && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Default: {variable.defaultValue}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingVariable(variable);
                                  setShowVariableDialog(true);
                                }}
                                data-testid={`edit-variable-${index}`}
                              >
                                <Edit className="h-4 w-4 default-edit-icon" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setVariables(variables.filter((_, i) => i !== index));
                                }}
                                data-testid={`delete-variable-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
                
                {/* Add Variable Button */}
                <Button
                  onClick={() => {
                    setEditingVariable(null);
                    setShowVariableDialog(true);
                  }}
                  className="w-full"
                  data-testid="add-variable-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help categorize and find this template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  data-testid="add-tag-input"
                />
                <Button onClick={addTag} data-testid="add-tag-button">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`remove-tag-${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Standards */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Standards</CardTitle>
              <CardDescription>
                Specify which compliance standards this template addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newStandard}
                  onChange={(e) => setNewStandard(e.target.value)}
                  placeholder="Add a compliance standard..."
                  onKeyPress={(e) => e.key === 'Enter' && addStandard()}
                  data-testid="add-standard-input"
                />
                <Button onClick={addStandard} data-testid="add-standard-button">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {complianceStandards.map(standard => (
                  <Badge key={standard} variant="default" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {standard}
                    <button
                      onClick={() => removeStandard(standard)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`remove-standard-${standard}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Estimate */}
          <Card>
            <CardHeader>
              <CardTitle>Time Estimate</CardTitle>
              <CardDescription>
                How long does it typically take to complete this document?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="e.g., 15-20 minutes"
                  data-testid="estimated-time-input"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                See how your template will look with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full rounded-md border p-6">
                <pre className="whitespace-pre-wrap font-sans">
                  {renderPreview()}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Variable Dialog */}
      <Dialog open={showVariableDialog} onOpenChange={setShowVariableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariable ? 'Edit Variable' : 'Add Variable'}
            </DialogTitle>
            <DialogDescription>
              Define a variable that will be replaced with actual values
            </DialogDescription>
          </DialogHeader>
          
          {/* Variable form would go here */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVariableDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowVariableDialog(false)}>
              {editingVariable ? 'Update' : 'Add'} Variable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}