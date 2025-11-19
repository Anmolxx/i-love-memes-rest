import { ApiProperty } from '@nestjs/swagger';
import { TimeRangeResponseDto } from './time-range.dto';

export class SummaryMetricsDto {
  @ApiProperty({ example: 42 })
  totalMemes: number;

  @ApiProperty({ example: 38 })
  publicMemes: number;

  @ApiProperty({ example: 4 })
  privateMemes: number;

  @ApiProperty({ example: 1247 })
  totalUpvotes: number;

  @ApiProperty({ example: 23 })
  totalDownvotes: number;

  @ApiProperty({ example: 156 })
  totalComments: number;

  @ApiProperty({ example: 8934 })
  totalViews: number;

  @ApiProperty({ example: 15.8, description: 'Engagement rate percentage' })
  engagementRate: number;
}

export class RecentActivityDto {
  @ApiProperty({ example: 2 })
  memesPostedToday: number;

  @ApiProperty({ example: 8 })
  memesPostedThisWeek: number;

  @ApiProperty({ example: 23 })
  memesPostedThisMonth: number;
}

export class TopPerformingMemeDto {
  @ApiProperty()
  memeId: string;

  @ApiProperty()
  memeSlug: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  upvotes: number;

  @ApiProperty()
  engagementScore: number;

  @ApiProperty()
  createdAt: Date;
}

export class PerformanceTrendDataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  memesPosted: number;

  @ApiProperty()
  totalUpvotes: number;

  @ApiProperty()
  engagementRate: number;
}

export class PerformanceTrendDto {
  @ApiProperty({ example: 'LAST_30_DAYS' })
  period: string;

  @ApiProperty({ type: [PerformanceTrendDataPointDto] })
  dataPoints: PerformanceTrendDataPointDto[];
}

export class UserDashboardDto {
  @ApiProperty({ type: SummaryMetricsDto })
  summary: SummaryMetricsDto;

  @ApiProperty({ type: RecentActivityDto })
  recentActivity: RecentActivityDto;

  @ApiProperty({ type: [TopPerformingMemeDto] })
  topPerformingMemes: TopPerformingMemeDto[];

  @ApiProperty({ type: PerformanceTrendDto })
  performanceTrend: PerformanceTrendDto;
}

export class MemeMetricsDto {
  @ApiProperty()
  totalUpvotes: number;

  @ApiProperty()
  totalDownvotes: number;

  @ApiProperty()
  totalComments: number;

  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  engagementScore: number;

  @ApiProperty()
  viralityScore: number;
}

export class EngagementRatesDto {
  @ApiProperty({ description: 'Percentage of viewers who upvoted' })
  upvoteRate: number;

  @ApiProperty({ description: 'Percentage of viewers who commented' })
  commentRate: number;

  @ApiProperty({ description: 'Percentage of viewers who shared' })
  shareRate: number;
}

export class TimeSeriesDataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  upvotes: number;

  @ApiProperty()
  downvotes: number;

  @ApiProperty()
  comments: number;

  @ApiProperty()
  views: number;
}

export class PlatformComparisonDto {
  @ApiProperty()
  averageUpvotes: number;

  @ApiProperty()
  averageEngagementScore: number;

  @ApiProperty({ description: "This meme's rank percentile" })
  percentile: number;
}

export class MemePerformanceDto {
  @ApiProperty()
  memeId: string;

  @ApiProperty()
  memeSlug: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: MemeMetricsDto })
  metrics: MemeMetricsDto;

  @ApiProperty({ type: EngagementRatesDto })
  engagement: EngagementRatesDto;

  @ApiProperty({ type: [TimeSeriesDataPointDto] })
  timeSeriesData: TimeSeriesDataPointDto[];

  @ApiProperty({ type: PlatformComparisonDto, required: false })
  platformComparison?: PlatformComparisonDto;
}

export class ActivitySummaryDto {
  @ApiProperty()
  memesCreated: number;

  @ApiProperty()
  upvotesGiven: number;

  @ApiProperty()
  downvotesGiven: number;

  @ApiProperty()
  commentsPosted: number;

  @ApiProperty()
  memesViewed: number;
}

export class ActivityTrendDataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  memesCreated: number;

  @ApiProperty()
  upvotesGiven: number;

  @ApiProperty()
  commentsPosted: number;
}

export class MostActiveDayDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  activityCount: number;
}

export class MostUsedTemplateDto {
  @ApiProperty()
  templateId: string;

  @ApiProperty()
  templateName: string;

  @ApiProperty()
  usageCount: number;
}

export class UserActivityDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ type: TimeRangeResponseDto })
  timeRange: TimeRangeResponseDto;

  @ApiProperty({ type: ActivitySummaryDto })
  activitySummary: ActivitySummaryDto;

  @ApiProperty({ type: [ActivityTrendDataPointDto] })
  activityTrend: ActivityTrendDataPointDto[];

  @ApiProperty({ type: MostActiveDayDto })
  mostActiveDay: MostActiveDayDto;

  @ApiProperty({ type: [MostUsedTemplateDto] })
  mostUsedTemplates: MostUsedTemplateDto[];
}
