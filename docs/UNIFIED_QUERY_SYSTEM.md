# Unified Query System Documentation

## Overview

This document describes the enterprise-ready, reusable query system implemented across all API resources in the I Love Memes backend. The system provides consistent query parameters, type-safe DTOs, and helper utilities for handling pagination, sorting, filtering, and searching.

## Architecture

### Core Components

1. **Base Query DTOs** (`src/utils/dto/base-query.dto.ts`)
   - `BasePaginationQueryDto`: Pagination parameters (page, limit)
   - `BaseSearchQueryDto`: Search functionality
   - `BaseTagsQueryDto`: Tag-based filtering
   - `BaseSortQueryDto<T>`: Generic sorting with type-safe field validation
   - `BaseQueryDto`: Complete query DTO combining all parameters

2. **Type Definitions** (`src/utils/types/pagination-options.ts`)
   - `IPaginationOptions`: Pagination configuration
   - `ISortOptions<T>`: Generic sort options
   - `IFilterOptions<T>`: Generic filter options with type safety
   - `IQueryOptions<TEntity, TSortField>`: Complete query options

3. **Helper Utilities** (`src/utils/helpers/query-options.helper.ts`)
   - `extractPaginationOptions()`: Extract and validate pagination
   - `extractSortOptions()`: Extract sort parameters
   - `extractFilterOptions()`: Extract filter parameters
   - `extractQueryOptions()`: All-in-one extraction function
   - `convertLegacyQueryOptions()`: Backward compatibility helper

4. **Resource-Specific Query DTOs**
   - `MemeQueryDto`: Extends BaseQueryDto with meme-specific fields (templateIds)
   - `TagQueryDto`: Extends BaseQueryDto with tag-specific fields (category, status)
   - `TemplateQueryDto`: Extends BaseQueryDto with template-specific fields
   - More resources can follow this pattern

## Standard Query Parameters

All listing endpoints support these query parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number for pagination (min: 1) |
| `limit` | number | No | 10 | Items per page (min: 1, max: 100) |
| `search` | string | No | - | Text search across relevant fields |
| `tags` | string[] | No | - | Filter by tags (comma-separated or array) |
| `orderBy` | enum | No | - | Field to sort by (resource-specific) |
| `order` | enum | No | DESC | Sort direction (ASC or DESC) |

### Resource-Specific Parameters

Each resource can define additional filter parameters by extending `BaseQueryDto`:

**Memes:**
- `templateIds`: string[] - Filter by template IDs

**Tags:**
- `category`: string[] - Filter by categories
- `status`: TagStatus - Filter by tag status

**Templates:**
- (Standard parameters only)

## Usage Guide

### 1. Creating Resource Query DTOs

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, Type } from 'class-validator';
import { BaseQueryDto } from '../../utils/dto/base-query.dto';

// Define sortable fields enum
export enum ResourceSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
}

// Extend BaseQueryDto
export class ResourceQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: ResourceSortField,
    description: 'Field to sort by',
    default: ResourceSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ResourceSortField)
  @Type(() => String)
  orderBy?: ResourceSortField;

  // Add resource-specific filters
  @ApiPropertyOptional({
    description: 'Resource-specific filter',
    type: String,
  })
  @IsOptional()
  @IsString()
  customFilter?: string;
}
```

### 2. Using Query DTOs in Controllers

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { extractQueryOptions, API_PAGE_LIMIT } from '../utils/helpers/query-options.helper';
import { ResourceQueryDto, ResourceSortField } from './dto/resource-query.dto';

@Controller('resources')
export class ResourceController {
  @Get()
  async findAll(@Query() query: ResourceQueryDto) {
    // Extract structured options
    const { paginationOptions, sortOptions, filterOptions } =
      extractQueryOptions<ResourceSortField>(query, API_PAGE_LIMIT);

    // Pass to service
    const result = await this.service.findAll({
      paginationOptions,
      sortOptions,
      filterOptions,
    });

    return result;
  }
}
```

### 3. Implementing Service Methods

Services should accept the structured query options:

```typescript
import { Injectable } from '@nestjs/common';
import { IQueryOptions } from '../utils/types/pagination-options';

@Injectable()
export class ResourceService {
  async findAll(options: IQueryOptions<Resource, ResourceSortField>) {
    const { paginationOptions, sortOptions, filterOptions } = options;

    // Use options in repository queries
    return this.repository.findManyWithPagination({
      paginationOptions,
      sortOptions,
      filterOptions,
    });
  }
}
```

### 4. Repository Implementation

Repositories receive the structured options and build queries accordingly:

```typescript
async findManyWithPagination(options: IQueryOptions<Resource, ResourceSortField>) {
  const { paginationOptions, sortOptions, filterOptions } = options;

  const queryBuilder = this.repository.createQueryBuilder('resource');

  // Apply search
  if (filterOptions?.search) {
    queryBuilder.andWhere(
      '(resource.name ILIKE :search OR resource.description ILIKE :search)',
      { search: `%${filterOptions.search}%` }
    );
  }

  // Apply tags
  if (filterOptions?.tags && filterOptions.tags.length > 0) {
    queryBuilder
      .leftJoin('resource.tags', 'tag')
      .andWhere('tag.name IN (:...tags)', { tags: filterOptions.tags });
  }

  // Apply sorting
  if (sortOptions?.orderBy) {
    queryBuilder.orderBy(
      `resource.${sortOptions.orderBy}`,
      sortOptions.order ?? 'DESC'
    );
  }

  // Apply pagination
  queryBuilder
    .skip((paginationOptions.page - 1) * paginationOptions.limit)
    .take(paginationOptions.limit);

  const [items, totalItems] = await queryBuilder.getManyAndCount();

  return {
    items,
    meta: {
      totalItems,
      totalPages: Math.ceil(totalItems / paginationOptions.limit),
      currentPage: paginationOptions.page,
      limit: paginationOptions.limit,
    },
  };
}
```

## API Examples

### Basic Pagination

```bash
GET /api/v1/memes?page=2&limit=20
```

### Search with Pagination

```bash
GET /api/v1/memes?search=funny&page=1&limit=10
```

### Filter by Tags

```bash
GET /api/v1/memes?tags=humor,viral&page=1&limit=10
# Or with array syntax
GET /api/v1/memes?tags[]=humor&tags[]=viral&page=1&limit=10
```

### Sorting

```bash
GET /api/v1/memes?orderBy=trending&order=DESC&page=1&limit=10
```

### Combined Query

```bash
GET /api/v1/memes?search=cat&tags=funny,animals&orderBy=upvotes&order=DESC&page=1&limit=20
```

### Resource-Specific Filters

```bash
# Memes with specific templates
GET /api/v1/memes?templateIds=uuid-1,uuid-2&page=1&limit=10

# Tags by category
GET /api/v1/tags?category=humor,meme&search=funny&page=1&limit=10
```

## Migration Guide

### For New Resources

1. Create a sort field enum for your resource
2. Create a query DTO extending `BaseQueryDto`
3. Add resource-specific filter properties with validation
4. Use `extractQueryOptions()` in controllers
5. Accept `IQueryOptions` in service methods
6. Implement query logic in repositories

### For Existing Resources

Legacy filter/sort DTOs are maintained for backward compatibility. To migrate:

1. Import the new query DTO
2. Replace separate `@Query()` parameters with single query DTO
3. Use `extractQueryOptions()` helper
4. Update service calls to pass structured options
5. Keep legacy DTOs marked as `@deprecated` for gradual migration

## Type Safety

The system is fully type-safe:

```typescript
// TypeScript knows the exact sort fields available
const options = extractQueryOptions<MemeSortField, MemeFilterOptionsDto>(
  query,
  API_PAGE_LIMIT
);

// sortOptions.orderBy is typed as MemeSortField | undefined
// filterOptions is typed as IFilterOptions<MemeFilterOptionsDto> | undefined
```

## Benefits

1. **Consistency**: All resources use the same query parameters
2. **Type Safety**: Full TypeScript support with generics
3. **Reusability**: Shared DTOs and helpers reduce code duplication
4. **Validation**: Built-in class-validator decorators
5. **Documentation**: Auto-generated Swagger docs from decorators
6. **Extensibility**: Easy to add resource-specific filters
7. **Maintainability**: Centralized query handling logic
8. **Backward Compatible**: Legacy DTOs supported during migration

## Future Enhancements

Potential improvements to the system:

1. **Advanced Filtering**: Add support for operators (gt, lt, eq, ne, in)
2. **Field Selection**: Allow clients to specify which fields to return
3. **Relationships**: Support for expanding/including related entities
4. **Caching**: Add query result caching with cache key generation
5. **Rate Limiting**: Per-query parameter rate limits
6. **Analytics**: Track popular queries and filters
7. **Query Validation**: More sophisticated validation rules
8. **Query Builder**: Fluent API for building complex queries

## Best Practices

1. **Always use extractQueryOptions()** instead of manual extraction
2. **Define clear sort field enums** for each resource
3. **Document resource-specific filters** in Swagger/OpenAPI
4. **Set appropriate max limits** based on resource size
5. **Index database columns** used in sorting and filtering
6. **Validate enum values** in sort field definitions
7. **Use TypeScript generics** for type safety
8. **Keep filter logic in repositories** for consistency
9. **Return structured metadata** with pagination info
10. **Test edge cases** (empty results, max limits, invalid sorts)

## Related Files

- `src/utils/dto/base-query.dto.ts` - Base query DTOs
- `src/utils/dto/resource-query.dto.ts` - Resource query factory
- `src/utils/types/pagination-options.ts` - Type definitions
- `src/utils/helpers/query-options.helper.ts` - Helper functions
- `src/memes/dto/meme-filter-options.dto.ts` - Meme query example
- `src/tags/dto/tag-filter-options.dto.ts` - Tag query example
- `src/templates/dto/template-filter-options.dto.ts` - Template query example
- `src/memes/memes.controller.ts` - Controller usage example

## Support

For questions or issues related to the query system, contact the backend team or refer to the architecture documentation.
