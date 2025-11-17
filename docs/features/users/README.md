# Users Feature Documentation

## Overview

This directory contains documentation for the users module, which handles user management, authentication, and authorization in the I Love Memes application.

## Features

### [User Filter and Sort](./USER-FILTER-SORT.md)

Comprehensive filtering and sorting capabilities for the users endpoint, allowing administrators to:

- Filter users by firstName, lastName, email, status, and role
- Sort users by createdAt, updatedAt, firstName, lastName, and email
- Combine multiple filters with sorting and pagination

## Module Structure

```
src/users/
├── domain/              # Domain entities
├── dto/                 # Data transfer objects
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── query-user.dto.ts   # Filter and sort DTOs
├── infrastructure/      # Persistence layer
│   └── persistence/
│       ├── relational/
│       │   ├── entities/
│       │   ├── mappers/
│       │   └── repositories/
│       └── user.repository.ts
├── users.controller.ts  # API endpoints
├── users.service.ts     # Business logic
└── users.module.ts      # Module definition
```

## API Endpoints

### Admin Endpoints

All admin endpoints require authentication and the `admin` role.

- `POST /api/v1/users` - Create a new user
- `GET /api/v1/users` - Get paginated list of users (with filter/sort)
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Soft delete user

## Authentication & Authorization

### Roles

- **Admin (RoleEnum.admin = 1)**: Full access to all user management endpoints
- **User (RoleEnum.user = 2)**: Limited access (via /me endpoints)

### Guards

- `AuthGuard('jwt')`: Validates JWT token
- `RolesGuard`: Checks user role authorization

## User Status

Users can have different statuses:

- **Active (StatusEnum.active = 1)**: User can access the system
- **Inactive (StatusEnum.inactive = 2)**: User account is disabled

## Related Documentation

- [Authentication Documentation](../../auth.md)
- [Authorization & Roles](../../roles/)
- [Database Schema](../../database.md)
- [API Documentation](../../server.md)

## Testing

User module tests are located in:

- Unit tests: `src/users/**/*.spec.ts`
- E2E tests: `test/admin/users.e2e-spec.ts`

Run tests:

```bash
# Unit tests
npm run test users

# E2E tests
npm run test:e2e -- users.e2e-spec.ts
```

## Examples

### Create a User

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "secretPassword123",
    "firstName": "John",
    "lastName": "Doe",
    "role": { "id": 2 },
    "status": { "id": 1 }
  }'
```

### Filter and Sort Users

```bash
# Get active users with "john" in their first name, sorted by creation date
curl -X GET "http://localhost:3000/api/v1/users?firstName=john&status=1&orderBy=createdAt&order=DESC" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Future Enhancements

- User profile management
- User preferences and settings
- Two-factor authentication
- Password reset via email
- User activity logging
- Bulk user operations
- Advanced search with multiple criteria
