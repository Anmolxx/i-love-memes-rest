# Use Case: End User Dashboard Statistics

## Use Case ID

UC-STATS-001

## Use Case Name

View Personal Dashboard Statistics

## Actor Identification

### Primary Actors

- **End User (Content Creator)**: Authenticated user who has created memes and wants to track performance

### Secondary Actors

- **Stats Service**: Backend service that aggregates and computes statistics
- **Cache Service**: Redis cache for performance optimization
- **Database**: PostgreSQL database containing meme and interaction data

## System Boundaries

- **In Scope**: Personal meme statistics, engagement metrics, performance trends, top-performing content
- **Out of Scope**: Platform-wide statistics, other users' detailed statistics, predictive analytics

## Preconditions

1. User must be authenticated with valid JWT token
2. User must have an active account (not suspended or deleted)
3. Stats API endpoints must be operational
4. Database must be accessible

## Main Success Scenario

### Step-by-Step Process Flow

1. **User Action**: User navigates to personal dashboard (`/dashboard/stats`)

2. **Authentication Check**: Frontend verifies JWT token validity
   - If invalid → Redirect to login page
   - If valid → Proceed to step 3

3. **API Request**: Frontend sends GET request to `/api/v1/stats/user/dashboard`
   - Headers: `Authorization: Bearer {token}`
   - Method: GET
   - No query parameters required

4. **Request Validation**: Stats Controller validates request
   - Verify JWT signature
   - Extract user ID from token
   - Check rate limiting (60 req/min limit)

5. **Cache Check**: Stats Service checks Redis cache
   - Cache key: `user:dashboard:{userId}`
   - If cache hit → Skip to step 10
   - If cache miss → Continue to step 6

6. **Data Aggregation**: User Stats Service aggregates data in parallel:

   **Query 1: Summary Statistics**
   ```sql
   SELECT 
     COUNT(*) as total_memes,
     COUNT(CASE WHEN audience = 'PUBLIC' THEN 1 END) as public_memes,
     COUNT(CASE WHEN audience = 'PRIVATE' THEN 1 END) as private_memes
   FROM memes
   WHERE author_id = :userId AND deleted_at IS NULL
   ```

   **Query 2: Engagement Metrics**
   ```sql
   SELECT 
     COUNT(CASE WHEN type = 'UPVOTE' THEN 1 END) as total_upvotes,
     COUNT(CASE WHEN type = 'DOWNVOTE' THEN 1 END) as total_downvotes
   FROM meme_interactions mi
   JOIN memes m ON mi.meme_id = m.id
   WHERE m.author_id = :userId AND m.deleted_at IS NULL
   ```

   **Query 3: Recent Activity**
   ```sql
   SELECT 
     COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today,
     COUNT(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week,
     COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month
   FROM memes
   WHERE author_id = :userId AND deleted_at IS NULL
   ```

   **Query 4: Top Performing Memes**
   ```sql
   SELECT 
     m.id, m.slug, m.title, m.created_at,
     COUNT(CASE WHEN mi.type = 'UPVOTE' THEN 1 END) as upvotes,
     m.engagement_score
   FROM memes m
   LEFT JOIN meme_interactions mi ON m.id = mi.meme_id
   WHERE m.author_id = :userId AND m.deleted_at IS NULL
   GROUP BY m.id, m.slug, m.title, m.created_at, m.engagement_score
   ORDER BY upvotes DESC
   LIMIT 3
   ```

   **Query 5: Performance Trend (Last 30 Days)**
   ```sql
   SELECT 
     DATE(m.created_at) as date,
     COUNT(m.id) as memes_posted,
     SUM(CASE WHEN mi.type = 'UPVOTE' THEN 1 ELSE 0 END) as total_upvotes
   FROM generate_series(
     CURRENT_DATE - INTERVAL '30 days',
     CURRENT_DATE,
     INTERVAL '1 day'
   ) AS date_series(date)
   LEFT JOIN memes m ON DATE(m.created_at) = date_series.date 
     AND m.author_id = :userId AND m.deleted_at IS NULL
   LEFT JOIN meme_interactions mi ON m.id = mi.meme_id AND mi.type = 'UPVOTE'
   GROUP BY date_series.date
   ORDER BY date_series.date
   ```

