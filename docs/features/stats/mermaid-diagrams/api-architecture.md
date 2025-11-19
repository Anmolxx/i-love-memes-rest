# Mermaid Diagrams: API Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application]
        MOBILE[Mobile App]
        ADMIN[Admin Dashboard]
    end
    
    subgraph "API Gateway"
        GW[NestJS API Gateway]
        AUTH[Authentication Middleware]
        RATE[Rate Limiter]
    end
    
    subgraph "Stats Module"
        SC[Stats Controller]
        SS[Stats Service]
        CM[Cache Manager]
        
        subgraph "Specialized Services"
            USS[User Stats Service]
            ASS[Admin Stats Service]
            MS[Meme Stats Service]
            TS[Template Stats Service]
            IS[Interaction Stats Service]
            TSS[Time Series Service]
        end
    end
    
    subgraph "Data Layer"
        REDIS[(Redis Cache)]
        PG[(PostgreSQL)]
        
        subgraph "Repositories"
            MR[Memes Repository]
            TR[Templates Repository]
            IR[Interactions Repository]
            UR[Users Repository]
        end
    end
    
    WEB --> GW
    MOBILE --> GW
    ADMIN --> GW
    
    GW --> AUTH
    AUTH --> RATE
    RATE --> SC
    
    SC --> SS
    SS --> CM
    SS --> USS
    SS --> ASS
    SS --> MS
    SS --> TS
    SS --> IS
    SS --> TSS
    
    USS --> MR
    USS --> UR
    ASS --> MR
    ASS --> TR
    ASS --> IR
    ASS --> UR
    MS --> MR
    MS --> IR
    TS --> TR
    TS --> MR
    IS --> IR
    
    CM <--> REDIS
    MR --> PG
    TR --> PG
    IR --> PG
    UR --> PG
```

## Request Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant StatsService
    participant CacheManager
    participant SpecializedService
    participant Repository
    participant Database
    
    Client->>Controller: GET /stats/user/dashboard
    Controller->>Controller: Validate JWT Token
    Controller->>Controller: Check Rate Limit
    
    Controller->>StatsService: getUserDashboard(userId)
    StatsService->>CacheManager: get('user:dashboard:{userId}')
    
    alt Cache Hit
        CacheManager-->>StatsService: Cached Data
        StatsService-->>Controller: Dashboard Data
        Controller-->>Client: 200 OK (cached)
    else Cache Miss
        CacheManager-->>StatsService: null
        StatsService->>SpecializedService: fetchUserDashboard(userId)
        
        par Parallel Data Fetching
            SpecializedService->>Repository: getUserMemeSummary(userId)
            Repository->>Database: SELECT COUNT(*), SUM(...)
            Database-->>Repository: Aggregated Data
            Repository-->>SpecializedService: Summary Data
        and
            SpecializedService->>Repository: getTopPerformingMemes(userId)
            Repository->>Database: SELECT ... ORDER BY upvotes
            Database-->>Repository: Top Memes
            Repository-->>SpecializedService: Top Memes Data
        and
            SpecializedService->>Repository: getRecentActivity(userId)
            Repository->>Database: SELECT ... WHERE created_at > ?
            Database-->>Repository: Recent Activity
            Repository-->>SpecializedService: Activity Data
        end
        
        SpecializedService-->>StatsService: Aggregated Dashboard
        StatsService->>CacheManager: set('user:dashboard:{userId}', data, TTL)
        CacheManager-->>StatsService: OK
        StatsService-->>Controller: Dashboard Data
        Controller-->>Client: 200 OK (fresh)
    end
```

## Admin Statistics Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Controller
    participant StatsService
    participant AdminStatsService
    participant Cache
    participant DB
    
    Admin->>Controller: GET /stats/admin/templates/usage?comparison=MOM
    Controller->>Controller: Validate JWT + Admin Role
    
    alt Not Admin
        Controller-->>Admin: 403 Forbidden
    else Is Admin
        Controller->>StatsService: getTemplateUsage(query)
        StatsService->>Cache: get(cacheKey)
        
        alt Cache Hit
            Cache-->>StatsService: Cached Data
        else Cache Miss
            Cache-->>StatsService: null
            StatsService->>AdminStatsService: calculateTemplateUsage(query)
            
            AdminStatsService->>AdminStatsService: calculateTimeRanges()
            
            par Fetch Current Period Data
                AdminStatsService->>DB: Query Current Period
                DB-->>AdminStatsService: Current Data
            and Fetch Previous Period Data
                AdminStatsService->>DB: Query Previous Period
                DB-->>AdminStatsService: Previous Data
            end
            
            AdminStatsService->>AdminStatsService: calculateComparisons()
            AdminStatsService->>AdminStatsService: calculateTrends()
            AdminStatsService-->>StatsService: Template Usage Data
            
            StatsService->>Cache: set(cacheKey, data)
        end
        
        StatsService-->>Controller: Template Usage Response
        Controller-->>Admin: 200 OK
    end
