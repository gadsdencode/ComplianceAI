import { Readable, PassThrough } from 'stream';
import {
  IObjectStorageClient,
  StorageResult,
  StorageObject,
  UploadOptions,
  DownloadOptions
} from './object-storage-client';

/**
 * Mock storage client for development/testing that mirrors the real API
 */
export class MockStorageClient implements IObjectStorageClient {
  private storage: Map<string, {
    data: Buffer;
    metadata: {
      contentType?: string;
      customMetadata?: Record<string, string>;
      size: number;
      lastModified: Date;
      etag: string;
    };
  }> = new Map();
  
  private simulatedLatency: number = 10; // Simulate network latency in ms
  private failureRate: number = 0; // 0-1, chance of simulated failure
  
  constructor(options?: {
    simulatedLatency?: number;
    failureRate?: number;
  }) {
    if (options?.simulatedLatency !== undefined) {
      this.simulatedLatency = options.simulatedLatency;
    }
    if (options?.failureRate !== undefined) {
      this.failureRate = Math.max(0, Math.min(1, options.failureRate));
    }
    
    console.log(`🔧 MockStorageClient initialized with:
      - Simulated latency: ${this.simulatedLatency}ms
      - Failure rate: ${(this.failureRate * 100).toFixed(1)}%`);
  }
  
