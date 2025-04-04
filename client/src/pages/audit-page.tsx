import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuditTrail, Document } from '@/types';
import { 
  CheckSquare, 
  Search, 
  Download, 
  Clock, 
  FileText, 
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AuditPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  
  // Fetch audit trail records
  const { 
    data: auditTrail,
    isLoading,
    error
  } = useQuery<AuditTrail[]>({
    queryKey: ['/api/documents/1/audit'], // In a real app, this would fetch all audit records
  });

  // Fetch documents for linking
  const {
    data: documents,
    isLoading: isLoadingDocuments
  } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const handleViewDocument = (documentId: number) => {
    navigate(`/documents/${documentId}?tab=audit`);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'DOCUMENT_CREATED':
        return <Badge variant="outline" className="bg-primary-100 text-primary-800 border-transparent">Created</Badge>;
      case 'DOCUMENT_UPDATED':
        return <Badge variant="outline" className="bg-slate-100 text-slate-800 border-transparent">Updated</Badge>;
      case 'DOCUMENT_SIGNED':
        return <Badge variant="outline" className="bg-success-100 text-success-800 border-transparent">Signed</Badge>;
      case 'COMPLIANCE_DEADLINE_CREATED':
        return <Badge variant="outline" className="bg-warning-100 text-warning-800 border-transparent">Deadline Created</Badge>;
      case 'COMPLIANCE_DEADLINE_UPDATED':
        return <Badge variant="outline" className="bg-warning-100 text-warning-800 border-transparent">Deadline Updated</Badge>;
      default:
        return <Badge variant="outline">{action.replace(/_/g, ' ').toLowerCase()}</Badge>;
    }
  };

  // Filter audit trail based on search and filters
  const filteredAuditTrail = auditTrail
    ?.filter(entry => {
      // Search filter
      if (searchQuery && !(
        entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.details && entry.details.toLowerCase().includes(searchQuery.toLowerCase()))
      )) {
        return false;
      }
      
      // Date filter
      if (dateFilter !== 'all') {
        const entryDate = new Date(entry.timestamp);
        const now = new Date();
        
        if (dateFilter === 'today') {
          if (entryDate.getDate() !== now.getDate() || 
              entryDate.getMonth() !== now.getMonth() || 
              entryDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (entryDate < weekAgo) {
            return false;
          }
        } else if (dateFilter === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          if (entryDate < monthAgo) {
            return false;
          }
        }
      }
      
      // Action filter
      if (actionFilter !== 'all' && entry.action !== actionFilter) {
        return false;
      }
      
      return true;
    });

  return (
    <DashboardLayout pageTitle="Audit Trail">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Audit Trail</h1>
        <p className="text-slate-500">View complete chain of custody and compliance activity</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search audit records..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-36">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="DOCUMENT_CREATED">Created</SelectItem>
                  <SelectItem value="DOCUMENT_UPDATED">Updated</SelectItem>
                  <SelectItem value="DOCUMENT_SIGNED">Signed</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <CheckSquare className="mr-2 h-5 w-5" />
            Compliance Audit Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full mr-2" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/6 ml-auto" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center p-6">
              <div className="mx-auto h-12 w-12 text-red-500 mb-4">
                <CheckSquare size={48} />
              </div>
              <h3 className="text-lg font-medium mb-2">Error loading audit trail</h3>
              <p className="text-slate-500 mb-4">{error.message || "Failed to load audit data"}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : filteredAuditTrail && filteredAuditTrail.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuditTrail.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 text-slate-400 mr-1" />
                        {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-3.5 w-3.5 text-slate-400 mr-1" />
                        User ID: {entry.userId}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.documentId ? (
                        <div className="flex items-center">
                          <FileText className="h-3.5 w-3.5 text-slate-400 mr-1" />
                          Document ID: {entry.documentId}
                        </div>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(entry.action)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.details || 'No details provided'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.documentId && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDocument(entry.documentId as number)}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-6">
              <CheckSquare className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No audit records found</h3>
              <p className="text-slate-500">
                {searchQuery || dateFilter !== 'all' || actionFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.' 
                  : 'No activity has been recorded yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
