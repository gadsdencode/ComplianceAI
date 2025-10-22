import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Wand2,
  Variable,
  Eye,
  Save,
  Sparkles,
  AlertCircle,
  Clock,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Percent,
  Hash,
  Type,
  List,
  ToggleLeft,
  Shield,
  Tag,
  Download,
  Send,
  Copy,
  Edit3,
  FileDown,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Template, Document } from '@shared/schema';
import { cn } from '@/lib/utils';
import TemplateLibrary from '../templates/TemplateLibrary';

interface DocumentGenerationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (document: Document) => void;
  preselectedTemplate?: Template;
}

// Wizard steps
const WIZARD_STEPS = [
  { id: 'template', title: 'Select Template', icon: FileText },
  { id: 'variables', title: 'Fill Variables', icon: Variable },
  { id: 'ai-options', title: 'AI Enhancement', icon: Sparkles },
  { id: 'review', title: 'Review & Generate', icon: Eye },
  { id: 'complete', title: 'Complete', icon: CheckCircle }
];

// Variable field component
const VariableField = ({ 
  variable, 
  value, 
  onChange 
}: { 
  variable: any; 
  value: any; 
  onChange: (value: any) => void 
}) => {
  const renderField = () => {
    switch (variable.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.placeholder || `Enter ${variable.name}`}
            data-testid={`variable-input-${variable.name}`}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.placeholder || `Enter ${variable.name}`}
            rows={3}
            data-testid={`variable-textarea-${variable.name}`}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.placeholder || '0'}
            data-testid={`variable-number-${variable.name}`}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            data-testid={`variable-date-${variable.name}`}
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="email@example.com"
            data-testid={`variable-email-${variable.name}`}
          />
        );
      
      case 'phone':
        return (
          <Input
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="+1 (555) 123-4567"
            data-testid={`variable-phone-${variable.name}`}
          />
        );
      
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              step="0.01"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="pl-8"
              placeholder="0.00"
              data-testid={`variable-currency-${variable.name}`}
            />
          </div>
        );
      
      case 'percentage':
        return (
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="100"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="pr-8"
              placeholder="0"
              data-testid={`variable-percentage-${variable.name}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
        );
      
      case 'boolean':
        return (
          <Switch
            checked={value || false}
            onCheckedChange={onChange}
            data-testid={`variable-boolean-${variable.name}`}
          />
        );
      
      case 'list':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger data-testid={`variable-list-${variable.name}`}>
              <SelectValue placeholder={`Select ${variable.name}`} />
            </SelectTrigger>
            <SelectContent>
              {variable.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${variable.name}`}
            data-testid={`variable-default-${variable.name}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {variable.name}
        {variable.required && (
          <Badge variant="secondary" className="text-xs">Required</Badge>
        )}
      </Label>
      {variable.description && (
        <p className="text-sm text-muted-foreground">{variable.description}</p>
      )}
      {renderField()}
    </div>
  );
};

export default function DocumentGenerationWizard({
  isOpen,
  onClose,
  onSuccess,
  preselectedTemplate
}: DocumentGenerationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(preselectedTemplate || null);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentCategory, setDocumentCategory] = useState('');
  const [aiOptions, setAiOptions] = useState({
    useAI: false,
    improveContent: false,
    checkCompliance: false,
    generateSummary: false,
    suggestActions: false
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<Document | null>(null);
  const { toast } = useToast();

  // Reset wizard when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(preselectedTemplate ? 1 : 0);
      setSelectedTemplate(preselectedTemplate || null);
      setVariableValues({});
      setDocumentTitle('');
      setDocumentCategory('');
      setAiOptions({
        useAI: false,
        improveContent: false,
        checkCompliance: false,
        generateSummary: false,
        suggestActions: false
      });
      setGeneratedContent('');
      setGeneratedDocument(null);
    }
  }, [isOpen, preselectedTemplate]);

  // Auto-populate document title from template
  useEffect(() => {
    if (selectedTemplate && !documentTitle) {
      const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      setDocumentTitle(`${selectedTemplate.name} - ${today}`);
      setDocumentCategory(selectedTemplate.category || 'Compliance');
    }
  }, [selectedTemplate, documentTitle]);

  // Parse variables from template - handle both structured and simple formats
  const templateVariables = selectedTemplate ? 
    (selectedTemplate.variables || []).map((variable: any) => {
      // Check if variable is already structured
      if (typeof variable === 'object' && variable.name) {
        return variable;
      }
      
      // If it's a simple string, convert to structured format
      const varName = typeof variable === 'string' ? variable : String(variable);
      const lowerName = varName.toLowerCase();
      let type = 'text';
      if (lowerName.includes('email')) type = 'email';
      else if (lowerName.includes('phone')) type = 'phone';
      else if (lowerName.includes('date')) type = 'date';
      else if (lowerName.includes('address')) type = 'textarea';
      else if (lowerName.includes('description') || lowerName.includes('details')) type = 'textarea';
      else if (lowerName.includes('amount') || lowerName.includes('price')) type = 'currency';
      else if (lowerName.includes('percent') || lowerName.includes('rate')) type = 'percentage';
      else if (lowerName.includes('number') || lowerName.includes('count')) type = 'number';
      
      return {
        name: varName,
        type,
        required: true,
        description: '',
        placeholder: `Enter ${varName}`
      };
    }) : [];

  // Generate document content
  const generateDocument = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    try {
      let content = selectedTemplate.content;
      
      // Replace variables with values
      Object.entries(variableValues).forEach(([key, value]) => {
        const regex = new RegExp(`\\[${key}\\]`, 'g');
        content = content.replace(regex, value || `[${key}]`);
      });
      
      // Apply AI enhancements if enabled
      if (aiOptions.useAI) {
        const aiResponse = await apiRequest('POST', '/api/ai/generate-from-template', {
          templateContent: content,
          companyInfo: variableValues,
          options: aiOptions
        });
        content = aiResponse.content || content;
      }
      
      setGeneratedContent(content);
      
      // Move to review step
      if (currentStep === 2) {
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save document mutation
  const saveDocumentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/documents', {
        title: documentTitle,
        content: generatedContent,
        category: documentCategory,
        templateId: selectedTemplate?.id,
        status: 'draft'
      });
    },
    onSuccess: (document) => {
      setGeneratedDocument(document);
      setCurrentStep(4);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document created",
        description: `"${document.title}" has been successfully created.`,
      });
      if (onSuccess) {
        onSuccess(document);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save document. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleNext = () => {
    if (currentStep === 0 && !selectedTemplate) {
      toast({
        title: "Template required",
        description: "Please select a template to continue.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 1) {
      // Validate required variables
      const missingRequired = templateVariables
        .filter(v => v.required && !variableValues[v.name])
        .map(v => v.name);
      
      if (missingRequired.length > 0) {
        toast({
          title: "Required fields missing",
          description: `Please fill in: ${missingRequired.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      generateDocument();
      return;
    }
    
    if (currentStep === 3) {
      saveDocumentMutation.mutate();
      return;
    }
    
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Template Selection
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <FileText className="h-12 w-12 mx-auto text-primary mb-3" />
              <h3 className="text-lg font-semibold">Choose a Document Template</h3>
              <p className="text-muted-foreground">
                Select from our library of professional templates
              </p>
            </div>
            
            <TemplateLibrary
              mode="selection"
              onSelectTemplate={(template) => {
                setSelectedTemplate(template);
                handleNext();
              }}
            />
          </div>
        );
      
      case 1: // Variable Filling
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Variable className="h-12 w-12 mx-auto text-primary mb-3" />
              <h3 className="text-lg font-semibold">Fill in Template Variables</h3>
              <p className="text-muted-foreground">
                Provide information to customize your document
              </p>
            </div>
            
            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Document Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-title">Document Title</Label>
                  <Input
                    id="doc-title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Enter document title"
                    data-testid="document-title-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="doc-category">Category</Label>
                  <Select value={documentCategory} onValueChange={setDocumentCategory}>
                    <SelectTrigger id="doc-category" data-testid="document-category-select">
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
              </CardContent>
            </Card>
            
            {/* Variables */}
            {templateVariables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template Variables</CardTitle>
                  <CardDescription>
                    Fill in the following information to customize your document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-6">
                      {templateVariables.map((variable) => (
                        <VariableField
                          key={variable.name}
                          variable={variable}
                          value={variableValues[variable.name]}
                          onChange={(value) => {
                            setVariableValues(prev => ({
                              ...prev,
                              [variable.name]: value
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case 2: // AI Options
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sparkles className="h-12 w-12 mx-auto text-primary mb-3" />
              <h3 className="text-lg font-semibold">AI Enhancement Options</h3>
              <p className="text-muted-foreground">
                Use AI to improve and validate your document
              </p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="use-ai">Enable AI Assistance</Label>
                      <p className="text-sm text-muted-foreground">
                        Use AI to generate and enhance document content
                      </p>
                    </div>
                    <Switch
                      id="use-ai"
                      checked={aiOptions.useAI}
                      onCheckedChange={(checked) => {
                        setAiOptions(prev => ({ ...prev, useAI: checked }));
                      }}
                      data-testid="enable-ai-switch"
                    />
                  </div>
                  
                  {aiOptions.useAI && (
                    <>
                      <Separator />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="improve-content">Improve Content</Label>
                            <p className="text-sm text-muted-foreground">
                              Enhance clarity and professionalism
                            </p>
                          </div>
                          <Switch
                            id="improve-content"
                            checked={aiOptions.improveContent}
                            onCheckedChange={(checked) => {
                              setAiOptions(prev => ({ ...prev, improveContent: checked }));
                            }}
                            data-testid="improve-content-switch"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="check-compliance">Check Compliance</Label>
                            <p className="text-sm text-muted-foreground">
                              Verify regulatory requirements
                            </p>
                          </div>
                          <Switch
                            id="check-compliance"
                            checked={aiOptions.checkCompliance}
                            onCheckedChange={(checked) => {
                              setAiOptions(prev => ({ ...prev, checkCompliance: checked }));
                            }}
                            data-testid="check-compliance-switch"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="generate-summary">Generate Summary</Label>
                            <p className="text-sm text-muted-foreground">
                              Create an executive summary
                            </p>
                          </div>
                          <Switch
                            id="generate-summary"
                            checked={aiOptions.generateSummary}
                            onCheckedChange={(checked) => {
                              setAiOptions(prev => ({ ...prev, generateSummary: checked }));
                            }}
                            data-testid="generate-summary-switch"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="suggest-actions">Suggest Actions</Label>
                            <p className="text-sm text-muted-foreground">
                              Recommend next steps and actions
                            </p>
                          </div>
                          <Switch
                            id="suggest-actions"
                            checked={aiOptions.suggestActions}
                            onCheckedChange={(checked) => {
                              setAiOptions(prev => ({ ...prev, suggestActions: checked }));
                            }}
                            data-testid="suggest-actions-switch"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {aiOptions.useAI && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI Processing</AlertTitle>
                <AlertDescription>
                  AI enhancement may take a few moments. The document will be generated with your selected improvements.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
      
      case 3: // Review
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Eye className="h-12 w-12 mx-auto text-primary mb-3" />
              <h3 className="text-lg font-semibold">Review Your Document</h3>
              <p className="text-muted-foreground">
                Review the generated content before saving
              </p>
            </div>
            
            {isGenerating ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating your document...</p>
                    {aiOptions.useAI && (
                      <p className="text-sm text-muted-foreground">
                        Applying AI enhancements...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{documentTitle}</CardTitle>
                        <CardDescription>
                          Category: {documentCategory} | Template: {selectedTemplate?.name}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Draft</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {generatedContent}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Generated on {new Date().toLocaleString()}
                    </div>
                  </CardFooter>
                </Card>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ready to Save</AlertTitle>
                  <AlertDescription>
                    Your document has been generated successfully. Click "Save Document" to save it to your documents.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        );
      
      case 4: // Complete
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Document Created Successfully!</h3>
              <p className="text-muted-foreground">
                Your document has been saved and is ready for use
              </p>
            </div>
            
            {generatedDocument && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{generatedDocument.title}</CardTitle>
                  <CardDescription>
                    Document ID: #{generatedDocument.id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="secondary">{generatedDocument.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Category</span>
                      <span className="text-sm">{generatedDocument.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm">
                        {new Date(generatedDocument.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" data-testid="view-document-button">
                      <Eye className="h-4 w-4 mr-2" />
                      View Document
                    </Button>
                    <Button variant="outline" data-testid="download-document-button">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}
            
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => {
                  setCurrentStep(0);
                  setSelectedTemplate(null);
                  setVariableValues({});
                  setGeneratedContent('');
                  setGeneratedDocument(null);
                }}
                data-testid="create-another-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Another
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                data-testid="close-wizard-button"
              >
                Close
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Document Generation Wizard</DialogTitle>
          <DialogDescription>
            Create professional documents using templates
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Steps */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        isActive && "bg-primary text-primary-foreground border-primary",
                        isCompleted && "bg-primary/20 text-primary border-primary",
                        !isActive && !isCompleted && "bg-background text-muted-foreground border-muted"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs mt-2 text-center",
                      isActive && "text-primary font-medium",
                      !isActive && "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={cn(
                      "h-[2px] flex-1 mx-2 mt-[-16px] transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
          
          <Progress value={(currentStep / (WIZARD_STEPS.length - 1)) * 100} className="h-2" />
        </div>
        
        {/* Step Content */}
        <ScrollArea className="flex-1 pr-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
        
        {/* Footer Actions */}
        {currentStep < 4 && (
          <DialogFooter className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isGenerating || saveDocumentMutation.isPending}
                  data-testid="wizard-back-button"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isGenerating || saveDocumentMutation.isPending}
                data-testid="wizard-cancel-button"
              >
                Cancel
              </Button>
              {currentStep === 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={!generatedContent || saveDocumentMutation.isPending}
                  data-testid="wizard-save-button"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveDocumentMutation.isPending ? 'Saving...' : 'Save Document'}
                </Button>
              ) : currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 0 && !selectedTemplate) ||
                    (currentStep === 2 && isGenerating)
                  }
                  data-testid="wizard-next-button"
                >
                  {currentStep === 2 ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}