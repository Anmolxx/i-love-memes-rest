# Templates Feature Documentation

## Overview

This directory contains documentation for the templates module, which handles meme template creation, management, and retrieval in the I Love Memes application.

## Features

### [Template Filter and Sort](./TEMPLATE-FILTER-SORT.md)

Comprehensive filtering and sorting capabilities for the templates endpoint, allowing users to:

- Search templates by title and description
- Sort templates by creation date, update date, or title
- View template usage statistics (meme counts)
- Paginate through large template collections

## Module Structure

```
src/templates/
├── domain/                  # Domain entities
│   └── template.ts         # Template domain with summary
├── dto/                    # Data transfer objects
│   ├── create-template.dto.ts
│   ├── update-template.dto.ts
│   ├── template-filter-options.dto.ts  # Filter and sort DTOs
│   ├── template-summary.dto.ts         # Summary with meme count
│   └── response/
│       └── create-template.response.dto.ts
├── infrastructure/         # Persistence layer
│   └── persistence/
│       ├── relational/
│       │   ├── entities/
│       │   ├── mappers/
│       │   └── repositories/
│       └── template.repository.ts
├── templates.controller.ts # API endpoints
├── templates.service.ts    # Business logic
└── templates.module.ts     # Module definition
```

## API Endpoints

### Public Endpoints

- `GET /api/v1/templates` - Get paginated list of templates (with filter/sort)
- `GET /api/v1/templates/:slugOrId` - Get template by slug or ID

### Authenticated Endpoints (Requires JWT)

- `POST /api/v1/templates` - Create a new template
- `PATCH /api/v1/templates/:slugOrId` - Update template (author only)
- `DELETE /api/v1/templates/:slugOrId` - Soft delete template (author only)

## Query Parameters

### List Endpoint: `GET /api/v1/templates`

```
?search=funny          # Search by title/description
&orderBy=createdAt    # Sort field (createdAt, updatedAt, title)
&order=DESC           # Sort order (ASC, DESC)
&page=1               # Page number (default: 1)
&limit=10             # Items per page (default: 10, max: 50)
```

## Response Includes

Each template response includes:

1. **Basic Information**
   - `id`: UUID identifier
   - `title`: Template name
   - `slug`: URL-friendly identifier
   - `description`: Template description

2. **Configuration**
   - `config`: Fabric.js canvas JSON configuration
   - Fully editable and customizable

3. **Relations**
   - `author`: User who created the template
   - `tags`: Associated tag list

4. **Summary**
   - `summary.totalMemes`: Count of memes created with this template
   - Updated in real-time

5. **Timestamps**
   - `createdAt`: Creation date
   - `updatedAt`: Last modification date
   - `deletedAt`: Soft delete date (if deleted)

## Authentication & Authorization

### Roles

- **Unauthenticated**: Can view templates
- **Authenticated User**: Can create/update/delete own templates
- **Template Author**: Can modify/delete their own templates

### Guards

- `OptionalJwtAuthGuard`: No auth required, but loads user if authenticated
- `AuthGuard('jwt')`: Requires JWT token for protected routes

## Template Tags

Templates support multiple tags for categorization:

- Tags are created on-the-fly if they don't exist
- Multiple templates can share the same tags
- Tags help organize and discover templates

## Template Configuration (Fabric.js)

Templates store Fabric.js canvas configuration including:

```json
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "text",
      "left": 100,
      "top": 100,
      "text": "Your text here",
      "fontSize": 20,
      "fontFamily": "Arial"
    },
    {
      "type": "rect",
      "left": 50,
      "top": 50,
      "width": 200,
      "height": 100,
      "fill": "#ff0000"
    }
  ],
  "background": "#ffffff"
}
```

## Template Summary

The `summary` object provides usage metrics:

```json
{
  "totalMemes": 42
}
```

This helps users:
- Identify popular templates
- Understand template adoption
- Make decisions about template improvements

## Testing

Template module tests are located in:

- Unit tests: `src/templates/**/*.spec.ts`
- E2E tests: `test/**/*.e2e-spec.ts`

Run tests:

```bash
# Unit tests
npm run test templates

# E2E tests
npm run test:e2e -- templates.e2e-spec.ts
```

## Examples

### Search Templates

```bash
curl -X GET "http://localhost:3000/api/v1/templates?search=funny" \
  -H "Content-Type: application/json"
```

### Get Templates by Popularity

```bash
curl -X GET "http://localhost:3000/api/v1/templates?orderBy=title&order=ASC&limit=20"
```

### Create a Template

```bash
curl -X POST http://localhost:3000/api/v1/templates \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Custom Template",
    "description": "A template for custom memes",
    "tags": ["custom", "personal"],
    "config": {
      "background": "#ffffff",
      "objects": []
    }
  }'
```

### Update a Template

```bash
curl -X PATCH http://localhost:3000/api/v1/templates/my-template-slug \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Template Name",
    "description": "Updated description"
  }'
```

## Design Patterns

### Slug-Based Routing

Templates support lookup by either slug or UUID:

```
GET /api/v1/templates/funny-cat      # By slug
GET /api/v1/templates/abc123...      # By UUID
```

### Soft Deletes

Deleted templates are marked with `deletedAt` timestamp:
- Not returned in list queries
- Can be restored if needed
- Data preserved for audit trails

### Fabric.js Integration

Templates store complete Fabric.js serialized objects:
- Full fidelity with frontend rendering
- Supports all Fabric.js object types
- Backward compatible with template versions

## Future Enhancements

- Template versioning and history
- Template cloning and forking
- Collaborative template editing
- Template marketplace/sharing
- Template performance analytics
- Advanced template builder UI
- Template import/export functionality
- Template validation and testing

## Related Documentation

- [User Module](../users/)
- [Memes Module](../memes/)
- [Tags Module](../tags/)
- [Authentication](../../auth.md)
- [Database Schema](../../database.md)
- [API Overview](../../server.md)
