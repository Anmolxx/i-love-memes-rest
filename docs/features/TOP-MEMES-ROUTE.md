# Top Memes Route Feature

## Overview

A dedicated endpoint to retrieve the most popular memes based on upvotes, with full filtering and sorting capabilities.

## Endpoint

```
GET /api/v1/memes/top
```

## Features

### Default Behavior

- **Sorts by TRENDING score (DESC)** by default when no sort parameter is provided
- Uses sophisticated scoring algorithm that considers:
    - **Weighted interactions**: Upvotes (+1.2), Downvotes (-0.3), Reports (-5.0), Flags (-2.0)
    - **Time decay**: Content naturally loses relevance over time (exponential decay)
    - **Recency bonus**: Fresh content (< 3 hours old) gets a 2x multiplier boost
    - **Age threshold**: Content older than 24 hours starts significant decay
- Returns paginated results
- Only includes **PUBLIC** memes (enforced by repository)
- No authentication required (public endpoint)

### Query Parameters

#### Pagination

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: defined by API_PAGE_LIMIT)

#### Filtering

- `search` (optional): Search term for meme title
    - Example: `?search=funny cat`

- `tags` (optional): Filter by tag names or slugs (comma-separated)
    - Example: `?tags=funny,viral` or `?tags=tag-slug-1,tag-slug-2`

- `templateIds` (optional): Filter by template IDs (comma-separated)
    - Example: `?templateIds=uuid-1,uuid-2`

#### Sorting

- `orderBy` (optional): Field to sort by
    - Options:
        - `trending` (default) - Sophisticated algorithm with weighted interactions, time decay, and recency bonus
        - `score` - Similar to trending but with balanced weights and slower decay
        - `upvotes` - Sort by upvote count only
        - `downvotes` - Sort by downvote count only
        - `reports` - Sort by report count only
        - `createdAt` - Sort by creation date
        - `updatedAt` - Sort by last update date
        - `title` - Sort alphabetically by title
    - Default: `trending`

- `order` (optional): Sort direction
    - Options: `ASC`, `DESC`
    - Default: `DESC`

## Usage Examples

### Basic Queries

#### Get top 10 trending memes (default)

```bash
GET /api/v1/memes/top
# Uses TRENDING algorithm by default
```

#### Get top 20 memes

```bash
GET /api/v1/memes/top?limit=20
```

### Sorting Variations

#### Get trending memes (explicit)

```bash
GET /api/v1/memes/top?orderBy=trending
# Fresh, viral content with time decay and recency boost
```

#### Get top memes by balanced score

```bash
GET /api/v1/memes/top?orderBy=score
# More balanced scoring, less aggressive decay
```

#### Get memes by pure upvote count

```bash
GET /api/v1/memes/top?orderBy=upvotes
# Simple upvote count, no weighting or decay
```

#### Get most controversial memes

```bash
GET /api/v1/memes/top?orderBy=downvotes&order=DESC
# Memes with most downvotes
```

#### Get newest memes

```bash
GET /api/v1/memes/top?orderBy=createdAt&order=DESC
# Sort by creation date instead of engagement
```

### Filtering

#### Get top memes filtered by tags

```bash
GET /api/v1/memes/top?tags=funny,viral
```

#### Get top memes with search query

```bash
GET /api/v1/memes/top?search=dog&limit=15
```

#### Get top memes by a specific template

```bash
GET /api/v1/memes/top?templateIds=template-uuid-here
```

### Combined Queries

#### Trending funny cat memes

```bash
GET /api/v1/memes/top?tags=funny,cats&orderBy=trending&limit=20
```

#### Top scoring memes from this week with search

```bash
GET /api/v1/memes/top?orderBy=score&search=dog&limit=15&page=1
```

#### Most upvoted memes about politics

```bash
GET /api/v1/memes/top?tags=politics&orderBy=upvotes&limit=50
```

### Use Case Examples

#### Homepage "Hot" Feed

```bash
GET /api/v1/memes/top?orderBy=trending&limit=20
# Shows currently viral content
```

#### "Best of All Time" Section

```bash
GET /api/v1/memes/top?orderBy=score&limit=100
# Shows highest quality content with less time bias
```

#### Category-Specific Trending

```bash
GET /api/v1/memes/top?tags=gaming&orderBy=trending&limit=50
# Trending memes in a specific category
```

#### Moderation Queue

```bash
GET /api/v1/memes/top?orderBy=reports&order=DESC&limit=20
# Memes with most reports for review
```

## Response Format

```json
{
  "success": true,
  "message": "Top memes fetched successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Meme Title",
      "slug": "meme-slug",
      "description": "Meme description",
      "audience": "PUBLIC",
      "file": {
        "id": "file-uuid",
        "path": "file-path"
      },
      "author": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "template": {
        "id": "template-uuid",
        "name": "Template Name"
      },
      "tags": [
        {
          "id": "tag-uuid",
          "name": "funny",
          "slug": "funny"
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10
  }
}
```

