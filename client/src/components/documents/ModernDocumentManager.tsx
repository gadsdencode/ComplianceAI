import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  Eye,
  Edit3,
  Download,
  Share2,
  Filter,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  FileCheck,
  UserCheck,
  Clock3,
  AlertTriangle,
  CheckSquare,
  BarChart3,
  FolderOpen,
  Upload,
  Trash2,
  Archive,
  Star,
  Tag,
  Calendar,
  User,
  SortAsc,
  SortDesc,
  ChevronDown,
  X,
  Check,
  Copy,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Type definition for document
interface Document {
  id: number;
  title: string;
  content: string;
  status: "draft" | "pending_approval" | "active" | "expired" | "archived";
  templateId?: number;
  version: number;
  createdById: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

interface UserDocument {
  id: number;
  userId: number;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  tags?: string[];
  category?: string;
  starred: boolean;
  status: "draft" | "review" | "approved" | "archived";
  isFolderPlaceholder: boolean;
  createdAt: string;
  updatedAt: string;
}

type AllDocument = Document | UserDocument;

// Real data will be fetched from API endpoints

const statusConfig = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-800", icon: Edit3 },
  pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  active: { label: "Active", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  expired: { label: "Expired", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-800", icon: Archive },
  review: { label: "Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle2 }
};

const priorityConfig = {
  high: { label: "High", color: "bg-red-100 text-red-800" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  low: { label: "Low", color: "bg-green-100 text-green-800" }
};

const categoryConfig = {
  Financial: { color: "bg-blue-100 text-blue-800" },
  Safety: { color: "bg-orange-100 text-orange-800" },
  HR: { color: "bg-purple-100 text-purple-800" },
  Legal: { color: "bg-red-100 text-red-800" },
  IT: { color: "bg-green-100 text-green-800" }
};

export default function ModernDocumentManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("lastModified");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Real API calls - fetch from both compliance documents and user documents
  const { data: complianceDocuments = [], isLoading: isLoadingCompliance } = useQuery<Document[]>({
    queryKey: ['/api/documents', { search: searchQuery, status: selectedStatus, category: selectedCategory, priority: selectedPriority, sortBy, sortOrder }],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: userDocuments = [], isLoading: isLoadingUser } = useQuery<UserDocument[]>({
    queryKey: ['/api/user-documents'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Combine both document types
  const allDocuments = [...complianceDocuments, ...userDocuments];
  const isLoading = isLoadingCompliance || isLoadingUser;

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <config.icon size={16} /> : <FileText size={16} />;
  };

  const getPriorityColor = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return config ? config.color : "bg-slate-100 text-slate-800";
  };

  const getCategoryColor = (category: string) => {
    const config = categoryConfig[category as keyof typeof categoryConfig];
    return config ? config.color : "bg-slate-100 text-slate-800";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  // Document operation functions
  const handleViewDocument = (docId: number) => {
    setLocation(`/documents/${docId}`);
  };

  const handleEditDocument = (docId: number) => {
    setLocation(`/documents/${docId}?mode=edit`);
  };

  const handleDownloadDocument = (docId: number) => {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) {
      toast({
        title: "Download Failed",
        description: "Document not found.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Download Started",
      description: "Your document download has started.",
    });
    
    // Determine if this is a compliance document or user document
    const isUserDocument = userDocuments.some(ud => ud.id === docId);
    const downloadUrl = isUserDocument ? `/api/user-documents/${docId}/download` : `/api/documents/${docId}/download`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${doc.title || 'document'}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareDocument = (docId: number) => {
    const doc = allDocuments.find(d => d.id === docId);
    if (doc && navigator.share) {
      navigator.share({
        title: doc.title || 'Document',
        text: `Check out this document: ${doc.title || 'Untitled'}`,
        url: window.location.origin + `/documents/${docId}`,
      });
    } else {
      // Fallback to clipboard
      const url = window.location.origin + `/documents/${docId}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Document link has been copied to clipboard.",
      });
    }
  };

  const handleDuplicateDocument = (docId: number) => {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) {
      toast({
        title: "Duplicate Failed",
        description: "Document not found.",
        variant: "destructive",
      });
      return;
    }

    // Check if this is a user document (user documents don't have duplicate functionality)
    const isUserDocument = userDocuments.some(ud => ud.id === docId);
    if (isUserDocument) {
      toast({
        title: "Duplicate Not Available",
        description: "User documents cannot be duplicated. Create a new document instead.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to duplicate "${doc.title}"?`)) {
      fetch(`/api/documents/${docId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => {
        if (response.ok) {
          toast({
            title: "Document Duplicated",
            description: `"${doc.title}" has been duplicated successfully.`,
          });
          // Refresh the documents list
          queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        } else {
          throw new Error('Failed to duplicate document');
        }
      })
      .catch(error => {
        toast({
          title: "Duplicate Failed",
          description: `Failed to duplicate "${doc.title}": ${error.message}`,
          variant: "destructive",
        });
      });
    }
  };

  const handleDeleteDocument = (docId: number) => {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) {
      toast({
        title: "Delete Failed",
        description: "Document not found.",
        variant: "destructive",
      });
      return;
    }

    // Check if this is a user document (user documents can be deleted)
    const isUserDocument = userDocuments.some(ud => ud.id === docId);
    
    if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      if (isUserDocument) {
        // Delete user document
        fetch(`/api/user-documents/${docId}`, {
          method: 'DELETE',
        })
        .then(response => {
          if (response.ok) {
            toast({
              title: "Document Deleted",
              description: `"${doc.title}" has been deleted successfully.`,
              variant: "destructive",
            });
            // Refresh the documents list
            queryClient.invalidateQueries({ queryKey: ['/api/user-documents'] });
          } else {
            throw new Error('Failed to delete document');
          }
        })
        .catch(error => {
          toast({
            title: "Delete Failed",
            description: `Failed to delete "${doc.title}": ${error.message}`,
            variant: "destructive",
          });
        });
      } else {
        // Compliance documents cannot be deleted
        toast({
          title: "Delete Not Available",
          description: "Compliance documents cannot be deleted. Consider archiving instead.",
          variant: "destructive",
        });
      }
    }
  };

  const handleArchiveDocument = (docId: number) => {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) {
      toast({
        title: "Archive Failed",
        description: "Document not found.",
        variant: "destructive",
      });
      return;
    }

    // Check if this is a user document (user documents don't have archive functionality)
    const isUserDocument = userDocuments.some(ud => ud.id === docId);
    if (isUserDocument) {
      toast({
        title: "Archive Not Available",
        description: "User documents cannot be archived. Consider deleting instead.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to archive "${doc.title}"?`)) {
      // Update document status to archived
      fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'archived'
        })
      })
      .then(response => {
        if (response.ok) {
          toast({
            title: "Document Archived",
            description: `"${doc.title}" has been archived.`,
          });
          // Refresh the documents list
          queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        } else {
          throw new Error('Failed to archive document');
        }
      })
      .catch(error => {
        toast({
          title: "Archive Failed",
          description: `Failed to archive "${doc.title}": ${error.message}`,
          variant: "destructive",
        });
      });
    }
  };

  // Bulk operations
  const handleBulkDownload = () => {
    if (selectedDocuments.length === 0) return;
    
    toast({
      title: "Bulk Download Started",
      description: `Downloading ${selectedDocuments.length} document(s).`,
    });
    
    // In a real app, this would trigger bulk download
    selectedDocuments.forEach(docId => {
      handleDownloadDocument(docId);
    });
  };

  const handleBulkShare = () => {
    if (selectedDocuments.length === 0) return;
    
    const urls = selectedDocuments.map(docId => 
      window.location.origin + `/documents/${docId}`
    ).join('\n');
    
    navigator.clipboard.writeText(urls);
    toast({
      title: "Links Copied",
      description: `${selectedDocuments.length} document link(s) copied to clipboard.`,
    });
  };

  const handleBulkArchive = () => {
    if (selectedDocuments.length === 0) return;
    
    if (window.confirm(`Are you sure you want to archive ${selectedDocuments.length} document(s)?`)) {
      toast({
        title: "Documents Archived",
        description: `${selectedDocuments.length} document(s) have been archived.`,
      });
      
      selectedDocuments.forEach(docId => {
        handleArchiveDocument(docId);
      });
      
      setSelectedDocuments([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)? This action cannot be undone.`)) {
      toast({
        title: "Documents Deleted",
        description: `${selectedDocuments.length} document(s) have been deleted.`,
        variant: "destructive",
      });
      
      selectedDocuments.forEach(docId => {
        handleDeleteDocument(docId);
      });
      
      setSelectedDocuments([]);
    }
  };

  const handleSelectDocument = (docId: number) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === allDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(allDocuments.map(doc => doc.id));
    }
  };

  const filteredDocuments = allDocuments.filter(doc => {
    // Handle different field names for different document types
    const content = 'content' in doc ? doc.content : ('description' in doc ? doc.description : '');
    
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (doc.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus;
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    // Note: Priority is not in the database schema, so we'll skip priority filtering for now
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600 mt-1">Manage and organize your compliance documents</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Upload size={16} className="mr-2" />
            Upload
          </Button>
          <Button className="bg-primary-600 hover:bg-primary-700">
            <Plus size={16} className="mr-2" />
            Create Document
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search documents, authors, or tags..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-3">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={16} className="mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastModified">Last Modified</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? <SortAsc size={16} /> : <SortDesc size={16} />}
                  </Button>
                  <span className="text-sm text-slate-600">
                    {sortOrder === "asc" ? "Ascending" : "Descending"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-primary-900">
                  {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDocuments([])}>
                  <X size={16} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkShare}>
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                  <Archive size={16} className="mr-2" />
                  Archive
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleBulkDelete}>
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedDocuments.length === allDocuments.length && allDocuments.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-slate-600">
              Select all ({allDocuments.length} documents)
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">
            {filteredDocuments.length} of {allDocuments.length} documents
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 size={16} />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Documents Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const statusInfo = statusConfig[doc.status as keyof typeof statusConfig];
            const categoryInfo = categoryConfig[doc.category as keyof typeof categoryConfig];
            
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={() => handleSelectDocument(doc.id)}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {doc.title}
                        </CardTitle>
        <CardDescription className="mt-1">
          {('version' in doc ? `v${doc.version}` : '')} • {doc.category || 'General'}
        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Star size={16} className={('starred' in doc && doc.starred) ? "fill-yellow-400 text-yellow-400" : ""} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDocument(doc.id)}>
                            <Eye size={16} className="mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDocument(doc.id)}>
                            <Edit3 size={16} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadDocument(doc.id)}>
                            <Download size={16} className="mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                            <Share2 size={16} className="mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDuplicateDocument(doc.id)}>
                            <Copy size={16} className="mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDocument(doc.id)}>
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status and Priority */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={statusInfo?.color || "bg-slate-100 text-slate-800"}>
                      {getStatusIcon(doc.status)}
                      <span className="ml-1">{statusInfo?.label || doc.status}</span>
                    </Badge>
                    <Badge variant="outline" className={categoryInfo?.color || "bg-slate-100 text-slate-800"}>
                      {doc.category || 'General'}
                    </Badge>
                  </div>

                  {/* Created and Updated Date */}
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      <span>Created: {formatDate(doc.createdAt)}</span>
                    </div>
                    <span>Updated: {formatDate(doc.updatedAt)}</span>
                  </div>

                  {/* Expiration Date */}
        {('expiresAt' in doc && doc.expiresAt) && (
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-slate-400" />
            <span className="text-slate-600">Expires: {new Date(doc.expiresAt).toLocaleDateString()}</span>
            {new Date(doc.expiresAt) < new Date() && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                Expired
              </Badge>
            )}
          </div>
        )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDocument(doc.id)}>
                      <Eye size={16} className="mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditDocument(doc.id)}>
                      <Edit3 size={16} className="mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(doc.id)}>
                      <Download size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr className="text-left">
                    <th className="p-4">
                      <Checkbox
                        checked={selectedDocuments.length === allDocuments.length && allDocuments.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4 font-medium text-slate-600">Document</th>
                    <th className="p-4 font-medium text-slate-600">Status</th>
                    <th className="p-4 font-medium text-slate-600">Created By</th>
                    <th className="p-4 font-medium text-slate-600">Last Updated</th>
                    <th className="p-4 font-medium text-slate-600">Category</th>
                    <th className="p-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const statusInfo = statusConfig[doc.status as keyof typeof statusConfig];
                    
                    return (
                      <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <Checkbox
                            checked={selectedDocuments.includes(doc.id)}
                            onCheckedChange={() => handleSelectDocument(doc.id)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <FileText size={20} className="text-slate-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{doc.title}</div>
                              <div className="text-sm text-slate-500">{('version' in doc ? `v${doc.version}` : '')} • {doc.category || 'General'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={statusInfo?.color || "bg-slate-100 text-slate-800"}>
                            {getStatusIcon(doc.status)}
                            <span className="ml-1">{statusInfo?.label || doc.status}</span>
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {('createdById' in doc ? doc.createdById : ('userId' in doc ? doc.userId : 0)).toString().slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">User {('createdById' in doc ? doc.createdById : ('userId' in doc ? doc.userId : 0))}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {formatDate(doc.updatedAt)}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-slate-100 text-slate-800">
                            {doc.category || 'General'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc.id)}>
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditDocument(doc.id)}>
                              <Edit3 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc.id)}>
                              <Download size={16} />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleShareDocument(doc.id)}>
                                  <Share2 size={16} className="mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateDocument(doc.id)}>
                                  <Copy size={16} className="mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDocument(doc.id)}>
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No documents found</h3>
            <p className="text-slate-600 mb-6">
              {searchQuery || selectedStatus !== "all" || selectedCategory !== "all" || selectedPriority !== "all"
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Get started by creating your first document."}
            </p>
            <Button className="bg-primary-600 hover:bg-primary-700">
              <Plus size={16} className="mr-2" />
              Create Document
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

