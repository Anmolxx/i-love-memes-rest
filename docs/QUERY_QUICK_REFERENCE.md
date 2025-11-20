# Query System Quick Reference

## Common Query Parameters

All listing endpoints support:

```
?page=1              # Page number (default: 1)
&limit=10            # Items per page (default: 10, max: 100)
&search=term         # Text search
&tags=tag1,tag2      # Filter by tags (comma-separated)
&orderBy=field       # Sort field (resource-specific)
&order=DESC          # Sort direction (ASC|DESC)
```

## API Examples

### Memes

```bash
# List all memes
GET /api/v1/memes

# Search and filter
GET /api/v1/memes?search=funny&tags=humor,viral&page=1&limit=20

# Sort by trending
GET /api/v1/memes?orderBy=trending&order=DESC

# With template filter
GET /api/v1/memes?templateIds=uuid-1,uuid-2

# Top memes
GET /api/v1/memes/top?orderBy=upvotes&order=DESC

# My memes
GET /api/v1/memes/me?page=1&limit=10

# Deleted memes (admin)
GET /api/v1/memes/deleted

# My deleted memes
GET /api/v1/memes/me/deleted

# Restore meme
PATCH /api/v1/memes/:slugOrId/restore

# Hard delete (admin only)
DELETE /api/v1/memes/:slugOrId/permanent

# Get print-ready file
GET /api/v1/memes/:slugOrId/print-ready
```

### Meme Sort Fields
- `createdAt` - Creation date
- `updatedAt` - Last update date
- `title` - Alphabetical by title
- `upvotes` - Number of upvotes
- `downvotes` - Number of downvotes
- `reports` - Number of reports
- `trending` - Trending score (default)
- `score` - Overall score

### Tags

```bash
# List all tags
GET /api/v1/tags

# Search tags
GET /api/v1/tags?search=funny&page=1&limit=20

# Filter by category
GET /api/v1/tags?category=humor,meme

# Sort by usage
GET /api/v1/tags?orderBy=usageCount&order=DESC

# Filter by status
GET /api/v1/tags?status=active
```

### Tag Sort Fields
- `name` - Tag name
- `normalizedName` - Normalized name
- `slug` - URL slug
- `category` - Category
- `description` - Description
- `usageCount` - Number of uses (popular)
- `status` - Tag status
- `createdAt` - Creation date
- `updatedAt` - Last update date

### Templates

```bash
# List all templates
GET /api/v1/templates

# Search templates
GET /api/v1/templates?search=drake&page=1&limit=20

# Filter by tags
GET /api/v1/templates?tags=popular,trending

# Sort by creation date
GET /api/v1/templates?orderBy=createdAt&order=DESC

# My templates
GET /api/v1/templates/me
```

### Template Sort Fields
- `createdAt` - Creation date (default)
- `updatedAt` - Last update date
- `title` - Alphabetical by title

## Controller Pattern

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { extractQueryOptions, API_PAGE_LIMIT } from '../utils';
import { ResourceQueryDto, ResourceSortField } from './dto';

@Controller('resources')
export class ResourceController {
  @Get()
  async findAll(@Query() query: ResourceQueryDto) {
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<ResourceSortField>(query, API_PAGE_LIMIT);

    return this.service.findAll({
      paginationOptions,
      sortOptions,
      filterOptions,
    });
  }
}
```

## Creating New Query DTOs

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, Type } from 'class-validator';
import { BaseQueryDto } from '../../utils/dto/base-query.dto';

// 1. Define sort fields
export enum ResourceSortField {
  CREATED_AT = 'createdAt',
  NAME = 'name',
}

// 2. Extend BaseQueryDto
export class ResourceQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: ResourceSortField,
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsEnum(ResourceSortField)
  @Type(() => String)
  orderBy?: ResourceSortField;

  // 3. Add resource-specific filters
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  customFilter?: string;
}
```

## Response Format

All paginated endpoints return:

```json
{
  "success": true,
  "message": "Resources fetched successfully",
  "data": [...],
  "meta": {
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10
  }
}
```

## Validation Rules

- **page**: Minimum 1
- **limit**: Minimum 1, Maximum 100
- **search**: String, optional
- **tags**: Array of strings, comma-separated or array syntax
- **orderBy**: Must be from resource's sort enum
- **order**: Must be 'ASC' or 'DESC'

## Tips

1. Use `orderBy` without `order` - defaults to DESC
2. Tags support both formats: `?tags=a,b,c` or `?tags[]=a&tags[]=b`
3. Search is case-insensitive
4. Empty search/tags are ignored
5. Invalid sort fields are rejected by validation
6. Max limit enforced at 100 items per page
7. Deleted endpoints require authentication
8. Hard delete requires admin role

## File Operations

```bash
# Get file for meme (print-ready)
GET /api/v1/memes/:slugOrId/print-ready
# Returns: StreamableFile with proper content-type
```

## Error Responses

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "orderBy": "must be a valid enum value"
  }
}
```

## Related Documentation

- [Unified Query System](./UNIFIED_QUERY_SYSTEM.md) - Full documentation
- [API Architecture](./architecture.md) - System architecture
- [Validation Checklist](./VALIDATION_CHECKLIST.md) - Validation rules
