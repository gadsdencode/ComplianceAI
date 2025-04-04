import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  EyeIcon, 
  PencilIcon, 
  PlusIcon, 
  CalendarIcon, 
  Clock
} from "lucide-react";
import { ComplianceCalendarItem } from "@/types";

type ComplianceCalendarProps = {
  calendarItems: ComplianceCalendarItem[];
  isLoading?: boolean;
  onViewItem?: (id: number) => void;
  onEditItem?: (id: number) => void;
  onAddItem?: () => void;
};

const getStatusBadge = (status: string) => {
  let color = "";
  let bgColor = "";
  
  switch (status) {
    case "in_progress":
      return <Badge variant="outline" className="bg-warning-100 text-warning-800 border-transparent">In Progress</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-success-100 text-success-800 border-transparent">Completed</Badge>;
    case "not_started":
      return <Badge variant="outline" className="bg-slate-100 text-slate-800 border-transparent">Not Started</Badge>;
    case "overdue":
      return <Badge variant="outline" className="bg-error-100 text-error-800 border-transparent">Overdue</Badge>;
    default:
      return <Badge variant="outline" className="bg-slate-100 text-slate-800 border-transparent">{status}</Badge>;
  }
};

const getDeadlineIcon = (deadline: string) => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);
  
  if (deadlineDate <= now) {
    return <Clock className="text-error-500 mr-1 text-sm" size={16} />;
  } else if (deadlineDate <= threeDaysFromNow) {
    return <Clock className="text-warning-500 mr-1 text-sm" size={16} />;
  } else {
    return <Clock className="text-slate-400 mr-1 text-sm" size={16} />;
  }
};

export default function ComplianceCalendar({ 
  calendarItems, 
  isLoading = false,
  onViewItem,
  onEditItem,
  onAddItem
}: ComplianceCalendarProps) {
  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Compliance Deadlines</h2>
          <div className="animate-pulse flex space-x-2">
            <div className="h-8 bg-slate-200 rounded w-28"></div>
            <div className="h-8 bg-slate-200 rounded w-24"></div>
          </div>
        </div>
        
        <Card className="shadow overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="animate-pulse">
              <div className="h-10 bg-slate-200 rounded w-full mb-4"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded w-full mb-3"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Upcoming Compliance Deadlines</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <CalendarIcon className="h-4 w-4 mr-1" />
            Calendar View
          </Button>
          <Button variant="outline" size="sm" onClick={onAddItem}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Event
          </Button>
        </div>
      </div>
      
      <Card className="shadow overflow-hidden">
        <CardContent className="p-4 sm:p-6 max-w-full overflow-x-auto">
          {calendarItems.length === 0 ? (
            <div className="text-center p-8 text-slate-500">
              <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-medium mb-1">No upcoming deadlines</h3>
              <p className="text-sm mb-4">Your compliance calendar is clear for now.</p>
              <Button onClick={onAddItem}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Compliance Deadline
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Document</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deadline</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assignee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {calendarItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{item.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getDeadlineIcon(item.deadline)}
                        <div className="text-sm text-slate-900">
                          {new Date(item.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{item.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700">
                          {item.assignee.initials}
                        </div>
                        <div className="ml-2 text-sm text-slate-900">{item.assignee.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-primary-600 hover:text-primary-900" onClick={() => onViewItem && onViewItem(item.id)}>
                        <EyeIcon className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 hover:text-slate-900" onClick={() => onEditItem && onEditItem(item.id)}>
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
