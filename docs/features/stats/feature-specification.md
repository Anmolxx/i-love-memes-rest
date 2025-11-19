# Feature Specification: Statistics & Analytics Dashboard

## Business Impact Analysis

### Manufacturing Process Improvement

The Statistics & Analytics feature transforms raw platform data into actionable insights, enabling data-driven decision-making for both content creators and platform administrators. This feature serves as the intelligence layer that drives content optimization, user engagement, and platform growth.

**Process Improvements**:

- **Content Optimization**: Users can identify high-performing content patterns and replicate success
- **Template Management**: Administrators can track template adoption and deprecate underperforming assets
- **User Engagement**: Real-time metrics enable quick response to trending content and user behavior
- **Moderation Efficiency**: Flagged content statistics help prioritize moderation efforts
- **Growth Tracking**: User acquisition and retention metrics guide marketing strategies

**Expected Efficiency Gains**:

- **30% reduction** in time to identify trending content (from manual analysis to automated dashboards)
- **50% improvement** in content moderation efficiency through prioritized queue management
- **40% increase** in user engagement through personalized performance insights
- **25% better** template utilization through data-driven template recommendations

**Cost Reduction Estimates**:

- **$15,000/year** saved in manual analytics and reporting labor
- **$8,000/year** reduction in infrastructure costs through query optimization
- **$5,000/year** saved in third-party analytics tool subscriptions

**Quality Enhancement Metrics**:

- **Data Accuracy**: 99.9% accuracy in statistical calculations
- **Data Freshness**: Real-time metrics updated within 5 minutes
- **Report Reliability**: 99.5% uptime for statistics endpoints
- **User Satisfaction**: Target 85%+ satisfaction score for dashboard usability

## Database Schema Changes

### No New Tables Required

The Statistics module operates as a **read-only aggregation layer** over existing tables. No new persistent storage is required as all statistics are computed on-demand or cached temporarily.

### Required Indexes (Performance Optimization)

```sql
-- Memes table indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_memes_created_at 
ON memes(created_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_memes_author_created 
ON memes(author_id, created_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_memes_template_created 
ON memes(template_id, created_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_memes_template_audience_created 
ON memes(template_id, audience, created_at) 
WHERE deleted_at IS NULL;

-- Interaction indexes for aggregation queries
CREATE INDEX IF NOT EXISTS idx_interactions_meme_type_created 
ON meme_interactions(meme_id, type, created_at);

CREATE INDEX IF NOT EXISTS idx_interactions_created_type 
ON meme_interactions(created_at, type);

CREATE INDEX IF NOT EXISTS idx_interactions_user_created 
ON meme_interactions(user_id, created_at);

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_users_created_status 
ON users(created_at, status_id);

-- Comments indexes (if tracking engagement)
CREATE INDEX IF NOT EXISTS idx_comments_meme_created 
ON comments(meme_id, created_at);

CREATE INDEX IF NOT EXISTS idx_comments_user_created 
ON comments(user_id, created_at);
```

### Optional: Materialized Views (Advanced Optimization)

For production environments with high query volume, consider these materialized views:

```sql
-- Daily meme aggregates (refresh: nightly at 00:30 UTC)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_meme_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as stat_date,
  COUNT(*) as total_memes,
  COUNT(DISTINCT author_id) as unique_authors,
  COUNT(CASE WHEN audience = 'PUBLIC' THEN 1 END) as public_memes,
  COUNT(CASE WHEN audience = 'PRIVATE' THEN 1 END) as private_memes,
  COUNT(DISTINCT template_id) as templates_used
FROM memes
WHERE deleted_at IS NULL
GROUP BY DATE_TRUNC('day', created_at);

CREATE UNIQUE INDEX ON mv_daily_meme_stats(stat_date);

-- Daily template usage (refresh: nightly at 00:45 UTC)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_template_usage AS
SELECT 
  DATE_TRUNC('day', m.created_at) as stat_date,
  m.template_id,
  t.name as template_name,
  t.category_id,
  COUNT(*) as usage_count,
  COUNT(DISTINCT m.author_id) as unique_users
FROM memes m
JOIN meme_templates t ON m.template_id = t.id
WHERE m.deleted_at IS NULL
GROUP BY DATE_TRUNC('day', m.created_at), m.template_id, t.name, t.category_id;

CREATE INDEX ON mv_daily_template_usage(stat_date, template_id);

-- Daily interaction aggregates (refresh: hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_interaction_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as stat_date,
  type as interaction_type,
  COUNT(*) as interaction_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT meme_id) as unique_memes
FROM meme_interactions
GROUP BY DATE_TRUNC('day', created_at), type;

CREATE INDEX ON mv_daily_interaction_stats(stat_date, interaction_type);
```

