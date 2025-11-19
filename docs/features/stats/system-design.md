# System Design: Statistics & Analytics Module

## Technical Architecture

### Module Structure

```
src/stats/
├── stats.module.ts                    # Module definition and dependency injection
├── stats.controller.ts                # HTTP endpoints for stats APIs
├── stats.service.ts                   # Main orchestration service
├── domain/
│   ├── stats-summary.ts               # Domain entity for statistics summaries
│   ├── time-series-data.ts            # Domain entity for time-series metrics
│   ├── comparison-metrics.ts          # Domain entity for period comparisons
│   └── chart-data.ts                  # Domain entity for chart/graph data
├── dto/
│   ├── time-range.dto.ts              # Common time range query parameters
│   ├── period-comparison.dto.ts       # Period comparison request/response
│   ├── user-stats-response.dto.ts     # End user statistics responses
│   ├── admin-stats-response.dto.ts    # Admin statistics responses
│   ├── meme-stats.dto.ts              # Meme-specific statistics
│   ├── template-stats.dto.ts          # Template-specific statistics
│   ├── interaction-stats.dto.ts       # Interaction statistics
│   └── top-charts.dto.ts              # Top content charts
├── services/
│   ├── user-stats.service.ts          # User-specific statistics logic
│   ├── admin-stats.service.ts         # Admin platform-wide statistics
│   ├── meme-stats.service.ts          # Meme performance analytics
│   ├── template-stats.service.ts      # Template usage analytics
│   ├── interaction-stats.service.ts   # Interaction aggregation
│   ├── time-series.service.ts         # Time-series data processing
│   └── cache-manager.service.ts       # Statistics caching strategy
├── enums/
│   ├── time-period.enum.ts            # Time period types (daily, weekly, etc.)
│   ├── comparison-type.enum.ts        # Comparison types (WoW, MoM, YoY)
│   └── chart-type.enum.ts             # Chart/graph types
└── utils/
    ├── time-range.util.ts             # Time range calculation helpers
    ├── aggregation.util.ts            # Data aggregation utilities
    └── percentage.util.ts             # Percentage and growth calculation
```

### Database Schema Considerations

#### Existing Tables to Query

The Stats module primarily performs read operations on existing tables:

```sql
-- Memes table
memes (
  id UUID PRIMARY KEY,
  title VARCHAR,
  slug VARCHAR,
  author_id UUID,
  template_id UUID,
  audience VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
)

-- Interactions table
meme_interactions (
  id UUID PRIMARY KEY,
  meme_id UUID,
  user_id UUID,
  type VARCHAR,  -- UPVOTE, DOWNVOTE, FLAG, REPORT
  created_at TIMESTAMP
)

-- Templates table
meme_templates (
  id UUID PRIMARY KEY,
  name VARCHAR,
  category_id UUID,
  created_at TIMESTAMP,
  is_active BOOLEAN
)

-- Users table
users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  status_id INTEGER
)

-- Comments table (if tracking comment engagement)
comments (
  id UUID PRIMARY KEY,
  meme_id UUID,
  user_id UUID,
  created_at TIMESTAMP
)
```

#### Recommended Indexes for Performance

```sql
-- Composite indexes for time-series queries
CREATE INDEX idx_memes_created_at ON memes(created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_memes_author_created ON memes(author_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_memes_template_created ON memes(template_id, created_at) WHERE deleted_at IS NULL;

-- Interaction aggregation indexes
CREATE INDEX idx_interactions_meme_type ON meme_interactions(meme_id, type, created_at);
CREATE INDEX idx_interactions_created ON meme_interactions(created_at);
CREATE INDEX idx_interactions_type_created ON meme_interactions(type, created_at);

-- Template usage tracking
CREATE INDEX idx_memes_template_created_audience ON memes(template_id, created_at, audience) WHERE deleted_at IS NULL;

-- User activity tracking
CREATE INDEX idx_users_created_status ON users(created_at, status_id);
```

#### Optional: Materialized Views for Complex Aggregations

