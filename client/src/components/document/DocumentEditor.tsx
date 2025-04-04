import { useState } from 'react';
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
  const [editableContent, setEditableContent] = useState(content);
  const [activeTab, setActiveTab] = useState('edit');

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
  };

  const handleSave = () => {
    onSave(editableContent);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
        </Tabs>
        
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
      
      <Card className="shadow">
        <CardContent className="p-0">
          <TabsContent value="edit" className="m-0">
            <Textarea
              value={editableContent}
              onChange={handleContentChange}
              className="w-full min-h-[500px] font-mono text-sm p-4 border-0 focus-visible:ring-0 resize-none"
              placeholder="Enter document content here..."
            />
          </TabsContent>
          
          <TabsContent value="preview" className="m-0">
            <div className="p-6">
              <DocumentDetail content={editableContent} />
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
}
