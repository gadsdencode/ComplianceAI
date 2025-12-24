import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  useSearchStore, 
  useSearchActions, 
  useSearchQuery, 
  useIsSearching, 
  useSearchResults, 
  useSearchContext, 
  SearchResults, 
  SearchSuggestion,
  useSetQuery,
  useSetSearching,
  useSetSearchResults,
  useAddToRecentSearches,
  useAddToSearchHistory,
  useClearSearch,
  useSetSearchScope
} from '@/stores/searchStore';
import { Document, ComplianceDeadline, UserDocument, DashboardStats } from '@/types';

// Debounce hook for search queries
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Global search hook that coordinates all search functionality
export function useGlobalSearch() {
  const query = useSearchQuery();
  const isSearching = useIsSearching();
  const searchResults = useSearchResults();
  const searchContext = useSearchContext();
  
  // Use individual action selectors for stable references
  const setQuery = useSetQuery();
  const setSearching = useSetSearching();
  const setSearchResults = useSetSearchResults();
  const addToRecentSearches = useAddToRecentSearches();
  const addToSearchHistory = useAddToSearchHistory();
  const clearSearch = useClearSearch();
  const setSearchScope = useSetSearchScope();
  
  const queryClient = useQueryClient();
  const debouncedQuery = useDebounce(query, 300);

  // Search suggestions hook
  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery<SearchSuggestion[]>({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }
      
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        return [];
      }
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Global search results hook
  const { data: globalSearchResults, isLoading: isLoadingSearch, error: searchError } = useQuery<SearchResults>({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return {
          documents: [],
          userDocuments: [],
          deadlines: [],
          insights: [],
          analytics: {
            filteredStats: {
              documents: 0,
              pending: 0,
              complianceRate: 0,
              expiringCount: 0,
              docsCreatedLastMonth: 0,
              urgentCount: 0,
              lastMonthComplianceChange: '+0%'
            },
            trends: { documentGrowth: [], complianceRate: [], deadlineCompletion: [] },
            insights: []
          },
          totalMatches: 0,
          searchTime: 0,
          lastUpdated: new Date().toISOString()
        };
      }

      const startTime = Date.now();
      
      try {
        // Parallel API calls for comprehensive search
        const [documentsRes, userDocumentsRes, deadlinesRes, statsRes] = await Promise.all([
          fetch(`/api/documents/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`, {
            credentials: 'include'
          }),
          fetch(`/api/user-documents/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`, {
            credentials: 'include'
          }),
          fetch(`/api/compliance-deadlines/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`, {
            credentials: 'include'
          }),
          fetch(`/api/dashboard/stats?search=${encodeURIComponent(debouncedQuery)}`, {
            credentials: 'include'
          })
        ]);

        const [documents, userDocuments, deadlines, stats] = await Promise.all([
          documentsRes.ok ? documentsRes.json() : [],
          userDocumentsRes.ok ? userDocumentsRes.json() : [],
          deadlinesRes.ok ? deadlinesRes.json() : [],
          statsRes.ok ? statsRes.json() : null
        ]);

        const searchTime = Date.now() - startTime;
        const totalMatches = documents.length + userDocuments.length + deadlines.length;

        // Generate insights based on search results
        const insights = generateSearchInsights(debouncedQuery, documents, userDocuments, deadlines, stats);

        return {
          documents,
          userDocuments,
          deadlines,
          insights,
          analytics: {
            filteredStats: stats || {
              documents: 0,
              pending: 0,
              complianceRate: 0,
              expiringCount: 0,
              docsCreatedLastMonth: 0,
              urgentCount: 0,
              lastMonthComplianceChange: '+0%'
            },
            trends: {
              documentGrowth: [],
              complianceRate: [],
              deadlineCompletion: []
            },
            insights
          },
          totalMatches,
          searchTime,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error('Global search error:', error);
        throw error;
      }
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1
  });

  // Update search results when data changes
  useEffect(() => {
    if (globalSearchResults) {
      setSearchResults(globalSearchResults);
      addToSearchHistory(debouncedQuery, globalSearchResults.totalMatches, globalSearchResults.searchTime);
    }
  }, [globalSearchResults, debouncedQuery, setSearchResults, addToSearchHistory]);


  // Update searching state
  useEffect(() => {
    setSearching(isLoadingSearch);
  }, [isLoadingSearch, setSearching]);

  // Search handlers
  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.trim()) {
      addToRecentSearches(newQuery);
    }
  }, [setQuery, addToRecentSearches]);

  const handleClearSearch = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  const handleSearchScopeChange = useCallback((scope: string) => {
    setSearchScope(scope as any);
  }, [setSearchScope]);

  // Memoize returned API to avoid creating a new object each render,
  // which can cause unnecessary re-renders and feedback loops in providers
  const api = useMemo(() => ({
    // State
    query,
    isSearching: isLoadingSearch,
    searchResults,
    searchContext,
    suggestions,
    isLoadingSuggestions,
    searchError,

    // Actions
    handleSearch,
    handleClearSearch,
    handleSearchScopeChange,

    // Computed
    hasResults: searchResults.totalMatches > 0,
    isEmpty: !query.trim(),
    isActive: query.trim().length >= 2
  }), [
    query,
    isLoadingSearch,
    searchResults,
    searchContext,
    suggestions,
    isLoadingSuggestions,
    searchError,
    handleSearch,
    handleClearSearch,
    handleSearchScopeChange
  ]);

  return api;
}

