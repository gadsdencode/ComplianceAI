import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SearchCommandCenter from '@/components/search/SearchCommandCenter';
import SearchResultsOverlay from '@/components/search/SearchResultsOverlay';
import { SearchResultsProvider, useSearchContext } from '@/components/search/SearchResultsProvider';
import { useSearchFilteredStats } from '@/hooks/use-search';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  Sparkles,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Search-driven stats component
function SearchDrivenStats() {
  const { query, isActive } = useSearchContext();
  const { stats, isLoading } = useSearchFilteredStats(query);

  const statCards = [
    {
      title: "Total Documents",
      value: stats?.documents || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Pending Review",
      value: stats?.pending || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      title: "Compliance Rate",
      value: `${stats?.complianceRate || 0}%`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Urgent Items",
      value: stats?.urgentCount || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <motion.div
            key={stat.title}
            variants={cardVariants}
            className={cn(
              "transition-all duration-300",
              isActive && "opacity-80 scale-95"
            )}
          >
            <Card className={cn(
              "h-full border-2 transition-all duration-300",
              stat.borderColor,
              isActive && "shadow-lg"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {stat.title}
                    </p>
                    <p className={cn("text-2xl font-bold", stat.color)}>
                      {stat.value}
                    </p>
                  </div>
                  
                  <div className={cn(
                    "p-3 rounded-full",
                    stat.bgColor
                  )}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
                
                {stat.title === "Compliance Rate" && (
                  <div className="mt-4">
                    <Progress 
                      value={stats?.complianceRate || 0} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Search insights component
function SearchInsights() {
  const { searchResults, isActive } = useSearchContext();

  const insights = searchResults.insights || [];

  if (!isActive || insights.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Sparkles className="h-5 w-5" />
            <span>AI Insights</span>
            <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-800">
              {insights.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/70 rounded-lg border border-purple-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-slate-600 mb-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant="outline" 
                        className="text-xs border-purple-300 text-purple-700"
                      >
                        {insight.type}
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-slate-500">
                        <TrendingUp className="h-3 w-3" />
                        <span>{Math.round(insight.confidence * 100)}% confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Search context indicator
function SearchContextIndicator() {
  const { query, searchResults, isActive } = useSearchContext();

  if (!isActive) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-800">
                  Search Active
                </span>
              </div>
              
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                "{query}"
              </Badge>
              
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                {searchResults.totalMatches} results
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-slate-600">
              <span className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>{searchResults.documents.length} docs</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{searchResults.deadlines.length} deadlines</span>
              </span>
              <span className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>{searchResults.insights.length} insights</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main dashboard content component
function SearchCentricDashboardContent() {
  const { isActive, hasResults } = useSearchContext();

  return (
    <div className="space-y-8">
      {/* Search Command Center - The Crown Jewel */}
      <div className="relative">
        <SearchCommandCenter 
          className="mb-8"
          placeholder="Search everything: documents, deadlines, insights, analytics..."
        />
        
        {/* Search Results Overlay */}
        <AnimatePresence>
          {isActive && hasResults && (
            <SearchResultsOverlay 
              className="mt-6"
              onResultClick={(result) => {
                console.log('Search result clicked:', result);
                // Handle result click - navigate to detail page, etc.
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Search Context Indicator */}
      <SearchContextIndicator />

      {/* Search-Driven Stats */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            Dashboard Overview
          </h2>
          <Badge 
            variant="outline" 
            className={cn(
              "transition-colors",
              isActive 
                ? "border-blue-300 text-blue-700 bg-blue-50" 
                : "border-slate-300 text-slate-600"
            )}
          >
            {isActive ? "Filtered by search" : "All data"}
          </Badge>
        </div>
        
        <SearchDrivenStats />
      </div>

      {/* Search Insights */}
      <SearchInsights />

      {/* Additional dashboard sections can be added here */}
      <motion.div
        className={cn(
          "transition-all duration-500",
          isActive && "opacity-60 scale-98"
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Additional Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              This section would contain additional dashboard components that react to search state.
              When search is active, these components would be visually de-emphasized to draw attention
              to the search results and search-driven stats above.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Main dashboard page component
export default function SearchCentricDashboardPage() {
  return (
    <SearchResultsProvider>
      <DashboardLayout 
        pageTitle="Search-Centric Dashboard" 
        notificationCount={0}
      >
        <SearchCentricDashboardContent />
      </DashboardLayout>
    </SearchResultsProvider>
  );
}
