import UnifiedLayout from '@/components/layouts/UnifiedLayout';
import EnhancedDashboard from '@/components/dashboard/EnhancedDashboard';

export default function EnhancedDashboardPage() {
  return (
    <UnifiedLayout pageTitle="Dashboard">
      <EnhancedDashboard />
    </UnifiedLayout>
  );
}