  /**
   * Simulate network delay
   */
  private async simulateDelay(): Promise<void> {
    if (this.simulatedLatency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.simulatedLatency));
    }
  }
  
  /**
   * Simulate random failures for testing
   */
  private shouldSimulateFailure(): boolean {
    return Math.random() < this.failureRate;
  }
  
  /**
   * Generate a simple etag based on content
   */
  private generateETag(data: Buffer): string {
    // Simple hash function for mock etag
    let hash = 0;
    for (let i = 0; i < Math.min(data.length, 100); i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash |= 0; // Convert to 32bit integer
    }
    return `"${hash.toString(16)}-${data.length}"`;
  }
  
  /**
   * Upload data from a buffer
   */
  async uploadFromBytes(
    objectName: string,
    data: Buffer,
    options?: UploadOptions
  ): Promise<StorageResult> {
    await this.simulateDelay();
    
    if (this.shouldSimulateFailure()) {
      console.error(`❌ [Mock] Simulated upload failure for: ${objectName}`);
      return { ok: false, error: 'Simulated network error during upload' };
    }
    
    try {
      const metadata = {
        contentType: options?.contentType,
        customMetadata: options?.metadata,
        size: data.length,
        lastModified: new Date(),
        etag: this.generateETag(data)
      };
      
      this.storage.set(objectName, {
        data: Buffer.from(data), // Create a copy to simulate real storage
        metadata
      });
      
      console.log(`✅ [Mock] Uploaded: ${objectName} (${data.length} bytes)`);
      console.log(`   └─ Total objects in storage: ${this.storage.size}`);
      
      if (options?.metadata) {
        console.log(`   └─ Custom metadata:`, options.metadata);
      }
      
      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [Mock] Upload error for ${objectName}:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * Upload data from a stream
   */
  async uploadFromStream(
    objectName: string,
    stream: Readable,
    options?: UploadOptions
  ): Promise<StorageResult> {
    try {
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      
      return new Promise<StorageResult>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => {
          const errorMessage = err.message || 'Stream error';
          console.error(`❌ [Mock] Stream upload error for ${objectName}:`, errorMessage);
          resolve({ ok: false, error: errorMessage });
        });
        stream.on('end', async () => {
          const buffer = Buffer.concat(chunks);
          const result = await this.uploadFromBytes(objectName, buffer, options);
          resolve(result);
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [Mock] Stream upload error for ${objectName}:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * Check if an object exists
   */
  async exists(objectName: string): Promise<StorageResult<boolean>> {
    await this.simulateDelay();
    
    if (this.shouldSimulateFailure()) {
      console.error(`❌ [Mock] Simulated exists check failure for: ${objectName}`);
      return { ok: false, value: false, error: 'Simulated network error during exists check' };
    }
    
    const exists = this.storage.has(objectName);
    console.log(`🔍 [Mock] Exists check for ${objectName}: ${exists}`);
    return { ok: true, value: exists };
  }
  
  /**
   * Delete an object
   */
  async delete(objectName: string): Promise<StorageResult> {
    await this.simulateDelay();
    
    if (this.shouldSimulateFailure()) {
      console.error(`❌ [Mock] Simulated delete failure for: ${objectName}`);
      return { ok: false, error: 'Simulated network error during delete' };
    }
    
    const existed = this.storage.delete(objectName);
    
    if (existed) {
      console.log(`🗑️ [Mock] Deleted: ${objectName}`);
      console.log(`   └─ Remaining objects: ${this.storage.size}`);
      return { ok: true };
    } else {
      console.warn(`⚠️ [Mock] Delete attempted on non-existent object: ${objectName}`);
      return { ok: true }; // Idempotent delete - success even if not found
    }
  }
  
  /**
   * List objects with optional prefix
   */
  async list(prefix?: string): Promise<StorageResult<StorageObject[]>> {
    await this.simulateDelay();
    
    if (this.shouldSimulateFailure()) {
      console.error(`❌ [Mock] Simulated list failure`);
      return { ok: false, value: [], error: 'Simulated network error during list' };
    }
    
    try {
      const objects: StorageObject[] = [];
      
      // Convert to array for iteration
      const entries = Array.from(this.storage.entries());
      for (const [name, obj] of entries) {
        if (!prefix || name.startsWith(prefix)) {
          objects.push({
            name,
            size: obj.metadata.size,
            lastModified: obj.metadata.lastModified,
            etag: obj.metadata.etag
          });
        }
      }
      
      // Sort by name for consistent results
      objects.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`📋 [Mock] Listed ${objects.length} objects${prefix ? ` with prefix: ${prefix}` : ''}`);
      return { ok: true, value: objects };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [Mock] List error:`, errorMessage);
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
    await this.simulateDelay();
    
    if (this.shouldSimulateFailure()) {
      console.error(`❌ [Mock] Simulated download stream failure for: ${objectName}`);
      return { ok: false, error: 'Simulated network error during download' };
    }
    
    const obj = this.storage.get(objectName);
    
    if (!obj) {
      console.warn(`⚠️ [Mock] Download stream attempted for non-existent object: ${objectName}`);
      return { ok: false, error: `Object not found: ${objectName}` };
    }
    
    try {
      // Create a PassThrough stream to simulate real streaming
      const stream = new PassThrough();
      
      // Handle range requests if specified
      let data = obj.data;
      if (options?.range) {
        const start = options.range.start;
        const end = options.range.end ?? data.length - 1;
        data = data.slice(start, end + 1);
        console.log(`📥 [Mock] Streaming range [${start}-${end}] of ${objectName}`);
      } else {
        console.log(`📥 [Mock] Streaming: ${objectName} (${data.length} bytes)`);
      }
      
      // Simulate chunked streaming
      const chunkSize = 64 * 1024; // 64KB chunks
      let offset = 0;
      
      const pushChunks = async () => {
        while (offset < data.length) {
          const chunk = data.slice(offset, offset + chunkSize);
          stream.push(chunk);
          offset += chunkSize;
          
          // Small delay between chunks to simulate network streaming
          if (this.simulatedLatency > 0 && offset < data.length) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        stream.push(null); // Signal end of stream
      };
      
      // Start pushing chunks asynchronously
      pushChunks().catch(err => {
        stream.destroy(err);
      });
      
      return { ok: true, value: stream };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [Mock] Download stream error for ${objectName}:`, errorMessage);
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
    await this.simulateDelay();
    
    if (this.shouldSimulateFailure()) {
      console.error(`❌ [Mock] Simulated download buffer failure for: ${objectName}`);
      return { ok: false, error: 'Simulated network error during download' };
    }
    
    const obj = this.storage.get(objectName);
    
    if (!obj) {
      console.warn(`⚠️ [Mock] Download buffer attempted for non-existent object: ${objectName}`);
      return { ok: false, error: `Object not found: ${objectName}` };
    }
    
    try {
      let data = obj.data;
      
      // Handle range requests if specified
      if (options?.range) {
        const start = options.range.start;
        const end = options.range.end ?? data.length - 1;
        data = data.slice(start, end + 1);
        console.log(`📥 [Mock] Downloaded range [${start}-${end}] of ${objectName}`);
      } else {
        console.log(`📥 [Mock] Downloaded buffer: ${objectName} (${data.length} bytes)`);
      }
      
      // Return a copy to simulate real storage behavior
      return { ok: true, value: Buffer.from(data) };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [Mock] Download buffer error for ${objectName}:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }
  
  /**
   * Get a signed URL (mock implementation returns a fake URL)
   */
  async getSignedUrl(
    objectName: string,
    expiresIn: number = 3600
  ): Promise<StorageResult<string>> {
    await this.simulateDelay();
    
    const obj = this.storage.get(objectName);
    
    if (!obj) {
      return { ok: false, error: `Object not found: ${objectName}` };
    }
    
    // Generate a mock signed URL
    const expiry = new Date(Date.now() + expiresIn * 1000).getTime();
    const signature = Buffer.from(`${objectName}-${expiry}`).toString('base64url');
    const url = `https://mock-storage.local/signed/${encodeURIComponent(objectName)}?signature=${signature}&expires=${expiry}`;
    
    console.log(`🔗 [Mock] Generated signed URL for ${objectName} (expires in ${expiresIn}s)`);
    return { ok: true, value: url };
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
    await this.simulateDelay();
    
    if (this.shouldSimulateFailure()) {
      console.error(`❌ [Mock] Simulated metadata failure for: ${objectName}`);
      return { ok: false, error: 'Simulated network error during metadata fetch' };
    }
    
    const obj = this.storage.get(objectName);
    
    if (!obj) {
      console.warn(`⚠️ [Mock] Metadata requested for non-existent object: ${objectName}`);
      return { ok: false, error: `Object not found: ${objectName}` };
    }
    
    console.log(`📄 [Mock] Retrieved metadata for: ${objectName}`);
    return {
      ok: true,
      value: {
        size: obj.metadata.size,
        contentType: obj.metadata.contentType,
        lastModified: obj.metadata.lastModified,
        metadata: obj.metadata.customMetadata
      }
    };
  }
  
  /**
   * Debug method to get storage stats
   */
  getStats(): {
    totalObjects: number;
    totalSize: number;
    objects: Array<{ name: string; size: number }>;
  } {
    let totalSize = 0;
    const objects: Array<{ name: string; size: number }> = [];
    
    // Convert to array for iteration
    const entries = Array.from(this.storage.entries());
    for (const [name, obj] of entries) {
      totalSize += obj.metadata.size;
      objects.push({ name, size: obj.metadata.size });
    }
    
    return {
      totalObjects: this.storage.size,
      totalSize,
      objects
    };
  }
  
  /**
   * Debug method to clear all storage
   */
  clearAll(): void {
    const count = this.storage.size;
    this.storage.clear();
    console.log(`🧹 [Mock] Cleared ${count} objects from storage`);
  }
}