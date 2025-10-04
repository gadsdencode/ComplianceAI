import UnifiedLayout from '@/components/layouts/UnifiedLayout';
import MinimalDashboard from '@/components/dashboard/MinimalDashboard';

export default function MinimalDashboardPage() {
  return (
    <UnifiedLayout pageTitle="Dashboard">
      <MinimalDashboard />
    </UnifiedLayout>
  );
}
