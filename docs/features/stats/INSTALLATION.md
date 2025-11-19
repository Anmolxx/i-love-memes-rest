# Stats Module - Quick Installation Guide

## Prerequisites

- Node.js v18+
- PostgreSQL v14+
- Redis v7+ (for caching)
- Existing I Love Memes backend installation

## Installation Steps

### 1. Install Dependencies

```bash
cd D:\Lakshay\code\i-love-memes\code\i-love-memes-backend

npm install @nestjs/cache-manager cache-manager date-fns
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Redis Cache Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Stats Module Configuration (Optional)
STATS_CACHE_TTL=300
STATS_QUERY_TIMEOUT=5000
```

### 3. Start Redis (if not already running)

**Windows**:
```powershell
# If installed via Chocolatey
redis-server

# Or via Docker
docker run -d -p 6379:6379 redis:7-alpine
```

**Linux/Mac**:
```bash
redis-server

# Or via Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Create Database Indexes (Optional but Recommended)

Create a new migration file:

```bash
npm run migration:create -- CreateStatsIndexes
```

Add this content to the migration file:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStatsIndexes1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Memes time-series indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_memes_created_at 
      ON memes(created_at) 
      WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_memes_author_created 
      ON memes(author_id, created_at) 
      WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_memes_template_created 
      ON memes(template_id, created_at) 
      WHERE deleted_at IS NULL;
    `);

    // Interaction indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_interactions_meme_type_created 
      ON meme_interactions(meme_id, type, created_at);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_interactions_created_type 
      ON meme_interactions(created_at, type);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_memes_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_memes_author_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_memes_template_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_meme_type_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interactions_created_type;`);
  }
}
```

Run the migration:

```bash
npm run migration:run
```

### 5. Verify Installation

Start the development server:

```bash
npm run start:dev
```

Check for stats module in logs:
```
[Nest] ... StatsModule dependencies initialized
```

### 6. Test the API

Visit Swagger documentation:
```
http://localhost:3000/docs
```

Look for the "Statistics" section with available endpoints.

## Quick Test

### Get User Dashboard (Authenticated)

```bash
# First, login to get a token
curl -X POST "http://localhost:3000/v1/auth/email/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'

# Use the token from response
export TOKEN="your-jwt-token-here"

# Get dashboard
curl -X GET "http://localhost:3000/v1/stats/user/dashboard" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Admin Overview (Admin User)

```bash
# Login as admin
curl -X POST "http://localhost:3000/v1/auth/email/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}'

export ADMIN_TOKEN="your-admin-jwt-token"

# Get platform overview
curl -X GET "http://localhost:3000/v1/stats/admin/overview" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Troubleshooting

### Redis Connection Error

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution**: 
1. Ensure Redis is running: `redis-cli ping` should return `PONG`
2. Check Redis configuration in `.env`
3. Try restarting Redis server

### Database Query Timeout

**Error**: `QueryFailedError: timeout`

**Solution**:
1. Ensure database indexes are created
2. Check query performance with `EXPLAIN ANALYZE`
3. Increase `STATS_QUERY_TIMEOUT` in `.env`

### Cache Not Working

**Error**: Cache hit rate is 0%

**Solution**:
1. Verify Redis connection
2. Check cache TTL configuration
3. Clear cache and retry: `redis-cli FLUSHDB`

### Authentication Errors

**Error**: `401 Unauthorized`

**Solution**:
1. Ensure JWT token is valid and not expired
2. Check Authorization header format: `Bearer <token>`
3. Verify user exists in database

## Configuration

### Cache TTL Settings

Adjust in `.env`:

```bash
# Shorter TTL for real-time data
STATS_CACHE_TTL=60  # 1 minute

# Longer TTL for historical data
STATS_CACHE_TTL=3600  # 1 hour
```

### Performance Tuning

For high-traffic environments:

```bash
# Increase cache capacity
STATS_CACHE_MAX_KEYS=50000

# Increase query timeout
STATS_QUERY_TIMEOUT=10000  # 10 seconds

# Enable materialized views
STATS_ENABLE_MATERIALIZED_VIEWS=true
```

## Next Steps

1. **Review Documentation**: Check [README.md](./README.md) for full details
2. **Explore API**: Use Swagger UI to test all endpoints
3. **Implement Missing Features**: See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
4. **Add Tests**: Write unit and integration tests
5. **Monitor Performance**: Set up monitoring and alerting

## Support

For issues or questions:
- Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for known issues
- Review [system-design.md](./system-design.md) for technical details
- See [API specifications](./api-specifications/) for endpoint documentation

---

**Installation Complete!** 🎉

The Stats Module is now ready for development and testing.
