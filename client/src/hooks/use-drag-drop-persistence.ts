import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { UserDocument } from '@/types';
import { persistCache, checkCacheState, checkLocalStorage } from '@/lib/cache-utils';

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
    console.log('🔄 Starting document move:', { documentId, targetCategory, currentCategory });
    
    try {
      // Don't move if it's already in the target category
      if (currentCategory === targetCategory) {
        console.log('⚠️ Document already in target category, skipping move');
        return;
      }

      // Check initial cache and localStorage state
      console.log('🔍 Initial cache state:');
      checkCacheState();
      console.log('🔍 Initial localStorage state:');
      checkLocalStorage();

      // Optimistic update: Update the cache immediately
      queryClient.setQueryData(['/api/user-documents'], (oldData: UserDocument[] | undefined) => {
        if (!oldData) return oldData;
        const updatedData = oldData.map(doc => 
          doc.id === documentId 
            ? { ...doc, category: targetCategory, updatedAt: new Date().toISOString() }
            : doc
        );
        console.log('🔄 Optimistic update applied:', updatedData);
        return updatedData;
      });

      // Make the API call
      console.log('📡 Making API call to update document...');
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

      // Get the updated document from the response
      const updatedDocument = await response.json();
      console.log('✅ API response received:', updatedDocument);

      // Update the cache with the server response to ensure consistency
      queryClient.setQueryData(['/api/user-documents'], (oldData: UserDocument[] | undefined) => {
        if (!oldData) return oldData;
        const finalData = oldData.map(doc => 
          doc.id === documentId 
            ? { ...doc, ...updatedDocument }
            : doc
        );
        console.log('🔄 Cache updated with server response:', finalData);
        return finalData;
      });

      // Force cache persistence
      console.log('💾 Forcing cache persistence...');
      await persistCache();

      // Also invalidate related queries to ensure everything is in sync
      console.log('🔄 Invalidating related queries...');
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['/api/user-documents'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['/api/user-documents/folders'],
          refetchType: 'active'
        })
      ]);

      // Check final cache and localStorage state
      console.log('🔍 Final cache state:');
      checkCacheState();
      console.log('🔍 Final localStorage state:');
      checkLocalStorage();

      options.onSuccess?.();
      console.log('✅ Document move completed successfully');

    } catch (error) {
      console.error('❌ Error moving document:', error);
      
      // Rollback optimistic update on error
      console.log('🔄 Rolling back optimistic update...');
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