7. **Calculate Engagement Rate**:
   ```
   engagement_rate = (total_upvotes / (total_upvotes + total_downvotes)) * 100
   ```

8. **Format Response**: Assemble all data into `UserDashboardDto` structure

9. **Cache Result**: Store computed result in Redis
   - Key: `user:dashboard:{userId}`
   - TTL: 300 seconds (5 minutes)
   - Value: Serialized dashboard data

10. **Return Response**: Controller returns 200 OK with dashboard data

11. **Frontend Rendering**: Frontend displays dashboard with:
    - Summary cards (total memes, upvotes, engagement rate)
    - Performance chart (line chart of last 30 days)
    - Top memes table
    - Recent activity indicators

## Postconditions

### Success Criteria

- User receives comprehensive dashboard statistics within 500ms
- All metrics are accurate and up-to-date (within 5 minutes)
- Data is cached for subsequent requests
- Frontend renders dashboard successfully

### System State Changes

- User dashboard data is cached in Redis
- API request is logged for monitoring
- Cache hit rate metrics are updated
- User's last activity timestamp is updated

## Alternative Flows

### Alternative Flow 1: Cache Hit

**Trigger**: Cache contains fresh dashboard data

**Flow**:
1. User requests dashboard
2. Stats Service checks cache
3. Cache returns data (hit)
4. Response returned immediately (< 100ms)
5. No database queries executed

**Outcome**: Faster response time, reduced database load

### Alternative Flow 2: First-Time User (No Memes)

**Trigger**: User has never created a meme

**Flow**:
1. User requests dashboard
2. Queries return zero memes
3. Response contains empty state data:
   ```json
   {
     "summary": {
       "totalMemes": 0,
       "totalUpvotes": 0,
       ...
     },
     "topPerformingMemes": [],
     "performanceTrend": { "dataPoints": [] }
   }
   ```
4. Frontend displays empty state UI with CTA to create first meme

**Outcome**: User sees encouraging message to create content

### Alternative Flow 3: Database Timeout

**Trigger**: Database query takes > 5 seconds

**Flow**:
1. User requests dashboard
2. Cache miss
3. Database query times out
4. Service attempts to retrieve stale cache data
5. If stale data exists:
   - Return stale data with `_metadata: { stale: true }`
   - Frontend shows warning banner
6. If no stale data:
   - Return 503 Service Unavailable
   - Frontend shows error message with retry button

**Outcome**: Graceful degradation, user sees old data or error

## Exception Handling

### Exception 1: Unauthorized Access

**Condition**: Invalid or expired JWT token

**Response**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**User Experience**: Redirected to login page

### Exception 2: Rate Limit Exceeded

**Condition**: User exceeds 60 requests per minute

**Response**:
```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again in 45 seconds.",
  "error": "Too Many Requests"
}
```

**User Experience**: Toast notification with countdown timer

### Exception 3: Service Unavailable

**Condition**: Database is down, no stale cache available

**Response**:
```json
{
  "statusCode": 503,
  "message": "Statistics temporarily unavailable. Please try again.",
  "error": "Service Unavailable"
}
```

**User Experience**: Error page with retry button

## Data Requirements

### Input Data

- **User ID**: Extracted from JWT token (UUID format)
- **Current Timestamp**: For cache TTL and relative date calculations

### Output Data Format

