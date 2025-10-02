import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';

interface DocumentDetailProps {
  content: string;
}

export default function DocumentDetail({ content }: DocumentDetailProps) {
  if (!content || content.trim() === '') {
    return (
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="text-center text-slate-500 py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium mb-2">No content available</p>
            <p className="text-sm">This document doesn't have any content yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardContent className="p-6">
        <div className="prose max-w-none prose-slate prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-base prose-a:text-primary-600">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
