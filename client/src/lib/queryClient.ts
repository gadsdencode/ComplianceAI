import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Create a persister for localStorage with better error handling
export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'compliance-ai-query-cache', // Unique key for this app
  serialize: (data: unknown) => {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Error serializing cache data:', error);
      return '{}';
    }
  },
  deserialize: (data: string) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error deserializing cache data:', error);
      return {};
    }
  },
});

// Create the query client with better configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 30, // 30 minutes - longer stale time for better persistence
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - much longer cache time
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Add debugging for cache operations
if (typeof window !== 'undefined') {
  // Debug cache on mount
  console.log('🔍 Initial cache state:', queryClient.getQueryCache().getAll());
  
  // Monitor cache changes
  queryClient.getQueryCache().subscribe((event) => {
    console.log('🔄 Cache event:', event.type, event.query?.queryKey);
  });
}
