import { IObjectStorageClient } from './object-storage-client.js';
import { ReplitStorageClient } from './replit-storage-client.js';
import { MockStorageClient } from './mock-storage-client.js';

/**
 * Environment detection for Replit
 */
export const isReplitEnvironment = !!(
  process.env.REPL_ID || 
  process.env.REPLIT_DB_URL || 
  process.env.REPLIT_DEPLOYMENT || 
  process.env.REPLIT_DOMAINS ||
  process.env.FORCE_REPLIT_STORAGE === 'true'
);

/**
 * Storage configuration options
 */
export interface StorageConfig {
  bucketId?: string;
  mockOptions?: {
    simulatedLatency?: number;
    failureRate?: number;
  };
  forceMode?: 'replit' | 'mock';
}

/**
 * Create an object storage client based on the environment
 */
export function createObjectStorageClient(config?: StorageConfig): IObjectStorageClient {
  // Allow forcing a specific mode for testing
  if (config?.forceMode === 'replit') {
    const bucketId = config.bucketId || process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      throw new Error('REPLIT_OBJECT_STORAGE_BUCKET_ID is required for Replit storage');
    }
    console.log(`🚀 Forced Replit Object Storage with bucket: ${bucketId}`);
    return new ReplitStorageClient(bucketId);
  }
  
  if (config?.forceMode === 'mock') {
    console.log(`🔧 Forced Mock Object Storage for testing`);
    return new MockStorageClient(config.mockOptions);
  }
  
  // Auto-detect based on environment
  if (isReplitEnvironment) {
    const bucketId = config?.bucketId || process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      console.warn('⚠️ Replit environment detected but REPLIT_OBJECT_STORAGE_BUCKET_ID not set');
      console.warn('⚠️ Falling back to Mock storage');
      return new MockStorageClient(config?.mockOptions);
    }
    
    console.log(`🚀 Using Replit Object Storage with bucket: ${bucketId}`);
    return new ReplitStorageClient(bucketId);
  } else {
    console.log('⚠️ Running in development mode - using Mock Object Storage');
    console.log('   Note: File uploads will work but won\'t persist between restarts');
    return new MockStorageClient(config?.mockOptions);
  }
}

/**
 * Singleton instance of the object storage client
 */
let storageClient: IObjectStorageClient | null = null;

/**
 * Get or create the singleton storage client instance
 */
export function getObjectStorageClient(config?: StorageConfig): IObjectStorageClient {
  if (!storageClient) {
    storageClient = createObjectStorageClient(config);
  }
  return storageClient;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetObjectStorageClient(): void {
  storageClient = null;
}

// Re-export types and utilities for convenience
export * from './object-storage-client.js';
export { ReplitStorageClient } from './replit-storage-client.js';
export { MockStorageClient } from './mock-storage-client.js';