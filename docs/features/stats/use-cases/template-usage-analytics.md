# Use Case: Template Usage Analytics with Comparative Analysis

## Use Case ID

UC-STATS-003

## Use Case Name

View Template Usage Analytics with Period Comparison

## Actor Identification

### Primary Actors

- **Platform Administrator**: User with admin role who needs to monitor template performance and adoption

### Secondary Actors

- **Admin Stats Service**: Backend service for platform-wide analytics
- **Template Stats Service**: Specialized service for template metrics
- **Time Series Service**: Service for period comparison calculations
- **Cache Service**: Redis cache for performance optimization
- **Database**: PostgreSQL database with template and meme data

## System Boundaries

- **In Scope**: Template usage tracking, adoption rate analysis, comparative period metrics (WoW, MoM, QoQ, YoY), trend visualization
- **Out of Scope**: Individual user tracking, template editing, template creation, financial analytics

## Preconditions

1. Admin must be authenticated with valid JWT token
2. Admin must have admin role privileges
3. Templates exist in the database
4. Memes have been created using templates
5. Stats API endpoints are operational

## Main Success Scenario

### Step-by-Step Process Flow

1. **Admin Action**: Administrator navigates to Template Analytics page (`/admin/analytics/templates`)

2. **Authentication & Authorization Check**:
   - Verify JWT token validity
   - Verify user has admin role
   - If not admin → Return 403 Forbidden
   - If valid → Proceed

3. **Parameter Selection**: Admin selects analysis parameters:
   - Start Date: `2025-10-01`
   - End Date: `2025-10-31`
   - Comparison Type: `MOM` (Month-over-Month)
   - Sort By: `growth`
   - Limit: `20` templates

4. **API Request**: Frontend sends GET request:
   ```
   GET /api/v1/stats/admin/templates/usage?
     startDate=2025-10-01T00:00:00Z&
     endDate=2025-10-31T23:59:59Z&
     comparison=MOM&
     sortBy=growth&
     limit=20
   ```

5. **Request Validation**: Controller validates query parameters:
   - Validate date format (ISO 8601)
   - Verify startDate < endDate
   - Check date range ≤ 2 years
   - Verify limit between 1-200
   - Validate sortBy value
   - Validate comparison type

6. **Cache Key Generation**:
   ```typescript
   const cacheKey = generateCacheKey('admin:templates:usage', {
     startDate: '2025-10-01',
     endDate: '2025-10-31',
     comparison: 'MOM',
     sortBy: 'growth',
     limit: 20
   });
   // Result: "admin:templates:usage:2025-10-01:2025-10-31:MOM:growth:20"
   ```

7. **Cache Check**: 
   - Query Redis with cache key
   - If cache hit → Skip to step 15
   - If cache miss → Continue

8. **Calculate Time Ranges**:
   - **Current Period**: October 1-31, 2025 (31 days)
   - **Previous Period**: September 1-30, 2025 (30 days)
   - Adjust previous period to match current period duration

9. **Data Aggregation - Current Period**:
   ```sql
   SELECT 
     t.id as template_id,
     t.name as template_name,
     c.name as category_name,
     COUNT(m.id) as usage_count,
     COUNT(DISTINCT m.author_id) as unique_users,
     AVG(m.engagement_score) as avg_engagement
   FROM meme_templates t
   LEFT JOIN memes m ON m.template_id = t.id 
     AND m.created_at >= '2025-10-01T00:00:00Z'
     AND m.created_at <= '2025-10-31T23:59:59Z'
     AND m.deleted_at IS NULL
   LEFT JOIN categories c ON t.category_id = c.id
   WHERE t.is_active = true
   GROUP BY t.id, t.name, c.name
   ```

10. **Data Aggregation - Previous Period**:
    ```sql
    SELECT 
      t.id as template_id,
      COUNT(m.id) as usage_count,
      COUNT(DISTINCT m.author_id) as unique_users,
      AVG(m.engagement_score) as avg_engagement
    FROM meme_templates t
    LEFT JOIN memes m ON m.template_id = t.id 
      AND m.created_at >= '2025-09-01T00:00:00Z'
      AND m.created_at <= '2025-09-30T23:59:59Z'
      AND m.deleted_at IS NULL
    WHERE t.is_active = true
    GROUP BY t.id
    ```

11. **Usage Trend Data** (for each template):
    ```sql
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as usage_count
    FROM memes
    WHERE template_id = :templateId
      AND created_at >= '2025-10-01T00:00:00Z'
      AND created_at <= '2025-10-31T23:59:59Z'
      AND deleted_at IS NULL
    GROUP BY DATE(created_at)
    ORDER BY date
    ```