```typescript
interface UserDashboardDto {
  summary: {
    totalMemes: number;          // Total memes created
    publicMemes: number;         // Public memes count
    privateMemes: number;        // Private memes count
    totalUpvotes: number;        // Sum of all upvotes received
    totalDownvotes: number;      // Sum of all downvotes received
    totalComments: number;       // Sum of all comments received
    totalViews: number;          // Sum of all meme views
    engagementRate: number;      // (upvotes / (upvotes + downvotes)) * 100
  };
  recentActivity: {
    memesPostedToday: number;    // Memes created today
    memesPostedThisWeek: number; // Memes created this week
    memesPostedThisMonth: number;// Memes created this month
  };
  topPerformingMemes: Array<{
    memeId: string;              // UUID
    memeSlug: string;            // URL-friendly slug
    title: string;               // Meme title
    upvotes: number;             // Upvote count
    engagementScore: number;     // Calculated engagement score
    createdAt: Date;             // Creation timestamp
  }>;
  performanceTrend: {
    period: 'LAST_30_DAYS';
    dataPoints: Array<{
      date: Date;                // Date (YYYY-MM-DD)
      memesPosted: number;       // Memes posted on this date
      totalUpvotes: number;      // Upvotes received on this date
      engagementRate: number;    // Daily engagement rate
    }>;
  };
}
```

### Data Validation Rules

- All numeric values must be non-negative integers
- Dates must be in ISO 8601 format
- Engagement rate must be between 0 and 100
- Top performing memes limited to 3 items
- Performance trend limited to 30 data points

## User Interface Requirements

### Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  Personal Dashboard                       [Refresh] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │  Total   │ │  Public  │ │  Total   │ │Engage- ││
│  │  Memes   │ │  Memes   │ │ Upvotes  │ │ ment   ││
│  │    42    │ │    38    │ │  1,247   │ │ 15.8%  ││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Performance Trend (Last 30 Days)           │  │
│  │                                             │  │
│  │  [Line Chart: Memes Posted & Upvotes]      │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Top Performing Memes                       │  │
│  │ ┌──────────────┬──────────┬────────────┐  │  │
│  │ │ Title        │ Upvotes  │ Created    │  │  │
│  │ ├──────────────┼──────────┼────────────┤  │  │
│  │ │ Recursion... │ 342      │ Nov 10     │  │  │
│  │ │ Debugging... │ 289      │ Nov 8      │  │  │
│  │ │ CSS is...    │ 267      │ Nov 5      │  │  │
│  │ └──────────────┴──────────┴────────────┘  │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Recent Activity                            │  │
│  │  • 2 memes today                            │  │
│  │  • 8 memes this week                        │  │
│  │  • 23 memes this month                      │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Interactive Elements

1. **Refresh Button**: Manually refresh statistics (clears cache)
2. **Chart Tooltips**: Hover to see detailed daily metrics
3. **Top Memes Links**: Click meme title to view detailed performance
4. **Date Range Selector**: Switch between 7/30/90 day views

### Accessibility Considerations

- All charts must have text alternatives
- Color-blind friendly color schemes
- Keyboard navigation support
- Screen reader compatible labels
- ARIA landmarks for dashboard sections

### Mobile Responsiveness

- Stack summary cards vertically on mobile
- Simplify chart interactions for touch
- Collapsible sections for better scrolling
- Swipe gestures for chart navigation

## Performance Requirements

### Response Time Targets

- **Cache Hit**: < 100ms (95th percentile)
- **Cache Miss**: < 500ms (95th percentile)
- **Database Queries**: < 200ms each (parallel execution)
- **Total Time**: < 500ms (95th percentile)

### Scalability Targets

- Support 1,000 concurrent dashboard requests
- Handle 10,000 requests per minute across all users
- Cache hit rate > 80%
- Database connection pool utilization < 70%

### Resource Constraints

- Maximum query result size: 100 KB
- Cache entry size: < 50 KB
- Memory per request: < 10 MB
- Database connections: Max 5 concurrent per request

## Security Considerations

### Authentication & Authorization

- JWT token required for all requests
- Token must not be expired (checked at middleware level)
- User can only access their own dashboard
- Rate limiting prevents abuse