## UI Modifications

### End User Dashboard

**New Route**: `/dashboard/stats` (authenticated users only)

**Components**:

1. **Summary Cards** (top of page)
   - Total Memes Created
   - Total Upvotes Received
   - Engagement Rate
   - Top Meme (this month)

2. **Performance Chart** (line chart)
   - X-axis: Date (last 30 days)
   - Y-axis: Engagement metrics (upvotes, comments)
   - Interactive tooltips with daily details

3. **Top Memes Table**
   - Columns: Meme Title, Created Date, Upvotes, Engagement Score
   - Click to view detailed performance
   - Sort by different metrics

4. **Template Usage Chart** (pie chart)
   - Shows distribution of templates used
   - Interactive segments with usage counts

5. **Activity Heatmap** (calendar view)
   - Color intensity represents activity level
   - Hover to see daily meme counts

**Individual Meme Performance Page**

**Route**: `/memes/:slug/stats` (owner only)

**Components**:

1. **Metric Cards**
   - Upvotes, Downvotes, Comments, Views
   - Comparison with personal average

2. **Engagement Timeline** (area chart)
   - Upvotes and comments over time since creation
   - Identify viral moments

3. **Audience Demographics** (bar chart)
   - Viewer distribution (if tracking is enabled)
   - Peak viewing times

4. **Performance Comparison**
   - How this meme ranks among user's content
   - Platform average comparison (percentile)

### Admin Dashboard

**New Route**: `/admin/analytics` (admin role required)

**Sections**:

1. **Platform Overview** (landing page)
   - System Health Indicator
   - Real-time Metrics (active users, requests/min)
   - Content Summary (memes today/week/month)
   - User Growth Summary
   - Moderation Queue Status

2. **Template Analytics** (`/admin/analytics/templates`)
   - Template Usage Table with sorting
   - Comparative Period Selector (WoW, MoM, QoQ, YoY)
   - Usage Trend Charts
   - Top Templates by Category
   - Template Adoption Rate over Time

3. **Top Memes Charts** (`/admin/analytics/top-charts`)
   - Date Range Selector (last 7/30/90 days)
   - Daily Top 10 Memes List
   - Overall Top Performers
   - Trending Score Visualization
   - Export functionality (CSV)

4. **User Analytics** (`/admin/analytics/users`)
   - User Growth Chart (daily/weekly/monthly)
   - Retention Cohort Analysis
   - Active Users Metrics (DAU, WAU, MAU)
   - User Segmentation (creators vs. viewers)
   - Churn Rate Tracking

5. **Engagement Analytics** (`/admin/analytics/engagement`)
   - Interaction Trends (upvotes, downvotes, comments)
   - Net Engagement Score over Time
   - Most Engaged Content
   - Most Active Users
   - Flagged Content Statistics

**UI Components to Build**:

```typescript
// React/Vue component examples
<StatsCard title="Total Memes" value={stats.totalMemes} change={+12.5} />
<LineChart data={performanceData} xKey="date" yKeys={['upvotes', 'comments']} />
<PieChart data={templateUsage} labelKey="name" valueKey="count" />
<DataTable columns={memeColumns} data={topMemes} sortable paginated />
<DateRangePicker onChange={handleDateChange} presets={['7d', '30d', '90d']} />
<ComparisonSelector options={['WoW', 'MoM', 'QoQ', 'YoY']} onChange={handleComparisonChange} />
<HeatmapCalendar data={activityData} colorScale={['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']} />
```

## API Changes

### New Controller: `StatsController`

**Base Path**: `/api/v1/stats`

**Authentication**: All endpoints require JWT authentication

**Rate Limiting**: 
- User endpoints: 60 requests/minute
- Admin endpoints: 120 requests/minute

### New Endpoints

#### End User Endpoints

