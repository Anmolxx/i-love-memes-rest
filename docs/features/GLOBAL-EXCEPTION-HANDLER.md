# Global Exception Handler

## Overview

This document describes the global exception handling mechanism implemented in the I Love Memes backend application.

## Implementation

### Exception Filter

The `AllExceptionsFilter` is a global exception filter that catches all exceptions thrown in the application and returns appropriate HTTP responses to clients.

**Location**: `src/utils/filters/http-exception.filter.ts`

### Features

1. **Proper HTTP Status Codes**: Returns the correct HTTP status code based on the exception type
2. **Structured Error Response**: Provides consistent error response format across the application
3. **Error Details**: Includes validation errors and custom error messages when available
4. **Logging**: Logs unexpected errors for debugging purposes
5. **Request Context**: Includes request method, path, and timestamp in error responses

### Error Response Format

```json
{
  "statusCode": 422,
  "timestamp": "2025-11-17T10:30:00.000Z",
  "path": "/api/v1/users",
  "method": "POST",
  "message": "Validation failed",
  "errors": {
    "email": "emailAlreadyExists",
    "photo": "imageNotExists"
  }
}
```

### Supported Exception Types

1. **HttpException**: NestJS built-in HTTP exceptions
   - Returns the status code from the exception
   - Extracts message and errors from the exception response
   
2. **UnprocessableEntityException**: Used for validation errors
   - Returns 422 status code
   - Includes detailed error object with field-specific errors

3. **Generic Error**: Any uncaught Error instances
   - Returns 500 status code
   - Logs the error stack trace for debugging

4. **Unknown Exceptions**: Any other exception types
   - Returns 500 status code
   - Logs the exception for investigation

## Usage Examples

### Throwing Validation Errors

```typescript
throw new UnprocessableEntityException({
  status: HttpStatus.UNPROCESSABLE_ENTITY,
  errors: {
    email: 'emailAlreadyExists',
  },
});
```

**Client receives:**
```json
{
  "statusCode": 422,
  "timestamp": "2025-11-17T10:30:00.000Z",
  "path": "/api/v1/users",
  "method": "POST",
  "message": "Unprocessable Entity",
  "errors": {
    "email": "emailAlreadyExists"
  }
}
```

### Throwing Not Found Errors

```typescript
throw new NotFoundException('User not found');
```

**Client receives:**
```json
{
  "statusCode": 404,
  "timestamp": "2025-11-17T10:30:00.000Z",
  "path": "/api/v1/users/123",
  "method": "GET",
  "message": "User not found"
}
```

### Throwing Unauthorized Errors

```typescript
throw new UnauthorizedException('Invalid credentials');
```

**Client receives:**
```json
{
  "statusCode": 401,
  "timestamp": "2025-11-17T10:30:00.000Z",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "message": "Invalid credentials"
}
```

## Configuration

The global exception filter is registered in `src/main.ts`:

```typescript
app.useGlobalFilters(new AllExceptionsFilter());
```

## Benefits

1. **Consistency**: All errors follow the same response structure
2. **Client-Friendly**: Clients receive proper HTTP status codes instead of generic 500 errors
3. **Debugging**: Unexpected errors are logged with stack traces
4. **Security**: Internal error details are not exposed in production
5. **Maintainability**: Centralized error handling logic

## Best Practices

1. Always use appropriate NestJS exception classes:
   - `BadRequestException` (400)
   - `UnauthorizedException` (401)
   - `ForbiddenException` (403)
   - `NotFoundException` (404)
   - `UnprocessableEntityException` (422)
   - `InternalServerErrorException` (500)

2. Include meaningful error messages that help clients understand what went wrong

3. For validation errors, use the `errors` object to provide field-specific error messages

4. Let the global filter handle the response formatting - don't manually format error responses

## Related Files

- `src/utils/filters/http-exception.filter.ts` - Exception filter implementation
- `src/utils/filters/index.ts` - Filter exports
- `src/main.ts` - Global filter registration
- `src/users/users.service.ts` - Example usage in user service

## Testing

To test the exception filter:

1. Make a request that triggers validation errors (e.g., duplicate email)
2. Verify that the response includes:
   - Correct HTTP status code (422)
   - Structured error response with all required fields
   - Field-specific error messages in the `errors` object

3. Check server logs to ensure unexpected errors are being logged properly
