# Statistics & Analytics Module Documentation

## Overview

The Statistics & Analytics Module provides comprehensive data insights and performance metrics for the I Love Memes platform. This module enables both end users and administrators to track content performance, user engagement, and system health through real-time and historical data analysis.

**Status**: ✅ Fully Documented | 🔨 Implementation Pending

**Version**: 1.0.0

**Last Updated**: November 17, 2025

## Quick Links

- [Module Overview](./module-overview.md) - Architecture and high-level design
- [System Design](./system-design.md) - Technical implementation details
- [Feature Specification](./feature-specification.md) - Detailed requirements and API changes
- [API Specifications](./api-specifications/) - REST API documentation
- [Use Cases](./use-cases/) - Detailed scenario documentation
- [Mermaid Diagrams](./mermaid-diagrams/) - Visual architecture diagrams

## Module Purpose

### Business Objectives

1. **Content Optimization**: Enable users to identify high-performing content patterns
2. **Platform Intelligence**: Provide administrators with actionable insights
3. **User Engagement**: Increase user retention through personalized performance feedback
4. **Data-Driven Decisions**: Support strategic decisions with accurate metrics

### Key Features

#### For End Users

- **Personal Dashboard**: View meme performance, engagement metrics, and trends
- **Meme Performance**: Detailed analytics for individual memes
- **Activity Tracking**: Monitor content creation and engagement over time
- **Comparative Analytics**: Compare performance with platform averages

#### For Administrators

- **Platform Overview**: Real-time system health and metrics
- **Template Analytics**: Track template usage and adoption rates
- **Top Charts**: Daily rankings and trending content
- **User Growth**: Monitor user acquisition and retention
- **Interaction Statistics**: Aggregate engagement metrics

## Architecture Summary

### Module Structure

```
src/stats/
├── stats.module.ts                 # Module definition
├── stats.controller.ts             # HTTP endpoints
├── stats.service.ts                # Orchestration service
├── domain/                         # Domain entities
├── dto/                            # Data transfer objects
├── services/                       # Specialized services
│   ├── user-stats.service.ts
│   ├── admin-stats.service.ts
│   ├── meme-stats.service.ts
│   ├── template-stats.service.ts
│   ├── interaction-stats.service.ts
│   ├── time-series.service.ts
│   └── cache-manager.service.ts
├── enums/                          # Enumerations
└── utils/                          # Utility functions
```

### Technology Stack

- **Backend Framework**: NestJS v10+
- **Database**: PostgreSQL v14+
- **Cache**: Redis v7+
- **ORM**: TypeORM / Prisma
- **Authentication**: JWT
- **Documentation**: OpenAPI/Swagger

### Key Design Patterns

1. **Read-Only Module**: No write operations, only data aggregation
2. **Aggressive Caching**: Multi-layer cache strategy (in-memory + Redis)
3. **Parallel Queries**: Concurrent data fetching for performance
4. **Graceful Degradation**: Fallback to stale data on errors
5. **Time-Series Optimization**: Indexed queries and materialized views

## API Endpoints

### End User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats/user/dashboard` | Personal dashboard statistics | ✅ JWT |
| GET | `/stats/user/memes/:id/performance` | Individual meme performance | ✅ JWT |
| GET | `/stats/user/activity` | User activity over time | ✅ JWT |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats/admin/overview` | Platform overview | ✅ JWT + Admin |
| GET | `/stats/admin/templates/usage` | Template usage analytics | ✅ JWT + Admin |
| GET | `/stats/admin/top-charts` | Top meme charts | ✅ JWT + Admin |
| GET | `/stats/admin/users/growth` | User growth metrics | ✅ JWT + Admin |
| GET | `/stats/admin/interactions/summary` | Interaction statistics | ✅ JWT + Admin |

See [API Specifications](./api-specifications/) for detailed documentation.

## Data Flow

```
Client Request
    ↓
Authentication/Authorization
    ↓
Rate Limiting
    ↓
Stats Controller
    ↓
Cache Check (Redis)
    ↓ (if miss)
Specialized Service
    ↓
Repository (Database Query)
    ↓
Data Aggregation & Calculation
    ↓
Cache Result
    ↓
Format Response
    ↓
