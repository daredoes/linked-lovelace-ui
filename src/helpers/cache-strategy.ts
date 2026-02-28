import { DashboardConfig } from '../types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number; // TTL in milliseconds
}

export interface CacheConfig {
  defaultTTL: number; // Default cache expiration
  maxEntries: number; // Maximum number of cache entries
}

/**
 * Generic cache strategy for storing and retrieving data with TTL
 */
export class Cache {
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = {
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      maxEntries: config.maxEntries || 1000,
    };
  }

  /**
   * Removes expired entries from cache
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Retrieves a value from cache by key
   * @param key - Cache key
   * @returns The cached data or null if not found/expired
   */
  public get<T>(key: string): T | null {
    this.cleanExpiredEntries();
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.timestamp + entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stores a value in cache with specified TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (uses default if not specified)
   */
  public set<T>(key: string, data: T, ttl: number = this.config.defaultTTL): void {
    if (this.cache.size >= this.config.maxEntries) {
      // Remove oldest entry (first one in Map)
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: ttl,
    });
  }

  /**
   * Deletes a specific cache entry
   * @param key - Cache key to delete
   */
  public delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Checks if a key exists in cache
   * @param key - Cache key
   * @returns true if key exists and is not expired
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Returns the number of entries in cache (after cleanup)
   */
  public size(): number {
    this.cleanExpiredEntries();
    return this.cache.size;
  }

  /**
   * Clears all cache entries
   */
  public clear(): void {
    this.cache.clear();
  }
}

export default Cache;
