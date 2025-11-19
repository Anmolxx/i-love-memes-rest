import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ComparisonType, TrendDirection } from '../enums/stats.enum';
import {
  ComparisonPeriodDto,
  TimeRangeDto,
  TimeRangeResponseDto,
} from './time-range.dto';

export class TemplateUsageQueryDto extends TimeRangeDto {
  @ApiPropertyOptional({ enum: ComparisonType })
  @IsOptional()
  @IsEnum(ComparisonType)
  comparison?: ComparisonType;

  @ApiPropertyOptional({
    enum: ['usage', 'growth', 'adoption'],
    default: 'usage',
  })
  @IsOptional()
  @IsIn(['usage', 'growth', 'adoption'])
  sortBy?: string = 'usage';

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 50;
}

export class CurrentPeriodMetricsDto {
  @ApiProperty()
  usageCount: number;

  @ApiProperty()
  uniqueUsers: number;

  @ApiProperty()
  averageEngagement: number;
}

export class ComparisonMetricsDto {
  @ApiProperty({ description: 'Usage change percentage' })
  usageChange: number;

  @ApiProperty({ description: 'User growth percentage' })
  userGrowth: number;

  @ApiProperty({ description: 'Engagement change percentage' })
  engagementChange: number;

  @ApiProperty({ enum: TrendDirection })
  trend: TrendDirection;
}

export class UsageTrendDataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  usageCount: number;
}

export class TemplateMetricsDto {
  @ApiProperty()
  templateId: string;

  @ApiProperty()
  templateName: string;

  @ApiProperty()
  categoryName: string;

  @ApiProperty({ type: CurrentPeriodMetricsDto })
  currentPeriod: CurrentPeriodMetricsDto;

  @ApiPropertyOptional({ type: CurrentPeriodMetricsDto })
  previousPeriod?: CurrentPeriodMetricsDto;

  @ApiPropertyOptional({ type: ComparisonMetricsDto })
  comparison?: ComparisonMetricsDto;

  @ApiProperty({ type: [UsageTrendDataPointDto] })
  usageTrend: UsageTrendDataPointDto[];
}

export class TemplateUsageDto {
  @ApiProperty({ type: TimeRangeResponseDto })
  timeRange: TimeRangeResponseDto;

  @ApiPropertyOptional({ type: ComparisonPeriodDto })
  comparisonPeriod?: ComparisonPeriodDto;

  @ApiProperty()
  totalUsage: number;

  @ApiProperty()
  uniqueUsers: number;

  @ApiProperty({ type: [TemplateMetricsDto] })
  templates: TemplateMetricsDto[];
}

export class SystemHealthDto {
  @ApiProperty({ enum: ['HEALTHY', 'DEGRADED', 'CRITICAL'] })
  status: string;

  @ApiProperty({ description: 'Uptime in seconds' })
  uptime: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  requestsPerMinute: number;
}

export class ContentSummaryDto {
  @ApiProperty()
  totalMemes: number;

  @ApiProperty()
  memesToday: number;

  @ApiProperty()
  memesThisWeek: number;

  @ApiProperty()
  memesThisMonth: number;

  @ApiProperty()
  totalTemplates: number;

  @ApiProperty()
  activeTemplates: number;
}

export class UserSummaryDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  activeUsersToday: number;

  @ApiProperty()
  activeUsersThisWeek: number;

  @ApiProperty()
  activeUsersThisMonth: number;

  @ApiProperty()
  newUsersToday: number;

  @ApiProperty()
  newUsersThisWeek: number;
}

export class EngagementSummaryDto {
  @ApiProperty()
  totalInteractions: number;

  @ApiProperty()
  upvotesToday: number;

  @ApiProperty()
  downvotesToday: number;

  @ApiProperty()
  commentsToday: number;

  @ApiProperty()
  flagsToday: number;

  @ApiProperty()
  reportsToday: number;
}

export class ModerationQueueDto {
  @ApiProperty()
  pendingReports: number;

  @ApiProperty()
  pendingFlags: number;

  @ApiProperty()
  resolvedToday: number;
}

export class PlatformOverviewDto {
  @ApiProperty({ type: SystemHealthDto })
  systemHealth: SystemHealthDto;

  @ApiProperty({ type: ContentSummaryDto })
  contentSummary: ContentSummaryDto;

  @ApiProperty({ type: UserSummaryDto })
  userSummary: UserSummaryDto;

  @ApiProperty({ type: EngagementSummaryDto })
  engagementSummary: EngagementSummaryDto;

  @ApiProperty({ type: ModerationQueueDto })
  moderationQueue: ModerationQueueDto;
}