```sql
-- Daily meme statistics (refreshed nightly)
CREATE MATERIALIZED VIEW daily_meme_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_memes,
  COUNT(DISTINCT author_id) as unique_authors,
  COUNT(CASE WHEN audience = 'PUBLIC' THEN 1 END) as public_memes,
  COUNT(CASE WHEN audience = 'PRIVATE' THEN 1 END) as private_memes
FROM memes
WHERE deleted_at IS NULL
GROUP BY DATE_TRUNC('day', created_at);

-- Daily template usage (refreshed nightly)
CREATE MATERIALIZED VIEW daily_template_usage AS
SELECT 
  DATE_TRUNC('day', m.created_at) as date,
  m.template_id,
  t.name as template_name,
  COUNT(*) as usage_count,
  COUNT(DISTINCT m.author_id) as unique_users
FROM memes m
JOIN meme_templates t ON m.template_id = t.id
WHERE m.deleted_at IS NULL
GROUP BY DATE_TRUNC('day', m.created_at), m.template_id, t.name;

-- Daily interaction summary (refreshed hourly)
CREATE MATERIALIZED VIEW daily_interaction_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  type,
  COUNT(*) as interaction_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT meme_id) as unique_memes
FROM meme_interactions
GROUP BY DATE_TRUNC('day', created_at), type;
```

### Service Layer Architecture

#### Stats Service (Orchestrator)

```typescript
@Injectable()
export class StatsService {
  constructor(
    private readonly userStatsService: UserStatsService,
    private readonly adminStatsService: AdminStatsService,
    private readonly memeStatsService: MemeStatsService,
    private readonly templateStatsService: TemplateStatsService,
    private readonly interactionStatsService: InteractionStatsService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  // Delegates to appropriate specialized service
  // Implements caching strategy
  // Handles error cases and fallbacks
}
```

#### User Stats Service (End User Metrics)

**Responsibilities**:

- Personal meme performance tracking
- User activity history
- Individual meme statistics
- Comparative performance against platform averages

**Key Methods**:

```typescript
async getUserDashboard(userId: string): Promise<UserDashboardDto>
async getUserMemeStats(userId: string, timeRange: TimeRangeDto): Promise<UserMemeStatsDto>
async getMemePerformance(memeId: string, userId: string): Promise<MemePerformanceDto>
async getUserActivity(userId: string, timeRange: TimeRangeDto): Promise<UserActivityDto>
```

#### Admin Stats Service (Platform Analytics)

**Responsibilities**:

- Platform-wide overview metrics
- System health indicators
- User growth and retention
- Content moderation statistics

**Key Methods**:

```typescript
async getPlatformOverview(): Promise<PlatformOverviewDto>
async getUserGrowthStats(timeRange: TimeRangeDto, comparison: ComparisonType): Promise<GrowthStatsDto>
async getContentModerationStats(timeRange: TimeRangeDto): Promise<ModerationStatsDto>
async getSystemHealthMetrics(): Promise<SystemHealthDto>
```

#### Meme Stats Service (Content Performance)

**Responsibilities**:

- Meme engagement aggregation
- Trending meme identification
- Top charts generation
- Performance scoring

**Key Methods**:

```typescript
async getTopMemes(timeRange: TimeRangeDto, limit: number): Promise<TopMemesDto>
async getTrendingMemes(limit: number): Promise<TrendingMemesDto>
async getMemeEngagementStats(memeId: string): Promise<EngagementStatsDto>
async getDailyTopMemesForPeriod(days: number): Promise<DailyTopChartsDto>
```

#### Template Stats Service (Template Analytics)

**Responsibilities**:

- Template usage tracking
- Adoption rate calculation
- Popular template identification
- Comparative period analysis

**Key Methods**:

```typescript
async getTemplateUsage(timeRange: TimeRangeDto, comparison: ComparisonType): Promise<TemplateUsageDto>
async getTopTemplates(timeRange: TimeRangeDto, limit: number): Promise<TopTemplatesDto>
async getTemplateAdoptionRate(templateId: string, timeRange: TimeRangeDto): Promise<AdoptionRateDto>
async getTemplateUsageComparison(templateId: string, comparisonType: ComparisonType): Promise<ComparisonDto>
```

#### Interaction Stats Service (Engagement Metrics)

**Responsibilities**:

- Interaction type aggregation (upvotes, downvotes, flags, reports)
- Engagement rate calculations
- User interaction patterns
- Moderation metrics

**Key Methods**:

```typescript
async getInteractionSummary(memeId: string): Promise<InteractionSummaryDto>
async getInteractionTrends(timeRange: TimeRangeDto): Promise<InteractionTrendsDto>
async getFlaggedContentStats(timeRange: TimeRangeDto): Promise<FlaggedStatsDto>
async getUserInteractionActivity(userId: string): Promise<UserInteractionDto>
```

#### Time Series Service (Temporal Analysis)

**Responsibilities**:

- Time range calculation and validation
- Period comparison logic (WoW, MoM, QoQ, YoY)
- Data point aggregation by granularity (hourly, daily, weekly, monthly)
- Growth rate and percentage calculations

**Key Methods**:

```typescript
calculateTimeRange(period: TimePeriod, endDate?: Date): TimeRangeDto
calculateComparisonPeriod(currentRange: TimeRangeDto, comparison: ComparisonType): TimeRangeDto
aggregateDataPoints<T>(data: T[], granularity: Granularity): AggregatedData<T>[]
calculateGrowthRate(current: number, previous: number): GrowthMetrics
```

#### Cache Manager Service (Performance Optimization)

**Responsibilities**:

- Cache key generation
- TTL management by metric type
- Cache warming for frequently accessed data
- Cache invalidation strategies

**Key Methods**:

```typescript
async get<T>(key: string): Promise<T | null>
async set<T>(key: string, value: T, ttl?: number): Promise<void>
async invalidate(pattern: string): Promise<void>
async warmCache(keys: string[]): Promise<void>
generateCacheKey(prefix: string, params: Record<string, any>): string
getTTLForMetricType(metricType: MetricType): number
```

## API Contract Definitions

### End User Endpoints

#### GET /stats/user/dashboard

**Description**: Retrieve personalized dashboard statistics for the authenticated user.

**Authentication**: Required (JWT)

**Response Schema**:

```typescript
interface UserDashboardDto {
  summary: {
    totalMemes: number;
    publicMemes: number;
    privateMemes: number;
    totalUpvotes: number;
    totalDownvotes: number;
    totalComments: number;
    totalViews: number;
    engagementRate: number; // Percentage
  };
  recentActivity: {
    memesPostedToday: number;
    memesPostedThisWeek: number;
    memesPostedThisMonth: number;
  };
  topPerformingMemes: Array<{
    memeId: string;
    memeSlug: string;
    title: string;
    upvotes: number;
    engagementScore: number;
    createdAt: Date;
  }>;
  performanceTrend: {
    period: 'LAST_30_DAYS';
    dataPoints: Array<{
      date: Date;
      memesPosted: number;
      totalUpvotes: number;
      engagementRate: number;
    }>;
  };
}
```

#### GET /stats/user/memes/:id/performance

**Description**: Get detailed performance metrics for a specific meme owned by the user.

**Authentication**: Required (JWT)

**Path Parameters**:

- `id`: Meme ID or slug

**Query Parameters**:

- `includeComparisons`: boolean (optional, default: false) - Include platform average comparisons

**Response Schema**:

```typescript
interface MemePerformanceDto {
  memeId: string;
  memeSlug: string;
  title: string;
  createdAt: Date;
  metrics: {
    totalUpvotes: number;
    totalDownvotes: number;
    totalComments: number;
    totalViews: number;
    engagementScore: number;
    viralityScore: number;
  };
  engagement: {
    upvoteRate: number; // Percentage of viewers who upvoted
    commentRate: number; // Percentage of viewers who commented
    shareRate: number;
  };
  timeSeriesData: Array<{
    date: Date;
    upvotes: number;
    downvotes: number;
    comments: number;
    views: number;
  }>;
  platformComparison?: {
    averageUpvotes: number;
    averageEngagementScore: number;
    percentile: number; // This meme's rank percentile
  };
}
```

#### GET /stats/user/activity

**Description**: User activity statistics over a specified time range.

**Authentication**: Required (JWT)

**Query Parameters**:

- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `period`: 'DAILY' | 'WEEKLY' | 'MONTHLY' (default: 'DAILY')

**Response Schema**:

```typescript
interface UserActivityDto {
  userId: string;
  timeRange: {
    startDate: Date;
    endDate: Date;
    period: TimePeriod;
  };
  activitySummary: {
    memesCreated: number;
    upvotesGiven: number;
    downvotesGiven: number;
    commentsPosted: number;
    memesViewed: number;
  };
  activityTrend: Array<{
    date: Date;
    memesCreated: number;
    upvotesGiven: number;
    commentsPosted: number;
  }>;
  mostActiveDay: {
    date: Date;
    activityCount: number;
  };
  mostUsedTemplates: Array<{
    templateId: string;
    templateName: string;
    usageCount: number;
  }>;
}
```

### Admin Endpoints

#### GET /stats/admin/overview

**Description**: Platform-wide overview dashboard for administrators.

**Authentication**: Required (JWT + Admin Role)

**Response Schema**:

```typescript
interface PlatformOverviewDto {
  systemHealth: {
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    uptime: number; // Seconds
    activeUsers: number;
    requestsPerMinute: number;
  };
  contentSummary: {
    totalMemes: number;
    memesToday: number;
    memesThisWeek: number;
    memesThisMonth: number;
    totalTemplates: number;
    activeTemplates: number;
  };
  userSummary: {
    totalUsers: number;
    activeUsersToday: number;
    activeUsersThisWeek: number;
    activeUsersThisMonth: number;
    newUsersToday: number;
    newUsersThisWeek: number;
  };
  engagementSummary: {
    totalInteractions: number;
    upvotesToday: number;
    downvotesToday: number;
    commentsToday: number;
    flagsToday: number;
    reportsToday: number;
  };
  moderationQueue: {
    pendingReports: number;
    pendingFlags: number;
    resolvedToday: number;
  };
}
```

#### GET /stats/admin/templates/usage

**Description**: Template usage analytics with comparative period analysis.

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**:

- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `comparison`: 'WOW' | 'MOM' | 'QOQ' | 'YOY' (optional)
- `sortBy`: 'usage' | 'growth' | 'adoption' (default: 'usage')
- `limit`: number (default: 50)

**Response Schema**:

```typescript
interface TemplateUsageDto {
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  comparisonPeriod?: {
    startDate: Date;
    endDate: Date;
    type: ComparisonType;
  };
  totalUsage: number;
  uniqueUsers: number;
  templates: Array<{
    templateId: string;
    templateName: string;
    categoryName: string;
    currentPeriod: {
      usageCount: number;
      uniqueUsers: number;
      averageEngagement: number;
    };
    previousPeriod?: {
      usageCount: number;
      uniqueUsers: number;
      averageEngagement: number;
    };
    comparison?: {
      usageChange: number; // Percentage
      userGrowth: number; // Percentage
      engagementChange: number; // Percentage
      trend: 'UP' | 'DOWN' | 'STABLE';
    };
    usageTrend: Array<{
      date: Date;
      usageCount: number;
    }>;
  }>;
}
```

#### GET /stats/admin/top-charts

**Description**: Top meme charts with daily breakdowns for a specified period.

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**:

- `days`: number (default: 30, max: 90) - Number of days to retrieve
- `limit`: number (default: 10, max: 50) - Top memes per day

**Response Schema**:

```typescript
interface DailyTopChartsDto {
  period: {
    startDate: Date;
    endDate: Date;
    totalDays: number;
  };
  dailyCharts: Array<{
    date: Date;
    topMemes: Array<{
      rank: number;
      memeId: string;
      memeSlug: string;
      title: string;
      authorId: string;
      authorName: string;
      metrics: {
        upvotes: number;
        downvotes: number;
        comments: number;
        engagementScore: number;
      };
      templateName: string;
      categoryName: string;
    }>;
    summary: {
      totalMemes: number;
      totalUpvotes: number;
      averageEngagement: number;
    };
  }>;
  overallTopMemes: Array<{
    memeId: string;
    memeSlug: string;
    title: string;
    totalUpvotes: number;
    averageRank: number;
    daysInTop: number;
  }>;
}
```

