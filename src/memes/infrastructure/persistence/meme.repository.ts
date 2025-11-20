import { PaginationMetaDto } from '../../../utils/dto/pagination-response.dto';
import { NullableType } from '../../../utils/types/nullable.type';
import {
  IFilterOptions,
  IPaginationOptions,
  ISortOptions,
} from '../../../utils/types/pagination-options';
import { Meme } from '../../domain/meme';
import { CreateMemeDto } from '../../dto/create-meme.dto';
import { IMemeFilters, MemeSortField } from '../../dto/meme-filter-options.dto';

export abstract class MemesRepository {
  abstract create(data: Meme | CreateMemeDto): Promise<Meme>;
  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    currentUserId,
  }: {
    filterOptions?: IFilterOptions<IMemeFilters> | null;
    sortOptions?: ISortOptions<MemeSortField>;
    paginationOptions: IPaginationOptions;
    currentUserId?: string;
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }>;
  abstract findById(
    id: Meme['id'],
    currentUserId?: string,
  ): Promise<NullableType<Meme>>;
  abstract findBySlug(
    slug: string,
    currentUserId?: string,
  ): Promise<NullableType<Meme>>;
  abstract findByTitle(title: string): Promise<NullableType<Meme>>;
  abstract findByFileId(fileId: string): Promise<NullableType<Meme>>;
  abstract update(id: Meme['id'], payload: Partial<Meme>): Promise<Meme>;
  abstract remove(id: Meme['id']): Promise<void>;
  abstract findByAuthorId(
    userId: string,
    args: {
      filterOptions?: IFilterOptions<IMemeFilters> | null;
      sortOptions?: ISortOptions<MemeSortField>;
      paginationOptions: IPaginationOptions;
      currentUserId?: string;
    },
  ): Promise<{ items: Meme[]; meta: PaginationMetaDto }>;

  // New: pagination for soft-deleted memes
  abstract findDeletedWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: IFilterOptions<IMemeFilters> | null;
    sortOptions?: ISortOptions<MemeSortField>;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }>;

  // New: list soft-deleted memes by author
  abstract findByAuthorIdDeleted(
    userId: string,
    args: {
      filterOptions?: IFilterOptions<IMemeFilters> | null;
      sortOptions?: ISortOptions<MemeSortField>;
      paginationOptions: IPaginationOptions;
      currentUserId?: string;
    },
  ): Promise<{ items: Meme[]; meta: PaginationMetaDto }>;

  // New: restore a soft-deleted meme
  abstract restore(id: string): Promise<void>;

  // New: permanently delete a meme
  abstract hardDelete(id: string): Promise<any>;
}
