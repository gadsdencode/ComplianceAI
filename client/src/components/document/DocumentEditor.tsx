import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, FileText, Eye, X, Loader2 } from 'lucide-react';
import DocumentDetail from './DocumentDetail';

interface DocumentEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function DocumentEditor({ 
  content, 
  onSave, 
  onCancel,
  isSaving
}: DocumentEditorProps) {
  const [editableContent, setEditableContent] = useState(content || '');
  const [activeTab, setActiveTab] = useState('edit');


  // Update content when prop changes
  useEffect(() => {
    setEditableContent(content || '');
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
  };

  const handleSave = () => {
    onSave(editableContent);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="edit">
              <FileText className="h-4 w-4 mr-1" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
        
        <TabsContent value="edit" className="mt-4">
          <Card className="shadow">
            <CardContent className="p-0">
              <Textarea
                value={editableContent}
                onChange={handleContentChange}
                className="w-full min-h-[500px] font-mono text-sm p-4 border-0 focus-visible:ring-0 resize-none"
                placeholder={editableContent ? "Enter document content here..." : "Start typing your document content here...\n\nYou can use Markdown formatting:\n\n# Heading 1\n## Heading 2\n### Heading 3\n\n**Bold text**\n*Italic text*\n\n- Bullet point 1\n- Bullet point 2\n\n1. Numbered item 1\n2. Numbered item 2\n\n[Link text](https://example.com)\n\n```\nCode block\n```"}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <Card className="shadow">
            <CardContent className="p-6">
              <DocumentDetail content={editableContent} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
