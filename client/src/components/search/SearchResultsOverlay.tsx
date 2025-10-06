import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Sparkles, 
  BarChart3, 
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSearchContext, useSearchResults, useSearchActions } from '@/stores/searchStore';
import { useSearchAnalytics } from '@/hooks/use-search';
import { formatDistanceToNow } from 'date-fns';

interface SearchResultsOverlayProps {
  className?: string;
  onResultClick?: (result: any) => void;
  onClose?: () => void;
}

// Animation variants
const overlayVariants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

// Status configuration for documents
const statusConfig = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-800", icon: FileText },
  pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  active: { label: "Active", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  expired: { label: "Expired", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-800", icon: FileText }
};

// Deadline status configuration
const deadlineStatusConfig = {
  not_started: { label: "Not Started", color: "bg-slate-100 text-slate-800" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800" }
};

export default function SearchResultsOverlay({ 
  className,
  onResultClick,
  onClose
}: SearchResultsOverlayProps) {
  const searchContext = useSearchContext();
  const searchResults = useSearchResults();
  const { clearSearch } = useSearchActions();
  const analytics = useSearchAnalytics();

  // Don't render if no search query
  if (!searchContext.query || searchContext.query.length < 2) {
    return null;
  }

  const handleClose = () => {
    clearSearch();
    onClose?.();
  };

  const handleResultClick = (result: any, type: string) => {
    onResultClick?.({ ...result, type });
  };

  return (
    <AnimatePresence>
      <motion.div
        className={cn("w-full max-w-6xl mx-auto", className)}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Search Context Header */}
        <motion.div
          className="mb-6"
          variants={cardVariants}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-semibold text-slate-800">
                      Search Results for "{searchContext.query}"
                    </span>
                  </div>
                  
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {searchContext.totalMatches} total results
                  </Badge>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search Performance Metrics */}
              <div className="mt-4 flex items-center space-x-6 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{searchResults.searchTime}ms search time</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className={cn(
                    analytics.searchEfficiency === 'fast' && "text-green-600",
                    analytics.searchEfficiency === 'medium' && "text-yellow-600",
                    analytics.searchEfficiency === 'slow' && "text-red-600"
                  )}>
                    {analytics.searchEfficiency} search
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Filter className="h-4 w-4" />
                  <span>Scope: {searchContext.searchScope}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Documents Results */}
          {searchResults.documents.length > 0 && (
            <motion.div variants={cardVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Documents</span>
                    <Badge variant="secondary" className="ml-auto">
                      {searchResults.documents.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {searchResults.documents.slice(0, 5).map((doc, index) => {
                    const statusInfo = statusConfig[doc.status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo?.icon || FileText;
                    
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                        onClick={() => handleResultClick(doc, 'document')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 truncate group-hover:text-blue-700">
                              {doc.title}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                              Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-3">
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", statusInfo?.color)}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo?.label}
                            </Badge>
                            
                            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {searchResults.documents.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        View {searchResults.documents.length - 5} more documents
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* User Documents Results */}
          {searchResults.userDocuments.length > 0 && (
            <motion.div variants={cardVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>User Documents</span>
                    <Badge variant="secondary" className="ml-auto">
                      {searchResults.userDocuments.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {searchResults.userDocuments.slice(0, 5).map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50/50 transition-all cursor-pointer group"
                      onClick={() => handleResultClick(doc, 'userDocument')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 truncate group-hover:text-green-700">
                            {doc.title}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">
                            {doc.category && (
                              <span className="inline-block mr-2">
                                {doc.category}
                              </span>
                            )}
                            Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                          </p>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-green-500 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                  
                  {searchResults.userDocuments.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" className="text-green-600">
                        View {searchResults.userDocuments.length - 5} more user documents
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Deadlines Results */}
          {searchResults.deadlines.length > 0 && (
            <motion.div variants={cardVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span>Deadlines</span>
                    <Badge variant="secondary" className="ml-auto">
                      {searchResults.deadlines.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {searchResults.deadlines.slice(0, 5).map((deadline, index) => {
                    const statusInfo = deadlineStatusConfig[deadline.status as keyof typeof deadlineStatusConfig];
                    const isOverdue = new Date(deadline.deadline) < new Date() && deadline.status !== 'completed';
                    
                    return (
                      <motion.div
                        key={deadline.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "p-3 rounded-lg border transition-all cursor-pointer group",
                          isOverdue 
                            ? "border-red-200 hover:border-red-300 hover:bg-red-50/50" 
                            : "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
                        )}
                        onClick={() => handleResultClick(deadline, 'deadline')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              "font-medium truncate",
                              isOverdue 
                                ? "text-red-900 group-hover:text-red-700" 
                                : "text-slate-900 group-hover:text-purple-700"
                            )}>
                              {deadline.title}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                              Due {formatDistanceToNow(new Date(deadline.deadline), { addSuffix: true })}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-3">
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs",
                                statusInfo?.color,
                                isOverdue && "bg-red-100 text-red-800"
                              )}
                            >
                              {isOverdue ? "Overdue" : statusInfo?.label}
                            </Badge>
                            
                            <ArrowRight className={cn(
                              "h-4 w-4 transition-colors",
                              isOverdue 
                                ? "text-slate-400 group-hover:text-red-500" 
                                : "text-slate-400 group-hover:text-purple-500"
                            )} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {searchResults.deadlines.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" className="text-purple-600">
                        View {searchResults.deadlines.length - 5} more deadlines
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Insights Results */}
          {searchResults.insights.length > 0 && (
            <motion.div variants={cardVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Sparkles className="h-5 w-5 text-pink-600" />
                    <span>AI Insights</span>
                    <Badge variant="secondary" className="ml-auto">
                      {searchResults.insights.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {searchResults.insights.slice(0, 3).map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 rounded-lg border border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 transition-all cursor-pointer group"
                      onClick={() => handleResultClick(insight, 'insight')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 truncate group-hover:text-pink-700">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {insight.description}
                          </p>
                          
                          <div className="mt-2 flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-pink-500 rounded-full" />
                              <span className="text-xs text-slate-500 capitalize">
                                {insight.type}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-500">
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-pink-500 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Analytics Summary */}
          {searchResults.analytics && (
            <motion.div variants={cardVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span>Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div variants={statVariants}>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Compliance Rate</span>
                        <span className="font-medium">
                          {searchResults.analytics.filteredStats.complianceRate}%
                        </span>
                      </div>
                      <Progress 
                        value={searchResults.analytics.filteredStats.complianceRate} 
                        className="h-2"
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div variants={statVariants} className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">
                        {searchResults.analytics.filteredStats.documents}
                      </div>
                      <div className="text-xs text-slate-500">Total Documents</div>
                    </div>
                    
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">
                        {searchResults.analytics.filteredStats.pending}
                      </div>
                      <div className="text-xs text-slate-500">Pending</div>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={statVariants}>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        {searchResults.analytics.filteredStats.lastMonthComplianceChange} 
                        <span className="ml-1">vs last month</span>
                      </div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* No Results State */}
        {searchContext.totalMatches === 0 && (
          <motion.div
            className="text-center py-12"
            variants={cardVariants}
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No results found
                </h3>
                <p className="text-slate-500 mb-4">
                  Try adjusting your search terms or expanding your search scope.
                </p>
                <Button variant="outline" onClick={handleClose}>
                  Clear search
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