```typescript
// GET /stats/user/dashboard
@Get('user/dashboard')
@UseGuards(AuthGuard('jwt'))
@ApiOperation({ summary: 'Get user dashboard statistics' })
@ApiOkResponse({ type: UserDashboardDto })
async getUserDashboard(@CurrentUser() user: User): Promise<UserDashboardDto>

// GET /stats/user/memes/:id/performance
@Get('user/memes/:id/performance')
@UseGuards(AuthGuard('jwt'))
@ApiOperation({ summary: 'Get individual meme performance metrics' })
@ApiParam({ name: 'id', description: 'Meme ID or slug' })
@ApiQuery({ name: 'includeComparisons', type: Boolean, required: false })
@ApiOkResponse({ type: MemePerformanceDto })
async getMemePerformance(
  @Param('id') memeId: string,
  @CurrentUser() user: User,
  @Query('includeComparisons') includeComparisons?: boolean,
): Promise<MemePerformanceDto>

// GET /stats/user/activity
@Get('user/activity')
@UseGuards(AuthGuard('jwt'))
@ApiOperation({ summary: 'Get user activity statistics' })
@ApiQuery({ name: 'startDate', type: String, required: false })
@ApiQuery({ name: 'endDate', type: String, required: false })
@ApiQuery({ name: 'period', enum: TimePeriod, required: false })
@ApiOkResponse({ type: UserActivityDto })
async getUserActivity(
  @CurrentUser() user: User,
  @Query() timeRange: TimeRangeDto,
): Promise<UserActivityDto>
```

#### Admin Endpoints

```typescript
// GET /stats/admin/overview
@Get('admin/overview')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.Admin)
@ApiOperation({ summary: 'Get platform overview statistics' })
@ApiOkResponse({ type: PlatformOverviewDto })
async getAdminOverview(): Promise<PlatformOverviewDto>

// GET /stats/admin/templates/usage
@Get('admin/templates/usage')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.Admin)
@ApiOperation({ summary: 'Get template usage analytics' })
@ApiQuery({ name: 'startDate', type: String, required: false })
@ApiQuery({ name: 'endDate', type: String, required: false })
@ApiQuery({ name: 'comparison', enum: ComparisonType, required: false })
@ApiQuery({ name: 'sortBy', enum: ['usage', 'growth', 'adoption'], required: false })
@ApiQuery({ name: 'limit', type: Number, required: false })
@ApiOkResponse({ type: TemplateUsageDto })
async getTemplateUsage(
  @Query() query: TemplateUsageQueryDto,
): Promise<TemplateUsageDto>

// GET /stats/admin/top-charts
@Get('admin/top-charts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.Admin)
@ApiOperation({ summary: 'Get top meme charts with daily breakdown' })
@ApiQuery({ name: 'days', type: Number, required: false, description: 'Number of days (max 90)' })
@ApiQuery({ name: 'limit', type: Number, required: false, description: 'Top N memes per day (max 50)' })
@ApiOkResponse({ type: DailyTopChartsDto })
async getTopCharts(
  @Query('days') days: number = 30,
  @Query('limit') limit: number = 10,
): Promise<DailyTopChartsDto>

// GET /stats/admin/users/growth
@Get('admin/users/growth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.Admin)
@ApiOperation({ summary: 'Get user growth and retention metrics' })
@ApiQuery({ name: 'startDate', type: String, required: false })
@ApiQuery({ name: 'endDate', type: String, required: false })
@ApiQuery({ name: 'comparison', enum: ComparisonType, required: false })
@ApiQuery({ name: 'granularity', enum: Granularity, required: false })
@ApiOkResponse({ type: UserGrowthDto })
async getUserGrowth(
  @Query() query: GrowthQueryDto,
): Promise<UserGrowthDto>

// GET /stats/admin/interactions/summary
@Get('admin/interactions/summary')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.Admin)
@ApiOperation({ summary: 'Get interaction statistics summary' })
@ApiQuery({ name: 'startDate', type: String, required: false })
@ApiQuery({ name: 'endDate', type: String, required: false })
@ApiQuery({ name: 'interactionType', enum: InteractionType, required: false })
@ApiOkResponse({ type: InteractionStatsDto })
async getInteractionStats(
  @Query() query: InteractionStatsQueryDto,
): Promise<InteractionStatsDto>
```

### New DTOs

**Request DTOs**:

- `TimeRangeDto`: Start date, end date, period
- `TemplateUsageQueryDto`: Extends TimeRangeDto with comparison, sortBy, limit
- `GrowthQueryDto`: Extends TimeRangeDto with comparison, granularity
- `InteractionStatsQueryDto`: Extends TimeRangeDto with interactionType

**Response DTOs**:

- `UserDashboardDto`: User summary statistics
- `MemePerformanceDto`: Individual meme metrics
- `UserActivityDto`: User activity over time
- `PlatformOverviewDto`: Admin platform overview
- `TemplateUsageDto`: Template analytics with comparisons
- `DailyTopChartsDto`: Top memes per day
- `UserGrowthDto`: User growth and retention
- `InteractionStatsDto`: Interaction summary

**Supporting DTOs**:

- `MetricSummaryDto`: Generic metric container (value, change, trend)
- `TimeSeriesDataPointDto`: Date + metric values
- `ComparisonMetricsDto`: Current vs. previous period comparison
- `TrendIndicatorDto`: Trend direction and magnitude

### Error Responses

```typescript
// 400 Bad Request - Invalid date range
{
  statusCode: 400,
  message: 'Invalid date range',
  errors: {
    startDate: 'Start date must be before end date',
    endDate: 'End date cannot be in the future'
  }
}

// 403 Forbidden - Not authorized to view stats
{
  statusCode: 403,
  message: 'You do not have permission to view this meme\'s statistics',
  error: 'Forbidden'
}

// 404 Not Found - Meme not found
{
  statusCode: 404,
  message: 'Meme with identifier "abc123" not found',
  error: 'Not Found'
}

// 429 Too Many Requests - Rate limit exceeded
{
  statusCode: 429,
  message: 'Too many requests. Please try again in 30 seconds.',
  error: 'Too Many Requests'
}

// 503 Service Unavailable - Database timeout
{
  statusCode: 503,
  message: 'Statistics temporarily unavailable. Please try again.',
  error: 'Service Unavailable'
}
```

## Service Dependencies

### Required Modules

```typescript
@Module({
  imports: [
    MemesModule,           // Access to meme repository
    TemplatesModule,       // Access to template repository
    InteractionsModule,    // Access to interaction repository
    UsersModule,           // Access to user repository
    CommentsModule,        // Access to comment repository (optional)
    CacheModule.register({ // Redis caching
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 300, // Default TTL: 5 minutes
    }),
  ],
  controllers: [StatsController],
  providers: [
    StatsService,
    UserStatsService,
    AdminStatsService,
    MemeStatsService,
    TemplateStatsService,
    InteractionStatsService,
    TimeSeriesService,
    CacheManagerService,
  ],
  exports: [StatsService],
})
export class StatsModule {}
```

### External Dependencies

```json
{
  "dependencies": {
    "@nestjs/cache-manager": "^2.1.0",
    "cache-manager": "^5.2.3",
    "cache-manager-redis-store": "^3.0.1",
    "date-fns": "^2.30.0",
    "lodash": "^4.17.21"
  }
}
```

## Validation Rules

### Time Range Validation

```typescript
export class TimeRangeDto {
  @IsOptional()
  @IsISO8601()
  @ApiProperty({ required: false, example: '2023-01-01T00:00:00Z' })
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({ required: false, example: '2023-12-31T23:59:59Z' })
  endDate?: string;

  @IsOptional()
  @IsEnum(TimePeriod)
  @ApiProperty({ enum: TimePeriod, required: false, default: TimePeriod.DAILY })
  period?: TimePeriod = TimePeriod.DAILY;

  @ValidateIf(o => o.startDate && o.endDate)
  @Validate(DateRangeValidator)
  validate?: boolean;
}

// Custom validator
class DateRangeValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as TimeRangeDto;
    const start = new Date(obj.startDate);
    const end = new Date(obj.endDate);
    
    // End date must be after start date
    if (end <= start) return false;
    
    // Cannot query future dates
    if (end > new Date()) return false;
    
    // Maximum range: 2 years
    const maxRange = 2 * 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxRange) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid date range. Ensure end date is after start date, not in the future, and range is within 2 years.';
  }
}
```

### Query Parameter Validation

```typescript
// Limit validation
@IsOptional()
@IsInt()
@Min(1)
@Max(100)
@Transform(({ value }) => parseInt(value))
limit?: number = 50;

// Days validation
@IsOptional()
@IsInt()
@Min(1)
@Max(90)
@Transform(({ value }) => parseInt(value))
days?: number = 30;

// Comparison type validation
@IsOptional()
@IsEnum(ComparisonType)
comparison?: ComparisonType;

// Sort by validation
@IsOptional()
@IsIn(['usage', 'growth', 'adoption', 'name'])
sortBy?: string = 'usage';
```

