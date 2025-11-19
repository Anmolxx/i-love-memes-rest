# API Specification: End User Statistics Endpoints

## Overview

End user statistics endpoints provide personalized insights and performance metrics for individual users. These endpoints enable content creators to track their meme performance, understand audience engagement, and identify successful content patterns.

## Authentication

All end user statistics endpoints require JWT authentication. Users can only access their own statistics.

**Authentication Header**:

```
Authorization: Bearer <jwt_token>
```

## Base URL

```
/api/v1/stats/user
```

## Rate Limiting

- **Limit**: 60 requests per minute per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Endpoints

### 1. Get User Dashboard

Retrieve comprehensive dashboard statistics for the authenticated user.

**Endpoint**: `GET /stats/user/dashboard`

**Authentication**: Required (JWT)

**Query Parameters**: None

**Request Example**:

```bash
curl -X GET "https://api.ilovememes.com/v1/stats/user/dashboard" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**: `200 OK`

```json
{
  "summary": {
    "totalMemes": 42,
    "publicMemes": 38,
    "privateMemes": 4,
    "totalUpvotes": 1247,
    "totalDownvotes": 23,
    "totalComments": 156,
    "totalViews": 8934,
    "engagementRate": 15.8
  },
  "recentActivity": {
    "memesPostedToday": 2,
    "memesPostedThisWeek": 8,
    "memesPostedThisMonth": 23
  },
  "topPerformingMemes": [
    {
      "memeId": "c9f84a1e-2b3c-4d5e-8f7a-9b0c1d2e3f4a",
      "memeSlug": "when-you-finally-understand-recursion",
      "title": "When you finally understand recursion",
      "upvotes": 342,
      "engagementScore": 87.5,
      "createdAt": "2025-11-10T14:32:00Z"
    },
    {
      "memeId": "a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      "memeSlug": "debugging-at-3am",
      "title": "Debugging at 3AM",
      "upvotes": 289,
      "engagementScore": 82.3,
      "createdAt": "2025-11-08T22:15:00Z"
    },
    {
      "memeId": "f7e6d5c4-b3a2-1098-7654-3210fedcba98",
      "memeSlug": "css-is-awesome",
      "title": "CSS is awesome",
      "upvotes": 267,
      "engagementScore": 79.8,
      "createdAt": "2025-11-05T10:45:00Z"
    }
  ],
  "performanceTrend": {
    "period": "LAST_30_DAYS",
    "dataPoints": [
      {
        "date": "2025-10-18",
        "memesPosted": 1,
        "totalUpvotes": 45,
        "engagementRate": 18.2
      },
      {
        "date": "2025-10-19",
        "memesPosted": 2,
        "totalUpvotes": 78,
        "engagementRate": 16.5
      },
      {
        "date": "2025-10-20",
        "memesPosted": 0,
        "totalUpvotes": 12,
        "engagementRate": 0
      }
      // ... 27 more data points
    ]
  }
}
```

**Error Responses**:

```json
// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// 429 Too Many Requests
{
  "statusCode": 429,
  "message": "Too many requests. Please try again in 45 seconds.",
  "error": "Too Many Requests"
}

// 503 Service Unavailable
{
  "statusCode": 503,
  "message": "Statistics temporarily unavailable. Please try again.",
  "error": "Service Unavailable"
}
```

**Caching**:

- TTL: 5 minutes
- Cache key: `user:dashboard:{userId}`

### 2. Get Meme Performance

Retrieve detailed performance metrics for a specific meme owned by the user.

**Endpoint**: `GET /stats/user/memes/:id/performance`

**Authentication**: Required (JWT)

**Path Parameters**:

- `id` (string, required): Meme ID (UUID) or slug

**Query Parameters**:

- `includeComparisons` (boolean, optional, default: false): Include platform average comparisons

**Request Example**:

```bash
curl -X GET "https://api.ilovememes.com/v1/stats/user/memes/when-you-finally-understand-recursion/performance?includeComparisons=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**: `200 OK`

```json
{
  "memeId": "c9f84a1e-2b3c-4d5e-8f7a-9b0c1d2e3f4a",
  "memeSlug": "when-you-finally-understand-recursion",
  "title": "When you finally understand recursion",
  "createdAt": "2025-11-10T14:32:00Z",
  "metrics": {
    "totalUpvotes": 342,
    "totalDownvotes": 8,
    "totalComments": 47,
    "totalViews": 2145,
    "engagementScore": 87.5,
    "viralityScore": 72.3
  },
  "engagement": {
    "upvoteRate": 15.94,
    "commentRate": 2.19,
    "shareRate": 3.42
  },
  "timeSeriesData": [
    {
      "date": "2025-11-10",
      "upvotes": 87,
      "downvotes": 2,
      "comments": 12,
      "views": 456
    },
    {
      "date": "2025-11-11",
      "upvotes": 123,
      "downvotes": 3,
      "comments": 18,
      "views": 789
    },
    {
      "date": "2025-11-12",
      "upvotes": 89,
      "downvotes": 2,
      "comments": 11,
      "views": 543
    }
    // ... more data points
  ],
  "platformComparison": {
    "averageUpvotes": 42.5,
    "averageEngagementScore": 35.8,
    "percentile": 94.2
  }
}
```

**Error Responses**:

```json
// 403 Forbidden (not the owner)
{
  "statusCode": 403,
  "message": "You do not have permission to view this meme's statistics",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Meme with identifier 'invalid-slug' not found",
  "error": "Not Found"
}
```

