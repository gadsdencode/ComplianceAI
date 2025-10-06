import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useGlobalSearch } from '@/hooks/use-search';
import { useSearchStore } from '@/stores/searchStore';

// Search context interface
interface SearchContextType {
  // Search state
  query: string;
  isSearching: boolean;
  searchResults: any;
  searchContext: any;
  hasResults: boolean;
  isEmpty: boolean;
  isActive: boolean;
  
  // Search actions
  handleSearch: (query: string) => void;
  handleClearSearch: () => void;
  handleSearchScopeChange: (scope: string) => void;
  
  // Search analytics
  analytics: any;
}

// Create the search context
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Search provider props
interface SearchResultsProviderProps {
  children: ReactNode;
}

// Search results provider component
export function SearchResultsProvider({ children }: SearchResultsProviderProps) {
  // Use the global search hook to get all search functionality
  const searchHook = useGlobalSearch();
  
  // Derive analytics from searchHistory with memo to ensure stability
  const searchHistory = useSearchStore(state => state.searchHistory);
  const analytics = useMemo(() => {
    const totalSearches = searchHistory.length;
    const averageSearchTime = totalSearches > 0
      ? searchHistory.reduce((sum, entry) => sum + entry.searchTime, 0) / totalSearches
      : 0;

    const termCounts: Record<string, number> = {};
    searchHistory.forEach(entry => {
      const terms = entry.query.toLowerCase().split(' ');
      terms.forEach(term => {
        if (term.length > 2) {
          termCounts[term] = (termCounts[term] || 0) + 1;
        }
      });
    });

    const mostSearchedTerms = Object.entries(termCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([term]) => term);

    return {
      totalSearches,
      averageSearchTime,
      mostSearchedTerms
    };
  }, [searchHistory]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue: SearchContextType = useMemo(() => ({
    ...searchHook,
    analytics
  }), [searchHook, analytics]);

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

// Custom hook to use the search context
export function useSearchContext() {
  const context = useContext(SearchContext);
  
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchResultsProvider');
  }
  
  return context;
}

// Higher-order component to wrap components with search context
export function withSearchContext<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <SearchResultsProvider>
        <Component {...props} />
      </SearchResultsProvider>
    );
  };
}

// Search context consumer component for class components
export function SearchContextConsumer({ 
  children 
}: { 
  children: (context: SearchContextType) => ReactNode 
}) {
  return (
    <SearchContext.Consumer>
      {(context) => {
        if (context === undefined) {
          throw new Error('SearchContextConsumer must be used within a SearchResultsProvider');
        }
        return children(context);
      }}
    </SearchContext.Consumer>
  );
}

// Search state selector hooks for optimized re-renders
export function useSearchQuery() {
  const context = useSearchContext();
  return context.query;
}

export function useIsSearching() {
  const context = useSearchContext();
  return context.isSearching;
}

export function useSearchResults() {
  const context = useSearchContext();
  return context.searchResults;
}

export function useSearchActions() {
  const context = useSearchContext();
  return {
    handleSearch: context.handleSearch,
    handleClearSearch: context.handleClearSearch,
    handleSearchScopeChange: context.handleSearchScopeChange
  };
}

export function useSearchAnalytics() {
  const context = useSearchContext();
  return context.analytics;
}

// Search state change listener hook
export function useSearchStateListener(
  callback: (searchState: SearchContextType) => void,
  deps: React.DependencyList = []
) {
  const searchContext = useSearchContext();
  
  useEffect(() => {
    callback(searchContext);
  }, [searchContext.query, searchContext.isSearching, searchContext.hasResults, ...deps]);
}

// Search result filter hook
export function useSearchResultFilter<T>(
  data: T[],
  filterFn: (item: T, query: string) => boolean
) {
  const { query } = useSearchContext();
  
  return React.useMemo(() => {
    if (!query || query.length < 2) {
      return data;
    }
    
    return data.filter(item => filterFn(item, query));
  }, [data, query, filterFn]);
}

// Search highlight hook
export function useSearchHighlight(text: string, className?: string) {
  const { query } = useSearchContext();
  
  return React.useMemo(() => {
    if (!query || query.length < 2) {
      return <span className={className}>{text}</span>;
    }
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span className={className}>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  }, [text, query, className]);
}

// Search scope hook
export function useSearchScope() {
  const context = useSearchContext();
  return useSearchStore(state => state.searchScope);
}

// Search suggestions hook
export function useSearchSuggestions() {
  const context = useSearchContext();
  return useSearchStore(state => state.searchSuggestions);
}

// Recent searches hook
export function useRecentSearches() {
  const context = useSearchContext();
  return useSearchStore(state => state.recentSearches);
}

// Search history hook
export function useSearchHistory() {
  const context = useSearchContext();
  return useSearchStore(state => state.searchHistory);
}

// Search performance hook
export function useSearchPerformance() {
  const { searchResults, analytics } = useSearchContext();
  
  return React.useMemo(() => ({
    searchTime: searchResults.searchTime,
    totalSearches: analytics.totalSearches,
    averageSearchTime: analytics.averageSearchTime,
    searchEfficiency: searchResults.searchTime < 500 ? 'fast' : 
                     searchResults.searchTime < 1000 ? 'medium' : 'slow'
  }), [searchResults.searchTime, analytics]);
}

// Search result count hook
export function useSearchResultCount() {
  const { searchResults } = useSearchContext();
  
  return React.useMemo(() => ({
    total: searchResults.totalMatches,
    documents: searchResults.documents.length,
    userDocuments: searchResults.userDocuments.length,
    deadlines: searchResults.deadlines.length,
    insights: searchResults.insights.length
  }), [searchResults]);
}

// Search state persistence hook
export function useSearchPersistence() {
  const { query, searchResults } = useSearchContext();
  
  // Save search state to sessionStorage
  useEffect(() => {
    if (query) {
      sessionStorage.setItem('lastSearchQuery', query);
      sessionStorage.setItem('lastSearchResults', JSON.stringify(searchResults));
    }
  }, [query, searchResults]);
  
  // Restore search state from sessionStorage
  const restoreSearchState = React.useCallback(() => {
    const savedQuery = sessionStorage.getItem('lastSearchQuery');
    const savedResults = sessionStorage.getItem('lastSearchResults');
    
    if (savedQuery && savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        return { query: savedQuery, results: parsedResults };
      } catch (error) {
        console.error('Error restoring search state:', error);
      }
    }
    
    return null;
  }, []);
  
  return { restoreSearchState };
}

// Search keyboard shortcuts hook
export function useSearchKeyboardShortcuts() {
  const { handleClearSearch } = useSearchContext();
  
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
      if (event.key === 'Escape') {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput && document.activeElement === searchInput) {
          handleClearSearch();
          searchInput.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClearSearch]);
}

// Search context debug hook (for development)
export function useSearchDebug() {
  const context = useSearchContext();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Search Context Debug:', {
      query: context.query,
      isSearching: context.isSearching,
      hasResults: context.hasResults,
      resultCount: context.searchResults.totalMatches,
      searchTime: context.searchResults.searchTime
    });
  }
  
  return context;
}
