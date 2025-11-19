import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { MetricType } from '../enums/stats.enum';
import { CacheUtil } from '../utils/cache.util';

@Injectable()
export class CacheManagerService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value || null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl || 300);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.error(`Cache del error for key ${key}:`, error);
    }
  }

  /**
   * Generate cache key and get value
   */
  async getWithKey<T>(
    prefix: string,
    params: Record<string, any>,
  ): Promise<T | null> {
    const key = CacheUtil.generateCacheKey(prefix, params);
    return this.get<T>(key);
  }

  /**
   * Generate cache key and set value
   */
  async setWithKey<T>(
    prefix: string,
    params: Record<string, any>,
    value: T,
    metricType?: MetricType,
  ): Promise<void> {
    const key = CacheUtil.generateCacheKey(prefix, params);
    const ttl = metricType
      ? CacheUtil.getTTLForMetricType(metricType)
      : CacheUtil.getTTLForEndpoint(prefix);
    await this.set(key, value, ttl);
  }

  /**
   * Invalidate cache by pattern (simplified - would need Redis SCAN in production)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Note: This is a simplified implementation
      // In production, you'd use Redis SCAN to find and delete matching keys
      console.log(`Invalidating cache pattern: ${pattern}`);
      // Implementation depends on cache-manager version and store
    } catch (error) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, error);
    }

    return Promise.resolve();
  }

  /**
   * Reset all cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.clear();
    } catch (error) {
      console.error('Cache reset error:', error);
    }
  }
}
