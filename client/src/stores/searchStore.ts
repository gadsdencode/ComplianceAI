import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { Document, ComplianceDeadline, UserDocument, DashboardStats } from '@/types';

// Search scope types
export type SearchScope = 'all' | 'documents' | 'calendar' | 'analytics' | 'insights';

// Search result interfaces
export interface SearchInsight {
  id: string;
  type: 'trend' | 'alert' | 'recommendation' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  relatedData: any;
  createdAt: string;
}

export interface AnalyticsData {
  filteredStats: DashboardStats;
  trends: {
    documentGrowth: number[];
    complianceRate: number[];
    deadlineCompletion: number[];
  };
  insights: SearchInsight[];
}

export interface SearchResults {
  documents: Document[];
  userDocuments: UserDocument[];
  deadlines: ComplianceDeadline[];
  insights: SearchInsight[];
  analytics: AnalyticsData;
  totalMatches: number;
  searchTime: number;
  lastUpdated: string;
}

export interface SearchContext {
  query: string;
  totalMatches: number;
  categoryBreakdown: {
    documents: number;
    userDocuments: number;
    deadlines: number;
    insights: number;
  };
  highlightedTerms: string[];
  searchScope: SearchScope;
  isGlobalSearch: boolean;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'autocomplete';
  category?: string;
  icon?: string;
}

// Search store state interface
interface SearchState {
  // Core search state
  query: string;
  isSearching: boolean;
  searchResults: SearchResults;
  searchContext: SearchContext;
  
  // UI state
  isSearchFocused: boolean;
  searchScope: SearchScope;
  recentSearches: string[];
  showSuggestions: boolean;
  
  // Performance tracking
  searchHistory: Array<{
    query: string;
    timestamp: string;
    resultCount: number;
    searchTime: number;
  }>;
  
  // Actions
  setQuery: (query: string) => void;
  setSearching: (isSearching: boolean) => void;
  setSearchResults: (results: SearchResults) => void;
  setSearchContext: (context: SearchContext) => void;
  setSearchFocused: (focused: boolean) => void;
  setSearchScope: (scope: SearchScope) => void;
  setSearchSuggestions: (suggestions: SearchSuggestion[]) => void;
  setShowSuggestions: (show: boolean) => void;
  clearSearch: () => void;
  addToRecentSearches: (query: string) => void;
  addToSearchHistory: (query: string, resultCount: number, searchTime: number) => void;
  updateSearchContext: (updates: Partial<SearchContext>) => void;
  
  // Computed getters
  getFilteredResults: () => SearchResults;
  getSearchStats: () => {
    totalSearches: number;
    averageSearchTime: number;
    mostSearchedTerms: string[];
  };
}

// Initial state
const initialSearchResults: SearchResults = {
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
    trends: {
      documentGrowth: [],
      complianceRate: [],
      deadlineCompletion: []
    },
    insights: []
  },
  totalMatches: 0,
  searchTime: 0,
  lastUpdated: new Date().toISOString()
};

const initialSearchContext: SearchContext = {
  query: '',
  totalMatches: 0,
  categoryBreakdown: {
    documents: 0,
    userDocuments: 0,
    deadlines: 0,
    insights: 0
  },
  highlightedTerms: [],
  searchScope: 'all',
  isGlobalSearch: false
};