// Hook for search suggestions and autocomplete
export function useSearchSuggestions(query: string) {
  const { data: suggestions = [], isLoading } = useQuery<SearchSuggestion[]>({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return [];
      }
      
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
      }
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000
  });

  return { suggestions, isLoading };
}

// Hook for filtered dashboard stats based on search
export function useSearchFilteredStats(searchQuery: string) {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      
      const response = await fetch(`/api/dashboard/stats?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch filtered stats');
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return { stats, isLoading };
}

// Hook for search analytics and insights
export function useSearchAnalytics() {
  const searchResults = useSearchResults();
  const searchContext = useSearchContext();
  
  const analytics = useMemo(() => {
    const { documents, userDocuments, deadlines, insights } = searchResults;
    
    return {
      totalResults: searchResults.totalMatches,
      searchTime: searchResults.searchTime,
      categoryBreakdown: searchContext.categoryBreakdown,
      resultDistribution: {
        documents: documents.length,
        userDocuments: userDocuments.length,
        deadlines: deadlines.length,
        insights: insights.length
      },
      searchEfficiency: searchResults.searchTime < 500 ? 'fast' : searchResults.searchTime < 1000 ? 'medium' : 'slow',
      hasResults: searchResults.totalMatches > 0,
      isEmpty: searchResults.totalMatches === 0
    };
  }, [searchResults, searchContext]);

  return analytics;
}

// Hook for search keyboard shortcuts
export function useSearchKeyboardShortcuts() {
  // Use stable selectors to avoid changing deps every render
  const clearSearch = useClearSearch();
  const isSearchFocused = useSearchStore(state => state.isSearchFocused);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Global search shortcut (Cmd/Ctrl + K)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape to clear search
      if (event.key === 'Escape' && isSearchFocused) {
        clearSearch();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch, isSearchFocused]);

  return {
    focusSearch: () => {
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  };
}

// Helper function to generate search insights
function generateSearchInsights(
  query: string,
  documents: Document[],
  userDocuments: UserDocument[],
  deadlines: ComplianceDeadline[],
  stats: DashboardStats | null
): any[] {
  const insights = [];
  
  // Document insights
  if (documents.length > 0) {
    const statusCounts = documents.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    if (statusCounts.pending_approval > 0) {
      insights.push({
        id: `pending-docs-${query}`,
        type: 'alert',
        title: `${statusCounts.pending_approval} documents pending approval`,
        description: `Found ${statusCounts.pending_approval} documents matching "${query}" that need approval`,
        confidence: 0.9,
        relatedData: { documents: documents.filter(d => d.status === 'pending_approval') },
        createdAt: new Date().toISOString()
      });
    }
  }
  
  // Deadline insights
  if (deadlines.length > 0) {
    const upcomingDeadlines = deadlines.filter(d => 
      new Date(d.deadline) > new Date() && 
      new Date(d.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    
    if (upcomingDeadlines.length > 0) {
      insights.push({
        id: `upcoming-deadlines-${query}`,
        type: 'alert',
        title: `${upcomingDeadlines.length} upcoming deadlines`,
        description: `Found ${upcomingDeadlines.length} deadlines related to "${query}" due within 7 days`,
        confidence: 0.8,
        relatedData: { deadlines: upcomingDeadlines },
        createdAt: new Date().toISOString()
      });
    }
  }
  
  // Trend insights
  if (stats && documents.length > 0) {
    insights.push({
      id: `compliance-trend-${query}`,
      type: 'trend',
      title: 'Compliance trend analysis',
      description: `Documents matching "${query}" show ${stats.complianceRate}% compliance rate`,
      confidence: 0.7,
      relatedData: { stats, documents },
      createdAt: new Date().toISOString()
    });
  }
  
  return insights;
}