Return to Client
```

## Performance Characteristics

### Response Time Targets

| Endpoint Category | Cache Hit | Cache Miss | 95th Percentile |
|------------------|-----------|------------|-----------------|
| User Dashboard | < 100ms | < 500ms | 500ms |
| Meme Performance | < 80ms | < 300ms | 300ms |
| Admin Overview | < 85ms | < 800ms | 800ms |
| Template Analytics | < 320ms | < 800ms | 1200ms |
| Top Charts | < 450ms | < 1500ms | 2000ms |

### Caching Strategy

| Metric Type | TTL | Cache Layer |
|-------------|-----|-------------|
| Real-time | 1 minute | Redis |
| Daily metrics | 1 hour | Redis |
| Historical data | 24 hours | Redis |
| Trending data | 5 minutes | Redis |

### Scalability Targets

- **Concurrent Users**: 1,000+
- **Requests Per Minute**: 10,000+
- **Cache Hit Rate**: > 80%
- **Database Records**: 10M+ efficiently

## Database Considerations

### Required Indexes

The module requires specific indexes for optimal performance:

```sql
-- Memes time-series indexes
CREATE INDEX idx_memes_created_at ON memes(created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_memes_author_created ON memes(author_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_memes_template_created ON memes(template_id, created_at) WHERE deleted_at IS NULL;

-- Interaction indexes
CREATE INDEX idx_interactions_meme_type ON meme_interactions(meme_id, type, created_at);
CREATE INDEX idx_interactions_created ON meme_interactions(created_at);
CREATE INDEX idx_interactions_type_created ON meme_interactions(type, created_at);

-- User activity indexes
CREATE INDEX idx_users_created_status ON users(created_at, status_id);
```

See [System Design - Database Schema](./system-design.md#database-schema-considerations) for complete details.

### Optional: Materialized Views

For high-traffic production environments:

- `mv_daily_meme_stats`: Pre-aggregated daily meme counts
- `mv_daily_template_usage`: Pre-aggregated template usage
- `mv_daily_interaction_stats`: Pre-aggregated interaction metrics

Refresh schedule: Nightly at 00:30 UTC

## Security Considerations

### Authentication & Authorization

- **User Endpoints**: Require valid JWT token
- **Admin Endpoints**: Require JWT + admin role
- **Rate Limiting**: 60 req/min (users), 120 req/min (admins)

### Data Privacy

- Users can only view their own statistics
- Meme owners can only view their meme performance
- Aggregate data anonymizes individual user identities
- Admin access is logged for audit purposes

### GDPR Compliance

- Users can request deletion of their statistics history
- Aggregated metrics do not contain PII
- Cache entries respect data retention policies

## Error Handling

### HTTP Status Codes

| Code | Scenario | Response |
|------|----------|----------|
| 200 | Success | Statistics data |
| 400 | Invalid parameters | Validation errors |
| 401 | Not authenticated | Unauthorized message |
| 403 | Not authorized | Forbidden message |
| 404 | Resource not found | Not found message |
| 429 | Rate limit exceeded | Retry-after header |
| 503 | Service unavailable | Try again later |

### Graceful Degradation

1. **Database Timeout**: Return stale cache data with warning
2. **Cache Failure**: Fallback to direct database queries
3. **Partial Data**: Return available data with metadata
4. **Service Overload**: Return 503 with retry guidance

## Use Cases

### End User Use Cases

1. **[End User Dashboard](./use-cases/end-user-stats-dashboard.md)** - View personal statistics
   - **Status**: ✅ Documented
   - **Priority**: High
   - **Implementation**: Phase 2

2. **Meme Performance Tracking** - Detailed meme analytics
   - **Status**: 📝 Pending Documentation
   - **Priority**: High
   - **Implementation**: Phase 2

3. **User Activity History** - Track content creation over time
   - **Status**: 📝 Pending Documentation
   - **Priority**: Medium
   - **Implementation**: Phase 2

### Admin Use Cases

1. **Platform Overview Dashboard** - System health and metrics
   - **Status**: 📝 Pending Documentation
   - **Priority**: High
   - **Implementation**: Phase 3

2. **[Template Usage Analytics](./use-cases/template-usage-analytics.md)** - Template performance tracking
   - **Status**: ✅ Documented
   - **Priority**: High
   - **Implementation**: Phase 3

3. **Top Meme Charts** - Daily top content rankings
   - **Status**: 📝 Pending Documentation
   - **Priority**: High
   - **Implementation**: Phase 3

4. **User Growth Analysis** - Acquisition and retention metrics
   - **Status**: 📝 Pending Documentation
   - **Priority**: Medium
   - **Implementation**: Phase 4

5. **Interaction Analytics** - Engagement metrics and trends
   - **Status**: 📝 Pending Documentation
   - **Priority**: Medium
   - **Implementation**: Phase 4

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)

- [x] Module structure setup
- [x] DTO definitions
- [x] Enum definitions
- [x] Database indexes planning
- [ ] Cache service implementation
- [ ] Base repository setup

### Phase 2: User Statistics (Week 3-4)

- [ ] User dashboard endpoint
- [ ] Meme performance endpoint
- [ ] User activity endpoint
- [ ] Unit tests
- [ ] Integration tests

### Phase 3: Admin Statistics (Week 5-6)

- [ ] Platform overview endpoint
- [ ] Template usage endpoint
- [ ] Top charts endpoint
- [ ] Admin authorization
- [ ] Performance optimization

### Phase 4: Advanced Analytics (Week 7-8)

- [ ] User growth metrics
- [ ] Interaction statistics
- [ ] Comparative period analysis
- [ ] Time-series aggregation
- [ ] Cache warming strategy

### Phase 5: UI Integration (Week 9-10)

- [ ] User dashboard frontend
- [ ] Admin analytics frontend
- [ ] Chart components
- [ ] Real-time updates (optional)
- [ ] End-to-end testing

### Phase 6: Production Hardening (Week 11-12)

- [ ] Load testing
- [ ] Performance tuning
- [ ] Monitoring setup
- [ ] Alert configuration
- [ ] Documentation finalization

## Testing Strategy

### Unit Tests

- Time range calculations
- Growth rate calculations
- Percentage calculations
- Cache key generation
- Trend determination logic

### Integration Tests

- API endpoint responses
- Database query correctness
- Cache integration
- Authentication/authorization
- Error handling scenarios

### Performance Tests

- Load testing (1000 concurrent users)
- Stress testing (peak load)
- Query execution benchmarks
- Cache performance validation
- Response time verification

### End-to-End Tests

- Complete user workflows
- Admin analytics workflows
- Date range filtering
- Period comparison accuracy
- Real-time data freshness

## Monitoring & Observability

### Key Metrics

- API response times (p50, p95, p99)
- Cache hit/miss rates
- Database query execution times
- Error rates by endpoint
- Request volume trends
- Memory usage
- Database connection pool utilization

### Logging

- Structured JSON logging
- Request/response logging
- Error tracking with stack traces
- Performance metrics logging
- Admin access audit logs

### Alerting

- Response time > 2s → Warning
- Error rate > 5% → Critical
- Cache hit rate < 50% → Investigation
- Database pool > 80% → Warning
- Service unavailable → Critical

## Dependencies

### Internal Module Dependencies

- **MemesModule**: Meme data source
- **TemplatesModule**: Template data source
- **InteractionsModule**: Interaction data source
- **UsersModule**: User data source
- **AuthModule**: Authentication
- **CacheModule**: Redis caching

### External Dependencies

```json
{
  "@nestjs/cache-manager": "^2.1.0",
  "cache-manager": "^5.2.3",
  "cache-manager-redis-store": "^3.0.1",
  "date-fns": "^2.30.0",
  "lodash": "^4.17.21"
}
```

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret
REDIS_DB=0

# Cache Settings
STATS_CACHE_TTL=300
STATS_CACHE_MAX_KEYS=10000

# Performance Settings
STATS_QUERY_TIMEOUT=5000
STATS_MAX_DATE_RANGE_DAYS=730

# Feature Flags
STATS_ENABLE_MATERIALIZED_VIEWS=true
STATS_ENABLE_QUERY_CACHING=true
```

## Contributing

### Documentation Guidelines

When adding new statistics features:

1. Update module overview with new functionality
2. Document API endpoints in detail
3. Create use case documentation
4. Add Mermaid diagrams for complex flows
5. Update this README with new links

### Code Standards

- Follow NestJS best practices
- Write unit tests for all services
- Document complex aggregation logic
- Use TypeScript strict mode
- Follow existing naming conventions

## Support & Troubleshooting

### Common Issues

**Issue**: Slow response times

- **Solution**: Check cache hit rates, optimize database indexes, increase cache TTL

**Issue**: Inaccurate statistics

- **Solution**: Verify date range calculations, check for timezone issues, clear cache

**Issue**: High memory usage

- **Solution**: Limit result set sizes, optimize query result handling, increase pagination

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run start:dev
```

## Related Documentation

- [Module Overview](./module-overview.md)
- [System Design](./system-design.md)
- [Feature Specification](./feature-specification.md)
- [End User API](./api-specifications/end-user-stats-api.md)
- [Admin API](./api-specifications/admin-stats-api.md)
- [Architecture Diagrams](./mermaid-diagrams/api-architecture.md)

## Changelog

### v1.0.0 (2025-11-17)

- Initial documentation creation
- Module architecture defined
- API specifications documented
- Use cases documented
- System design completed

## License

Internal documentation - I Love Memes Platform

---

**Maintained by**: Platform Development Team

**Contact**: dev@ilovememes.com

**Last Review**: November 17, 2025
