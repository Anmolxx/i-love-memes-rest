/**
 * Pagination options interface
 * Used for paginated queries across all resources
 */
export interface IPaginationOptions {
  page: number;
  limit: number;
}

/**
 * Generic sort options interface
 * @template T - The field type (can be string enum or keyof entity)
 */
export interface ISortOptions<T = string> {
  orderBy?: T;
  order?: 'ASC' | 'DESC';
}

/**
 * Base filter options interface
 * Contains common filter properties available across all resources
 */
export interface IBaseFilterOptions {
  search?: string;
  tags?: string[];
}

/**
 * Generic filter options interface
 * @template TExtension - Additional resource-specific filter properties
 */
export type IFilterOptions<TExtension = Record<string, never>> =
  IBaseFilterOptions & TExtension;

/**
 * Search options interface
 * For text-based search functionality
 */
export interface ISearchOptions {
  search?: string;
}

/**
 * Combined query options interface
 * Combines pagination, sorting, filtering, and search
 * @template TEntity - The entity type
 * @template TSortField - The sort field type (enum or string)
 */
export interface IQueryOptions<TEntity = any, TSortField = string> {
  paginationOptions: IPaginationOptions;
  sortOptions?: ISortOptions<TSortField>;
  filterOptions?: IFilterOptions<TEntity>;
  currentUserId?: string;
}
