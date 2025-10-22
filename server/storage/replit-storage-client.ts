import { Client } from '@replit/object-storage';
import { Readable } from 'stream';
import {
  IObjectStorageClient,
  StorageResult,
  StorageObject,
  UploadOptions,
  DownloadOptions,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  withRetry
} from './object-storage-client';

/**
 * Replit Object Storage implementation with robust error handling and retries
 */
export class ReplitStorageClient implements IObjectStorageClient {
  private client: Client;
  private retryConfig: RetryConfig;
  
  constructor(bucketId: string, retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.client = new Client({ bucketId });
    this.retryConfig = retryConfig;
    console.log(`🚀 ReplitStorageClient initialized with bucket: ${bucketId}`);
  }
  
  /**
   * Upload data from a buffer with retry logic
   */
  async uploadFromBytes(
    objectName: string,
    data: Buffer,
    options?: UploadOptions
  ): Promise<StorageResult> {
    try {
      const result = await withRetry(
        async () => {
          const uploadResult = await this.client.uploadFromBytes(objectName, data);
          if (!uploadResult.ok) {
            throw new Error(uploadResult.error?.message || 'Upload failed');
          }
          return uploadResult;
        },
        this.retryConfig,
        `Upload ${objectName}`
      );
      
      console.log(`✅ Successfully uploaded: ${objectName} (${data.length} bytes)`);
      
      // Store metadata if provided
      if (options?.metadata) {
        console.log(`📝 Metadata for ${objectName}:`, options.metadata);
      }
      
      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to upload ${objectName}:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * Upload data from a stream with retry logic
   */
  async uploadFromStream(
    objectName: string,
    stream: Readable,
    options?: UploadOptions
  ): Promise<StorageResult> {
    try {
      // Convert stream to buffer for Replit API (it doesn't support streams directly)
      const chunks: Buffer[] = [];
      
      return new Promise<StorageResult>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => {
          reject({ ok: false, error: err.message });
        });
        stream.on('end', async () => {
          const buffer = Buffer.concat(chunks);
          const result = await this.uploadFromBytes(objectName, buffer, options);
          resolve(result);
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to upload stream ${objectName}:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * Check if an object exists with retry logic
   */
  async exists(objectName: string): Promise<StorageResult<boolean>> {
    try {
      const result = await withRetry(
        async () => {
          const existsResult = await this.client.exists(objectName);
          if (!existsResult.ok) {
            throw new Error(existsResult.error?.message || 'Exists check failed');
          }
          return existsResult;
        },
        this.retryConfig,
        `Exists check for ${objectName}`
      );
      
      console.log(`🔍 Object exists check for ${objectName}: ${result.value}`);
      return { ok: true, value: result.value };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to check existence of ${objectName}:`, errorMessage);
      // Important: Don't set value to false on error - leave it undefined
      // This allows callers to differentiate between "file not found" and "error checking"
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * Delete an object with retry logic
   */
  async delete(objectName: string): Promise<StorageResult> {
    try {
      const result = await withRetry(
        async () => {
          const deleteResult = await this.client.delete(objectName);
          if (!deleteResult.ok) {
            throw new Error(deleteResult.error?.message || 'Delete failed');
          }
          return deleteResult;
        },
        this.retryConfig,
        `Delete ${objectName}`
      );
      
      console.log(`🗑️ Successfully deleted: ${objectName}`);
      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to delete ${objectName}:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * List objects with optional prefix
   */
  async list(prefix?: string): Promise<StorageResult<StorageObject[]>> {
    try {
      const result = await withRetry(
        async () => {
          const listResult = await this.client.list({ prefix });
          if (!listResult.ok) {
            throw new Error(listResult.error?.message || 'List failed');
          }
          return listResult;
        },
        this.retryConfig,
        `List objects with prefix: ${prefix || 'all'}`
      );
      
      const objects: StorageObject[] = (result.value || []).map((item: any) => ({
        name: item.key || item.name,
        size: item.size || 0,
        lastModified: item.lastModified ? new Date(item.lastModified) : new Date(),
        etag: item.etag
      }));
      
      console.log(`📋 Listed ${objects.length} objects${prefix ? ` with prefix: ${prefix}` : ''}`);
      return { ok: true, value: objects };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to list objects:`, errorMessage);
      return { ok: false, value: [], error: errorMessage };
    }
  }
  
  /**
   * Download an object as a stream
   */
  async downloadAsStream(
    objectName: string,
    options?: DownloadOptions
  ): Promise<StorageResult<Readable>> {
    try {
      // First check if the object exists
      const existsResult = await this.exists(objectName);
      
      // Check if the exists operation itself failed
      if (!existsResult.ok) {
        return { ok: false, error: `Failed to check object existence: ${existsResult.error}` };
      }
      
      // Now check if the object actually exists
      if (!existsResult.value) {
        return { ok: false, error: `Object not found: ${objectName}` };
      }
      
      const stream = await withRetry(
        async () => {
          // Replit's downloadAsStream returns a NodeJS.ReadableStream
          const downloadStream = await this.client.downloadAsStream(objectName);
          if (!downloadStream) {
            throw new Error('Failed to get download stream');
          }
          
          // Ensure it's a proper Node.js Readable stream
          if (!(downloadStream instanceof Readable)) {
            // If it's a web stream, we need to convert it
            if (downloadStream && typeof (downloadStream as any).getReader === 'function') {
              const webStream = downloadStream as any;
              const nodeStream = Readable.from(webStream);
              return nodeStream;
            }
            
            // If it's already a Node stream, just return it
            if (typeof (downloadStream as any).pipe === 'function') {
              return downloadStream as unknown as Readable;
            }
            
            throw new Error('Unexpected stream type returned');
          }
          
          return downloadStream;
        },
        this.retryConfig,
        `Download stream for ${objectName}`
      );
      
      console.log(`📥 Stream created for: ${objectName}`);
      
      // Add error handling to the stream
      stream.on('error', (err) => {
        console.error(`❌ Stream error for ${objectName}:`, err);
      });
      
      return { ok: true, value: stream };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to download stream ${objectName}:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * Download an object as a buffer
   */
  async downloadAsBuffer(
    objectName: string,
    options?: DownloadOptions
  ): Promise<StorageResult<Buffer>> {
    try {
      // First check if the object exists
      const existsResult = await this.exists(objectName);
      
      // Check if the exists operation itself failed
      if (!existsResult.ok) {
        return { ok: false, error: `Failed to check object existence: ${existsResult.error}` };
      }
      
      // Now check if the object actually exists
      if (!existsResult.value) {
        return { ok: false, error: `Object not found: ${objectName}` };
      }
      
      const result = await withRetry(
        async () => {
          const downloadResult = await this.client.downloadAsBytes(objectName);
          if (!downloadResult.ok || !downloadResult.value) {
            throw new Error(downloadResult.error?.message || 'Download failed');
          }
          return downloadResult;
        },
        this.retryConfig,
        `Download buffer for ${objectName}`
      );
      
      // Convert Uint8Array to Buffer safely
      let buffer: Buffer;
      if (result.value instanceof Buffer) {
        buffer = result.value;
      } else if (result.value instanceof Uint8Array) {
        buffer = Buffer.from(result.value.buffer, result.value.byteOffset, result.value.byteLength);
      } else {
        // Fallback for any other array-like structure
        buffer = Buffer.from(result.value as any);
      }
      
      console.log(`📥 Downloaded buffer: ${objectName} (${buffer.length} bytes)`);
      
      return { ok: true, value: buffer };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to download buffer ${objectName}:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * Get object metadata without downloading
   */
  async getMetadata(objectName: string): Promise<StorageResult<{
    size: number;
    contentType?: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  }>> {
    try {
      // Replit doesn't have a direct metadata API, so we'll use list with prefix
      const listResult = await this.list(objectName);
      
      if (!listResult.ok || !listResult.value || listResult.value.length === 0) {
        return { ok: false, error: `Object not found: ${objectName}` };
      }
      
      const objectInfo = listResult.value.find(obj => obj.name === objectName);
      if (!objectInfo) {
        return { ok: false, error: `Object not found: ${objectName}` };
      }
      
      return {
        ok: true,
        value: {
          size: objectInfo.size,
          lastModified: objectInfo.lastModified,
          // Replit doesn't provide content type or custom metadata directly
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to get metadata for ${objectName}:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * Get a signed URL for direct access
   * Note: Replit Object Storage doesn't support signed URLs natively
   */
  async getSignedUrl(
    objectName: string,
    expiresIn: number = 3600
  ): Promise<StorageResult<string>> {
    // Replit doesn't support signed URLs, so we'll return an error
    return {
      ok: false,
      error: 'Signed URLs are not supported by Replit Object Storage. Use downloadAsStream or downloadAsBuffer instead.'
    };
  }
}