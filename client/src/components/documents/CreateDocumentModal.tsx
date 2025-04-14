import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Template } from "@/types";
import { FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type CreateDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  isLoadingTemplates?: boolean;
};

export default function CreateDocumentModal({
  isOpen,
  onClose,
  templates,
  isLoadingTemplates = false
}: CreateDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [aiOptions, setAIOptions] = useState({
    autoPopulate: true,
    suggestImprovements: false,
    flagIssues: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setTitle("");
      setSelectedTemplateId(null);
      setAIOptions({
        autoPopulate: true,
        suggestImprovements: false,
        flagIssues: true
      });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a document title",
        variant: "destructive"
      });
      return;
    }

    if (selectedTemplateId === null) {
      toast({
        title: "Missing information",
        description: "Please select a template",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First get the template content with AI generation if auto-populate is enabled
      let content = "";
      if (aiOptions.autoPopulate) {
        const aiResponse = await apiRequest("POST", "/api/ai/generate-from-template", {
          templateId: selectedTemplateId,
          companyInfo: {
            name: "Your Company Name" // Would be pulled from actual company settings
          }
        });
        const aiData = await aiResponse.json();
        content = aiData.content;
      } else {
        // Get raw template content
        const templateResponse = await apiRequest("GET", `/api/templates/${selectedTemplateId}`);
        const templateData = await templateResponse.json();
        content = templateData.content;
      }

      // Create the document
      const response = await apiRequest("POST", "/api/documents", {
        title,
        content,
        status: "draft",
        templateId: selectedTemplateId
      });

      if (!response.ok) {
        throw new Error("Failed to create document");
      }

      const newDocument = await response.json();

      // Invalidate documents cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });

      toast({
        title: "Document created",
        description: `"${title}" has been created successfully.`
      });

      onClose();
    } catch (error: any) {
      console.error("Error creating document:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create document",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Create New Document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="documentTitle" className="block text-sm font-medium text-slate-700 mb-1">
              Document Title
            </Label>
            <Input
              id="documentTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1">
              Template
            </Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {isLoadingTemplates ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="border border-slate-200 rounded-md p-3 h-12 animate-pulse bg-slate-100"></div>
                ))
              ) : (
                <>
                  {templates.map((template) => (
                    <div 
                      key={template.id}
                      className={cn(
                        "border rounded-md p-3 hover:border-primary-500 cursor-pointer",
                        selectedTemplateId === template.id 
                          ? "border-primary-500 bg-primary-50" 
                          : "border-slate-200"
                      )}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className="flex items-center">
                        <FileText className="text-slate-400 mr-2" size={16} />
                        <span className="text-sm font-medium text-slate-700">{template.name}</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border border-dashed border-slate-300 rounded-md p-3 hover:border-primary-500 cursor-pointer flex items-center justify-center text-sm text-slate-500">
                    <Plus className="mr-1" size={16} />
                    Custom Template
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1">
              AI Assistance Options
            </Label>
            <div className="space-y-2 mt-1">
              <div className="flex items-center">
                <Checkbox 
                  id="aiOption1" 
                  checked={aiOptions.autoPopulate}
                  onCheckedChange={(checked) => setAIOptions({...aiOptions, autoPopulate: checked === true})}
                />
                <Label htmlFor="aiOption1" className="ml-2 block text-sm text-slate-700">
                  Auto-populate with company information
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="aiOption2"
                  checked={aiOptions.suggestImprovements}
                  onCheckedChange={(checked) => setAIOptions({...aiOptions, suggestImprovements: checked === true})}
                />
                <Label htmlFor="aiOption2" className="ml-2 block text-sm text-slate-700">
                  Suggest improvements based on industry standards
                </Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="aiOption3"
                  checked={aiOptions.flagIssues}
                  onCheckedChange={(checked) => setAIOptions({...aiOptions, flagIssues: checked === true})}
                />
                <Label htmlFor="aiOption3" className="ml-2 block text-sm text-slate-700">
                  Flag potential compliance issues
                </Label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-5 border-t border-slate-200 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
