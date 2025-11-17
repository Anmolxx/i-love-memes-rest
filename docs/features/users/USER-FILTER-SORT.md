# User Filter and Sort Feature

## Overview

This document describes the filter and sort functionality for the users endpoint, allowing administrators to efficiently search and organize user data.

## Feature Description

The users endpoint (`/api/v1/users`) now supports filtering and sorting capabilities through query parameters, following the same pattern used in the memes module for consistency.

## API Specification

### Endpoint

```
GET /api/v1/users
```

### Authentication

- Requires authentication via JWT Bearer token
- Requires `admin` role

### Query Parameters

#### Pagination

- `page` (optional, number): Page number for pagination (default: 1)
- `limit` (optional, number): Number of items per page (default: 10, max: 50)

#### Filtering

All filter parameters support partial, case-insensitive matching:

- `firstName` (optional, string): Filter users by first name
- `lastName` (optional, string): Filter users by last name
- `email` (optional, string): Filter users by email address
- `status` (optional, number): Filter users by status ID (e.g., 1 for active, 2 for inactive)
- `role` (optional, number): Filter users by role ID (e.g., 1 for admin, 2 for user)

#### Sorting

- `orderBy` (optional, enum): Field to sort by
  - `createdAt`: Sort by creation date
  - `updatedAt`: Sort by last update date
  - `firstName`: Sort by first name
  - `lastName`: Sort by last name
  - `email`: Sort by email address
- `order` (optional, enum): Sort direction
  - `ASC`: Ascending order
  - `DESC`: Descending order

## Usage Examples

### Example 1: Filter by Email

```bash
GET /api/v1/users?email=john
```

Returns all users whose email contains "john" (case-insensitive).

### Example 2: Filter by Status

```bash
GET /api/v1/users?status=1
```

Returns all active users (status ID = 1).

### Example 3: Sort by Created Date

```bash
GET /api/v1/users?orderBy=createdAt&order=DESC
```

Returns users sorted by creation date in descending order (newest first).

### Example 4: Multiple Filters with Sorting

```bash
GET /api/v1/users?status=1&firstName=john&orderBy=createdAt&order=DESC
```

Returns active users with first name containing "john", sorted by creation date in descending order.

### Example 5: Pagination with Filters

```bash
GET /api/v1/users?status=1&page=2&limit=20&orderBy=email&order=ASC
```

Returns page 2 of active users (20 items per page), sorted by email in ascending order.

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "user fetched successfully",
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": {
        "id": 2,
        "name": "User"
      },
      "status": {
        "id": 1,
        "name": "Active"
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

## Technical Implementation

### Architecture

The implementation follows the same pattern as the memes module:

1. **DTOs** (`src/users/dto/query-user.dto.ts`):
   - `FilterUserDto`: Defines filterable fields
   - `SortUserDto`: Defines sortable fields and order
   - `UserSortField`: Enum of allowed sort fields

2. **Controller** (`src/users/users.controller.ts`):
   - Accepts filter and sort options as separate `@Query()` decorators
   - Validates input using class-validator decorators

3. **Service** (`src/users/users.service.ts`):
   - Passes filter and sort options to repository

4. **Repository** (`src/users/infrastructure/persistence/relational/repositories/user.repository.ts`):
   - Implements filtering using TypeORM's `ILike` for case-insensitive partial matching
   - Implements sorting using TypeORM's `order` option

### Database Query

Filters are applied using TypeORM's `ILike` operator for case-insensitive partial matching:

```typescript
if (filterOptions?.email) {
  where.email = ILike(`%${filterOptions.email}%`);
}
```

Sorting is applied using TypeORM's order object:

```typescript
const order: any = {};
if (sortOptions?.orderBy && sortOptions?.order) {
  order[sortOptions.orderBy] = sortOptions.order;
}
```

## Testing

Comprehensive E2E tests are available in `test/admin/users.e2e-spec.ts`:

- Filter by email
- Filter by firstName
- Filter by lastName
- Filter by status
- Sort by createdAt (ASC/DESC)
- Sort by email
- Sort by firstName
- Sort by lastName
- Combined filters and sorting

Run tests with:

```bash
npm run test:e2e -- users.e2e-spec.ts
```

## Performance Considerations

1. **Indexing**: The following fields are indexed for optimal query performance:
   - `email` (unique index)
   - `firstName`
   - `lastName`
   - `socialId`

2. **Pagination**: Always use pagination to limit result sets and improve response times.

3. **Query Optimization**: Filters are applied at the database level using TypeORM's query builder for efficient execution.

## Security Considerations

1. **Authentication**: All requests require valid JWT authentication
2. **Authorization**: Only users with `admin` role can access this endpoint
3. **Input Validation**: All query parameters are validated using class-validator
4. **SQL Injection Prevention**: TypeORM parameterizes all queries automatically

## Future Enhancements

Potential improvements for future iterations:

1. Add full-text search capability
2. Support for multiple status/role filters
3. Date range filtering for createdAt/updatedAt
4. Export functionality (CSV, Excel)
5. Saved filter presets for common searches

## Related Documentation

- [User Module Overview](./README.md)
- [Authentication Documentation](../../auth.md)
- [Database Documentation](../../database.md)
- [Memes Filter and Sort](../memes/FILTER-SORT.md) (similar implementation pattern)
