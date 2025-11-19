// filepath: src/stats/utils/cache.util.ts
export class CacheUtil {
  static generateCacheKey(prefix: string, params: Record<string, any>): string {
    const serialized = Object.keys(params)
      .sort()
      .map((k) => `${k}=${String(params[k])}`)
      .join('&');
    return `${prefix}:${serialized}`;
  }

  static getTTLForMetricType(metricType: string): number {
    switch (metricType) {
      case 'REAL_TIME':
        return 10;
      case 'DAILY':
        return 60 * 60 * 24;
      case 'HISTORICAL':
        return 60 * 60 * 24 * 7;
      case 'TRENDING':
        return 60 * 60;
      default:
        return 300;
    }
  }

  static getTTLForEndpoint(prefix: string): number {
    if (prefix.startsWith('user:')) return 300;
    if (prefix.startsWith('admin:')) return 60;
    return 300;
  }
}
