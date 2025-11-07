import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Meme } from '../../domain/meme';
import { NullableType } from '../../../utils/types/nullable.type';
import { CreateMemeDto } from '../../dto/create-meme.dto';

export abstract class MemesRepository {
  abstract create(data: Meme | CreateMemeDto): Promise<Meme>;
  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: any | null;
    sortOptions?: {
      orderBy: string;
      order: 'ASC' | 'DESC';
    };
    paginationOptions: IPaginationOptions;
  }): Promise<{ data: Meme[]; total: number }>;
  abstract findById(id: Meme['id']): Promise<NullableType<Meme>>;
  abstract findBySlug(slug: string): Promise<NullableType<Meme>>;
  abstract findByTitle(title: string): Promise<NullableType<Meme>>;
  abstract findByFileId(fileId: string): Promise<NullableType<Meme>>;
  abstract update(id: Meme['id'], payload: Partial<Meme>): Promise<Meme>;
  abstract remove(id: Meme['id']): Promise<void>;
  abstract findByAuthorId(userId: string): Promise<Meme[]>;
}
