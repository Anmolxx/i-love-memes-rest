import { BaseQueryDto } from '../dto/base-query.dto';
import {
  IFilterOptions,
  IPaginationOptions,
  IQueryOptions,
  ISortOptions,
} from '../types/pagination-options';

/**
 * Default maximum page limit across the application
 */
export const API_PAGE_LIMIT = 100;

/**
 * Extract pagination options from query DTO
 * @param queryDto - Query DTO containing page and limit
 * @param maxLimit - Maximum allowed limit (default: API_PAGE_LIMIT)
 * @returns Validated pagination options
 */
export function extractPaginationOptions(
  queryDto: Pick<BaseQueryDto, 'page' | 'limit'>,
  maxLimit: number = API_PAGE_LIMIT,
): IPaginationOptions {
  const safePage = queryDto.page ?? 1;
  const safeLimit = Math.min(queryDto.limit ?? 10, maxLimit);

  return {
    page: safePage,
    limit: safeLimit,
  };
}

/**
 * Extract sort options from query DTO
 * @param queryDto - Query DTO containing orderBy and order
 * @returns Sort options or undefined if not provided
 */
export function extractSortOptions<TSortField = string>(
  queryDto: Pick<BaseQueryDto, 'orderBy' | 'order'>,
): ISortOptions<TSortField> | undefined {
  if (!queryDto.orderBy && !queryDto.order) {
    return undefined;
  }

  return {
    orderBy: queryDto.orderBy as TSortField,
    order: queryDto.order ?? 'DESC',
  };
}

/**
 * Extract filter options from query DTO
 * @param queryDto - Query DTO containing search, tags, and other filters
 * @returns Filter options or undefined if not provided
 */
export function extractFilterOptions<T = any>(
  queryDto: BaseQueryDto,
): IFilterOptions<T> | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page, limit, orderBy, order, search, tags, ...rest } = queryDto;

  // Check if any filter is provided
  const hasFilters =
    search !== undefined ||
    (tags && tags.length > 0) ||
    Object.keys(rest).length > 0;

  if (!hasFilters) {
    return undefined;
  }

  return {
    search,
    tags,
    ...rest,
  } as IFilterOptions<T>;
}

/**
 * Extract complete query options from query DTO
 * Convenience function that combines pagination, sort, and filter extraction
 *
 * @param queryDto - Query DTO from controller
 * @param maxLimit - Maximum allowed limit (default: API_PAGE_LIMIT)
 * @returns Complete query options object
 */
export function extractQueryOptions<TSortField = string, TEntity = any>(
  queryDto: BaseQueryDto,
  maxLimit: number = API_PAGE_LIMIT,
): IQueryOptions<TEntity, TSortField> {
  return {
    paginationOptions: extractPaginationOptions(queryDto, maxLimit),
    sortOptions: extractSortOptions<TSortField>(queryDto),
    filterOptions: extractFilterOptions<TEntity>(queryDto),
  };
}
