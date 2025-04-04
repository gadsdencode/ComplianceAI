import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Info, User, Clock } from 'lucide-react';
import { AuditTrail } from '@/types';
import { format } from 'date-fns';

interface AuditTrailTableProps {
  auditTrail: AuditTrail[];
  isLoading: boolean;
}

export default function AuditTrailTable({ auditTrail, isLoading }: AuditTrailTableProps) {
  const getActionBadge = (action: string) => {
    let color = "";
    let label = action.replace(/_/g, ' ').toLowerCase();
    label = label.charAt(0).toUpperCase() + label.slice(1);
    
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
        return <Badge variant="outline">{label}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-full"></div>
            <div className="h-20 bg-slate-200 rounded w-full"></div>
            <div className="h-20 bg-slate-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckSquare className="mr-2 h-5 w-5" />
          Document Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auditTrail.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditTrail.map((entry) => (
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
                  <TableCell>{getActionBadge(entry.action)}</TableCell>
                  <TableCell>{entry.details || 'No details'}</TableCell>
                  <TableCell>{entry.ipAddress || 'Not recorded'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-6 border rounded-md bg-slate-50">
            <CheckSquare className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium mb-1">No audit trail</h3>
            <p className="text-slate-500">No activity has been recorded for this document yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