```

## Cache Strategy Diagram

```mermaid
graph LR
    subgraph "Cache Layers"
        L1[In-Memory Cache<br/>TTL: 1min]
        L2[Redis Cache<br/>TTL: 5min-24hr]
    end
    
    subgraph "Data Sources"
        DB[(Database)]
        MV[Materialized Views]
    end
    
    REQUEST[API Request] --> L1
    L1 -->|Miss| L2
    L2 -->|Miss| MV
    MV -->|Not Available| DB
    
    DB -->|Compute| L2
    MV -->|Compute| L2
    L2 -->|Store| L1
    
    L1 -->|Hit| RESPONSE[API Response]
    L2 -->|Hit| RESPONSE
    MV -->|Hit| RESPONSE
    DB -->|Hit| RESPONSE
    
    style L1 fill:#90EE90
    style L2 fill:#87CEEB
    style MV fill:#FFD700
    style DB fill:#FFA500
```

## Data Aggregation Pipeline

```mermaid
flowchart TD
    START[Stats Request] --> VALIDATE[Validate Parameters]
    VALIDATE --> CACHE_CHECK{Check Cache}
    
    CACHE_CHECK -->|Hit| RETURN_CACHED[Return Cached Data]
    CACHE_CHECK -->|Miss| TIME_RANGE[Calculate Time Range]
    
    TIME_RANGE --> COMPARISON{Needs Comparison?}
    COMPARISON -->|Yes| CALC_COMP[Calculate Comparison Period]
    COMPARISON -->|No| QUERY_DB
    CALC_COMP --> QUERY_DB[Query Database]
    
    QUERY_DB --> PARALLEL{Parallel Queries?}
    
    PARALLEL -->|Yes| PARALLEL_EXEC
    PARALLEL -->|No| SINGLE_QUERY[Execute Single Query]
    
    subgraph PARALLEL_EXEC[Parallel Execution]
        Q1[Query 1: Current Period]
        Q2[Query 2: Previous Period]
        Q3[Query 3: Trends]
        Q4[Query 4: Top Items]
    end
    
    SINGLE_QUERY --> AGGREGATE
    PARALLEL_EXEC --> AGGREGATE[Aggregate Results]
    
    AGGREGATE --> CALCULATE[Calculate Metrics]
    CALCULATE --> FORMAT[Format Response]
    FORMAT --> STORE_CACHE[Store in Cache]
    STORE_CACHE --> RETURN[Return to Client]
    RETURN_CACHED --> END[End]
    RETURN --> END
    
    style CACHE_CHECK fill:#87CEEB
    style PARALLEL_EXEC fill:#90EE90
    style CALCULATE fill:#FFD700
```

## Module Dependencies

```mermaid
graph TB
    subgraph "Stats Module"
        SM[StatsModule]
        SC[StatsController]
        SS[StatsService]
    end
    
    subgraph "Domain Modules"
        MM[MemesModule]
        TM[TemplatesModule]
        IM[InteractionsModule]
        UM[UsersModule]
        CM[CommentsModule]
    end
    
    subgraph "Infrastructure Modules"
        CACHE[CacheModule]
        DB[DatabaseModule]
        AUTH[AuthModule]
    end
    
    SM --> MM
    SM --> TM
    SM --> IM
    SM --> UM
    SM --> CM
    SM --> CACHE
    SM --> DB
    SM --> AUTH
    
    SC --> SS
    SS --> MM
    SS --> TM
    SS --> IM
    SS --> UM
    
    style SM fill:#FF6B6B
    style CACHE fill:#4ECDC4
    style DB fill:#45B7D1
    style AUTH fill:#FFA07A
```

## Time-Series Aggregation

```mermaid
graph LR
    subgraph "Input"
        RAW[Raw Events]
    end
    
    subgraph "Aggregation Levels"
        HOURLY[Hourly Aggregates]
        DAILY[Daily Aggregates]
        WEEKLY[Weekly Aggregates]
        MONTHLY[Monthly Aggregates]
        YEARLY[Yearly Aggregates]
    end
    
    subgraph "Storage"
        HOT[Hot Data<br/>Last 7 days]
        WARM[Warm Data<br/>Last 90 days]
        COLD[Cold Data<br/>90+ days]
    end
    
    RAW --> HOURLY
    HOURLY --> DAILY
    DAILY --> WEEKLY
    WEEKLY --> MONTHLY
    MONTHLY --> YEARLY
    
    HOURLY --> HOT
    DAILY --> HOT
    DAILY --> WARM
    WEEKLY --> WARM
    MONTHLY --> COLD
    YEARLY --> COLD
    
    style RAW fill:#FF6B6B
    style HOT fill:#90EE90
    style WARM fill:#FFD700
    style COLD fill:#87CEEB
