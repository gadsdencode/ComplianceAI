import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calendar, CheckSquare, Clock, Eye, FileText } from "lucide-react";
import { PendingDocumentItem, RecentDocumentItem } from "@/types";
import { formatDistanceToNow } from "date-fns";

type DocumentsCardProps = {
  title: string;
  viewAllHref: string;
  children: React.ReactNode;
};

const DocumentsCard = ({ title, viewAllHref, children }: DocumentsCardProps) => (
  <Card className="shadow h-full">
    <CardHeader className="p-4 border-b border-slate-200 flex flex-row items-center justify-between">
      <CardTitle className="text-base font-medium">{title}</CardTitle>
      <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-700 p-0" asChild>
        <a href={viewAllHref}>View All</a>
      </Button>
    </CardHeader>
    <CardContent className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
      {children}
    </CardContent>
  </Card>
);

type StatusBadgeProps = {
  status: string;
  label?: string;
};

const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  let color = "";
  let bgColor = "";
  const displayLabel = label || status.replace("_", " ");
  
  switch (status) {
    case "pending_approval":
    case "Signature Required":
    case "In Review":
      color = "text-warning-800";
      bgColor = "bg-warning-100";
      break;
    case "active":
    case "Active":
      color = "text-success-800";
      bgColor = "bg-success-100";
      break;
    case "urgent":
    case "Urgent":
      color = "text-error-800";
      bgColor = "bg-error-100";
      break;
    default:
      color = "text-slate-800";
      bgColor = "bg-slate-100";
  }

  return (
    <Badge variant="outline" className={`${bgColor} ${color} border-transparent`}>
      {displayLabel}
    </Badge>
  );
};

type DocumentsSectionProps = {
  pendingDocuments: PendingDocumentItem[];
  recentDocuments: RecentDocumentItem[];
  isLoading?: boolean;
};

export default function DocumentsSection({ 
  pendingDocuments, 
  recentDocuments, 
  isLoading = false 
}: DocumentsSectionProps) {
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="shadow">
            <CardHeader className="p-4 border-b border-slate-200">
              <div className="animate-pulse h-5 bg-slate-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="animate-pulse border border-slate-200 rounded-md p-4">
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                    </div>
                    <div className="h-3 bg-slate-200 rounded w-1/4 mt-2"></div>
                    <div className="flex justify-end mt-3 space-x-2">
                      <div className="h-8 bg-slate-200 rounded w-16"></div>
                      <div className="h-8 bg-slate-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "sign": return <AlertCircle className="text-warning-500 mr-1" size={16} />;
      case "review": return <AlertCircle className="text-error-500 mr-1" size={16} />;
      case "approve": return <CheckSquare className="text-slate-400 mr-1" size={16} />;
      default: return <FileText className="text-slate-400 mr-1" size={16} />;
    }
  };

  // View all documents handler
  const handleViewAll = () => {
    navigate('/document-repository');
  };

  // Handle document click - different navigation for user vs compliance documents
  const handleDocumentClick = (doc: any) => {
    if (doc.isUserDocument) {
      navigate('/document-repository'); // Navigate to document management workspace
    } else {
      navigate(`/documents/${doc.id}`); // Navigate to compliance document detail
    }
  };

  return (
    <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pending Action Documents */}
      <DocumentsCard title="Documents Requiring Action" viewAllHref="/document-repository?filter=pending">
        {pendingDocuments.length === 0 ? (
          <div className="text-center p-6 text-slate-500">
            <CheckSquare className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p>No documents require your action</p>
          </div>
        ) : (
          pendingDocuments.map((doc) => (
            <div key={doc.id} className="border border-slate-200 rounded-md p-4 mb-3 hover:bg-slate-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    {getActionIcon(doc.actionType)}
                    <h4 className="font-medium text-slate-800">{doc.title}</h4>
                  </div>
                  {doc.deadline && (
                    <p className="text-xs text-slate-500 mt-1">
                      Requires {doc.actionType} by {new Date(doc.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <StatusBadge 
                  status={doc.actionType === "sign" ? "Signature Required" : 
                          doc.actionType === "review" ? "Urgent" : "Pending Approval"} 
                />
              </div>
              <div className="mt-3 flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className="px-3 py-1 h-auto text-xs" 
                  onClick={() => navigate(`/document-repository/${doc.id}`)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button 
                  size="sm"
                  className="px-3 py-1 h-auto text-xs"
                  onClick={() => navigate(`/document-repository/${doc.id}?action=${doc.actionType}`)}
                >
                  {doc.actionType === "sign" ? "Sign" : 
                   doc.actionType === "review" ? "Review" : "Approve"}
                </Button>
              </div>
            </div>
          ))
        )}
      </DocumentsCard>
      
      {/* Recent Documents */}
      <DocumentsCard title="Recently Updated Documents" viewAllHref="/document-repository">
        {recentDocuments.length === 0 ? (
          <div className="text-center p-6 text-slate-500">
            <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p>No recent documents</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Document</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Updated</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentDocuments.map((doc) => (
                <tr key={`${doc.isUserDocument ? 'user' : 'compliance'}-${doc.id}`} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleDocumentClick(doc)}>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="text-slate-400 mr-2 text-lg" size={18} />
                      <span className="text-sm font-medium text-slate-700">{doc.title}</span>
                      {doc.isUserDocument && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          User Doc
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-500">
                    {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <StatusBadge status={doc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DocumentsCard>
    </section>
  );
}
