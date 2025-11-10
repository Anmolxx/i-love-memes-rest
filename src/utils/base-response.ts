import { PaginationMetaDto } from './dto/pagination-response.dto';

export const createResponse = <T>(
  message = 'Request successful',
  data: T,
  meta?: PaginationMetaDto,
) => ({
  data,
  ...(meta ? { meta } : {}),
  success: true,
  message,
});

// New: helper for paginated responses that must return `items` + `meta`
// Keeps the exact shape requested: { items, meta: { totalItems, totalPages, currentPage, limit } }
export const createPaginatedResponse = <T>(
  message = 'Request successful',
  items: T[],
  meta: PaginationMetaDto,
) => ({
  items,
  meta,
  success: true,
  message,
});
