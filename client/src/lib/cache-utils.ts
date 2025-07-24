import { queryClient } from './queryClient';

// Utility to manually trigger cache persistence
export const persistCache = async () => {
  try {
    // Get all queries from cache
    const queries = queryClient.getQueryCache().getAll();
    console.log('💾 Persisting cache with queries:', queries.length);
    
    // Force a re-render by updating a dummy query
    queryClient.setQueryData(['cache-persistence-trigger'], { timestamp: Date.now() });
    
    // Wait a bit for the persistence to happen
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ Cache persistence triggered');
  } catch (error) {
    console.error('❌ Error persisting cache:', error);
  }
};

// Utility to check cache state
export const checkCacheState = () => {
  const queries = queryClient.getQueryCache().getAll();
  console.log('🔍 Current cache state:', {
    totalQueries: queries.length,
    queries: queries.map(q => ({
      key: q.queryKey,
      status: q.state.status,
      dataUpdatedAt: q.state.dataUpdatedAt,
      hasData: !!q.state.data
    }))
  });
  return queries;
};

// Utility to clear cache
export const clearCache = () => {
  console.log('🧹 Clearing cache...');
  queryClient.clear();
  console.log('✅ Cache cleared');
};

// Utility to check localStorage
export const checkLocalStorage = () => {
  if (typeof window === 'undefined') return null;
  
  const cacheKey = 'compliance-ai-query-cache';
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      console.log('📦 localStorage cache found:', {
        key: cacheKey,
        size: cached.length,
        data: parsed
      });
      return parsed;
    } catch (error) {
      console.error('❌ Error parsing localStorage cache:', error);
      return null;
    }
  } else {
    console.log('📦 No localStorage cache found for key:', cacheKey);
    return null;
  }
}; 