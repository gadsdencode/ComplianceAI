import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';

interface DocumentDetailProps {
  content: string;
}

export default function DocumentDetail({ content }: DocumentDetailProps) {
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
