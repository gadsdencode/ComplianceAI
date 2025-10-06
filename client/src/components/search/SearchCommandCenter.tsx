import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Command, 
  Filter, 
  Clock, 
  TrendingUp,
  FileText,
  Calendar,
  BarChart3,
  Sparkles,
  Loader2,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useGlobalSearch, useSearchKeyboardShortcuts } from '@/hooks/use-search';
import { useSearchStore, useSearchScope } from '@/stores/searchStore';
import { SearchSuggestion } from '@/stores/searchStore';

interface SearchCommandCenterProps {
  className?: string;
  placeholder?: string;
  onSearchResultSelect?: (result: any) => void;
}

// Animation variants for the search command center
const searchContainerVariants = {
  idle: {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    borderColor: "rgb(226, 232, 240)"
  },
  focused: {
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    borderColor: "rgb(59, 130, 246)"
  },
  searching: {
    scale: 1.01,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    borderColor: "rgb(99, 102, 241)"
  }
};

const searchInputVariants = {
  idle: { 
    scale: 1,
    opacity: 1
  },
  focused: { 
    scale: 1.01,
    opacity: 1
  },
  searching: { 
    scale: 1,
    opacity: 0.8
  }
};

const suggestionVariants = {
  hidden: { 
    opacity: 0, 
    y: -10,
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
  },
  exit: { 
    opacity: 0, 
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

// Search scope options
const searchScopes = [
  { id: 'all', label: 'Everything', icon: Search, color: 'bg-blue-100 text-blue-800' },
  { id: 'documents', label: 'Documents', icon: FileText, color: 'bg-green-100 text-green-800' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'bg-purple-100 text-purple-800' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'bg-orange-100 text-orange-800' },
  { id: 'insights', label: 'Insights', icon: Sparkles, color: 'bg-pink-100 text-pink-800' }
] as const;

export default function SearchCommandCenter({ 
  className,
  placeholder = "Search everything: documents, deadlines, insights...",
  onSearchResultSelect
}: SearchCommandCenterProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  
  // Search state and actions
  const { 
    query, 
    isSearching, 
    searchResults, 
    searchContext,
    suggestions,
    handleSearch, 
    handleClearSearch,
    handleSearchScopeChange,
    hasResults,
    isEmpty,
    isActive
  } = useGlobalSearch();
  
  const searchScope = useSearchScope();
  const { focusSearch } = useSearchKeyboardShortcuts();
  const [activeTab, setActiveTab] = useState<'recent' | 'actions'>('recent');
  
  // Focus management
  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus();
    }
  }, [isFocused]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleSearch(value);
    setSelectedSuggestionIndex(-1);
  }, [handleSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const shouldShowSuggestions = isFocused && suggestions.length > 0;
    if (!shouldShowSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClearSearch();
        inputRef.current?.blur();
        break;
    }
  }, [isFocused, suggestions, selectedSuggestionIndex, handleClearSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    handleSearch(suggestion.text);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  }, [handleSearch]);

  // Handle scope change
  const handleScopeChange = useCallback((scope: string) => {
    handleSearchScopeChange(scope);
  }, [handleSearchScopeChange]);

  // Get current animation state
  const getAnimationState = () => {
    if (isSearching) return 'searching';
    if (isFocused) return 'focused';
    return 'idle';
  };

  // Fetch recent documents when focused and query is short
  const { data: recentDocuments = [], isLoading: isLoadingRecent } = useQuery<any[]>({
    queryKey: ['/api/documents/recent'],
    queryFn: async () => {
      const res = await fetch('/api/documents/recent', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch recent documents');
      return res.json();
    },
    enabled: isFocused && query.trim().length < 2,
    staleTime: 5 * 60 * 1000
  });

  // Quick actions similar to EnhancedDocumentSearch
  const quickActions = [
    {
      id: 'create-document',
      title: 'Create Document',
      description: 'Start a new compliance document',
      icon: ArrowRight,
      action: () => navigate('/documents/new')
    },
    {
      id: 'view-documents',
      title: 'View All Documents',
      description: 'Browse all documents in the system',
      icon: FileText,
      action: () => navigate('/documents')
    },
    {
      id: 'calendar',
      title: 'Compliance Calendar',
      description: 'View upcoming deadlines and events',
      icon: Calendar,
      action: () => navigate('/calendar')
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'View compliance metrics and reports',
      icon: BarChart3,
      action: () => navigate('/analytics')
    }
  ];

  return (
    <div className={cn("relative w-full max-w-4xl mx-auto", className)}>
      {/* Main Search Container */}
      <motion.div
        className={cn(
          "relative bg-white/95 backdrop-blur-sm border-2 rounded-2xl shadow-lg",
          "transition-all duration-300 ease-out",
          "min-h-[72px] sm:min-h-[80px] p-4 sm:p-6"
        )}
        variants={searchContainerVariants}
        animate={getAnimationState()}
        initial="idle"
      >
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
          <div className="relative flex-1">
            <motion.div
              className="relative"
              variants={searchInputVariants}
              animate={getAnimationState()}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              
              <Input
                ref={inputRef}
                data-search-input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                  // Check if the blur is caused by clicking within the dropdown
                  const dropdownElement = document.querySelector('[data-search-dropdown]');
                  if (dropdownElement && dropdownElement.contains(e.relatedTarget as Node)) {
                    return; // Don't close if clicking within dropdown
                  }
                  // Delay blur to allow suggestion clicks
                  setTimeout(() => setIsFocused(false), 150);
                }}
                className={cn(
                  "pl-10 pr-10 sm:pl-12 sm:pr-12 py-3 sm:py-4 text-base sm:text-lg border-0 bg-transparent",
                  "focus:ring-0 focus:outline-none",
                  "placeholder:text-slate-400"
                )}
              />
              
              {/* Loading indicator */}
              <AnimatePresence>
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  >
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Clear button */}
              <AnimatePresence>
                {query && !isSearching && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* Search Scope Selector */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2">
            {searchScopes.map((scope) => {
              const Icon = scope.icon;
              const isActive = searchScope === scope.id;
              
              return (
                <motion.button
                  key={scope.id}
                  onClick={() => handleScopeChange(scope.id)}
                  className={cn(
                    "flex items-center space-x-2 px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                    isActive 
                      ? `${scope.color} shadow-sm` 
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{scope.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Search Results Summary */}
        <AnimatePresence>
          {isActive && hasResults && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 pt-4 border-t border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {searchResults.totalMatches} results
                  </Badge>
                  
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    {searchContext.categoryBreakdown.documents > 0 && (
                      <span className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{searchContext.categoryBreakdown.documents} docs</span>
                      </span>
                    )}
                    {searchContext.categoryBreakdown.deadlines > 0 && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{searchContext.categoryBreakdown.deadlines} deadlines</span>
                      </span>
                    )}
                    {searchContext.categoryBreakdown.insights > 0 && (
                      <span className="flex items-center space-x-1">
                        <Sparkles className="h-3 w-3" />
                        <span>{searchContext.categoryBreakdown.insights} insights</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{searchResults.searchTime}ms</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Search Dropdown with Tabs: Recent Documents | Quick Actions | Suggestions */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={suggestionVariants}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm" data-search-dropdown>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <div className="flex items-center justify-between px-3 pt-2">
                    <TabsList>
                      <TabsTrigger value="recent">Recent</TabsTrigger>
                      <TabsTrigger value="actions">Quick Actions</TabsTrigger>
                      {suggestions.length > 0 && (
                        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                      )}
                    </TabsList>
                  </div>

                  <TabsContent value="recent">
                    <div className="px-2 pb-2">
                      {query.trim().length >= 2 ? (
                        <div className="text-xs text-slate-500 px-2 py-2">Type less than 2 chars to see recent documents</div>
                      ) : isLoadingRecent ? (
                        <div className="text-sm text-slate-500 px-2 py-2 flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading recent documents...</div>
                      ) : recentDocuments.length === 0 ? (
                        <div className="text-sm text-slate-500 px-2 py-2">No recent documents</div>
                      ) : (
                        <div className="space-y-1">
                          {recentDocuments.map((doc: any) => (
                            <button
                              key={doc.id}
                              onClick={() => navigate(`/documents/${doc.id}`)}
                              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left hover:bg-slate-50 transition-colors"
                            >
                              <FileText className="h-4 w-4 text-slate-400" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate">{doc.title}</div>
                                <div className="text-xs text-slate-500">Updated {new Date(doc.updatedAt).toLocaleDateString()}</div>
                              </div>
                              <ArrowRight className="h-3 w-3 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="actions">
                    <div className="px-2 pb-2 space-y-1">
                      {quickActions.map(action => (
                        <button
                          key={action.id}
                          onClick={action.action}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left hover:bg-slate-50 transition-colors"
                        >
                          <action.icon className="h-4 w-4 text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{action.title}</div>
                            <div className="text-xs text-slate-500">{action.description}</div>
                          </div>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  {suggestions.length > 0 && (
                    <TabsContent value="suggestions">
                      <div className="px-2 pb-2 space-y-1">
                        {suggestions.map((suggestion, index) => (
                          <motion.button
                            key={suggestion.id}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className={cn(
                              "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left",
                              "hover:bg-slate-50 transition-colors",
                              selectedSuggestionIndex === index && "bg-blue-50"
                            )}
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex-shrink-0">
                              {suggestion.type === 'recent' && <Clock className="h-4 w-4 text-slate-400" />}
                              {suggestion.type === 'popular' && <TrendingUp className="h-4 w-4 text-slate-400" />}
                              {suggestion.type === 'autocomplete' && <Zap className="h-4 w-4 text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900 truncate">{suggestion.text}</div>
                              {suggestion.category && (
                                <div className="text-xs text-slate-500">{suggestion.category}</div>
                              )}
                            </div>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                          </motion.button>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Keyboard Shortcut Hint */}
      <AnimatePresence>
        {!isFocused && isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-4 text-center"
          >
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
              <Command className="h-4 w-4" />
              <span>Press</span>
              <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">⌘K</kbd>
              <span>to search</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
