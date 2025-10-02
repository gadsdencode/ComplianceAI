import DashboardLayout from '@/components/layouts/DashboardLayout';
import SimplifiedDashboard from '@/components/dashboard/SimplifiedDashboard';

export default function SimplifiedDashboardPage() {
  return (
    <DashboardLayout pageTitle="Dashboard">
      <SimplifiedDashboard />
    </DashboardLayout>
  );
}