// Create the search store
export const useSearchStore = create<SearchState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      query: '',
      isSearching: false,
      searchResults: initialSearchResults,
      searchContext: initialSearchContext,
      isSearchFocused: false,
      searchScope: 'all',
      recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
      showSuggestions: false,
      searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),

      // Actions
      setQuery: (query: string) => {
        set({ query }, false, 'setQuery');
        
        // Update search context
        const currentContext = get().searchContext;
        set({
          searchContext: {
            ...currentContext,
            query,
            highlightedTerms: query.split(' ').filter(term => term.length > 2)
          }
        }, false, 'updateSearchContext');
      },

      setSearching: (isSearching: boolean) => {
        set({ isSearching }, false, 'setSearching');
      },

      setSearchResults: (searchResults: SearchResults) => {
        set({ searchResults }, false, 'setSearchResults');
        
        // Update search context with new results
        const context = get().searchContext;
        set({
          searchContext: {
            ...context,
            totalMatches: searchResults.totalMatches,
            categoryBreakdown: {
              documents: searchResults.documents.length,
              userDocuments: searchResults.userDocuments.length,
              deadlines: searchResults.deadlines.length,
              insights: searchResults.insights.length
            }
          }
        }, false, 'updateSearchContextFromResults');
      },

      setSearchContext: (searchContext: SearchContext) => {
        set({ searchContext }, false, 'setSearchContext');
      },

      setSearchFocused: (isSearchFocused: boolean) => {
        set({ isSearchFocused }, false, 'setSearchFocused');
      },

      setSearchScope: (searchScope: SearchScope) => {
        set({ searchScope }, false, 'setSearchScope');
        
        // Update search context
        const currentContext = get().searchContext;
        set({
          searchContext: {
            ...currentContext,
            searchScope,
            isGlobalSearch: searchScope === 'all'
          }
        }, false, 'updateSearchScope');
      },


      setShowSuggestions: (showSuggestions: boolean) => {
        set({ showSuggestions }, false, 'setShowSuggestions');
      },

      clearSearch: () => {
        set({
          query: '',
          searchResults: initialSearchResults,
          searchContext: initialSearchContext,
          isSearching: false,
          showSuggestions: false
        }, false, 'clearSearch');
      },

      addToRecentSearches: (query: string) => {
        if (!query.trim()) return;
        
        set((state) => {
          const newRecentSearches = [
            query,
            ...state.recentSearches.filter(q => q !== query)
          ].slice(0, 10); // Keep only 10 recent searches
          
          // Persist to localStorage
          localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
          
          return { recentSearches: newRecentSearches };
        }, false, 'addToRecentSearches');
      },

      addToSearchHistory: (query: string, resultCount: number, searchTime: number) => {
        if (!query.trim()) return;
        
        set((state) => {
          const newHistory = [
            {
              query,
              timestamp: new Date().toISOString(),
              resultCount,
              searchTime
            },
            ...state.searchHistory
          ].slice(0, 50); // Keep only 50 search history entries
          
          // Persist to localStorage
          localStorage.setItem('searchHistory', JSON.stringify(newHistory));
          
          return { searchHistory: newHistory };
        }, false, 'addToSearchHistory');
      },

      updateSearchContext: (updates: Partial<SearchContext>) => {
        set((state) => ({
          searchContext: { ...state.searchContext, ...updates }
        }), false, 'updateSearchContext');
      },

      // Computed getters
      getFilteredResults: () => {
        const { searchResults, searchScope } = get();
        
        if (searchScope === 'all') {
          return searchResults;
        }
        
        // Filter results based on scope
        const filtered: SearchResults = {
          ...searchResults,
          documents: searchScope === 'documents' ? searchResults.documents : [],
          userDocuments: searchScope === 'documents' ? searchResults.userDocuments : [],
          deadlines: searchScope === 'calendar' ? searchResults.deadlines : [],
          insights: searchScope === 'insights' ? searchResults.insights : [],
          analytics: searchScope === 'analytics' ? searchResults.analytics : initialSearchResults.analytics
        };
        
        // Recalculate total matches
        filtered.totalMatches = 
          filtered.documents.length + 
          filtered.userDocuments.length + 
          filtered.deadlines.length + 
          filtered.insights.length;
        
        return filtered;
      },

      getSearchStats: () => {
        const { searchHistory } = get();
        
        const totalSearches = searchHistory.length;
        const averageSearchTime = searchHistory.length > 0 
          ? searchHistory.reduce((sum, entry) => sum + entry.searchTime, 0) / searchHistory.length 
          : 0;
        
        // Get most searched terms
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
      }
    })),
    {
      name: 'search-store',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        searchHistory: state.searchHistory
      })
    }
  )
);

// Selectors for optimized re-renders
export const useSearchQuery = () => useSearchStore(state => state.query);
export const useIsSearching = () => useSearchStore(state => state.isSearching);
export const useSearchResults = () => useSearchStore(state => state.searchResults);
export const useSearchContext = () => useSearchStore(state => state.searchContext);
export const useIsSearchFocused = () => useSearchStore(state => state.isSearchFocused);
export const useSearchScope = () => useSearchStore(state => state.searchScope);
export const useRecentSearches = () => useSearchStore(state => state.recentSearches);
export const useShowSuggestions = () => useSearchStore(state => state.showSuggestions);

// Individual action selectors for stable references
export const useSetQuery = () => useSearchStore(state => state.setQuery);
export const useSetSearching = () => useSearchStore(state => state.setSearching);
export const useSetSearchResults = () => useSearchStore(state => state.setSearchResults);
export const useSetSearchContext = () => useSearchStore(state => state.setSearchContext);
export const useSetSearchFocused = () => useSearchStore(state => state.setSearchFocused);
export const useSetSearchScope = () => useSearchStore(state => state.setSearchScope);
export const useSetShowSuggestions = () => useSearchStore(state => state.setShowSuggestions);
export const useClearSearch = () => useSearchStore(state => state.clearSearch);
export const useAddToRecentSearches = () => useSearchStore(state => state.addToRecentSearches);
export const useAddToSearchHistory = () => useSearchStore(state => state.addToSearchHistory);
export const useUpdateSearchContext = () => useSearchStore(state => state.updateSearchContext);

// Action selectors (deprecated - use individual selectors for better performance)
export const useSearchActions = () => useSearchStore(state => ({
  setQuery: state.setQuery,
  setSearching: state.setSearching,
  setSearchResults: state.setSearchResults,
  setSearchContext: state.setSearchContext,
  setSearchFocused: state.setSearchFocused,
  setSearchScope: state.setSearchScope,
  setShowSuggestions: state.setShowSuggestions,
  clearSearch: state.clearSearch,
  addToRecentSearches: state.addToRecentSearches,
  addToSearchHistory: state.addToSearchHistory,
  updateSearchContext: state.updateSearchContext
}));

// Computed selectors
export const useFilteredSearchResults = () => useSearchStore(state => state.getFilteredResults());
export const useSearchStats = () => useSearchStore(state => state.getSearchStats());
