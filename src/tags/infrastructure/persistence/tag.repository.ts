import { Tag } from 'src/tags/domain/tag';
import { ITagFilters, TagSortField } from 'src/tags/dto/tag-filter-options.dto';
import { PaginationMetaDto } from 'src/utils/dto/pagination-response.dto';

import { DeepPartial } from 'src/utils/types/deep-partial.type';
import { NullableType } from 'src/utils/types/nullable.type';
import {
  IFilterOptions,
  IPaginationOptions,
  ISortOptions,
} from 'src/utils/types/pagination-options';

export abstract class TagRepository {
  abstract create(
    data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Tag>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: IFilterOptions<ITagFilters> | null;
    sortOptions?: ISortOptions<TagSortField> | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Tag[]; meta: PaginationMetaDto }>;

  abstract findById(id: Tag['id']): Promise<NullableType<Tag>>;

  abstract findByNormalizedName(
    normalizedName: string,
  ): Promise<NullableType<Tag>>;

  abstract findBySlug(slug: string): Promise<NullableType<Tag>>;

  abstract findByNames(names: string[]): Promise<Tag[]>;

  abstract update(
    id: Tag['id'],
    payload: DeepPartial<Tag>,
  ): Promise<Tag | null>;

  abstract remove(id: Tag['id']): Promise<void>;

  abstract findDeletedWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: IFilterOptions<ITagFilters> | null;
    sortOptions?: ISortOptions<TagSortField> | null;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Tag[]; meta: PaginationMetaDto }>;

  abstract restore(id: Tag['id']): Promise<void>;
  abstract hardDelete(id: Tag['id']): Promise<void>;

  abstract incrementUsageCount(id: Tag['id']): Promise<void>;

  abstract decrementUsageCount(id: Tag['id']): Promise<void>;

  abstract linkTagToMeme(memeId: string, tagId: string): Promise<void>;
  abstract linkTagToTemplate(templateId: string, tagId: string): Promise<void>;
  abstract removeAllTagLinksForMeme(memeId: string): Promise<void>;
  abstract removeAllTagLinksForTemplate(templateId: string): Promise<void>;
}
