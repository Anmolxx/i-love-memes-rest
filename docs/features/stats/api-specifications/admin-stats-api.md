# API Specification: Admin Statistics Endpoints

## Overview

Admin statistics endpoints provide platform-wide analytics and insights for administrators. These endpoints enable monitoring of system health, user growth, content performance, and engagement trends across the entire platform.

## Authentication

All admin statistics endpoints require:

1. **JWT Authentication**: Valid JWT token
2. **Admin Role**: User must have admin role privileges

**Authentication Header**:

```
Authorization: Bearer <jwt_token>
```

## Base URL

```
/api/v1/stats/admin
```

## Rate Limiting

- **Limit**: 120 requests per minute per admin user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Endpoints

### 1. Get Platform Overview

Retrieve comprehensive platform-wide statistics dashboard.

**Endpoint**: `GET /stats/admin/overview`

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**: None

**Request Example**:

```bash
curl -X GET "https://api.ilovememes.com/v1/stats/admin/overview" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**: `200 OK`

```json
{
  "systemHealth": {
    "status": "HEALTHY",
    "uptime": 2592000,
    "activeUsers": 1247,
    "requestsPerMinute": 3456
  },
  "contentSummary": {
    "totalMemes": 125678,
    "memesToday": 342,
    "memesThisWeek": 2156,
    "memesThisMonth": 8934,
    "totalTemplates": 487,
    "activeTemplates": 423
  },
  "userSummary": {
    "totalUsers": 45123,
    "activeUsersToday": 3214,
    "activeUsersThisWeek": 12456,
    "activeUsersThisMonth": 28934,
    "newUsersToday": 78,
    "newUsersThisWeek": 456
  },
  "engagementSummary": {
    "totalInteractions": 3456789,
    "upvotesToday": 12456,
    "downvotesToday": 234,
    "commentsToday": 1567,
    "flagsToday": 23,
    "reportsToday": 12
  },
  "moderationQueue": {
    "pendingReports": 45,
    "pendingFlags": 78,
    "resolvedToday": 123
  }
}
```

**Error Responses**:

```json
// 403 Forbidden (not admin)
{
  "statusCode": 403,
  "message": "You do not have permission to access admin statistics",
  "error": "Forbidden"
}
```

**Caching**:

- TTL: 1 minute (real-time data)
- Cache key: `admin:overview`

### 2. Get Template Usage Analytics

Retrieve template usage statistics with comparative period analysis.

**Endpoint**: `GET /stats/admin/templates/usage`

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**:

- `startDate` (string, optional): ISO 8601 date string (default: 30 days ago)
- `endDate` (string, optional): ISO 8601 date string (default: today)
- `comparison` (enum, optional): Comparison type - `WOW` (Week-over-Week), `MOM` (Month-over-Month), `QOQ` (Quarter-over-Quarter), `YOY` (Year-over-Year)
- `sortBy` (enum, optional): Sort field - `usage`, `growth`, `adoption` (default: `usage`)
- `limit` (number, optional): Number of templates to return (default: 50, max: 200)

**Request Example**:

```bash
curl -X GET "https://api.ilovememes.com/v1/stats/admin/templates/usage?startDate=2025-10-01T00:00:00Z&endDate=2025-10-31T23:59:59Z&comparison=MOM&sortBy=growth&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**: `200 OK`

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
  "templates": [
    {
      "templateId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "templateName": "Distracted Boyfriend",
      "categoryName": "Relationship",
      "currentPeriod": {
        "usageCount": 567,
        "uniqueUsers": 342,
        "averageEngagement": 67.8
      },
      "previousPeriod": {
        "usageCount": 423,
        "uniqueUsers": 289,
        "averageEngagement": 62.4
      },
      "comparison": {
        "usageChange": 34.04,
        "userGrowth": 18.34,
        "engagementChange": 8.65,
        "trend": "UP"
      },
      "usageTrend": [
        { "date": "2025-10-01", "usageCount": 18 },
        { "date": "2025-10-02", "usageCount": 22 },
        { "date": "2025-10-03", "usageCount": 19 }
        // ... more data points
      ]
    },
    {
      "templateId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "templateName": "Drake Hotline Bling",
      "categoryName": "Reaction",
      "currentPeriod": {
        "usageCount": 489,
        "uniqueUsers": 301,
        "averageEngagement": 71.2
      },
      "previousPeriod": {
        "usageCount": 512,
        "uniqueUsers": 318,
        "averageEngagement": 69.8
      },
      "comparison": {
        "usageChange": -4.49,
        "userGrowth": -5.35,
        "engagementChange": 2.01,
        "trend": "DOWN"
      },
      "usageTrend": [
        { "date": "2025-10-01", "usageCount": 16 },
        { "date": "2025-10-02", "usageCount": 15 },
        { "date": "2025-10-03", "usageCount": 17 }
        // ... more data points
      ]
    }
    // ... more templates
  ]
}
```

**Validation Rules**:

- `startDate` must be before `endDate`
- Date range cannot exceed 2 years
- `limit` must be between 1 and 200
- `sortBy` must be one of: `usage`, `growth`, `adoption`
- `comparison` must be one of: `WOW`, `MOM`, `QOQ`, `YOY`

**Caching**:

- TTL: 1 hour
- Cache key: `admin:templates:usage:{startDate}:{endDate}:{comparison}:{sortBy}:{limit}`

### 3. Get Top Meme Charts

Retrieve top meme charts with daily breakdown for a specified period.

**Endpoint**: `GET /stats/admin/top-charts`

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**:

- `days` (number, optional): Number of days to retrieve (default: 30, max: 90)
- `limit` (number, optional): Top N memes per day (default: 10, max: 50)

**Request Example**:

```bash
curl -X GET "https://api.ilovememes.com/v1/stats/admin/top-charts?days=7&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**: `200 OK`

