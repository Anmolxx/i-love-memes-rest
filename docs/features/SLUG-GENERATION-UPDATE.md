# Slug Generation Logic Update - Summary

## Overview

Updated slug generation logic for both **Memes** and **Meme Templates** to ensure slugs are always unique, even when
multiple records have the same title.

## Changes Made

### Slug Generation Strategy

#### Previous Approach

- Base slug generated from title (lowercase, hyphenated)
- Relied on title uniqueness constraint
- Duplicate titles were blocked with error

#### New Approach

- Base slug generated from title
- If slug already exists, append 7-character random string
- Multiple items with same title get unique slugs automatically
- Titles can now be duplicate across records

### Random String Format

- **Length**: 7 characters
- **Character Set**: Lowercase letters (a-z) and numbers (0-9)
- **Format**: `{base-slug}-{random-string}`
- **Fallback**: If random generation fails after 10 attempts, use timestamp

### Examples

#### Memes

```typescript
// First meme with title "I Love Memes"
"i-love-memes"

// Second meme with same title
"i-love-memes-a3b7k2m"

// Third meme with same title
"i-love-memes-x9w4t1p"

// Fourth meme with same title
"i-love-memes-k2p9w5t"
```

#### Templates

```typescript
// First template with title "Drake Meme"
"drake-meme"

// Second template with same title
"drake-meme-k8m3n2x"

// Third template with same title
"drake-meme-p5w9t7q"
```

## Technical Implementation

### Core Functions

```typescript
// Generate base slug from title
function generateBaseSlug(title: string): string {
  return title
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Generate random string
function generateRandomString(length: number = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate unique slug with collision handling
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateBaseSlug(title);

  // Check if base slug is available
  const existing = await repository.findBySlug(baseSlug);

  if (!existing) {
    return baseSlug;
  }

  // Slug conflict - append random string
  let attempts = 0;
  const maxAttempts = 10;

  do {
    const randomSuffix = generateRandomString(7);
    const uniqueSlug = `${baseSlug}-${randomSuffix}`;

    const conflicting = await repository.findBySlug(uniqueSlug);

    if (!conflicting) {
      return uniqueSlug;
    }

    attempts++;
  } while (attempts < maxAttempts);

  // Fallback to timestamp
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}
```

## Database Schema Changes

### Memes Table

**Before**:

```sql
CREATE TABLE memes (
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) NOT NULL UNIQUE,
  -- ...
  CONSTRAINT uk_meme_title_author UNIQUE (title, author_id)
);
```

**After**:

```sql
CREATE TABLE memes (
  title VARCHAR(200) NOT NULL,  -- No longer unique
  slug VARCHAR(250) NOT NULL UNIQUE,  -- Still unique
  -- ...
  INDEX idx_memes_title (title),  -- Added for search
  -- Removed: CONSTRAINT uk_meme_title_author UNIQUE (title, author_id)
);
```

### Templates Table

**Before**:

```sql
CREATE TABLE templates (
  title VARCHAR(200) NOT NULL UNIQUE,
  slug VARCHAR(250) NOT NULL UNIQUE,
  -- ...
);
```

**After**:

```sql
CREATE TABLE templates (
  title VARCHAR(200) NOT NULL,  -- No longer unique
  slug VARCHAR(250) NOT NULL UNIQUE,  -- Still unique
  -- ...
  INDEX idx_templates_title (title),  -- Added for search
);
```

## Business Rule Changes

### Memes

| Rule                 | Before                    | After                                |
|----------------------|---------------------------|--------------------------------------|
| **Title Uniqueness** | Required per user         | Not required                         |
| **Slug Uniqueness**  | Required globally         | Required globally                    |
| **Slug Generation**  | From title only           | From title + random suffix if needed |
| **Duplicate Titles** | Blocked with error        | Allowed, unique slugs auto-generated |
| **Title Validation** | Throws error on duplicate | Optional warning only                |

### Templates

| Rule                 | Before                     | After                                |
|----------------------|----------------------------|--------------------------------------|
| **Title Uniqueness** | Required globally          | Not required                         |
| **Slug Uniqueness**  | Required globally          | Required globally                    |
| **Slug Generation**  | From title only            | From title + random suffix if needed |
| **Duplicate Titles** | Blocked with error         | Allowed, unique slugs auto-generated |
| **Update Behavior**  | Title validation on update | Slug regeneration on title change    |

## API Behavior Changes

### Meme Creation

**Before**:

```json
POST /v1/memes
{
  "title": "I Love Memes",
  ...
}

// If title exists for user:
422 Unprocessable Entity
{
  "success": false,
  "message": "Meme with this title already exists"
}
```

**After**:

```json
POST /v1/memes
{
  "title": "I Love Memes",
  ...
}

// Always succeeds with unique slug:
201 Created
{
  "success": true,
  "data": {
    "title": "I Love Memes",
    "slug": "i-love-memes-a3b7k2m"  // Random suffix if needed
  }
}
```