### Data Privacy

- No personally identifiable information exposed
- Meme titles may contain user-generated content (sanitized)
- Statistics do not reveal other users' identities
- Cache keys include user ID (isolated per user)

### Audit Requirements

- Log all dashboard access attempts
- Track response times for performance monitoring
- Record cache hit/miss rates
- Alert on unusual access patterns

## Testing Scenarios

### Test Case 1: Successful Dashboard Load (Happy Path)

**Given**: User is authenticated with valid token
**And**: User has created 10 memes
**When**: User requests dashboard
**Then**: Response contains accurate statistics for all 10 memes
**And**: Response time is < 500ms
**And**: HTTP status is 200 OK

### Test Case 2: Empty State (New User)

**Given**: User is authenticated
**And**: User has created 0 memes
**When**: User requests dashboard
**Then**: Response contains zero values for all metrics
**And**: `topPerformingMemes` array is empty
**And**: HTTP status is 200 OK

### Test Case 3: Cache Performance

**Given**: User's dashboard data is cached
**When**: User requests dashboard
**Then**: Response is served from cache
**And**: Response time is < 100ms
**And**: No database queries are executed

### Test Case 4: Unauthorized Access

**Given**: User is not authenticated
**When**: User requests dashboard
**Then**: HTTP status is 401 Unauthorized
**And**: Error message indicates authentication required

### Test Case 5: Rate Limit Exceeded

**Given**: User has made 60 requests in the last minute
**When**: User makes another dashboard request
**Then**: HTTP status is 429 Too Many Requests
**And**: Response includes retry-after header

### Test Case 6: Large Dataset Performance

**Given**: User has created 1,000+ memes
**When**: User requests dashboard
**Then**: Response time is still < 800ms
**And**: Only top 3 memes are returned
**And**: Aggregated metrics are accurate

## Acceptance Criteria (Definition of Done)

### Functional Criteria

- [x] User can view total memes created
- [x] User can see public vs. private meme breakdown
- [x] User can view total engagement metrics (upvotes, downvotes)
- [x] User can see engagement rate calculation
- [x] User can view top 3 performing memes
- [x] User can see 30-day performance trend
- [x] User can view recent activity summary

### Non-Functional Criteria

- [x] API response time < 500ms (95th percentile)
- [x] Cache hit rate > 80%
- [x] Rate limiting enforced (60 req/min)
- [x] All queries use indexed columns
- [x] Parallel query execution for performance
- [x] Graceful degradation on errors
- [x] Mobile-responsive UI

### Quality Criteria

- [x] Unit tests coverage > 80%
- [x] Integration tests for all API endpoints
- [x] Performance tests verify response times
- [x] Security tests verify authentication
- [x] Accessibility tests pass WCAG 2.1 AA
- [x] Cross-browser compatibility verified

### Documentation Criteria

- [x] API documentation complete
- [x] Use case documented
- [x] Sequence diagrams created
- [x] Error handling documented
- [x] Frontend integration guide provided

## Dependencies

### Technical Dependencies

- NestJS framework (v10+)
- PostgreSQL database (v14+)
- Redis cache (v7+)
- JWT authentication
- TypeORM or Prisma ORM

### Module Dependencies

- MemesModule (for meme repository)
- InteractionsModule (for interaction data)
- AuthModule (for authentication)
- CacheModule (for Redis integration)

### External Dependencies

- Frontend dashboard component library
- Charting library (e.g., Chart.js, Recharts)
- Date manipulation library (date-fns)

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live statistics
2. **Export Functionality**: Download statistics as PDF/CSV
3. **Custom Date Ranges**: User-selectable time periods
4. **Comparative Analytics**: Compare with platform averages
5. **Goal Setting**: User-defined performance targets
6. **Notifications**: Alerts for milestone achievements
7. **Detailed Insights**: AI-powered recommendations
8. **Historical Snapshots**: Year-in-review summaries