```json
{
  "period": {
    "startDate": "2025-11-10T00:00:00Z",
    "endDate": "2025-11-17T23:59:59Z",
    "totalDays": 7
  },
  "dailyCharts": [
    {
      "date": "2025-11-17",
      "topMemes": [
        {
          "rank": 1,
          "memeId": "c9f84a1e-2b3c-4d5e-8f7a-9b0c1d2e3f4a",
          "memeSlug": "when-you-finally-understand-recursion",
          "title": "When you finally understand recursion",
          "authorId": "d8e7f6a5-b4c3-2109-8765-4321fedcba98",
          "authorName": "codewizard42",
          "metrics": {
            "upvotes": 342,
            "downvotes": 8,
            "comments": 47,
            "engagementScore": 87.5
          },
          "templateName": "Drake Hotline Bling",
          "categoryName": "Programming"
        },
        {
          "rank": 2,
          "memeId": "a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
          "memeSlug": "debugging-at-3am",
          "title": "Debugging at 3AM",
          "authorId": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
          "authorName": "nightcoder",
          "metrics": {
            "upvotes": 289,
            "downvotes": 5,
            "comments": 38,
            "engagementScore": 82.3
          },
          "templateName": "Sleeping Shaq",
          "categoryName": "Programming"
        }
        // ... 8 more memes
      ],
      "summary": {
        "totalMemes": 1245,
        "totalUpvotes": 18934,
        "averageEngagement": 45.8
      }
    },
    {
      "date": "2025-11-16",
      "topMemes": [
        // ... top 10 memes for this day
      ],
      "summary": {
        "totalMemes": 1189,
        "totalUpvotes": 17856,
        "averageEngagement": 43.2
      }
    }
    // ... 5 more days
  ],
  "overallTopMemes": [
    {
      "memeId": "c9f84a1e-2b3c-4d5e-8f7a-9b0c1d2e3f4a",
      "memeSlug": "when-you-finally-understand-recursion",
      "title": "When you finally understand recursion",
      "totalUpvotes": 2145,
      "averageRank": 1.8,
      "daysInTop": 7
    },
    {
      "memeId": "a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      "memeSlug": "debugging-at-3am",
      "title": "Debugging at 3AM",
      "totalUpvotes": 1987,
      "averageRank": 2.4,
      "daysInTop": 6
    }
    // ... more top memes
  ]
}
```