### Template Creation

**Before**:

```json
POST /v1/templates
{
  "title": "Drake Meme",
  ...
}

// If title exists:
422 Unprocessable Entity
{
  "success": false,
  "message": "Template with this title already exists"
}
```

**After**:

```json
POST /v1/templates
{
  "title": "Drake Meme",
  ...
}

// Always succeeds with unique slug:
201 Created
{
  "success": true,
  "data": {
    "title": "Drake Meme",
    "slug": "drake-meme-k8m3n2x"  // Random suffix if needed
  }
}
```

## Error Handling Changes

### Removed Errors

- ❌ `DUPLICATE_TITLE` - No longer thrown for memes
- ❌ `DUPLICATE_TITLE` - No longer thrown for templates

### New Errors

- ✅ `SLUG_ERROR` (500) - If slug generation fails completely (rare)

### Error Scenarios Table

| Scenario           | Before                         | After                                  |
|--------------------|--------------------------------|----------------------------------------|
| Duplicate title    | 422 Error                      | Success with unique slug               |
| Slug conflict      | N/A (prevented by title check) | Auto-resolved with random suffix       |
| Generation failure | N/A                            | 500 SLUG_ERROR (fallback to timestamp) |

## User Experience Impact

### Benefits

1. **No Title Restrictions**: Users can use same titles as others
2. **Simpler UX**: No "title already exists" errors to handle
3. **Better SEO**: Similar content can have similar base slugs
4. **Flexibility**: Multiple versions/variations with same name

### Considerations

1. **Slug Visibility**: Users see random suffix in URLs when title conflicts
2. **Search Impact**: Need to search by title, not rely on title uniqueness
3. **UI Warnings**: Optional warning when similar titles exist (UX improvement)

## Migration Guide

### Database Migration

```sql
-- For memes table
ALTER TABLE memes DROP CONSTRAINT IF EXISTS uk_meme_title_author;
CREATE INDEX IF NOT EXISTS idx_memes_title ON memes(title);

-- For templates table
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_title_key;
CREATE INDEX IF NOT EXISTS idx_templates_title ON templates(title);
```

### Application Code Changes

#### Before (Old Code)

```typescript
// Meme creation
const slug = generateSlug(title);
await validateTitleUniqueness(title, userId);
// ... create meme with slug
```

#### After (New Code)

```typescript
// Meme creation
const slug = await generateUniqueSlug(title);
// No title validation needed
// ... create meme with slug
```

## Testing Requirements

### Unit Tests

- ✅ Base slug generation from various titles
- ✅ Random string generation (7 chars, alphanumeric)
- ✅ Unique slug generation with collision handling
- ✅ Fallback to timestamp after max attempts
- ✅ Multiple items with same title get different slugs

### Integration Tests

- ✅ Create memes/templates with duplicate titles
- ✅ Verify all slugs are unique
- ✅ Test slug regeneration on title update
- ✅ Verify database uniqueness constraint works

### Performance Tests

- ✅ Slug generation under load
- ✅ Collision handling efficiency
- ✅ Database lookup performance with slug index

## Documentation Updates

### Files Modified

1. ✅ `docs/features/memes/feature-specification.md`
    - Updated slug generation algorithm
    - Updated business rules
    - Updated database schema
    - Updated error handling
    - Removed title uniqueness validation

2. ✅ `docs/features/meme-templates/feature-specification.md`
    - Updated slug generation algorithm
    - Updated business rules
    - Updated database schema
    - Updated update rules
    - Removed title uniqueness requirement

## Rollout Strategy

### Phase 1: Code Deployment

1. Deploy new slug generation logic
2. Keep existing title constraints temporarily
3. Monitor for issues

### Phase 2: Database Migration

1. Run migration to remove title uniqueness constraints
2. Add title indexes for search
3. Verify no duplicate slugs exist

### Phase 3: Cleanup

1. Remove old title validation code
2. Update API documentation
3. Update frontend to handle new behavior

## Questions & Answers

### Q: What if random generation fails?

**A**: After 10 attempts, fallback to timestamp-based suffix: `slug-{timestamp}`

### Q: Can users specify custom slugs?

**A**: No, slugs are always auto-generated to ensure uniqueness

### Q: What about existing records?

**A**: Existing records keep their current slugs, no migration needed for data

### Q: How do we handle slug collisions in distributed systems?

**A**: Database uniqueness constraint provides ultimate protection. Race conditions result in retry with new random
suffix

### Q: Can we regenerate slugs for existing content?

**A**: No, changing slugs breaks existing URLs. Only new content uses new logic

## Related Documentation

- [Memes Feature Specification](./memes/feature-specification.md)
- [Meme Templates Feature Specification](./meme-templates/feature-specification.md)
- [Database Schema Documentation](../database.md)

---

**Last Updated**: November 7, 2025

**Change Type**: Breaking Change (Database Schema)

**Version**: 2.0.0
