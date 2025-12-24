import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Document, UserDocument } from '@/types';

interface PaginationParams {
  page: number;
  limit: number;
  status?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Hook for fetching paginated documents with smooth transitions
 */
export function usePaginatedDocuments(options: PaginationParams) {
  const { page, limit, status } = options;
  
  return useQuery<PaginatedResponse<Document>>({
    queryKey: ['/api/documents', { page, limit, status }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (status) {
        params.set('status', status);
      }
      
      const response = await fetch(`/api/documents?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }
      
      return response.json();
    },
    placeholderData: keepPreviousData, // Keeps previous data while fetching new page
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for fetching paginated user documents with smooth transitions
 */
export function usePaginatedUserDocuments(options: PaginationParams & { folderId?: string }) {
  const { page, limit, status, folderId } = options;
  
  return useQuery<PaginatedResponse<UserDocument>>({
    queryKey: ['/api/user-documents', { page, limit, status, folderId }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (status) {
        params.set('status', status);
      }
      
      if (folderId) {
        params.set('folderId', folderId);
      }
      
      const response = await fetch(`/api/user-documents?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user documents: ${response.status}`);
      }
      
      return response.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Generic paginated query hook for any resource
 */
export function usePaginatedQuery<T>(
  endpoint: string,
  options: {
    page: number;
    limit: number;
    additionalParams?: Record<string, string>;
    enabled?: boolean;
  }
) {
  const { page, limit, additionalParams = {}, enabled = true } = options;
  
  return useQuery<PaginatedResponse<T>>({
    queryKey: [endpoint, { page, limit, ...additionalParams }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...additionalParams,
      });
      
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      return response.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    enabled,
  });
}