**Validation Rules**:

- `days` must be between 1 and 90
- `limit` must be between 1 and 50

**Caching**:

- TTL: 24 hours (historical data)
- TTL: 5 minutes (for current day)
- Cache key: `admin:top:charts:{days}:{limit}:{currentDate}`

### 4. Get User Growth Statistics

Retrieve user growth and retention metrics with comparative analysis.

**Endpoint**: `GET /stats/admin/users/growth`

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**:

- `startDate` (string, optional): ISO 8601 date string (default: 30 days ago)
- `endDate` (string, optional): ISO 8601 date string (default: today)
- `comparison` (enum, optional): Comparison type - `WOW`, `MOM`, `QOQ`, `YOY`
- `granularity` (enum, optional): Data granularity - `DAILY`, `WEEKLY`, `MONTHLY` (default: `DAILY`)

**Request Example**:

```bash
curl -X GET "https://api.ilovememes.com/v1/stats/admin/users/growth?startDate=2025-10-01T00:00:00Z&endDate=2025-10-31T23:59:59Z&comparison=MOM&granularity=WEEKLY" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**: `200 OK`

```json
{
  "timeRange": {
    "startDate": "2025-10-01T00:00:00Z",
    "endDate": "2025-10-31T23:59:59Z",
    "granularity": "WEEKLY"
  },
  "comparisonPeriod": {
    "startDate": "2025-09-01T00:00:00Z",
    "endDate": "2025-09-30T23:59:59Z",
    "type": "MOM"
  },
  "currentPeriod": {
    "newUsers": 1234,
    "activeUsers": 8456,
    "retainedUsers": 7123,
    "churnedUsers": 234,
    "retentionRate": 84.23,
    "churnRate": 2.77
  },
  "previousPeriod": {
    "newUsers": 1089,
    "activeUsers": 7834,
    "retainedUsers": 6723,
    "churnedUsers": 289,
    "retentionRate": 85.82,
    "churnRate": 3.69
  },
  "comparison": {
    "newUsersChange": 13.32,
    "activeUsersChange": 7.94,
    "retentionRateChange": -1.59,
    "trend": "UP"
  },
  "growthTrend": [
    {
      "date": "2025-10-01",
      "newUsers": 47,
      "activeUsers": 1245,
      "cumulativeUsers": 43567
    },
    {
      "date": "2025-10-08",
      "newUsers": 53,
      "activeUsers": 1389,
      "cumulativeUsers": 43620
    },
    {
      "date": "2025-10-15",
      "newUsers": 61,
      "activeUsers": 1456,
      "cumulativeUsers": 43681
    },
    {
      "date": "2025-10-22",
      "newUsers": 58,
      "activeUsers": 1423,
      "cumulativeUsers": 43739
    },
    {
      "date": "2025-10-29",
      "newUsers": 55,
      "activeUsers": 1398,
      "cumulativeUsers": 43794
    }
  ],
  "cohortAnalysis": [
    {
      "cohortDate": "2025-10-01",
      "cohortSize": 47,
      "retentionRates": {
        "week1": 89.36,
        "week2": 78.72,
        "week4": 65.96,
        "month3": 0
      }
    },
    {
      "cohortDate": "2025-10-08",
      "cohortSize": 53,
      "retentionRates": {
        "week1": 90.57,
        "week2": 81.13,
        "week4": 0,
        "month3": 0
      }
    }
    // ... more cohorts
  ]
}
```

**Validation Rules**:

- `startDate` must be before `endDate`
- Date range cannot exceed 2 years
- `granularity` must be one of: `DAILY`, `WEEKLY`, `MONTHLY`
- `comparison` must be one of: `WOW`, `MOM`, `QOQ`, `YOY`

**Caching**:

- TTL: 1 hour
- Cache key: `admin:users:growth:{startDate}:{endDate}:{comparison}:{granularity}`

### 5. Get Interaction Statistics

Retrieve interaction statistics summary and trends.

**Endpoint**: `GET /stats/admin/interactions/summary`

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**:

- `startDate` (string, optional): ISO 8601 date string (default: 30 days ago)
- `endDate` (string, optional): ISO 8601 date string (default: today)
- `interactionType` (enum, optional): Filter by type - `UPVOTE`, `DOWNVOTE`, `FLAG`, `REPORT`, `ALL` (default: `ALL`)

**Request Example**:

```bash
curl -X GET "https://api.ilovememes.com/v1/stats/admin/interactions/summary?startDate=2025-11-01T00:00:00Z&endDate=2025-11-17T23:59:59Z&interactionType=ALL" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**: `200 OK`

