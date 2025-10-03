import UnifiedLayout from '@/components/layouts/UnifiedLayout';
import EnhancedDocumentManager from '@/components/documents/EnhancedDocumentManager';

export default function EnhancedDocumentsPage() {
  return (
    <UnifiedLayout pageTitle="Documents">
      <EnhancedDocumentManager />
    </UnifiedLayout>
  );
}