12. **Calculate Comparison Metrics**:
    For each template:
    ```typescript
    const usageChange = calculatePercentageChange(
      currentPeriod.usageCount,
      previousPeriod.usageCount
    );
    // Formula: ((current - previous) / previous) * 100

    const userGrowth = calculatePercentageChange(
      currentPeriod.uniqueUsers,
      previousPeriod.uniqueUsers
    );

    const engagementChange = calculatePercentageChange(
      currentPeriod.averageEngagement,
      previousPeriod.averageEngagement
    );

    const trend = determineTrend(usageChange);
    // 'UP' if > 5%, 'DOWN' if < -5%, 'STABLE' otherwise
    ```

13. **Sort and Limit Results**:
    - Sort by `growth` (usageChange percentage)
    - Apply limit (20 templates)
    - Include pagination metadata

14. **Cache Result**:
    - Store in Redis with TTL = 1 hour (3600 seconds)
    - Serialize data to JSON
    - Set cache key with computed data

15. **Format Response**: Assemble `TemplateUsageDto`:
    ```json
    {
      "timeRange": {
        "startDate": "2025-10-01T00:00:00Z",
        "endDate": "2025-10-31T23:59:59Z"
      },
      "comparisonPeriod": {
        "startDate": "2025-09-01T00:00:00Z",
        "endDate": "2025-09-30T23:59:59Z",
        "type": "MOM"
      },
      "totalUsage": 8934,
      "uniqueUsers": 2456,
      "templates": [...]
    }
    ```

16. **Return Response**: Controller returns 200 OK

17. **Frontend Rendering**: Display analytics dashboard:
    - Summary cards (total usage, unique users)
    - Template table with sortable columns
    - Growth indicators (↑ UP, ↓ DOWN, → STABLE)
    - Usage trend charts
    - Comparison metrics with color coding

## Postconditions

### Success Criteria

- Admin receives accurate template usage statistics
- Comparative analysis shows meaningful growth/decline patterns
- Data is sorted by requested metric (growth)
- Response time is < 800ms
- Results are cached for subsequent requests

### System State Changes

- Template usage statistics are cached for 1 hour
- Admin access is logged for audit trail
- Cache performance metrics are updated
- Response time is recorded for monitoring

## Alternative Flows

### Alternative Flow 1: No Comparison Requested

**Trigger**: Admin does not specify comparison parameter

**Flow**:
1. Admin requests template usage without comparison
2. System calculates only current period metrics
3. Previous period data is not fetched
4. Response excludes `comparisonPeriod` and `comparison` fields
5. Faster response time (< 400ms)

**Outcome**: Simpler dataset, better performance

### Alternative Flow 2: Year-over-Year Comparison

**Trigger**: Admin selects `YOY` comparison

**Flow**:
1. Current Period: October 2025
2. Previous Period: October 2024 (same month, previous year)
3. Calculate 12-month growth rates
4. Highlight seasonal trends
5. Include year-over-year context in response

**Outcome**: Long-term growth analysis

### Alternative Flow 3: Template with Zero Usage

**Trigger**: Template has not been used in current period

**Flow**:
1. Query returns 0 usage for template
2. System includes template in results with zero metrics
3. Comparison shows usage decline (e.g., -100% if had usage before)
4. Trend marked as 'DOWN'
5. Admin can identify underperforming templates for deprecation

**Outcome**: Visibility into unused templates

### Alternative Flow 4: Cache Hit

**Trigger**: Same query parameters requested within cache TTL

**Flow**:
1. Admin requests template usage
2. System finds cached result
3. Return cached data immediately (< 100ms)
4. No database queries executed
5. Response includes cache metadata

**Outcome**: Ultra-fast response, reduced database load

## Exception Handling

### Exception 1: Invalid Date Range

**Condition**: Start date is after end date

**Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "startDate": "Start date must be before end date"
  }
}
```

**User Experience**: Form validation error with highlighted field

### Exception 2: Unauthorized Access (Non-Admin)

**Condition**: User does not have admin role

**Response**:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to access admin statistics",
  "error": "Forbidden"
}
```

**User Experience**: Redirect to dashboard with error message

### Exception 3: Database Query Timeout

**Condition**: Complex query exceeds 5-second timeout

**Response**: Attempt to return stale cache data or error

**Flow**:
1. Database query times out
2. Check for stale cache (expired but still in Redis)
3. If stale data exists:
   ```json
   {
     ...data,
     "_metadata": {
       "stale": true,
       "lastUpdated": "2025-11-17T09:30:00Z",
       "warning": "Data may be outdated due to system load"
     }
   }
   ```
4. If no stale data → Return 503 Service Unavailable

**User Experience**: Warning banner showing data staleness

### Exception 4: Invalid Comparison Type

**Condition**: Comparison parameter is not WOW, MOM, QOQ, or YOY

**Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "comparison": "Comparison must be one of: WOW, MOM, QOQ, YOY"
  }
}
```

**User Experience**: Dropdown constraint prevents invalid input

## Data Requirements

### Input Data Specifications

| Parameter | Type | Required | Validation | Default |
|-----------|------|----------|------------|---------|
| startDate | ISO 8601 string | No | Valid date, before endDate | 30 days ago |
| endDate | ISO 8601 string | No | Valid date, not future | Today |
| comparison | Enum | No | WOW, MOM, QOQ, YOY | None |
| sortBy | Enum | No | usage, growth, adoption | usage |
| limit | Integer | No | 1-200 | 50 |

### Output Data Format

```typescript
interface TemplateUsageDto {
  timeRange: {
    startDate: string;         // ISO 8601
    endDate: string;           // ISO 8601
  };
  comparisonPeriod?: {
    startDate: string;         // ISO 8601
    endDate: string;           // ISO 8601
    type: ComparisonType;      // WOW, MOM, QOQ, YOY
  };
  totalUsage: number;          // Sum of all template usage
  uniqueUsers: number;         // Distinct users who created memes
  templates: TemplateMetrics[];
}

interface TemplateMetrics {
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
    usageChange: number;       // Percentage
    userGrowth: number;        // Percentage
    engagementChange: number;  // Percentage
    trend: 'UP' | 'DOWN' | 'STABLE';
  };
  usageTrend: Array<{
    date: string;              // YYYY-MM-DD
    usageCount: number;
  }>;
}
```

### Data Validation Rules

- Percentages can be negative (indicating decline)
- Trend thresholds: UP > 5%, DOWN < -5%, STABLE = -5% to 5%
- Usage counts must be non-negative integers
- Dates in usageTrend must be ascending order
- Template names sanitized for XSS prevention

## User Interface Requirements

### Analytics Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Template Usage Analytics               [Export] [Refresh]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters:                                                        │
│  [Oct 1, 2025] to [Oct 31, 2025]   [Month-over-Month ▼]        │
│  Sort by: [Growth ▼]                Limit: [20 ▼]               │
│                                                                  │
│  ┌────────────┐  ┌────────────┐                                │
│  │ Total      │  │ Unique     │                                │
│  │ Usage      │  │ Users      │                                │
│  │ 8,934      │  │ 2,456      │                                │
│  └────────────┘  └────────────┘                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Template Name     │ Category  │Usage│Growth│ Trend       │  │
│  ├───────────────────┼───────────┼─────┼──────┼─────────────┤  │
│  │ Distracted BF     │Relationship│ 567 │+34%  │↑ UP   [📊] │  │
│  │ Drake Hotline     │ Reaction  │ 489 │-4.5% │↓ DOWN [📊] │  │
│  │ Expanding Brain   │ Knowledge │ 423 │+28%  │↑ UP   [📊] │  │
│  │ ...               │ ...       │ ... │ ...  │ ...    [...] │  │
│  └───────────────────┴───────────┴─────┴──────┴─────────────┘  │
│                                                                  │
│  [Detailed View for: Distracted Boyfriend]                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Usage Trend - October 2025                              │  │
│  │  [Line Chart showing daily usage]                        │  │
│  │                                                            │  │
│  │  Current Period:                Previous Period:          │  │
│  │  • Usage: 567                   • Usage: 423              │  │
│  │  • Unique Users: 342            • Unique Users: 289       │  │
│  │  • Avg Engagement: 67.8         • Avg Engagement: 62.4    │  │
│  │                                                            │  │
│  │  Comparison:                                              │  │
│  │  • Usage Change: +34.04% ↑                                │  │
│  │  • User Growth: +18.34% ↑                                 │  │
│  │  • Engagement Change: +8.65% ↑                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Interactive Elements

1. **Date Range Picker**: Select custom date ranges or use presets (7d, 30d, 90d, 1y)
2. **Comparison Selector**: Dropdown to choose WOW, MOM, QOQ, YOY
3. **Sort Dropdown**: Sort by usage, growth, or adoption rate
4. **Template Row Expansion**: Click to view detailed trend chart
5. **Export Button**: Download data as CSV
6. **Refresh Button**: Clear cache and reload data

### Visual Indicators

- **↑ UP (Green)**: Growth > 5%
- **↓ DOWN (Red)**: Decline < -5%
- **→ STABLE (Gray)**: Change between -5% and 5%
- **Sparkline Charts**: Mini trend visualizations in table cells
- **Progress Bars**: Visual representation of usage percentages

## Performance Requirements

### Response Time Targets

- **Cache Hit**: < 100ms
- **Cache Miss (No Comparison)**: < 400ms
- **Cache Miss (With Comparison)**: < 800ms
- **Complex Queries (90 days, 200 templates)**: < 2000ms

### Scalability Targets

- Support 50 concurrent admin requests
- Handle 500 template analytics requests per hour
- Cache hit rate > 75%
- Database query optimization for 10,000+ templates

### Resource Constraints

- Maximum result size: 500 KB
- Parallel query execution: Max 3 concurrent queries
- Database connections: Max 5 per request
- Memory per request: < 50 MB

## Business Rules

### Template Eligibility

- Only active templates (`is_active = true`) included in analytics
- Deleted memes excluded from usage counts
- Private memes count toward template usage
- Test/draft templates can be filtered out

### Comparison Period Calculation

**Week-over-Week (WOW)**:
- Current period: Last 7 days
- Previous period: 7 days before current period

**Month-over-Month (MOM)**:
- Current period: Specified month
- Previous period: Same number of days in previous month

**Quarter-over-Quarter (QOQ)**:
- Current period: Specified quarter
- Previous period: Previous quarter (same length)

**Year-over-Year (YOY)**:
- Current period: Specified time range
- Previous period: Same dates in previous year

### Growth Classification

```typescript
function determineTrend(changePercentage: number): Trend {
  if (changePercentage > 5) return 'UP';
  if (changePercentage < -5) return 'DOWN';
  return 'STABLE';
}
```

## Integration Points

### External Systems

- **Notification Service**: Alert admins about significant template performance changes
- **Reporting Service**: Generate scheduled reports
- **Dashboard Service**: Embed charts in admin overview

### Internal Modules

- **Templates Module**: Source data for template metadata
- **Memes Module**: Source data for usage counts
- **Users Module**: User demographic analysis (future enhancement)
- **Categories Module**: Category-level aggregations

## Monitoring & Alerting

### Metrics to Track

- Query execution time (by comparison type)
- Cache hit/miss rates
- Number of templates analyzed per request
- Response payload size
- Error rates by endpoint

### Alert Conditions

- Response time > 2 seconds → Warning
- Cache hit rate < 50% → Investigation needed
- Error rate > 5% → Critical alert
- Database connection pool > 80% → Warning

## Testing Scenarios

### Test Case 1: Month-over-Month Comparison

**Given**: Templates exist with usage data for Oct and Sept 2025
**When**: Admin requests MOM comparison for October
**Then**: Response includes comparison metrics for both periods
**And**: Growth percentages are accurate
**And**: Trends are correctly classified

### Test Case 2: Zero Previous Period Usage

**Given**: Template was used in October but not September
**When**: Admin requests MOM comparison
**Then**: `previousPeriod.usageCount` is 0
**And**: `comparison.usageChange` shows +Infinity or max value
**And**: Trend is 'UP'

### Test Case 3: Sorting by Growth

**Given**: Multiple templates with varying growth rates
**When**: Admin sorts by growth
**Then**: Templates are ordered by `comparison.usageChange` descending
**And**: Highest growth template appears first

### Test Case 4: Performance with Large Dataset

**Given**: 500 active templates and 50,000 memes
**When**: Admin requests analytics for 90-day period
**Then**: Response time is < 2 seconds
**And**: Results are correctly limited to 50 templates
**And**: All calculations are accurate

### Test Case 5: Cache Effectiveness

**Given**: Same query parameters requested twice
**When**: Second request is made within 1 hour
**Then**: Second request returns cached data
**And**: Response time is < 100ms
**And**: No database queries executed

## Acceptance Criteria (Definition of Done)

- [x] Admin can view template usage for custom date ranges
- [x] Comparative period analysis (WOW, MOM, QOQ, YOY) implemented
- [x] Usage trends displayed with daily granularity
- [x] Growth metrics calculated accurately
- [x] Sorting by usage, growth, and adoption works correctly
- [x] Results are limited and paginated
- [x] Response time < 800ms for standard queries
- [x] Cache hit rate > 75% after warm-up
- [x] Authorization restricted to admin users
- [x] Error handling for edge cases implemented
- [x] UI displays analytics with charts and tables
- [x] Export functionality (future enhancement)
- [x] Unit tests coverage > 80%
- [x] Integration tests verify accuracy
- [x] Performance tests validate scalability

## Future Enhancements

1. **Template Recommendations**: Suggest templates to deprecate or promote
2. **Cohort Analysis**: Track template performance by user cohorts
3. **Predictive Analytics**: Forecast template popularity trends
4. **A/B Testing**: Compare template variants
5. **Category-Level Analytics**: Aggregate by category
6. **Custom Metrics**: Allow admins to define custom KPIs
7. **Automated Reports**: Schedule and email reports
8. **Real-Time Dashboard**: WebSocket updates for live data