```

## Comparison Period Calculation

```mermaid
flowchart TD
    START[Comparison Request] --> INPUT[Input: Current Period + Comparison Type]
    
    INPUT --> TYPE{Comparison Type}
    
    TYPE -->|WOW| WOW[Week-over-Week]
    TYPE -->|MOM| MOM[Month-over-Month]
    TYPE -->|QOQ| QOQ[Quarter-over-Quarter]
    TYPE -->|YOY| YOY[Year-over-Year]
    
    WOW --> CALC_WOW[Previous Period = Current - 7 days]
    MOM --> CALC_MOM[Previous Period = Same days in previous month]
    QOQ --> CALC_QOQ[Previous Period = Same days in previous quarter]
    YOY --> CALC_YOY[Previous Period = Same days in previous year]
    
    CALC_WOW --> FETCH
    CALC_MOM --> FETCH
    CALC_QOQ --> FETCH
    CALC_YOY --> FETCH
    
    FETCH[Fetch Both Period Data] --> COMPARE[Calculate Differences]
    
    COMPARE --> METRICS[Generate Comparison Metrics]
    
    METRICS --> OUTPUT[Output: Current + Previous + Comparison]
    
    style TYPE fill:#FFD700
    style FETCH fill:#87CEEB
    style COMPARE fill:#90EE90
```

## Error Handling Flow

```mermaid
flowchart TD
    REQUEST[Incoming Request] --> VALIDATE[Validate Input]
    
    VALIDATE -->|Invalid| ERROR_400[400 Bad Request]
    VALIDATE -->|Valid| AUTH[Authenticate User]
    
    AUTH -->|Unauthorized| ERROR_401[401 Unauthorized]
    AUTH -->|Authorized| AUTHORIZE[Check Permissions]
    
    AUTHORIZE -->|Forbidden| ERROR_403[403 Forbidden]
    AUTHORIZE -->|Allowed| RATE_LIMIT[Check Rate Limit]
    
    RATE_LIMIT -->|Exceeded| ERROR_429[429 Too Many Requests]
    RATE_LIMIT -->|OK| PROCESS[Process Request]
    
    PROCESS -->|Database Error| FALLBACK{Has Stale Cache?}
    PROCESS -->|Timeout| FALLBACK
    PROCESS -->|Success| RESPONSE[200 OK]
    
    FALLBACK -->|Yes| STALE[Return Stale Data + Warning]
    FALLBACK -->|No| ERROR_503[503 Service Unavailable]
    
    ERROR_400 --> LOG[Log Error]
    ERROR_401 --> LOG
    ERROR_403 --> LOG
    ERROR_429 --> LOG
    ERROR_503 --> LOG
    RESPONSE --> LOG
    STALE --> LOG
    
    LOG --> END[End]
    
    style ERROR_400 fill:#FF6B6B
    style ERROR_401 fill:#FF6B6B
    style ERROR_403 fill:#FF6B6B
    style ERROR_429 fill:#FFA500
    style ERROR_503 fill:#FF6B6B
    style RESPONSE fill:#90EE90
    style STALE fill:#FFD700
```

## Performance Optimization Strategy

```mermaid
graph TB
    subgraph "Query Optimization"
        IDX[Database Indexes]
        MV[Materialized Views]
        PART[Table Partitioning]
    end
    
    subgraph "Caching Strategy"
        L1[L1: In-Memory Cache]
        L2[L2: Redis Cache]
        WARM[Cache Warming]
    end
    
    subgraph "Computation"
        PRECOMP[Pre-computed Aggregates]
        INCR[Incremental Updates]
        ASYNC[Async Processing]
    end
    
    subgraph "Result"
        FAST[Fast Response Times]
        SCALE[High Scalability]
        FRESH[Data Freshness]
    end
    
    IDX --> FAST
    MV --> FAST
    PART --> SCALE
    
    L1 --> FAST
    L2 --> FAST
    WARM --> FAST
    
    PRECOMP --> FAST
    PRECOMP --> FRESH
    INCR --> FRESH
    ASYNC --> SCALE
    
    style FAST fill:#90EE90
    style SCALE fill:#87CEEB
    style FRESH fill:#FFD700
```
