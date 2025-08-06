import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkCacheState, checkLocalStorage, clearCache, persistSpecificQueries } from '@/lib/cache-utils';

export const CacheDebugger = () => {
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [localStorageInfo, setLocalStorageInfo] = useState<any>(null);

  const refreshCacheInfo = () => {
    const cache = checkCacheState();
    const localStorage = checkLocalStorage();
    setCacheInfo(cache);
    setLocalStorageInfo(localStorage);
  };

  const handleClearCache = () => {
    clearCache();
    refreshCacheInfo();
  };

  const handlePersistCache = async () => {
    await persistSpecificQueries([['/api/user-documents'], ['/api/user-documents/folders']]);
    refreshCacheInfo();
  };

  return (
    <Card className="fixed bottom-4 left-4 w-96 bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-sm">Cache Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            onClick={refreshCacheInfo}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={handlePersistCache}
            className="bg-green-500 hover:bg-green-600"
          >
            Persist
          </Button>
          <Button 
            size="sm" 
            onClick={handleClearCache}
            variant="destructive"
          >
            Clear
          </Button>
        </div>
        
        <div className="text-xs text-white space-y-2">
          <div>
            <strong>Cache Queries:</strong> {cacheInfo?.length || 0}
          </div>
          <div>
            <strong>localStorage:</strong> {localStorageInfo ? 'Found' : 'Not found'}
          </div>
          
          {cacheInfo && (
            <div className="mt-2">
              <strong>Query Details:</strong>
              <div className="mt-1 space-y-1">
                {cacheInfo.map((query: any, index: number) => (
                  <div key={index} className="text-gray-300">
                    {query.queryKey.join(' > ')} - {query.state.status}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 