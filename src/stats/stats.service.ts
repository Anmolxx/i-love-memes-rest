import { Injectable } from '@nestjs/common';
import { PlatformOverviewDto } from './dto/admin-stats-response.dto';
import { TimeRangeDto } from './dto/time-range.dto';
import {
  MemePerformanceDto,
  UserActivityDto,
  UserDashboardDto,
} from './dto/user-stats-response.dto';
import { MetricType } from './enums/stats.enum';
import { AdminStatsService } from './services/admin-stats.service';
import { CacheManagerService } from './services/cache-manager.service';
import { UserStatsService } from './services/user-stats.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly cacheManager: CacheManagerService,
    private readonly userStatsService: UserStatsService,
    private readonly adminStatsService: AdminStatsService,
  ) {}

  /**
   * Get user dashboard with caching
   */
  async getUserDashboard(userId: string): Promise<UserDashboardDto> {
    const cacheKey = `user:dashboard:${userId}`;

    // Try cache first
    const cached = await this.cacheManager.get<UserDashboardDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from service
    const data = await this.userStatsService.getUserDashboard(userId);

    // Cache result
    await this.cacheManager.set(cacheKey, data, 300); // 5 minutes TTL

    return data;
  }

  /**
   * Get meme performance with caching
   */
  async getMemePerformance(
    memeId: string,
    userId: string,
    includeComparisons: boolean,
  ): Promise<MemePerformanceDto> {
    const cacheKey = `user:meme:performance:${memeId}:${userId}:${includeComparisons}`;

    const cached = await this.cacheManager.get<MemePerformanceDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.userStatsService.getMemePerformance(
      memeId,
      userId,
      includeComparisons,
    );

    await this.cacheManager.set(cacheKey, data, 3600); // 1 hour TTL

    return data;
  }

  /**
   * Get user activity with caching
   */
  async getUserActivity(
    userId: string,
    query: TimeRangeDto,
  ): Promise<UserActivityDto> {
    const cacheParams = {
      userId,
      startDate: query.startDate || 'default',
      endDate: query.endDate || 'default',
      period: query.period || 'DAILY',
    };

    const cached = await this.cacheManager.getWithKey<UserActivityDto>(
      'user:activity',
      cacheParams,
    );
    if (cached) {
      return cached;
    }

    const data = await this.userStatsService.getUserActivity(userId, query);

    await this.cacheManager.setWithKey(
      'user:activity',
      cacheParams,
      data,
      MetricType.DAILY,
    );

    return data;
  }

  /**
   * Get platform overview with caching
   */
  async getPlatformOverview(): Promise<PlatformOverviewDto> {
    const cacheKey = 'admin:overview';

    const cached = await this.cacheManager.get<PlatformOverviewDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.adminStatsService.getPlatformOverview();

    await this.cacheManager.set(cacheKey, data, 60); // 1 minute TTL

    return data;
  }

  /**
   * Invalidate cache for user
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.cacheManager.invalidatePattern(`user:*:${userId}`);
  }

  /**
   * Invalidate admin cache
   */
  async invalidateAdminCache(): Promise<void> {
    await this.cacheManager.invalidatePattern('admin:*');
  }
}
