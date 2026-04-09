/**
 * Storage client hook — returns null until an object-storage integration
 * is configured. The calling code already guards with `if (photoFile && storageClient)`.
 */
export interface StorageClient {
  putFile(bytes: Uint8Array): Promise<{ hash: string }>;
  getDirectURL(hash: string): Promise<string>;
}

export function useStorageClient(): StorageClient | null {
  return null;
}