```json
{
  "timeRange": {
    "startDate": "2025-11-01T00:00:00Z",
    "endDate": "2025-11-17T23:59:59Z"
  },
  "interactionType": "ALL",
  "summary": {
    "totalInteractions": 234567,
    "upvotes": 198456,
    "downvotes": 12345,
    "flags": 1234,
    "reports": 532,
    "uniqueUsers": 8934,
    "uniqueMemes": 12456,
    "averageInteractionsPerMeme": 18.83,
    "averageInteractionsPerUser": 26.26
  },
  "trends": [
    {
      "date": "2025-11-01",
      "upvotes": 11234,
      "downvotes": 678,
      "flags": 67,
      "reports": 29,
      "netEngagement": 10556
    },
    {
      "date": "2025-11-02",
      "upvotes": 12456,
      "downvotes": 734,
      "flags": 72,
      "reports": 31,
      "netEngagement": 11722
    }
    // ... more data points
  ],
  "topInteractedMemes": [
    {
      "memeId": "c9f84a1e-2b3c-4d5e-8f7a-9b0c1d2e3f4a",
      "memeSlug": "when-you-finally-understand-recursion",
      "title": "When you finally understand recursion",
      "totalInteractions": 397,
      "upvotes": 342,
      "downvotes": 8,
      "engagementScore": 87.5
    },
    {
      "memeId": "a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      "memeSlug": "debugging-at-3am",
      "title": "Debugging at 3AM",
      "totalInteractions": 332,
      "upvotes": 289,
      "downvotes": 5,
      "engagementScore": 82.3
    }
    // ... more memes
  ],
  "mostActiveUsers": [
    {
      "userId": "d8e7f6a5-b4c3-2109-8765-4321fedcba98",
      "username": "codewizard42",
      "totalInteractions": 1456,
      "breakdown": {
        "upvotes": 1234,
        "downvotes": 45,
        "flags": 12,
        "reports": 5
      }
    },
    {
      "userId": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
      "username": "nightcoder",
      "totalInteractions": 1298,
      "breakdown": {
        "upvotes": 1189,
        "downvotes": 78,
        "flags": 18,
        "reports": 13
      }
    }
    // ... more users
  ]
}
```

**Validation Rules**:

- `startDate` must be before `endDate`
- Date range cannot exceed 1 year for detailed interaction stats
- `interactionType` must be one of: `UPVOTE`, `DOWNVOTE`, `FLAG`, `REPORT`, `ALL`

**Caching**:

- TTL: 5 minutes
- Cache key: `admin:interactions:{startDate}:{endDate}:{interactionType}`

## Common Response Headers

All successful responses include:

```
Content-Type: application/json
X-Response-Time: 78ms
X-Cache-Status: HIT | MISS
X-Data-Freshness: 2025-11-17T10:30:00Z
X-Admin-Access: true
```

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "startDate": "Start date must be before end date",
    "limit": "Limit must be between 1 and 200"
  }
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "You do not have permission to access admin statistics",
  "error": "Forbidden"
}
```

### 429 Too Many Requests

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again in 30 seconds.",
  "error": "Too Many Requests"
}
```

### 503 Service Unavailable

```json
{
  "statusCode": 503,
  "message": "Statistics temporarily unavailable. Please try again.",
  "error": "Service Unavailable"
}
```

## Performance Characteristics

| Endpoint | Avg Response Time | 95th Percentile | Cache Hit Rate |
|----------|------------------|-----------------|----------------|
| Platform Overview | 85ms | 250ms | 90% |
| Template Usage | 320ms | 750ms | 75% |
| Top Charts | 450ms | 1200ms | 85% |
| User Growth | 280ms | 680ms | 70% |
| Interaction Summary | 190ms | 520ms | 80% |