**Caching**:

- TTL: 1 hour
- Cache key: `user:meme:performance:{memeId}:{userId}:{includeComparisons}`

### 3. Get User Activity

Retrieve user activity statistics over a specified time range.

**Endpoint**: `GET /stats/user/activity`

**Authentication**: Required (JWT)

**Query Parameters**:

- `startDate` (string, optional): ISO 8601 date string (default: 30 days ago)
- `endDate` (string, optional): ISO 8601 date string (default: today)
- `period` (enum, optional): Aggregation period - `DAILY`, `WEEKLY`, `MONTHLY` (default: `DAILY`)

**Request Example**:

```bash
curl -X GET "https://api.ilovememes.com/v1/stats/user/activity?startDate=2025-10-01T00:00:00Z&endDate=2025-10-31T23:59:59Z&period=WEEKLY" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**: `200 OK`

```json
{
  "userId": "d8e7f6a5-b4c3-2109-8765-4321fedcba98",
  "timeRange": {
    "startDate": "2025-10-01T00:00:00Z",
    "endDate": "2025-10-31T23:59:59Z",
    "period": "WEEKLY"
  },
  "activitySummary": {
    "memesCreated": 23,
    "upvotesGiven": 487,
    "downvotesGiven": 12,
    "commentsPosted": 89,
    "memesViewed": 1245
  },
  "activityTrend": [
    {
      "date": "2025-10-01",
      "memesCreated": 3,
      "upvotesGiven": 67,
      "commentsPosted": 12
    },
    {
      "date": "2025-10-08",
      "memesCreated": 5,
      "upvotesGiven": 102,
      "commentsPosted": 18
    },
    {
      "date": "2025-10-15",
      "memesCreated": 8,
      "upvotesGiven": 156,
      "commentsPosted": 31
    },
    {
      "date": "2025-10-22",
      "memesCreated": 4,
      "upvotesGiven": 89,
      "commentsPosted": 15
    },
    {
      "date": "2025-10-29",
      "memesCreated": 3,
      "upvotesGiven": 73,
      "commentsPosted": 13
    }
  ],
  "mostActiveDay": {
    "date": "2025-10-15",
    "activityCount": 45
  },
  "mostUsedTemplates": [
    {
      "templateId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "templateName": "Distracted Boyfriend",
      "usageCount": 8
    },
    {
      "templateId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "templateName": "Drake Hotline Bling",
      "usageCount": 6
    },
    {
      "templateId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "templateName": "Expanding Brain",
      "usageCount": 4
    }
  ]
}
```

**Error Responses**:

```json
// 400 Bad Request (invalid date range)
{
  "statusCode": 400,
  "message": "Invalid date range",
  "errors": {
    "startDate": "Start date must be before end date",
    "endDate": "End date cannot be in the future"
  }
}
```

**Validation Rules**:

- `startDate` must be before `endDate`
- `endDate` cannot be in the future
- Date range cannot exceed 2 years
- Dates must be valid ISO 8601 format

**Caching**:

- TTL: 5 minutes
- Cache key: `user:activity:{userId}:{startDate}:{endDate}:{period}`

## Common Response Headers

All successful responses include these headers:

```
Content-Type: application/json
X-Response-Time: 45ms
X-Cache-Status: HIT | MISS
X-Data-Freshness: 2025-11-17T10:30:00Z
```

## Pagination

User statistics endpoints do not use pagination as they return aggregated summary data. However, `topPerformingMemes` arrays are limited to 10 items by default.

## Data Freshness

- **Real-time metrics**: Updated within 5 minutes
- **Historical metrics**: Updated daily at 00:30 UTC
- **Cache**: Varies by endpoint (see individual endpoint caching sections)

## Performance Characteristics

| Endpoint | Avg Response Time | 95th Percentile | Cache Hit Rate |
|----------|------------------|-----------------|----------------|
| User Dashboard | 120ms | 350ms | 85% |
| Meme Performance | 80ms | 200ms | 90% |
| User Activity | 150ms | 400ms | 75% |

## SDK Examples

### JavaScript/TypeScript

```typescript
// Using fetch API
async function getUserDashboard(token: string) {
  const response = await fetch('https://api.ilovememes.com/v1/stats/user/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// Using axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.ilovememes.com/v1',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  },
});

const dashboard = await api.get('/stats/user/dashboard');
const memePerf = await api.get(`/stats/user/memes/${memeSlug}/performance`, {
  params: { includeComparisons: true },
});
```

### Python

```python
import requests

class ILoveMemesSta API:
    def __init__(self, token):
        self.base_url = 'https://api.ilovememes.com/v1'
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }
    
    def get_user_dashboard(self):
        response = requests.get(
            f'{self.base_url}/stats/user/dashboard',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_meme_performance(self, meme_id, include_comparisons=False):
        response = requests.get(
            f'{self.base_url}/stats/user/memes/{meme_id}/performance',
            headers=self.headers,
            params={'includeComparisons': include_comparisons}
        )
        response.raise_for_status()
        return response.json()
```

## Webhook Notifications (Future)

Future versions may support webhook notifications for:

- Meme reaches viral threshold
- New engagement milestone (100, 500, 1000 upvotes)
- Meme becomes trending
- Daily/weekly performance summary

## Changelog

### v1.0.0 (2025-11-17)

- Initial release of end user statistics endpoints
- User dashboard endpoint
- Meme performance endpoint
- User activity endpoint
