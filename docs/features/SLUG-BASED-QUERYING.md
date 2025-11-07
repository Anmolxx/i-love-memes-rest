# Slug-Based Querying Implementation

## Overview

All entities with slug fields (Tags, Memes, Templates) now support querying by both slug and UUID. This provides a more
user-friendly API where clients can use human-readable slugs instead of UUIDs for retrieving and referencing resources.

## Implementation Pattern

### URL Parameters

All endpoints that previously accepted an ID parameter now accept a `slugOrId` parameter that can be either:

- A slug (e.g., `funny-cat-meme`)
- A UUID (e.g., `cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae`)

### Resolution Logic

Services use a consistent pattern for resolving slugOrId to the actual entity:

1. **First attempt**: Query by slug using `findBySlug(slugOrId)`
2. **Second attempt**: If not found, query by ID using `findById(slugOrId)`
3. **Error handling**: If still not found, throw `NotFoundException` with descriptive message

```typescript
async
findOne(slugOrId
:
string
):
Promise < Entity > {
  // Try slug first (more user-friendly)
  let entity = await this.repository.findBySlug(slugOrId);

  // Fall back to ID if not found
  if(!
entity
)
{
  entity = await this.repository.findById(slugOrId);
}

if (!entity) {
  throw new NotFoundException(`Entity with identifier ${slugOrId} not found`);
}

return entity;
}
```

## Updated Endpoints

### Tags

- `GET /v1/tags/:slugOrId` - Get tag by slug or ID
- `PATCH /v1/tags/:slugOrId` - Update tag by slug or ID
- `DELETE /v1/tags/:slugOrId` - Delete tag by slug or ID

**Example slugs**: `funny`, `relatable`, `dark-humor`

### Memes

- `GET /v1/memes/:slugOrId` - Get meme by slug or ID
- `PATCH /v1/memes/:slugOrId` - Update meme by slug or ID
- `DELETE /v1/memes/:slugOrId` - Delete meme by slug or ID

**Example slugs**: `funny-cat-meme`, `coding-life`, `monday-mood`

### Templates

- `GET /v1/templates/:slugOrId` - Get template by slug or ID
- `PATCH /v1/templates/:slugOrId` - Update template by slug or ID
- `DELETE /v1/templates/:slugOrId` - Delete template by slug or ID

**Example slugs**: `drake-hotline-bling`, `distracted-boyfriend`, `two-buttons`

### Comments (Meme Reference)

- `GET /v1/comments/memes/:slugOrId` - Get comments for meme by slug or ID

### Interactions (Meme Reference)

- `DELETE /v1/interactions/memes/:slugOrId` - Remove interaction by meme slug or ID
- `GET /v1/interactions/memes/:slugOrId/summary` - Get interaction summary by meme slug or ID

## DTO Updates

### CreateCommentDto

```typescript
export class CreateCommentDto {
  @ApiProperty({
    example: 'funny-cat-meme',
    description: 'Meme slug or UUID',
  })
  @IsString()  // Changed from @IsUUID()
  @IsNotEmpty()
  memeId: string;

  // ... other fields
}
```

### CreateInteractionDto

```typescript
export class CreateInteractionDto {
  @ApiProperty({
    example: 'funny-cat-meme',
    description: 'Meme slug or UUID',
  })
  @IsString()  // Changed from @IsUUID()
  @IsNotEmpty()
  memeId: string;

  // ... other fields
}
```

## Service-Level Slug Resolution

When creating relationships (comments on memes, interactions on memes), the services automatically resolve slugs to IDs
before persisting:

### Comments Service

```typescript
async
create(createCommentDto
:
CreateCommentDto, userId
:
string
)
{
  const { memeId: memeSlugOrId } = createCommentDto;

  // Resolve meme slug to ID
  let meme = await this.memeRepository.findBySlug(memeSlugOrId);
  if (!meme) {
    meme = await this.memeRepository.findById(memeSlugOrId);
  }
  if (!meme) {
    throw new NotFoundException(`Meme with identifier ${memeSlugOrId} not found`);
  }

  // Use resolved ID for database relationship
  const comment = await this.commentRepository.create({
    content: createCommentDto.content,
    meme: { id: meme.id } as any,  // Uses ID internally
    // ... other fields
  });
}
```

### Interactions Service

```typescript
async
createInteraction(createInteractionDto
:
CreateInteractionDto, userId
:
string
)
{
  const { memeId: memeSlugOrId } = createInteractionDto;

  // Resolve meme slug to ID
  let meme = await this.memeRepository.findBySlug(memeSlugOrId);
  if (!meme) {
    meme = await this.memeRepository.findById(memeSlugOrId);
  }
  if (!meme) {
    throw new NotFoundException(`Meme with identifier ${memeSlugOrId} not found`);
  }

  // Use resolved ID for database relationship
  return this.interactionRepository.create({
    meme: { id: meme.id } as any,  // Uses ID internally
    // ... other fields
  });
}
```

## Repository Layer

All repositories for entities with slugs now implement the `findBySlug` method:

### TagsRepository

```typescript
abstract class TagsRepository {
  abstract findBySlug(slug: string): Promise<Tag | null>;

  abstract findById(id: string): Promise<Tag | null>;

  // ... other methods
}
```

### MemesRepository

```typescript
abstract class MemesRepository {
  abstract findBySlug(slug: string): Promise<Meme | null>;

  abstract findById(id: string): Promise<Meme | null>;

  // ... other methods
}
```

### TemplateRepository

```typescript
abstract class TemplateRepository {
  abstract findBySlug(slug: string): Promise<TemplateEntity | null>;

  abstract getById(id: string): Promise<TemplateEntity | null>;

  // ... other methods
}
```

## Benefits

1. **User-Friendly URLs**: Clients can use readable slugs like `funny-cat-meme` instead of UUIDs
2. **Backward Compatibility**: UUIDs still work, ensuring existing integrations aren't broken
3. **Consistent Pattern**: All entities follow the same slug-first, ID-fallback pattern
4. **Type Safety**: Services validate entity existence before creating relationships
5. **Better Error Messages**: Clear feedback when entities aren't found

## Slug Generation

Slugs are automatically generated from titles using the `slugify` library:

```typescript
const slug = slugify(title, {
  replacement: '-',
  remove: undefined,
  lower: false,
  strict: false,
  locale: 'vi',
  trim: true,
});
```

**Normalization for Tags**:

Tags have additional normalization for consistency:

```typescript
private
normalizeTagName(name
:
string
):
string
{
  return name.toLowerCase().trim();
}
```

## Migration Impact

No database migrations needed - all slug columns already exist in the schema. This is purely an API enhancement that
adds flexibility to how entities are queried.

## Testing

When testing endpoints, you can now use either format:

```bash
# Using slug
curl http://localhost:3000/v1/memes/funny-cat-meme

# Using UUID
curl http://localhost:3000/v1/memes/cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae

# Creating a comment with slug
curl -X POST http://localhost:3000/v1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great meme!",
    "memeId": "funny-cat-meme"
  }'
```

## Future Considerations

- **Slug Uniqueness**: Ensure slug generation handles collisions (append numbers if needed)
- **Slug Updates**: When titles change, consider whether to update slugs or preserve them
- **SEO**: Slugs improve SEO for public-facing pages
- **Analytics**: Track whether users prefer slugs over UUIDs
