export interface IPaginationOptions {
  page: number;
  limit: number;
}

export interface ISortOptions<T> {
  orderBy: keyof T;
  order: 'ASC' | 'DESC';
}

export interface IFilterOptions<T> {
  filter?: Partial<Record<keyof T, string>>;
}
export interface ISearchOptions {
  search?: string;
}
