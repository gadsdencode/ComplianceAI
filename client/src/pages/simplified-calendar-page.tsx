import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Plus, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ComplianceDeadline, Document } from '@/types';

export default function SimplifiedCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  // Fetch calendar data
  const { data: deadlines = [], isLoading: isLoadingDeadlines } = useQuery<ComplianceDeadline[]>({
    queryKey: ['/api/compliance-deadlines'],
  });

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  // Get upcoming deadlines
  const upcomingDeadlines = deadlines
    .filter(deadline => new Date(deadline.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 10);

  // Get overdue deadlines
  const overdueDeadlines = deadlines
    .filter(deadline => new Date(deadline.deadline) < new Date() && deadline.status !== 'completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Calendar generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get deadlines for a specific date
  const getDeadlinesForDate = (date: Date) => {
    return deadlines.filter(deadline => 
      isSameDay(new Date(deadline.deadline), date)
    );
  };

  const getPriorityColor = (deadline: ComplianceDeadline) => {
    const daysUntilDeadline = Math.ceil((new Date(deadline.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntilDeadline <= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysUntilDeadline <= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <DashboardLayout pageTitle="Calendar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
            <p className="text-slate-600">Track deadlines and compliance schedules</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Deadline
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Upcoming</p>
                  <p className="text-2xl font-bold text-slate-900">{upcomingDeadlines.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Overdue</p>
                  <p className="text-2xl font-bold text-slate-900">{overdueDeadlines.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {deadlines.filter(d => d.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayDeadlines = getDeadlinesForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[100px] p-2 border rounded-lg ${
                          isCurrentMonth ? 'bg-white' : 'bg-slate-50'
                        } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                        } ${isTodayDate ? 'text-blue-600' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        
                        <div className="space-y-1">
                          {dayDeadlines.slice(0, 2).map((deadline) => (
                            <div
                              key={deadline.id}
                              className={`text-xs p-1 rounded border ${getPriorityColor(deadline)}`}
                              title={deadline.title}
                            >
                              {deadline.title.length > 15 
                                ? `${deadline.title.substring(0, 15)}...` 
                                : deadline.title}
                            </div>
                          ))}
                          {dayDeadlines.length > 2 && (
                            <div className="text-xs text-slate-500">
                              +{dayDeadlines.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No upcoming deadlines</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((deadline) => {
                      const daysUntilDeadline = Math.ceil((new Date(deadline.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={deadline.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-slate-600" />
                            <div>
                              <h4 className="font-medium text-slate-900">{deadline.title}</h4>
                              <p className="text-sm text-slate-600">
                                Due {format(new Date(deadline.deadline), 'PPP')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {deadline.type}
                            </Badge>
                            <Badge className={getPriorityColor(deadline)}>
                              {daysUntilDeadline === 0 ? 'Today' : 
                               daysUntilDeadline === 1 ? 'Tomorrow' : 
                               `${daysUntilDeadline} days`}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Overdue Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueDeadlines.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                    <p className="text-lg font-medium">No overdue items!</p>
                    <p className="text-sm">All deadlines are on track</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {overdueDeadlines.map((deadline) => {
                      const daysOverdue = Math.ceil((new Date().getTime() - new Date(deadline.deadline).getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={deadline.id} className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <div>
                              <h4 className="font-medium text-slate-900">{deadline.title}</h4>
                              <p className="text-sm text-slate-600">
                                Was due {format(new Date(deadline.deadline), 'PPP')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {deadline.type}
                            </Badge>
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              {daysOverdue} days overdue
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
