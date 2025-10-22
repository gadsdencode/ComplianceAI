import { Readable } from 'stream';

/**
 * Result type for storage operations
 */
export interface StorageResult<T = void> {
  ok: boolean;
  value?: T;
  error?: string | Error;
}

/**
 * List result for storage objects
 */
export interface StorageObject {
  name: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

/**
 * Upload options
 */
export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Download options
 */
export interface DownloadOptions {
  range?: {
    start: number;
    end?: number;
  };
}

/**
 * Abstract interface for object storage operations
 */
export interface IObjectStorageClient {
  /**
   * Upload data from a buffer
   */
  uploadFromBytes(
    objectName: string,
    data: Buffer,
    options?: UploadOptions
  ): Promise<StorageResult>;

  /**
   * Upload data from a stream
   */
  uploadFromStream(
    objectName: string,
    stream: Readable,
    options?: UploadOptions
  ): Promise<StorageResult>;

  /**
   * Check if an object exists
   */
  exists(objectName: string): Promise<StorageResult<boolean>>;

  /**
   * Delete an object
   */
  delete(objectName: string): Promise<StorageResult>;

  /**
   * List objects with optional prefix
   */
  list(prefix?: string): Promise<StorageResult<StorageObject[]>>;

  /**
   * Download an object as a stream
   */
  downloadAsStream(
    objectName: string,
    options?: DownloadOptions
  ): Promise<StorageResult<Readable>>;

  /**
   * Download an object as a buffer
   */
  downloadAsBuffer(
    objectName: string,
    options?: DownloadOptions
  ): Promise<StorageResult<Buffer>>;

  /**
   * Get a signed URL for direct access (if supported)
   */
  getSignedUrl?(
    objectName: string,
    expiresIn?: number
  ): Promise<StorageResult<string>>;

  /**
   * Get object metadata without downloading
   */
  getMetadata(objectName: string): Promise<StorageResult<{
    size: number;
    contentType?: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  }>>;
}

/**
 * Retry configuration for storage operations
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'EPIPE',
    'ENETUNREACH',
    'EAI_AGAIN'
  ]
};

/**
 * Helper function to determine if an error is retryable
 */
export function isRetryableError(error: any, config: RetryConfig): boolean {
  if (!error) return false;
  
  // Check for specific error codes
  if (config.retryableErrors?.includes(error.code)) {
    return true;
  }
  
  // Check for network-related errors
  if (error.message && (
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ECONNRESET') ||
    error.message.includes('network') ||
    error.message.includes('timeout')
  )) {
    return true;
  }
  
  // Check for HTTP status codes that are retryable
  if (error.statusCode && (
    error.statusCode === 429 || // Too Many Requests
    error.statusCode === 502 || // Bad Gateway
    error.statusCode === 503 || // Service Unavailable
    error.statusCode === 504    // Gateway Timeout
  )) {
    return true;
  }
  
  return false;
}

/**
 * Execute an operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  operationName?: string
): Promise<T> {
  let lastError: any;
  let delay = config.initialDelay;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      
      if (attempt === config.maxAttempts || !isRetryableError(error, config)) {
        console.error(
          `❌ ${operationName || 'Operation'} failed after ${attempt} attempt(s):`,
          error
        );
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(
        `⚠️ ${operationName || 'Operation'} failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms:`,
        errorMessage
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Calculate next delay with exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }
  
  throw lastError;
}