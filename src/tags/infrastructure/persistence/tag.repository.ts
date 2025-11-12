import { Tag } from 'src/tags/domain/tag';

import { DeepPartial } from 'src/utils/types/deep-partial.type';
import { NullableType } from 'src/utils/types/nullable.type';
import { IPaginationOptions } from 'src/utils/types/pagination-options';

export abstract class TagRepository {
  abstract create(
    data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Tag>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: any | null;
    sortOptions?: Array<any> | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Tag[]>;

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

  abstract incrementUsageCount(id: Tag['id']): Promise<void>;

  abstract decrementUsageCount(id: Tag['id']): Promise<void>;

  abstract linkTagToMeme(memeId: string, tagId: string): Promise<void>;
  abstract linkTagToTemplate(templateId: string, tagId: string): Promise<void>;
  abstract removeAllTagLinksForMeme(memeId: string): Promise<void>;
  abstract removeAllTagLinksForTemplate(templateId: string): Promise<void>;
}