## Scoring Algorithm

### TRENDING Score (Default)

The trending algorithm is designed to surface viral, engaging content that's currently hot:

#### Formula

```
Score = (Weighted Interactions) × (Time Decay Factor) × (Recency Bonus)
```

#### Components

**1. Weighted Interactions**

Each interaction type contributes differently to the score:

| Interaction Type | Weight | Rationale                                               |
|------------------|--------|---------------------------------------------------------|
| Upvote           | +1.2   | Strong positive signal, slightly amplified for trending |
| Downvote         | -0.3   | Mild negative signal, doesn't completely negate upvotes |
| Report           | -5.0   | Very strong negative signal, indicates policy violation |
| Flag             | -2.0   | Moderate negative signal, indicates problematic content |

Formula:

```
Weighted Interactions = (Upvotes × 1.2) + (Downvotes × -0.3) + (Reports × -5.0) + (Flags × -2.0)
```

**2. Time Decay Factor**

Content naturally loses relevance over time to make room for fresh posts:

```
Time Decay = 0.5 ^ ((Age - 24 hours) / 24 hours)
```

- Content under 24 hours old: No decay (multiplier = 1.0)
- Content at 48 hours: 50% decay (multiplier = 0.5)
- Content at 72 hours: 25% decay (multiplier = 0.25)
- And so on...

**3. Recency Bonus**

Ultra-fresh content (< 3 hours) gets a 2x multiplier to help new posts gain visibility:

```
Recency Bonus = 2.0 (if age < 3 hours) else 1.0
```

#### Example Calculation

**Scenario**: A meme posted 2 hours ago with 50 upvotes, 5 downvotes, 0 reports, 0 flags

```
Weighted Interactions = (50 × 1.2) + (5 × -0.3) + (0 × -5.0) + (0 × -2.0)
                      = 60 - 1.5 + 0 + 0
                      = 58.5

Time Decay = 1.0 (content is < 24 hours old)

Recency Bonus = 2.0 (content is < 3 hours old)

Final Score = 58.5 × 1.0 × 2.0 = 117.0
```

### SCORE Sort (Alternative)

The score algorithm is more balanced, suitable for longer-term quality assessment:

#### Differences from TRENDING

| Parameter         | TRENDING       | SCORE          |
|-------------------|----------------|----------------|
| Upvote Weight     | 1.2            | 1.0            |
| Downvote Weight   | -0.3           | -0.5           |
| Report Weight     | -5.0           | -3.0           |
| Flag Weight       | -2.0           | -1.5           |
| Time Decay Factor | 1.0 (fast)     | 0.5 (moderate) |
| Age Threshold     | 24 hours       | 48 hours       |
| Recency Bonus     | 2.0x (< 3 hrs) | 1.5x (< 6 hrs) |

**Use Case**: Better for "Best of the Week" or "Top Posts" that aren't as time-sensitive.

### Simple Count Sorts

For direct metric sorting without weighting:

- **upvotes**: Pure upvote count, descending
- **downvotes**: Pure downvote count
- **reports**: Pure report count (useful for moderation)

## Implementation Details

### Controller

- **Location**: `src/memes/memes.controller.ts`
- **Method**: `findTopMemes()`
- **Route Order**: Placed before `/me` route to avoid path conflicts

### Service

- **Location**: `src/memes/memes.service.ts`
- **Method**: `findTopMemes()`
- **Logic**:
    - Defaults sort options to `{ orderBy: 'upvotes', order: 'DESC' }` if not provided
    - Delegates to repository's `findManyWithPagination()` method
    - Reuses existing filtering and sorting logic

### Repository

- **Location**: `src/memes/infrastructure/persistence/relational/repositories/meme.repository.ts`
- **Method**: Uses existing `findManyWithPagination()` with `enforceAudiencePublic: true`
- **Features**:
    - Joins with file, author, tags, and template relations
    - Applies tag filtering with distinct results
    - Applies template filtering
    - Implements search on title (case-insensitive)
    - Handles special sorting for upvotes/downvotes/reports using subqueries

## Configuration

### Scoring Parameters

All scoring parameters are defined in `src/memes/meme-scoring.config.ts`:

**Available Configurations:**

1. **DEFAULT_MEME_SCORING_CONFIG** - Balanced scoring for general use
2. **TRENDING_MEME_SCORING_CONFIG** - Aggressive decay for hot/trending content
3. **ALLTIME_MEME_SCORING_CONFIG** - Minimal decay for all-time best content

### Customization

To adjust the scoring algorithm, modify the configuration values:

```typescript
export const TRENDING_MEME_SCORING_CONFIG: MemeScoringConfig = {
  upvoteWeight: 1.2,           // Increase to value upvotes more
  downvoteWeight: -0.3,        // Make more negative to penalize downvotes more
  reportWeight: -5.0,          // Adjust penalty for reports
  flagWeight: -2.0,            // Adjust penalty for flags
  timeDecayFactor: 1.0,        // Increase for faster decay (0.1-2.0 range)
  ageThresholdHours: 24,       // Content stays "fresh" until this age
  minScore: -50,               // Floor to prevent extreme negatives
  recencyBonusMultiplier: 2.0, // Bonus for ultra-fresh content
  recencyBonusHours: 3,        // How long the recency bonus lasts
};
```

### Tuning Guidelines

**For More Viral/Trending Behavior:**
- Increase `timeDecayFactor` (e.g., 1.5-2.0)
- Decrease `ageThresholdHours` (e.g., 12-18 hours)
- Increase `recencyBonusMultiplier` (e.g., 2.5-3.0)

**For More Stable/Quality Behavior:**
- Decrease `timeDecayFactor` (e.g., 0.2-0.3)
- Increase `ageThresholdHours` (e.g., 72-168 hours)
- Decrease `recencyBonusMultiplier` (e.g., 1.2-1.3)

**For Harsher Content Moderation:**
- Make `reportWeight` more negative (e.g., -10.0)
- Make `flagWeight` more negative (e.g., -3.0)
- Decrease `downvoteWeight` (e.g., -0.7)

## Technical Notes

### Sorting by Interaction Counts

When sorting by simple counts (`upvotes`, `downvotes`, or `reports`), the repository uses a subquery:

```sql
SELECT COUNT(*) 
FROM meme_interactions mi 
WHERE mi.meme_id = meme.id 
  AND mi.type = 'UPVOTE'
```

This ensures accurate real-time sorting based on actual interaction counts.

### Sophisticated Scoring Implementation

For `trending` and `score` sorts, the repository executes a complex SQL calculation:

```sql
SELECT 
  meme.*,
  (
    -- Base interaction score (weighted)
    (
      (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi 
       WHERE mi.meme_id = meme.id AND mi.type = 'UPVOTE') * 1.2
      +
      (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi 
       WHERE mi.meme_id = meme.id AND mi.type = 'DOWNVOTE') * -0.3
      +
      (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi 
       WHERE mi.meme_id = meme.id AND mi.type = 'REPORT') * -5.0
      +
      (SELECT COALESCE(COUNT(*), 0) FROM meme_interactions mi 
       WHERE mi.meme_id = meme.id AND mi.type = 'FLAG') * -2.0
    )
    *
    -- Time decay (exponential)
    POWER(
      0.5,
      GREATEST(0, EXTRACT(EPOCH FROM (NOW() - meme.created_at)) / 3600 - 24) / 24 * 1.0
    )
    *
    -- Recency bonus
    CASE
      WHEN EXTRACT(EPOCH FROM (NOW() - meme.created_at)) / 3600 < 3
      THEN 2.0
      ELSE 1.0
    END
  ) AS calculatedScore
FROM meme
ORDER BY calculatedScore DESC
```

**Performance Considerations:**
- Uses subqueries for interaction counts (could be optimized with materialized views for very high traffic)
- Exponential decay calculated in real-time
- All calculations happen at query time for absolute freshness

**Optimization Opportunities:**
1. Add a computed column for interaction scores (updated via triggers)
2. Implement Redis caching for top N results
3. Use materialized views that refresh every few minutes
4. Add database indexes on `created_at` and `meme_id` in interactions table

### Tag Filtering

When filtering by tags, the query:

- Supports both tag names and slugs
- Uses `DISTINCT` to avoid duplicate memes when a meme has multiple matching tags
- Uses `IN` clause for efficient filtering

### Audience Enforcement

The `enforceAudiencePublic` flag ensures only PUBLIC memes are returned, maintaining privacy for PRIVATE memes.

## Testing

### Manual Testing

```bash
# Test default behavior
curl http://localhost:3000/api/v1/memes/top

# Test with filters
curl "http://localhost:3000/api/v1/memes/top?tags=funny&limit=5"

# Test with search
curl "http://localhost:3000/api/v1/memes/top?search=cat"

# Test with custom sorting
curl "http://localhost:3000/api/v1/memes/top?orderBy=createdAt&order=DESC"
```

### Integration Testing

Consider adding tests to verify:

- Default sorting by upvotes
- Filter combinations work correctly
- Pagination works as expected
- Only PUBLIC memes are returned
- Tag filtering with multiple tags
- Search functionality

## Future Enhancements

1. **Time-based filtering**: Add ability to filter top memes by time period (today, this week, this month, all time)
2. **Trending algorithm**: Implement a trending score that considers recency + engagement
3. **Caching**: Add Redis caching for frequently accessed top memes
4. **Category filtering**: Add ability to filter by meme categories
5. **User preferences**: Allow authenticated users to see personalized top memes

## Related Documentation

- [Memes Module Overview](../memes/)
- [Slug-Based Querying](./SLUG-BASED-QUERYING.md)
- [User Interactions](../user-interactions/)