#### GET /stats/admin/users/growth

**Description**: User growth and retention metrics with comparative analysis.

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**:

- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `comparison`: 'WOW' | 'MOM' | 'QOQ' | 'YOY' (optional)
- `granularity`: 'DAILY' | 'WEEKLY' | 'MONTHLY' (default: 'DAILY')

**Response Schema**:

```typescript
interface UserGrowthDto {
  timeRange: {
    startDate: Date;
    endDate: Date;
    granularity: Granularity;
  };
  comparisonPeriod?: {
    startDate: Date;
    endDate: Date;
    type: ComparisonType;
  };
  currentPeriod: {
    newUsers: number;
    activeUsers: number;
    retainedUsers: number;
    churnedUsers: number;
    retentionRate: number; // Percentage
    churnRate: number; // Percentage
  };
  previousPeriod?: {
    newUsers: number;
    activeUsers: number;
    retainedUsers: number;
    churnedUsers: number;
    retentionRate: number;
    churnRate: number;
  };
  comparison?: {
    newUsersChange: number; // Percentage
    activeUsersChange: number; // Percentage
    retentionRateChange: number; // Percentage points
    trend: 'UP' | 'DOWN' | 'STABLE';
  };
  growthTrend: Array<{
    date: Date;
    newUsers: number;
    activeUsers: number;
    cumulativeUsers: number;
  }>;
  cohortAnalysis: Array<{
    cohortDate: Date;
    cohortSize: number;
    retentionRates: {
      week1: number;
      week2: number;
      week4: number;
      month3: number;
    };
  }>;
}
```

#### GET /stats/admin/interactions/summary

**Description**: Interaction statistics summary and trends.

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**:

- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `interactionType`: 'UPVOTE' | 'DOWNVOTE' | 'FLAG' | 'REPORT' | 'ALL' (default: 'ALL')

**Response Schema**:

```typescript
interface InteractionStatsDto {
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  interactionType: InteractionType | 'ALL';
  summary: {
    totalInteractions: number;
    upvotes: number;
    downvotes: number;
    flags: number;
    reports: number;
    uniqueUsers: number;
    uniqueMemes: number;
    averageInteractionsPerMeme: number;
    averageInteractionsPerUser: number;
  };
  trends: Array<{
    date: Date;
    upvotes: number;
    downvotes: number;
    flags: number;
    reports: number;
    netEngagement: number; // upvotes - downvotes
  }>;
  topInteractedMemes: Array<{
    memeId: string;
    memeSlug: string;
    title: string;
    totalInteractions: number;
    upvotes: number;
    downvotes: number;
    engagementScore: number;
  }>;
  mostActiveUsers: Array<{
    userId: string;
    username: string;
    totalInteractions: number;
    breakdown: {
      upvotes: number;
      downvotes: number;
      flags: number;
      reports: number;
    };
  }>;
}
```

## Caching Strategy

### Cache Key Patterns

```typescript
// User stats
user:dashboard:{userId}
user:meme:performance:{memeId}:{userId}
user:activity:{userId}:{startDate}:{endDate}

// Admin stats
admin:overview
admin:templates:usage:{startDate}:{endDate}:{comparison}
admin:top:charts:{days}:{limit}
admin:users:growth:{startDate}:{endDate}:{comparison}
admin:interactions:{startDate}:{endDate}:{type}

// Meme stats
meme:engagement:{memeId}
meme:trending:{limit}
meme:top:{timeRange}:{limit}

// Template stats
template:usage:{templateId}:{timeRange}
template:top:{timeRange}:{limit}
```

### TTL Configuration

```typescript
enum CacheTTL {
  REAL_TIME = 60,           // 1 minute - live data
  SHORT_TERM = 300,         // 5 minutes - frequently changing
  MEDIUM_TERM = 3600,       // 1 hour - daily stats
  LONG_TERM = 86400,        // 24 hours - historical data
  VERY_LONG_TERM = 604800,  // 7 days - archived data
}

const TTL_MAP = {
  'user:dashboard': CacheTTL.SHORT_TERM,
  'user:meme:performance': CacheTTL.MEDIUM_TERM,
  'admin:overview': CacheTTL.REAL_TIME,
  'admin:templates:usage': CacheTTL.MEDIUM_TERM,
  'admin:top:charts': CacheTTL.LONG_TERM,
  'meme:trending': CacheTTL.SHORT_TERM,
  'template:usage': CacheTTL.MEDIUM_TERM,
};
```

