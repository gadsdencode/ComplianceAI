import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Document } from '@/types';

interface UseDocumentSearchOptions {
  maxResults?: number;
  debounceMs?: number;
  minQueryLength?: number;
}

export function useDocumentSearch(options: UseDocumentSearchOptions = {}) {
  const {
    maxResults = 10,
    debounceMs = 300,
    minQueryLength = 2
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [, navigate] = useLocation();

  // Debounce the search query
  const debounceRef = useState<NodeJS.Timeout | null>(null);
  
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    
    if (debounceRef[0]) {
      clearTimeout(debounceRef[0]);
    }
    
    const timeout = setTimeout(() => {
      setDebouncedQuery(newQuery);
    }, debounceMs);
    
    debounceRef[1](timeout);
  }, [debounceMs]);

  // Fetch search results
  const { 
    data: searchResults = [], 
    isLoading, 
    error,
    refetch
  } = useQuery<Document[]>({
    queryKey: ['/api/documents/search', { q: debouncedQuery }],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < minQueryLength) {
        return [];
      }
      const params = new URLSearchParams({ q: debouncedQuery });
      const response = await fetch(`/api/documents/search?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      return response.json();
    },
    enabled: debouncedQuery.length >= minQueryLength,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Navigate to document
  const navigateToDocument = useCallback((document: Document) => {
    navigate(`/documents/${document.id}`);
  }, [navigate]);

  // Navigate to search results page
  const navigateToSearchResults = useCallback(() => {
    if (query.trim()) {
      navigate(`/documents?search=${encodeURIComponent(query.trim())}`);
    }
  }, [navigate, query]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    if (debounceRef[0]) {
      clearTimeout(debounceRef[0]);
    }
  }, [debounceRef]);

  return {
    query,
    debouncedQuery,
    searchResults: searchResults.slice(0, maxResults),
    totalResults: searchResults.length,
    isLoading,
    error,
    updateQuery,
    navigateToDocument,
    navigateToSearchResults,
    clearSearch,
    refetch,
    hasResults: searchResults.length > 0,
    canSearch: debouncedQuery.length >= minQueryLength
  };
}
