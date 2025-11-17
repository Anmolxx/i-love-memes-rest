# Template Filter and Sort Feature

## Overview

This document describes the filter and sort functionality for the templates endpoint, allowing users to efficiently search and organize template data with a cohesive pattern matching the memes module.

## Feature Description

The templates endpoint (`/api/v1/templates`) now supports:
- **Filtering**: Search templates by title/description
- **Sorting**: Sort by creation date, last update, or title
- **Pagination**: Paginate through large result sets
- **Template Summary**: Shows meme count for each template

## API Specification

### Endpoint

```
GET /api/v1/templates
```

### Query Parameters

#### Pagination

- `page` (optional, number): Page number for pagination (default: 1)
- `limit` (optional, number): Number of items per page (default: 10, max: 50)

#### Filtering

- `search` (optional, string): Search templates by title or description (case-insensitive, partial matching)

#### Sorting

- `orderBy` (optional, enum): Field to sort by
  - `createdAt`: Sort by creation date
  - `updatedAt`: Sort by last update date
  - `title`: Sort by template title
  - Default: `createdAt`
- `order` (optional, enum): Sort direction
  - `ASC`: Ascending order
  - `DESC`: Descending order (default)

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Templates fetched successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Funny Cat Template",
      "slug": "funny-cat-template",
      "description": "A template for funny cat memes",
      "config": {
        "background": "#ffffff",
        "objects": []
      },
      "author": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "tags": [
        {
          "id": "tag-uuid",
          "name": "funny",
          "slug": "funny"
        }
      ],
      "summary": {
        "totalMemes": 42
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "currentPage": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

### Single Template Response (GET by ID/Slug)

```json
{
  "success": true,
  "message": "Template Fetched Successfully",
  "data": {
    "id": "uuid",
    "title": "Funny Cat Template",
    "slug": "funny-cat-template",
    "description": "A template for funny cat memes",
    "config": { ... },
    "author": { ... },
    "tags": [ ... ],
    "summary": {
      "totalMemes": 42
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Usage Examples

### Example 1: Search Templates

```bash
GET /api/v1/templates?search=funny
```

Returns all templates with "funny" in the title or description.

### Example 2: Sort by Title

```bash
GET /api/v1/templates?orderBy=title&order=ASC
```

Returns templates sorted alphabetically by title.

### Example 3: Pagination with Sorting

```bash
GET /api/v1/templates?page=2&limit=20&orderBy=createdAt&order=DESC
```

Returns page 2 of templates (20 per page), sorted by creation date (newest first).

### Example 4: Recent Templates Search

```bash
GET /api/v1/templates?search=meme&orderBy=createdAt&order=DESC&limit=5
```

Returns the 5 most recent templates matching "meme" search.

## Technical Implementation

### Architecture

The implementation follows the same pattern as the memes module for consistency:

1. **DTOs** (`src/templates/dto/template-filter-options.dto.ts`):
   - `FilterTemplateDto`: Defines filterable fields (search)
   - `SortTemplateDto`: Defines sortable fields and order
   - `TemplateSortField`: Enum of allowed sort fields

2. **Domain** (`src/templates/domain/template.ts`):
   - `Template`: Domain model with summary property
   - `TemplateSummaryDto`: Summary containing meme count

3. **Controller** (`src/templates/templates.controller.ts`):
   - Accepts filter and sort options as separate `@Query()` decorators
   - Validates input using class-validator decorators

4. **Service** (`src/templates/templates.service.ts`):
   - Loads meme counts for each template
   - Returns templates with summary information

5. **Repository** (`src/templates/infrastructure/persistence/relational/repositories/template.repository.ts`):
   - Implements search using TypeORM's ILIKE operator
   - Implements sorting using TypeORM's order option
   - Counts memes per template via relationship queries

### Database Query Example

Search and sort query:
```sql
SELECT template.* FROM template
WHERE template.title ILIKE '%search%'
  OR template.description ILIKE '%search%'
ORDER BY template.createdAt DESC
LIMIT 10 OFFSET 0;
```

Meme count query:
```sql
SELECT COUNT(meme.id) as count FROM meme
WHERE meme.templateId = 'template-uuid'
  AND meme.deletedAt IS NULL;
```

## Template Summary

Each template includes a `summary` object with:

- **totalMemes** (number): Count of memes created using this template
  - Updated in real-time by counting non-deleted memes
  - Useful for understanding template popularity
  - Helps users identify trending templates

## Related Data

Templates include the following related entities:

### Author (UserSummary)
- User who created the template
- Includes firstName and lastName

### Tags
- Array of tags associated with the template
- Each tag has id, name, and slug

### Configuration (config)
- Fabric.js canvas configuration
- Contains canvas objects and styling

## Performance Considerations

1. **Indexing**: Key fields are indexed for optimal query performance:
   - `id` (primary key)
   - `slug` (unique index)
   - `title` (indexed for search)
   - `createdAt` (indexed for sorting)

2. **Pagination**: Always use pagination to limit result sets and improve response times

3. **Query Optimization**: 
   - Search uses ILIKE for case-insensitive matching
   - Meme counts are fetched via efficient COUNT queries
   - Tags are loaded via relationship queries

## Security Considerations

1. **Data Exposure**: Template content (config) is publicly visible
2. **Author Privacy**: Only firstName and lastName are exposed
3. **Soft Delete**: Deleted templates are excluded from queries
4. **Pagination Protection**: Max limit enforced (50 items per page)

## Future Enhancements

Potential improvements for future iterations:

1. **Advanced Filtering**:
   - Filter by author
   - Filter by tags
   - Filter by meme count range
   - Date range filtering

2. **Search Enhancement**:
   - Full-text search on description
   - Fuzzy matching for typos
   - Search result highlighting

3. **Popularity Metrics**:
   - Trending templates (by meme creation rate)
   - Most popular templates (by meme count)
   - Recently used templates

4. **Export Features**:
   - Export templates as JSON
   - Batch template operations

## Related Documentation

- [Template Module Overview](./README.md)
- [Meme Filter and Sort](../memes/FILTER-SORT.md) (similar implementation pattern)
- [API Documentation](../../server.md)
- [Database Schema](../../database.md)