### Cache Invalidation Strategy

**Event-Based Invalidation**:

- When a new meme is created → Invalidate user dashboard, admin overview
- When an interaction is created/removed → Invalidate meme engagement, user dashboard
- When a user is created → Invalidate admin user growth stats
- When content is moderated → Invalidate admin moderation stats

**Time-Based Invalidation**:

- Real-time metrics: Auto-expire after TTL
- Historical metrics: Invalidate at day boundaries (midnight UTC)
- Trending data: Invalidate every 5 minutes

## Performance Optimization Strategies

### Query Optimization

1. **Use Indexed Columns**: All WHERE clauses should use indexed columns
2. **Limit Result Sets**: Apply pagination and TOP N queries
3. **Avoid N+1 Queries**: Use JOIN operations or batch loading
4. **Use COUNT Estimates**: For large tables, use approximate counts when exact counts aren't critical
5. **Partition Time-Series Data**: Partition tables by date for faster range queries

### Aggregation Strategies

1. **Pre-Computed Aggregates**: Use materialized views or scheduled jobs
2. **Incremental Updates**: Update aggregates incrementally rather than full recalculation
3. **Sampling**: For very large datasets, use statistical sampling
4. **Approximate Algorithms**: Use HyperLogLog for unique counts, Count-Min Sketch for frequencies

### Connection Pooling

```typescript
// Database connection pool configuration
{
  max: 20,  // Maximum connections
  min: 5,   // Minimum connections
  idle: 10000,  // Idle timeout (10 seconds)
  acquire: 30000,  // Acquire timeout (30 seconds)
}
```

## Error Handling

### Common Error Scenarios

1. **Database Timeout**: Return cached data with warning flag
2. **Cache Miss**: Fall back to database query
3. **Invalid Date Range**: Return 400 Bad Request with validation error
4. **Unauthorized Access**: Return 403 Forbidden
5. **Resource Not Found**: Return 404 Not Found
6. **Rate Limiting**: Return 429 Too Many Requests

### Graceful Degradation

```typescript
async getStatistics(params: StatsQueryDto): Promise<StatsResponseDto> {
  try {
    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const data = await this.fetchFromDatabase(params);
    await this.cacheManager.set(cacheKey, data);
    return data;
  } catch (error) {
    // Log error
    this.logger.error('Failed to fetch statistics', error);

    // Return stale cache if available
    const stale = await this.cacheManager.getStale(cacheKey);
    if (stale) {
      return {
        ...stale,
        _metadata: { stale: true, lastUpdated: stale._cachedAt },
      };
    }

    // Return empty/default data
    return this.getDefaultResponse(params);
  }
}
```

## Testing Strategy

### Unit Tests

- Test individual calculation functions (growth rate, percentages, aggregations)
- Test date range calculations and comparisons
- Test cache key generation
- Mock repository calls

### Integration Tests

- Test database queries with test data
- Test cache integration
- Test API endpoints with authentication
- Test error scenarios and edge cases

### Performance Tests

- Load test with concurrent requests
- Stress test with large datasets
- Cache performance benchmarking
- Query execution time monitoring

## Monitoring & Observability

### Metrics to Track

- API response times (p50, p95, p99)
- Cache hit/miss rates
- Database query execution times
- Error rates by endpoint
- Request volume by endpoint
- Cache memory usage
- Database connection pool utilization

### Logging Strategy

```typescript
// Structured logging for statistics queries
this.logger.log({
  action: 'FETCH_STATS',
  endpoint: '/stats/admin/overview',
  userId: request.user.id,
  executionTime: duration,
  cacheHit: false,
  recordsReturned: result.length,
});
```

### Alerting Thresholds

- Response time > 2 seconds → Warning
- Error rate > 5% → Critical
- Cache hit rate < 50% → Warning
- Database connection pool > 80% → Warning
