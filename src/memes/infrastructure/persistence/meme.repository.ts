import { PaginationMetaDto } from '../../../utils/dto/pagination-response.dto';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Meme } from '../../domain/meme';
import { CreateMemeDto } from '../../dto/create-meme.dto';
import {
  MemeFilterOptionsDto,
  MemeSortOptionsDto,
} from '../../dto/meme-filter-options.dto';

export abstract class MemesRepository {
  abstract create(data: Meme | CreateMemeDto): Promise<Meme>;
  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: MemeFilterOptionsDto | null;
    sortOptions?: MemeSortOptionsDto;
    paginationOptions: IPaginationOptions;
  }): Promise<{ items: Meme[]; meta: PaginationMetaDto }>;
  abstract findById(id: Meme['id']): Promise<NullableType<Meme>>;
  abstract findBySlug(slug: string): Promise<NullableType<Meme>>;
  abstract findByTitle(title: string): Promise<NullableType<Meme>>;
  abstract findByFileId(fileId: string): Promise<NullableType<Meme>>;
  abstract update(id: Meme['id'], payload: Partial<Meme>): Promise<Meme>;
  abstract remove(id: Meme['id']): Promise<void>;
  abstract findByAuthorId(userId: string): Promise<Meme[]>;
}
