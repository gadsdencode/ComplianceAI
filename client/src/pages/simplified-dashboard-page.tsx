import SimplifiedLayout from '@/components/layouts/SimplifiedLayout';
import SimplifiedDashboard from '@/components/dashboard/SimplifiedDashboard';

export default function SimplifiedDashboardPage() {
  return (
    <SimplifiedLayout>
      <div className="p-6 pt-20">
        <SimplifiedDashboard />
      </div>
    </SimplifiedLayout>
  );
}