## SDK Examples

### JavaScript/TypeScript

```typescript
class AdminStatsAPI {
  private baseURL = 'https://api.ilovememes.com/v1/stats/admin';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPlatformOverview() {
    return this.request('/overview');
  }

  async getTemplateUsage(params: {
    startDate?: string;
    endDate?: string;
    comparison?: 'WOW' | 'MOM' | 'QOQ' | 'YOY';
    sortBy?: 'usage' | 'growth' | 'adoption';
    limit?: number;
  }) {
    return this.request('/templates/usage', params);
  }

  async getTopCharts(days: number = 30, limit: number = 10) {
    return this.request('/top-charts', { days, limit });
  }

  async getUserGrowth(params: {
    startDate?: string;
    endDate?: string;
    comparison?: 'WOW' | 'MOM' | 'QOQ' | 'YOY';
    granularity?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  }) {
    return this.request('/users/growth', params);
  }

  async getInteractionStats(params: {
    startDate?: string;
    endDate?: string;
    interactionType?: 'UPVOTE' | 'DOWNVOTE' | 'FLAG' | 'REPORT' | 'ALL';
  }) {
    return this.request('/interactions/summary', params);
  }
}

// Usage
const adminAPI = new AdminStatsAPI(token);
const overview = await adminAPI.getPlatformOverview();
const topCharts = await adminAPI.getTopCharts(7, 10);
```

### Python

```python
import requests
from typing import Optional, Dict, Any
from datetime import datetime

class AdminStatsAPI:
    def __init__(self, token: str):
        self.base_url = 'https://api.ilovememes.com/v1/stats/admin'
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }
    
    def _request(self, endpoint: str, params: Optional[Dict[str, Any]] = None):
        response = requests.get(
            f'{self.base_url}{endpoint}',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def get_platform_overview(self):
        return self._request('/overview')
    
    def get_template_usage(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        comparison: Optional[str] = None,
        sort_by: str = 'usage',
        limit: int = 50
    ):
        params = {
            'startDate': start_date,
            'endDate': end_date,
            'comparison': comparison,
            'sortBy': sort_by,
            'limit': limit
        }
        return self._request('/templates/usage', params)
    
    def get_top_charts(self, days: int = 30, limit: int = 10):
        return self._request('/top-charts', {'days': days, 'limit': limit})
    
    def get_user_growth(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        comparison: Optional[str] = None,
        granularity: str = 'DAILY'
    ):
        params = {
            'startDate': start_date,
            'endDate': end_date,
            'comparison': comparison,
            'granularity': granularity
        }
        return self._request('/users/growth', params)
    
    def get_interaction_stats(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        interaction_type: str = 'ALL'
    ):
        params = {
            'startDate': start_date,
            'endDate': end_date,
            'interactionType': interaction_type
        }
        return self._request('/interactions/summary', params)

# Usage
admin_api = AdminStatsAPI(token)
overview = admin_api.get_platform_overview()
top_charts = admin_api.get_top_charts(days=7, limit=10)
```

## Data Export (Future Feature)

Future versions may support data export in multiple formats:

- **CSV**: Tabular data export
- **JSON**: Full structured data
- **PDF**: Formatted reports
- **Excel**: Spreadsheet format

## Audit Logging

All admin statistics access is logged for security and compliance:

```json
{
  "timestamp": "2025-11-17T10:30:45Z",
  "adminId": "admin-user-id",
  "adminUsername": "admin@ilovememes.com",
  "endpoint": "/stats/admin/users/growth",
  "params": {
    "startDate": "2025-10-01T00:00:00Z",
    "endDate": "2025-10-31T23:59:59Z",
    "comparison": "MOM"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "responseTime": 345,
  "statusCode": 200
}
```

## Changelog

### v1.0.0 (2025-11-17)

- Initial release of admin statistics endpoints
- Platform overview endpoint
- Template usage analytics endpoint
- Top meme charts endpoint
- User growth statistics endpoint
- Interaction statistics endpoint
