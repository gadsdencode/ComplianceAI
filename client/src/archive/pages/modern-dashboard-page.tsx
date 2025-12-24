import { useLocation } from 'wouter';
import ModernLayout from '@/components/layouts/ModernLayout';
import ModernDashboard from '@/components/dashboard/ModernDashboard';
import { Button } from '@/components/ui/button';
import { Calendar, BarChart3 } from 'lucide-react';

export default function ModernDashboardPage() {
  const [, setLocation] = useLocation();

  const handleViewCalendar = () => {
    setLocation('/calendar');
  };

  const handleViewAnalytics = () => {
    setLocation('/analytics');
  };

  return (
    <ModernLayout 
      pageTitle="Dashboard"
      breadcrumbs={[
        { label: "Dashboard" }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleViewCalendar}>
            <Calendar size={16} className="mr-2" />
            View Calendar
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewAnalytics}>
            <BarChart3 size={16} className="mr-2" />
            Analytics
          </Button>
        </div>
      }
    >
      <ModernDashboard />
    </ModernLayout>
  );
}

