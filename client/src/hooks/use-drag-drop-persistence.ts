import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { UserDocument } from '@/types';

interface DragDropPersistenceOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useDragDropPersistence = (options: DragDropPersistenceOptions = {}) => {
  const queryClient = useQueryClient();

  const moveDocument = useCallback(async (
    documentId: number, 
    targetCategory: string, 
    currentCategory: string
  ) => {
    try {
      // Don't move if it's already in the target category
      if (currentCategory === targetCategory) {
        return;
      }

      // Optimistic update: Update the cache immediately
      queryClient.setQueryData(['/api/user-documents'], (oldData: UserDocument[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(doc => 
          doc.id === documentId 
            ? { ...doc, category: targetCategory, updatedAt: new Date().toISOString() }
            : doc
        );
      });

      // Make the API call
      const response = await fetch(`/api/user-documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ category: targetCategory }),
      });

      if (!response.ok) {
        throw new Error(`Failed to move document: ${response.statusText}`);
      }

      // Ensure the cache is properly updated with the server response
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/user-documents'],
        refetchType: 'active'
      });
      
      // Also invalidate folders to ensure folder counts are updated
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/user-documents/folders'],
        refetchType: 'active'
      });

      options.onSuccess?.();

    } catch (error) {
      console.error('Error moving document:', error);
      
      // Rollback optimistic update on error
      queryClient.invalidateQueries({ 
        queryKey: ['/api/user-documents'],
        refetchType: 'active'
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      options.onError?.(new Error(errorMessage));
      throw error;
    }
  }, [queryClient, options]);

  return {
    moveDocument,
  };
}; 