## Security Considerations

### Authorization

1. **User Stats**: Users can only view their own statistics
2. **Meme Performance**: Only meme owners can view detailed performance
3. **Admin Stats**: Requires admin role verification
4. **Public Stats**: Limited subset available without authentication

### Data Privacy

1. **Anonymization**: User identifiers in aggregate statistics should be anonymized
2. **GDPR Compliance**: Users can request deletion of their statistics history
3. **Sensitive Data**: Flag reasons and report notes should not be exposed in general statistics
4. **Access Logging**: Log all admin statistics access for audit purposes

### Rate Limiting

```typescript
// User endpoints
@Throttle(60, 60) // 60 requests per 60 seconds
@Get('user/dashboard')

// Admin endpoints
@Throttle(120, 60) // 120 requests per 60 seconds
@Get('admin/overview')
```

## Performance Requirements

### Response Time Targets

- **User Dashboard**: < 500ms (95th percentile)
- **Meme Performance**: < 300ms (95th percentile)
- **Admin Overview**: < 800ms (95th percentile)
- **Complex Queries** (top charts, growth analysis): < 2000ms (95th percentile)

### Scalability Targets

- Support 1,000 concurrent users viewing dashboards
- Handle 10,000 statistics requests per minute
- Process aggregations over 10M+ records efficiently
- Cache hit rate > 80% for frequently accessed metrics

### Resource Constraints

- Maximum query execution time: 5 seconds (timeout)
- Maximum memory per request: 256 MB
- Redis cache size: 2 GB (with LRU eviction)
- Database connection pool: 20 connections max

## Testing Requirements

### Unit Tests

- Time range calculation functions
- Growth rate and percentage calculations
- Cache key generation
- Data aggregation utilities
- Comparison logic (WoW, MoM, etc.)

### Integration Tests

- Database query correctness
- Cache integration (set/get/invalidate)
- API endpoint responses
- Authentication and authorization
- Error handling scenarios

### Performance Tests

- Load test: 1000 concurrent users
- Stress test: Peak load simulation
- Query performance: Execution time benchmarks
- Cache performance: Hit rate verification

### End-to-End Tests

- User dashboard loading
- Admin analytics workflows
- Date range filtering
- Period comparison accuracy
- Real-time data freshness

## Deployment Considerations

### Environment Variables

```bash
# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret
REDIS_DB=0

# Cache settings
STATS_CACHE_TTL=300
STATS_CACHE_MAX_KEYS=10000

# Performance settings
STATS_QUERY_TIMEOUT=5000
STATS_MAX_DATE_RANGE_DAYS=730

# Feature flags
STATS_ENABLE_MATERIALIZED_VIEWS=true
STATS_ENABLE_QUERY_CACHING=true
```

### Database Migrations

```bash
# Create indexes
npm run migration:create -- create-stats-indexes

# Create materialized views (optional)
npm run migration:create -- create-stats-materialized-views

# Apply migrations
npm run migration:run
```

### Monitoring Setup

```typescript
// Prometheus metrics
@Metrics()
export class StatsService {
  @Counter('stats_requests_total', { labelNames: ['endpoint', 'status'] })
  private requestCounter: Counter;

  @Histogram('stats_request_duration_seconds', { labelNames: ['endpoint'] })
  private requestDuration: Histogram;

  @Gauge('stats_cache_hit_rate')
  private cacheHitRate: Gauge;
}
```

## Rollout Plan

### Phase 1: Core Infrastructure (Week 1-2)

- Set up StatsModule structure
- Implement caching layer
- Create base DTOs and enums
- Add database indexes

### Phase 2: User Statistics (Week 3-4)

- Implement user dashboard endpoint
- Create meme performance endpoint
- Build user activity tracking
- Add unit tests

### Phase 3: Admin Statistics (Week 5-6)

- Implement platform overview
- Create template usage analytics
- Build top charts endpoint
- Add integration tests

### Phase 4: Advanced Analytics (Week 7-8)

- User growth and retention metrics
- Interaction statistics
- Comparative period analysis
- Performance optimization

### Phase 5: UI Integration (Week 9-10)

- User dashboard frontend
- Admin analytics frontend
- Chart/graph components
- End-to-end testing

### Phase 6: Production Hardening (Week 11-12)

- Load testing
- Performance tuning
- Monitoring setup
- Documentation completion
