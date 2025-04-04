import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { DashboardStats } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  footer: {
    label: string;
    value: string | number;
    color?: string;
  };
}

const StatsCard = ({ title, value, icon, iconBgColor, iconColor, footer }: StatsCardProps) => (
  <Card className="shadow">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-semibold">{value}</h3>
        </div>
        <div className={`h-10 w-10 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{footer.label}</span>
          <span className={`font-medium ${footer.color || "text-primary-600"}`}>{footer.value}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

type DashboardOverviewProps = {
  stats: DashboardStats;
  isLoading?: boolean;
};

export default function DashboardOverview({ stats, isLoading = false }: DashboardOverviewProps) {
  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Compliance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow">
              <CardContent className="p-5">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  </div>
                  <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Compliance Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Documents"
          value={stats.documents}
          icon={<FileText size={20} />}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
          footer={{
            label: "Last 30 days",
            value: `+${stats.docsCreatedLastMonth}`,
          }}
        />
        
        <StatsCard
          title="Pending Approval"
          value={stats.pending}
          icon={<Clock size={20} />}
          iconBgColor="bg-warning-100"
          iconColor="text-warning-600"
          footer={{
            label: "Urgent",
            value: stats.urgentCount,
            color: "text-warning-600"
          }}
        />
        
        <StatsCard
          title="Compliance Rate"
          value={`${stats.complianceRate}%`}
          icon={<CheckCircle size={20} />}
          iconBgColor="bg-success-100"
          iconColor="text-success-600"
          footer={{
            label: "Last month",
            value: stats.lastMonthComplianceChange,
            color: "text-success-600"
          }}
        />
        
        <StatsCard
          title="Expiring Soon"
          value={stats.expiringCount}
          icon={<AlertTriangle size={20} />}
          iconBgColor="bg-error-100"
          iconColor="text-error-600"
          footer={{
            label: "Next 7 days",
            value: stats.urgentCount,
            color: "text-error-600"
          }}
        />
      </div>
    </section>
  );
}
